import uvicorn
import os
import io
import json
import tempfile
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
import ollama
import whisper
from pydub import AudioSegment

load_dotenv()

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))
# Defaulting to llama3.2 for speed, or falling back to your environment choice
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "llama3.2")

app = FastAPI(title="AI Interviewer Microservice", version="1.0")

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WHISPER_MODEL = None

try:
    print("🚀 Loading Whisper Model (base.en)...")
    WHISPER_MODEL = whisper.load_model("base.en")
    print("✅ Whisper Model Loaded Successfully")
    
except Exception as e:
    print("❌ Error while loading Whisper Model:")
    print(e)

# Fixed class naming configuration for safety
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
    return {"message": "Hello from AI Interviewer Microservice !", "model": OLLAMA_MODEL_NAME}


@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionRequest):
    try:
        if request.interview_type == "coding-mix":
            coding_count = int(request.count * 0.2)
            if coding_count == 0 and request.count > 0:
                coding_count = 1  # Ensure at least 1 coding question if mix is selected
            oral_oral = int(request.count) - int(coding_count)

            instruction = (
                f"The first {coding_count} questions MUST be coding challenges requiring code implementation or logic design. "
                f"The remaining {oral_oral} questions MUST be conceptual, theoretical oral interview questions."
            )
        else:
            instruction = "All questions MUST be conceptual, theoretical oral questions. Do NOT generate any coding challenges."

        system_prompt = (
            "You are a strict technical interviewer. "
            "Task: Generate clear interview questions based on the instructions. "
            "CRITICAL: Output ONLY the raw questions, exactly one question per line. "
            "Do NOT number them, do NOT write introductions, and do NOT write descriptions. "
            f"{instruction}"
        )

        user_prompt = f"Generate exactly {request.count} unique interview questions for a {request.level} level {request.role} role."

        # Offload synchronous Ollama generation to a separate worker thread to prevent freezing
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: ollama.generate(
                model=OLLAMA_MODEL_NAME,
                prompt=user_prompt,
                system=system_prompt,
                options={
                    "temperature": 0.3,       # Lower temperature makes it faster & more predictable
                    "num_predict": 400,       # Strict token ceiling prevents infinite generation loops
                    "top_k": 20
                }
            )
        )

        raw_text = response['response'].strip()
        questions = [q.strip() for q in raw_text.split('\n') if q.strip()]
        
        # Fallback if the model returned numbered lists despite instructions
        clean_questions = []
        for q in questions:
            cleaned = q.lstrip('0123456789.-* ')
            if cleaned:
                clean_questions.append(cleaned)

        # Pad with default questions if model fell short
        while len(clean_questions) < request.count:
            clean_questions.append(f"Explain the core design architecture of a standard {request.role} application.")

        return QuestionResponse(questions=clean_questions[:request.count], model_used=OLLAMA_MODEL_NAME)

    except Exception as e:
        print(f"❌ Error in /generate-questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    temp_audio_path = None
    try:
        audio_bytes = await file.read()
        audio_in_memory = io.BytesIO(audio_bytes)
        audio_segment = AudioSegment.from_file(audio_in_memory)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            temp_audio_path = tmp.name
            audio_segment.export(temp_audio_path, format="mp3")
        
        if not WHISPER_MODEL:
            raise HTTPException(status_code=503, detail="Whisper Model is not loaded on this server environment.")
        
        # Running heavy Whisper processing inside an executor thread stops event-loop blocks
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, 
            lambda: WHISPER_MODEL.transcribe(temp_audio_path)
        )
                
        return {"transcription": result["text"].strip()}

    except Exception as e:
        print(f"❌ Error in /transcribe: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except Exception:
                pass


@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest):
    try:
        if request.question_type == "oral":
            assessment_instruction = (
                "This is a conceptual oral question. Focus purely on the candidate's verbal explanation. "
                "Ignore code syntax requirements. "
                "CRITICAL: If the transcript is empty, nonsense (e.g., 'blah blah', 'testing'), or completely irrelevant, SCORE 0."
            )
        else:
            assessment_instruction = (
                "This is a coding challenge question. Evaluate the code logic, clean patterns, and efficiency. "
                "Use the transcription only for insights into their verbalized thought process. "
                "CRITICAL: If the code field is empty, 'undefined', or random typing filler, SCORE 0."
            )
        
        system_prompt = (
            "You are a strict technical interviewer. "
            "Do NOT hallucinate positive reviews for bad or missing input. "
            "RULE 1: If the answer is missing, gibberish, or entirely wrong, return 'technicalScore': 0 and 'confidenceScore': 0. "
            "RULE 2: Provide a clean Markdown string for 'idealAnswer'. Do NOT nest JSON arrays or objects inside it. "
            f"Context: {assessment_instruction}\n"
            "Respond ONLY with a valid, single flat JSON object containing these keys: 'technicalScore' (0-100), 'confidenceScore' (0-100), 'aiFeedback' (string), 'idealAnswer' (string)."
        )
        
        user_prompt = (
            f"Role: {request.role}\n"
            f"Question: {request.question}\n"
            f"Level: {request.level}\n"
            f"Verbal Answer Transcript: {request.user_answer or 'No verbal answer provided'}\n"
            f"Code Answer: {request.user_code or 'No code provided'}\n"
        )
        
        # Execute Ollama generation safely via an async thread executor
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: ollama.generate(
                model=OLLAMA_MODEL_NAME,
                prompt=user_prompt,
                system=system_prompt,
                format="json",
                options={
                    "temperature": 0.1,    # Low temperature guarantees strict structure compliance
                    "num_predict": 600     # Stops the evaluator from outputting giant, endless paragraphs
                }
            )
        )
        
        response_text = response['response'].strip()
        
        try:
            evaluation_data = json.loads(response_text)
            if 'idealAnswer' in evaluation_data and not isinstance(evaluation_data['idealAnswer'], str):
                evaluation_data['idealAnswer'] = json.dumps(evaluation_data['idealAnswer'])
            return EvaluationResponse(**evaluation_data)
        except json.JSONDecodeError:
            import re
            fixed_text = re.sub(r'[\r\n\t]', ' ', response_text)
            try:
                evaluation_data = json.loads(fixed_text)
                if 'idealAnswer' in evaluation_data and not isinstance(evaluation_data['idealAnswer'], str):
                    evaluation_data['idealAnswer'] = json.dumps(evaluation_data['idealAnswer'])
                return EvaluationResponse(**evaluation_data)
            except Exception:
                print(f"❌ Failed to parse response text raw: {response_text}")
                return EvaluationResponse(
                    technicalScore=0,
                    confidenceScore=0,
                    aiFeedback="Evaluation payload string was corrupt or unreadable.",
                    idealAnswer="An error occurred while generating structural feedback data."
                )

    except Exception as e:
        print(f"❌ Error in /evaluate: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=AI_SERVICE_PORT, reload=False)