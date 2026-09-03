import uvicorn
import os
import json
import tempfile
import time
import mimetypes
import asyncio
import subprocess
import io
import ffmpeg
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
from google import genai
from google.genai import types

load_dotenv()

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))
GEMINI_MODEL_NAME = "gemini-3.5-flash"

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

        # Implement retry logic for rate-limit (429) and service unavailable (503) responses from Gemini
        max_retries = 3
        response = None
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=GEMINI_MODEL_NAME,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.4,
                    )
                )
                break  # success
            except Exception as e:
                # Detect rate-limit errors (429) or service unavailable (503) via status code or message
                err_msg = str(e)
                if "429" in err_msg or "Rate limit" in err_msg or "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg:
                    wait_seconds = 2 ** attempt
                    print(f"⚠️ Gemini temporarily unavailable during question generation (attempt {attempt + 1}/{max_retries}), waiting {wait_seconds}s before retry. Error: {err_msg[:100]}")
                    await asyncio.sleep(wait_seconds)
                    continue
                # Re-raise other exceptions
                raise
        if response is None:
            print("❌ Failed to generate questions after all retries.")
            raise HTTPException(status_code=500, detail="Failed to generate questions after retries.")

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
    """
    Transcribe audio using Gemini with server-side audio conversion.
    
    This approach uses pydub/ffmpeg to convert any input audio format to WAV
    before sending to Gemini, eliminating MIME type compatibility issues.
    """
    temp_input_path = None
    temp_wav_path = None
    
    try:
        content = await file.read()
        print(f"📥 Received: {file.filename}, Size: {len(content)} bytes, Content-Type: {file.content_type}")

        # Validate that we received some content
        if not content:
            print("⚠️ No file content received.")
            return {"transcription": ""}
        
        # Warn if audio is very small (likely silence or corrupted)
        if len(content) < 500:
            print(f"⚠️ Audio file is very small ({len(content)} bytes), may be silence or corrupted.")

        # Step 1: Save uploaded content to a temporary file
        # Use the original file extension if available, otherwise default to .webm
        original_ext = os.path.splitext(file.filename or "")[1].lower()
        if not original_ext or original_ext not in ['.webm', '.mp4', '.wav', '.ogg', '.mp3', '.m4a', '.aac', '.flac']:
            original_ext = '.webm'  # Default for MediaRecorder
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=original_ext) as tmp_in:
            tmp_in.write(content)
            temp_input_path = tmp_in.name
        
        print(f"💾 Saved input to temporary file: {temp_input_path}")

        # Step 2: Convert to WAV using ffmpeg-python directly
        # WAV is universally supported by Gemini and avoids all MIME type issues
        temp_wav_path = temp_input_path + '.wav'
        
        try:
            print(f"🔄 Converting audio to WAV format using ffmpeg...")
            # Use ffmpeg to convert to mono, 16kHz WAV (optimal for speech recognition)
            (
                ffmpeg
                .input(temp_input_path)
                .output(temp_wav_path, ac=1, ar=16000, format='wav')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            print(f"✅ Converted to WAV: {temp_wav_path} ({os.path.getsize(temp_wav_path)} bytes)")
            
        except Exception as conv_error:
            print(f"❌ Audio conversion failed: {conv_error}")
            # Fallback: try sending original content with best-guess MIME type
            return await _transcribe_with_fallback(content, file.content_type)

        # Step 3: Read the converted WAV file and send to Gemini
        with open(temp_wav_path, 'rb') as f:
            wav_content = f.read()
        
        print(f"📤 Sending WAV audio to Gemini ({len(wav_content)} bytes)")
        
        start = time.time()
        # Implement retry logic for rate-limit (429) and service unavailable (503)
        max_retries = 3
        response = None
        transcription_text = ""
        
        for attempt in range(max_retries):
            try:
                audio_part = types.Part.from_bytes(
                    data=wav_content,
                    mime_type="audio/wav",  # WAV is guaranteed to work with Gemini
                )
                
                response = await client.aio.models.generate_content(
                    model=GEMINI_MODEL_NAME,
                    contents=[
                        audio_part,
                        "Transcribe the spoken audio accurately. Output ONLY the raw transcript text. Do not add commentary, meta-talk, or headers."
                    ]
                )
                transcription_text = response.text.strip() if response.text else ""
                
                if transcription_text:
                    print(f"✅ Transcription successful (attempt {attempt + 1})")
                    break
                else:
                    print(f"⚠️ Empty transcription (attempt {attempt + 1})")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1)
                        
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "Rate limit" in err_msg or "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg:
                    wait_seconds = 2 ** attempt
                    print(f"⚠️ Gemini temporarily unavailable (attempt {attempt + 1}/{max_retries}), waiting {wait_seconds}s. Error: {err_msg[:100]}")
                    await asyncio.sleep(wait_seconds)
                    continue
                # For other errors, don't retry
                print(f"❌ Transcription error: {err_msg}")
                raise
        
        if not transcription_text:
            print("❌ Failed to get transcription after all retries.")
            return {"transcription": ""}
        
        print(f"⏱️ Gemini Transcription ({time.time() - start:.2f}s): '{transcription_text[:100]}...'")
        return {"transcription": transcription_text}

    except Exception as e:
        print(f"❌ Error in /transcribe: {str(e)}")
        return {"transcription": ""}
    
    finally:
        # Clean up temporary files
        for path in [temp_input_path, temp_wav_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                    print(f"🗑️ Cleaned up: {path}")
                except Exception as cleanup_err:
                    print(f"⚠️ Failed to cleanup {path}: {cleanup_err}")


async def _transcribe_with_fallback(content: bytes, content_type: str) -> dict:
    """
    Fallback transcription using original content with MIME type fallback.
    Used when audio conversion fails.
    """
    print("🔄 Using fallback transcription (no conversion)...")
    
    # Determine best MIME type to try
    raw_mime = (content_type or "audio/webm").strip().lower()
    if raw_mime == "video/webm":
        mime_types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/wav"]
    elif raw_mime in ["application/octet-stream", ""]:
        mime_types = ["audio/webm;codecs=opus", "audio/webm", "audio/wav", "audio/mpeg"]
    elif raw_mime == "audio/webm":
        mime_types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/wav"]
    else:
        mime_types = [raw_mime, "audio/wav", "audio/mpeg"]
    
    max_retries = 3
    
    for mime_type in mime_types:
        print(f"🔄 Trying fallback with MIME type: '{mime_type}'")
        audio_part = types.Part.from_bytes(data=content, mime_type=mime_type)
        
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=GEMINI_MODEL_NAME,
                    contents=[
                        audio_part,
                        "Transcribe the spoken audio accurately. Output ONLY the raw transcript text. Do not add commentary, meta-talk, or headers."
                    ]
                )
                transcription_text = response.text.strip() if response.text else ""
                if transcription_text:
                    print(f"✅ Fallback transcription successful with '{mime_type}'")
                    return {"transcription": transcription_text}
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "Rate limit" in err_msg or "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg:
                    wait_seconds = 2 ** attempt
                    print(f"⚠️ Rate limited, waiting {wait_seconds}s...")
                    await asyncio.sleep(wait_seconds)
                    continue
                print(f"⚠️ Fallback error with '{mime_type}': {err_msg[:100]}")
                break
    
    print("❌ All fallback attempts failed")
    return {"transcription": ""}

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest):
    try:
        # Fallback check to avoid evaluating on empty string inputs
        if request.question_type == "oral" and (not request.user_answer or not request.user_answer.strip()):
            return EvaluationResponse(
                technicalScore=0,
                confidenceScore=0,
                aiFeedback="The audio transcription was empty or failed, so no evaluation could be made. Please re-record your answer or submit code/text instead.",
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
        
        # Implement retry logic for rate-limit (429) and service unavailable (503) responses from Gemini
        max_retries = 3
        response = None
        for attempt in range(max_retries):
            try:
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
                break  # success
            except Exception as e:
                # Detect rate-limit errors (429) or service unavailable (503) via status code or message
                err_msg = str(e)
                if "429" in err_msg or "Rate limit" in err_msg or "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg:
                    wait_seconds = 2 ** attempt
                    print(f"⚠️ Gemini temporarily unavailable during evaluation (attempt {attempt + 1}/{max_retries}), waiting {wait_seconds}s before retry. Error: {err_msg[:100]}")
                    await asyncio.sleep(wait_seconds)
                    continue
                # Re-raise other exceptions
                raise
        if response is None:
            print("❌ Failed to get evaluation after all retries.")
            raise HTTPException(status_code=500, detail="Failed to get evaluation after retries.")
        
        response_text = response.text.strip() if response.text else ""
        evaluation_data = json.loads(response_text)
        
        return EvaluationResponse(**evaluation_data)

    except Exception as e:
        print(f"❌ Error in /evaluate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=AI_SERVICE_PORT, reload=False)