import { AssemblyAI } from 'assemblyai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

// Initialize clients
const assemblyai = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute with exponential backoff retry for rate limiting
 */
const executeWithRetry = async (fn, maxRetries = 5, baseDelay = 1000) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isRateLimit = error.message?.includes('429') ||
                error.message?.includes('rate limit') ||
                error.message?.includes('Too Many Requests') ||
                error.status === 429;

            if (isRateLimit && attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
                console.log(`🔄 Rate limited (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`);
                await sleep(delay);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
};

/**
 * Convert audio file to WAV format for better transcription compatibility
 */
export const convertAudioToWav = (inputPath) => {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace(/\.[^/.]+$/, '.wav');

        ffmpeg(inputPath)
            .output(outputPath)
            .audioCodec('pcm_s16le')
            .audioChannels(1)
            .audioFrequency(16000)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .run();
    });
};

/**
 * Transcribe audio using AssemblyAI (more reliable than Gemini for audio)
 */
export const transcribeAudio = async (audioFilePath) => {
    try {
        console.log(`🎙️ Starting transcription for: ${audioFilePath}`);

        if (!fs.existsSync(audioFilePath)) {
            throw new Error(`Audio file not found: ${audioFilePath}`);
        }

        const stats = fs.statSync(audioFilePath);
        console.log(`📁 Audio file size: ${stats.size} bytes`);

        if (stats.size === 0) {
            throw new Error('Audio file is empty');
        }

        let wavPath = audioFilePath;
        const ext = path.extname(audioFilePath).toLowerCase();
        if (ext !== '.wav') {
            console.log(`🔄 Converting ${ext} to WAV...`);
            try {
                wavPath = await convertAudioToWav(audioFilePath);
                console.log(`✅ Converted to WAV: ${wavPath}`);
            } catch (convertError) {
                console.error(`⚠️ WAV conversion failed, trying original file: ${convertError.message}`);
                wavPath = audioFilePath;
            }
        }

        console.log(`🎯 Requesting transcription...`);
        const transcript = await assemblyai.transcripts.transcribe({
            audio: wavPath,
            language_code: 'en',
            punctuate: true,
            format_text: true,
        });

        if (wavPath !== audioFilePath && fs.existsSync(wavPath)) {
            fs.unlinkSync(wavPath);
        }

        if (transcript.status === 'error') {
            throw new Error(`Transcription failed: ${transcript.error}`);
        }

        const transcriptionText = transcript.text || '';
        console.log(`✅ Transcription completed: ${transcriptionText.substring(0, 100)}...`);

        return transcriptionText;
    } catch (error) {
        console.error('❌ Transcription error:', error.message);
        throw new Error(`Transcription failed: ${error.message}`);
    }
};

/**
 * Evaluate answer using Gemini with retry logic
 */
export const evaluateAnswer = async (question, questionType, role, level, userAnswer, userCode) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const assessmentInstruction = questionType === 'oral'
        ? `This is a conceptual oral question. Evaluate based entirely on the candidate's verbal statement logic. 
       CRITICAL: If the transcript is empty, completely non-sensical, or irrelevant to the question context, SCORE 0 for both metrics.`
        : `This is a development coding challenge question. Evaluate algorithmic logic, accuracy, and structural efficiency. 
       CRITICAL: If the user_code is missing, empty, or garbage filler characters, SCORE 0 for both metrics.`;

    const systemPrompt = `You are a strict technical interviewer. Do not manufacture scores or hallucinate compliments for missing or incorrect data.
Rule 1: If an answer is fundamentally missing, invalid, or wrong, output technicalScore: 0 and confidenceScore: 0.
Rule 2: For idealAnswer, provide a clean Markdown formatting string. Do NOT add inner dictionary structures or nesting formats inside it.
Context: ${assessmentInstruction}`;

    const userPrompt = `Role Context: ${role}
Target Question: ${question}
Target Seniority Level: ${level}
Candidate Verbal Transcript: ${userAnswer || 'No verbal answer provided'}
Candidate Code Submission: ${userCode || 'No code provided'}`;

    try {
        console.log(`🤖 Evaluating answer for ${questionType} question...`);

        const result = await executeWithRetry(async () => {
            return await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                systemInstruction: systemPrompt,
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'object',
                        properties: {
                            technicalScore: { type: 'integer', minimum: 0, maximum: 100 },
                            confidenceScore: { type: 'integer', minimum: 0, maximum: 100 },
                            aiFeedback: { type: 'string' },
                            idealAnswer: { type: 'string' },
                        },
                        required: ['technicalScore', 'confidenceScore', 'aiFeedback', 'idealAnswer'],
                    },
                },
            });
        });

        const response = result.response;
        const text = response.text();

        if (!text) {
            throw new Error('Empty response from Gemini');
        }

        const evaluation = JSON.parse(text);
        console.log(`✅ Evaluation completed: Technical=${evaluation.technicalScore}, Confidence=${evaluation.confidenceScore}`);

        return evaluation;
    } catch (error) {
        console.error('❌ Evaluation error:', error.message);

        if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
            throw new Error('AI service rate limited. Please try again in a moment.');
        }

        throw new Error(`Evaluation failed: ${error.message}`);
    }
};

/**
 * Generate interview questions using Gemini
 */
export const generateQuestions = async (role, level, count, interviewType) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const codingCount = interviewType === 'coding-mix' ? Math.max(1, Math.floor(count * 0.2)) : 0;
    const oralCount = count - codingCount;

    const instruction = codingCount > 0
        ? `The first ${codingCount} questions MUST be algorithmic coding challenges or technical problem-solving tasks. 
       The remaining ${oralCount} questions MUST be conceptual or theoretical oral questions.`
        : 'All questions MUST be conceptual, theoretical oral questions. Do NOT generate coding implementation challenges.';

    const systemPrompt = `You are an expert technical interviewer.
Task: Generate clear, targeted interview questions.
CRITICAL: Output ONLY the raw questions, exactly one question per line.
Do NOT provide numbers, list markers, introductions, explanations, or commentary.
${instruction}`;

    const userPrompt = `Generate exactly ${count} unique interview questions for a ${level} level ${role} role.`;

    try {
        console.log(`📝 Generating ${count} questions for ${role}...`);

        const result = await executeWithRetry(async () => {
            return await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                systemInstruction: systemPrompt,
                generationConfig: {
                    temperature: 0.4,
                },
            });
        });

        const response = result.response;
        const text = response.text();

        if (!text) {
            throw new Error('Empty response from Gemini');
        }

        const questions = text
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .map(q => q.replace(/^[\d.\-*\s]+/, ''))
            .filter(q => q.length > 0)
            .slice(0, count);

        while (questions.length < count) {
            questions.push(`Explain core lifecycle and optimizations relevant to a ${role} architecture.`);
        }

        console.log(`✅ Generated ${questions.length} questions`);
        return questions;
    } catch (error) {
        console.error('❌ Question generation error:', error.message);

        if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
            throw new Error('AI service rate limited. Please try again in a moment.');
        }

        throw new Error(`Question generation failed: ${error.message}`);
    }
};

export default {
    transcribeAudio,
    evaluateAnswer,
    generateQuestions,
};