import uvicorn
import os
import json
import tempfile
import time
import mimetypes
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
from google import genai
from google.genai import types

load_dotenv()

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))
GEMINI_MODEL_NAME = "gemini-2.5-flash"

app = FastAPI(title="AI Interviewer Cloud Microservice", version="2.0")

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Gemini Client safely
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("⚠️ WARNING: GEMINI_API_KEY is missing from your environment variables!")

client = genai.Client(api_key=api_key)


class QuestionRequest(BaseModel):
    role: str = "MERN Stack Developer"
    level: str = "Junior"
    count: int = 5
    interview_type: str = "coding-mix"


class QuestionResponse(BaseModel):
    questions: list[str]
    model_used: str


class EvaluationRequest(BaseModel):
    question: str
    question_type: str
    role: str
    level: str
    user_answer: Optional[str] = None
    user_code: Optional[str] = None


class EvaluationResponse(BaseModel):
    technicalScore: int
    confidenceScore: int
    aiFeedback: str
    idealAnswer: str


@app.get("/")
async def root():
    return {"message": "Hello from AI Interviewer Cloud Microservice!", "model": GEMINI_MODEL_NAME}


@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionRequest):
    try:
        if request.interview_type == "coding-mix":
            coding_count = int(request.count * 0.2)
            if coding_count == 0 and request.count > 0:
                coding_count = 1
            oral_oral = int(request.count) - int(coding_count)

            instruction = (
                f"The first {coding_count} questions MUST be algorithmic coding challenges or technical problem-solving tasks. "
                f"The remaining {oral_oral} questions MUST be conceptual or theoretical oral questions."
            )
        else:
            instruction = "All questions MUST be conceptual, theoretical oral questions. Do NOT generate coding implementation challenges."

        system_prompt = (
            "You are an expert technical interviewer.\n"
            "Task: Generate clear, targeted interview questions.\n"
            "CRITICAL: Output ONLY the raw questions, exactly one question per line.\n"
            "Do NOT provide numbers, list markers, introductions, explanations, or commentary.\n"
            f"{instruction}"
        )

        user_prompt = f"Generate exactly {request.count} unique interview questions for a {request.level} level {request.role} role."

        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL_NAME,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.4,
            )
        )

        raw_text = response.text.strip() if response.text else ""
        questions = [q.strip() for q in raw_text.split('\n') if q.strip()]
        
        clean_questions = []
        for q in questions:
            cleaned = q.lstrip('0123456789.-* ')
            if cleaned:
                clean_questions.append(cleaned)

        while len(clean_questions) < request.count:
            clean_questions.append(f"Explain core lifecycle and optimizations relevant to a {request.role} architecture.")

        return QuestionResponse(questions=clean_questions[:request.count], model_used=GEMINI_MODEL_NAME)

    except Exception as e:
        print(f"❌ Error in /generate-questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    temp_audio_path = None
    uploaded_file = None
    try:
        # Step 1: Resolve extension and fallback safely
        suffix = os.path.splitext(file.filename)[1].lower() if file.filename else ".webm"
        if not suffix:
            suffix = ".webm"

        # Step 2: Read bytes and write to local temp file
        content = await file.read()
        if not content or len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_audio_path = tmp.name
            tmp.write(content)
            tmp.flush()

        start = time.time()
        
        # Step 3: Explicitly map mime-types for common web audio recording formats
        mime_map = {
            ".webm": "audio/webm",
            ".mp3": "audio/mp3",
            ".wav": "audio/wav",
            ".m4a": "audio/m4a",
            ".ogg": "audio/ogg",
            ".mp4": "audio/mp4",
        }
        mime_type = mime_map.get(suffix)
        if not mime_type:
            mime_type, _ = mimetypes.guess_type(temp_audio_path)
        if not mime_type:
            mime_type = "audio/webm"

        # Step 4: Upload file to Gemini Cloud Storage
        uploaded_file = await client.aio.files.upload(
            file=temp_audio_path,
            config=types.UploadFileConfig(mime_type=mime_type)
        )
        
        # Step 5: Wait for audio file processing state to become ACTIVE
        while uploaded_file.state.name == "PROCESSING":
            await asyncio.sleep(0.5)
            uploaded_file = await client.aio.files.get(name=uploaded_file.name)

        if uploaded_file.state.name == "FAILED":
            raise HTTPException(status_code=500, detail="Gemini failed to process the audio file format.")

        # Step 6: Request transcription from Gemini Flash
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL_NAME,
            contents=[
                uploaded_file,
                "Transcribe the spoken audio accurately. Output ONLY the raw transcript text. Do not add commentary, meta-talk, or headers."
            ]
        )
        
        print(f"⏱️ Gemini Transcription took {time.time() - start:.2f}s")
        
        transcription_text = response.text.strip() if response.text else ""
        return {"transcription": transcription_text}

    except Exception as e:
        print(f"❌ Error in /transcribe: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Step 7: Cleanup Cloud storage allocation
        if uploaded_file:
            try:
                await client.aio.files.delete(name=uploaded_file.name)
            except Exception as cloud_err:
                print(f"⚠️ Failed to delete cloud file: {cloud_err}")

        # Step 8: Cleanup local disk temp file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except Exception as disk_err:
                print(f"⚠️ Failed to delete temp file: {disk_err}")


@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest):
    try:
        # Fallback check to avoid evaluating on empty string inputs
        if request.question_type == "oral" and (not request.user_answer or not request.user_answer.strip()):
            return EvaluationResponse(
                technicalScore=0,
                confidenceScore=0,
                aiFeedback="The candidate's transcript was empty, therefore no evaluation could be made.",
                idealAnswer="A complete answer should address the core technical concepts of the question with clear explanation and relevant examples."
            )

        if request.question_type == "oral":
            assessment_instruction = (
                "This is a conceptual oral question. Evaluate based entirely on the candidate's verbal statement logic. "
                "CRITICAL: If the transcript is empty, completely non-sensical, or irrelevant to the question context, SCORE 0 for both metrics."
            )
        else:
            assessment_instruction = (
                "This is a development coding challenge question. Evaluate algorithmic logic, accuracy, and structural efficiency. "
                "CRITICAL: If the user_code is missing, empty, or garbage filler characters, SCORE 0 for both metrics."
            )
        
        system_prompt = (
            "You are a strict technical interviewer. Do not manufacture scores or hallucinate compliments for missing or incorrect data.\n"
            "Rule 1: If an answer is fundamentally missing, invalid, or wrong, output technicalScore: 0 and confidenceScore: 0.\n"
            "Rule 2: For idealAnswer, provide a clean Markdown formatting string. Do NOT add inner dictionary structures or nesting formats inside it.\n"
            f"Context: {assessment_instruction}"
        )
        
        user_prompt = (
            f"Role Context: {request.role}\n"
            f"Target Question: {request.question}\n"
            f"Target Seniority Level: {request.level}\n"
            f"Candidate Verbal Transcript: {request.user_answer or 'No verbal answer provided'}\n"
            f"Candidate Code Submission: {request.user_code or 'No code provided'}\n"
        )
        
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL_NAME,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.1,
                response_mime_type="application/json",
                response_schema=EvaluationResponse,
            )
        )
        
        response_text = response.text.strip() if response.text else ""
        evaluation_data = json.loads(response_text)
        
        return EvaluationResponse(**evaluation_data)

    except Exception as e:
        print(f"❌ Error in /evaluate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=AI_SERVICE_PORT, reload=False)