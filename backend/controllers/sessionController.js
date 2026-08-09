import asyncHandler from 'express-async-handler';
import Session from '../models/SessionModel.js';
import fetch from 'node-fetch'; // npm install node-fetch@2.6.1
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import mongoose from 'mongoose';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://google-ai-interview.onrender.com';

const generateFallbackQuestions = (role, level, count, interviewType) => {
    const questionCount = Number(count) || 5;
    const codingCount = interviewType === 'coding-mix' ? Math.max(1, Math.floor(questionCount * 0.2)) : 0;
    const oralCount = questionCount - codingCount;
    const baseRole = role || 'the requested role';
    const seniority = level || 'Mid-Level';

    const fallbackQuestions = [];
    for (let i = 0; i < codingCount; i += 1) {
        fallbackQuestions.push(`Design and explain an algorithm or system for a ${seniority} ${baseRole} that solves a real-world problem relevant to the role.`);
    }

    const oralTemplates = [
        `Describe a common architecture or workflow for a ${seniority} ${baseRole} and explain the tradeoffs involved.`,
        `Explain how you would approach debugging a production issue in a ${baseRole} codebase.`,
        `What are the most important performance or security concerns for a ${baseRole}, and how would you address them?`,
        `Discuss best practices for collaborating with cross-functional teams in a ${baseRole} role.`,
        `Summarize the core design patterns or principles that a ${seniority} ${baseRole} should apply in their work.`,
    ];

    for (let i = 0; i < oralCount; i += 1) {
        fallbackQuestions.push(oralTemplates[i % oralTemplates.length]);
    }

    return fallbackQuestions.slice(0, questionCount);
};

// Helper function to send an update via Socket.io
const pushSocketUpdate = (io, userId, sessionId, status, message, session = null) => {
    if (!io) return;
    io.to(userId.toString()).emit('sessionUpdate', {
        sessionId,
        status,
        message,
        session,
    });
};

// @desc    Create a new interview session and start AI question generation
// @route   POST /api/sessions/
// @access  Private
const createSession = asyncHandler(async (req, res) => {
    const { role, level, interviewType, count } = req.body;
    const userId = req.user._id;

    if (!role || !level || !interviewType || !count) {
        res.status(400);
        throw new Error('Please specify role, level, interview type, and question count.');
    }

    // 1. Create the session placeholder in MongoDB
    let session = await Session.create({
        user: userId,
        role,
        level,
        interviewType,
        status: 'pending',
    });

    const io = req.app.get('io');

    // 2. Immediately respond to client
    res.status(202).json({
        message: 'Session created. Generating questions asynchronously...',
        sessionId: session._id,
        status: 'processing',
    });

    // --- ASYNCHRONOUS BACKGROUND TASK START ---
    (async () => {
        try {
            pushSocketUpdate(io, userId, session._id, 'AI_GENERATING_QUESTIONS', `Generating ${count} questions for ${role}...`);

            const controller = new AbortController();
            const timeoutMs = 120000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            let questionsArray = [];
            let source = 'remote';

            try {
                const aiResponse = await fetch(`${AI_SERVICE_URL}/generate-questions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role,
                        level,
                        count,
                        interview_type: interviewType
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!aiResponse.ok) {
                    const errorBody = await aiResponse.text();
                    throw new Error(`AI Service error: ${aiResponse.status} - ${errorBody}`);
                }

                const aiData = await aiResponse.json();
                const codingCount = interviewType === 'coding-mix' ? Math.floor(count * 0.2) : 0;

                questionsArray = Array.isArray(aiData.questions)
                    ? aiData.questions.map((qText, index) => ({
                        questionText: qText,
                        questionType: index < codingCount ? 'coding' : 'oral',
                        isEvaluated: false,
                        isSubmitted: false,
                    }))
                    : [];

                if (questionsArray.length === 0) {
                    throw new Error('AI returned no questions.');
                }
            } catch (error) {
                console.error(`AI generation failed for session ${session._id}:`, error.message);
                source = 'fallback';
                const fallbackQuestions = generateFallbackQuestions(role, level, count, interviewType);
                const codingCount = interviewType === 'coding-mix' ? Math.floor(count * 0.2) : 0;
                questionsArray = fallbackQuestions.map((qText, index) => ({
                    questionText: qText,
                    questionType: index < codingCount ? 'coding' : 'oral',
                    isEvaluated: false,
                    isSubmitted: false,
                }));
            }

            session.questions = questionsArray;
            session.status = 'in-progress';
            await session.save();

            pushSocketUpdate(io, userId, session._id, 'QUESTIONS_READY', `Questions generated successfully (${source}). Starting session.`, session);

        } catch (error) {
            console.error(`Session Creation Failure for ${session._id}:`, error.message);
            session.status = 'failed';
            await session.save();
            pushSocketUpdate(io, userId, session._id, 'GENERATION_FAILED', `Question generation failed. Reason: ${error.message}.`);
        }
    })();
});

// @desc    Get all interview sessions for the current user
// @route   GET /api/sessions/
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
    const sessions = await Session.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .select('-questions.userAnswerText -questions.userSubmittedCode');
    res.json(sessions);
});

// @desc    Get a specific session detail
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = asyncHandler(async (req, res) => {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });

    if (session) {
        res.json(session);
    } else {
        res.status(404);
        throw new Error('Session not found or user unauthorized.');
    }
});

// @desc    Delete a session
// @route   DELETE /api/sessions/:id
// @access  Private
const deleteSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    if (session.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    await session.deleteOne();
    res.status(200).json({ id: req.params.id });
});

// Helper: Asynchronous Answer Evaluation & Transcription
const evaluateAnswerAsync = async (io, userId, sessionId, questionIndex, audioFilePath = null, code = null) => {
    let transcription = "";
    const questionIdx = typeof questionIndex === 'string' ? parseInt(questionIndex, 10) : questionIndex;

    const session = await Session.findById(sessionId);
    if (!session) {
        console.error(`Session ${sessionId} not found`);
        return;
    }

    const question = session.questions[questionIdx];
    if (!question) {
        pushSocketUpdate(io, userId, sessionId, 'EVALUATION_FAILED', `Q${questionIdx + 1} not found.`, null);
        return;
    }

    // --- Phase 1: Transcription (Only if audio exists) ---
    if (audioFilePath) {
        try {
            pushSocketUpdate(io, userId, sessionId, 'AI_TRANSCRIBING', `Transcribing audio for Q${questionIdx + 1}...`);

            const filename = path.basename(audioFilePath);
            const ext = path.extname(audioFilePath) || '.webm';

            // FIXED: Safe Stream Creation with autoClose disabled during append
            const fileStream = fs.createReadStream(audioFilePath, { autoClose: true });

            const formData = new FormData();
            formData.append('file', fileStream, {
                filename: filename.includes('.') ? filename : `recording${ext}`,
                contentType: ext === '.mp4' ? 'audio/mp4' : 'audio/webm',
            });

            // FIXED: Extended AbortController timeout to 120s for Gemini operations
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const transResponse = await fetch(`${AI_SERVICE_URL}/transcribe`, {
                method: 'POST',
                body: formData,
                headers: {
                    ...formData.getHeaders(),
                    'Connection': 'keep-alive'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!transResponse.ok) {
                const errorText = await transResponse.text();
                throw new Error(`Transcription service status ${transResponse.status}: ${errorText}`);
            }

            const transData = await transResponse.json();
            transcription = transData.transcription || "";
            console.log(`✅ Transcription received for Q${questionIdx + 1}:`, transcription);

        } catch (error) {
            console.error(`⚠️ Transcription Step Failed for Q${questionIdx + 1}: ${error.message}`);
            transcription = "[Audio transcription failed or timed out]";
        } finally {
            // Clean up temporary local file
            if (audioFilePath && fs.existsSync(audioFilePath)) {
                try {
                    fs.unlinkSync(audioFilePath);
                } catch (unlinkErr) {
                    console.error("Failed to delete temp audio file:", unlinkErr.message);
                }
            }
        }
    }

    // --- Phase 2: AI Evaluation ---
    try {
        pushSocketUpdate(io, userId, sessionId, 'AI_EVALUATING', `AI is analyzing Q${questionIdx + 1}...`);

        const evalResponse = await fetch(`${AI_SERVICE_URL}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question.questionText,
                question_type: question.questionType,
                role: session.role,
                level: session.level,
                user_answer: transcription,
                user_code: code || "",
            }),
        });

        if (!evalResponse.ok) {
            const pythonErrorText = await evalResponse.text();
            throw new Error(`AI Service returned status ${evalResponse.status}: ${pythonErrorText}`);
        }

        const evalData = await evalResponse.json();

        // --- Phase 3: Save Evaluation Result ---
        question.userAnswerText = transcription;
        question.userSubmittedCode = code || "";

        question.technicalScore = evalData.technicalScore;
        question.confidenceScore = evalData.confidenceScore;
        question.aiFeedback = evalData.aiFeedback;
        question.idealAnswer = evalData.idealAnswer;
        question.isEvaluated = true;

        const allQuestionsEvaluated = session.questions.every(q => q.isEvaluated);

        if (session.status === 'completed' || allQuestionsEvaluated) {
            const scoreSummary = await calculateOverallScore(sessionId);
            session.overallScore = scoreSummary.overallScore || 0;
            session.metrics = {
                avgTechnical: scoreSummary.avgTechnical,
                avgConfidence: scoreSummary.avgConfidence,
            };

            if (allQuestionsEvaluated) {
                session.status = 'completed';
                session.endTime = session.endTime || new Date();
            }

            await session.save();
            pushSocketUpdate(io, userId, sessionId, 'SESSION_COMPLETED', 'Scores finalized.', session);
        } else {
            await session.save();
            pushSocketUpdate(io, userId, sessionId, 'EVALUATION_COMPLETE', `Feedback for Q${questionIdx + 1} is ready!`, session);
        }

    } catch (error) {
        console.error(`❌ Evaluation Error: ${error.message}`);

        try {
            const freshSession = await Session.findById(sessionId);
            if (freshSession && freshSession.questions[questionIdx]) {
                freshSession.questions[questionIdx].isSubmitted = false;
                freshSession.questions[questionIdx].isEvaluated = false;
                freshSession.markModified('questions');
                await freshSession.save();

                pushSocketUpdate(io, userId, sessionId, 'EVALUATION_FAILED', `Evaluation failed: ${error.message}`, freshSession);
            }
        } catch (dbError) {
            console.error("Failed to reset session status in catch block:", dbError.message);
            pushSocketUpdate(io, userId, sessionId, 'EVALUATION_FAILED', `Evaluation failed completely.`, null);
        }
    }
};

// @desc    Submit an answer (Audio or Code)
// @route   POST /api/sessions/:id/submit-answer
// @access  Private
const submitAnswer = asyncHandler(async (req, res) => {
    try {
        const sessionId = req.params.id;
        const { questionIndex, code } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401);
            throw new Error('User not authenticated or req.user is missing.');
        }

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            res.status(400);
            throw new Error('Invalid Session ID format.');
        }

        const session = await Session.findById(sessionId);
        if (!session || session.user.toString() !== userId.toString()) {
            res.status(404);
            throw new Error('Session not found or user unauthorized.');
        }

        const questionIdx = parseInt(questionIndex, 10);
        if (isNaN(questionIdx) || !session.questions || !session.questions[questionIdx]) {
            res.status(400);
            throw new Error(`Question at parsed index [${questionIndex}] not found.`);
        }

        const question = session.questions[questionIdx];

        let audioFilePath = null;
        if (req.file) {
            console.log('Audio upload details:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
            });

            if (req.file.size === 0) {
                res.status(400);
                throw new Error('Uploaded audio file is empty. Please re-record and submit again.');
            }

            if (req.file.path) {
                audioFilePath = path.resolve(req.file.path);
            }
        }

        const codeSubmission = code || null;
        if (!audioFilePath && !codeSubmission) {
            res.status(400);
            throw new Error('Submission must include either audio or code.');
        }

        question.isSubmitted = true;
        await session.save();

        res.status(202).json({
            message: 'Answer received. Processing asynchronously...',
            status: 'received',
        });

        const io = req.app.get('io');
        evaluateAnswerAsync(io, userId, sessionId, questionIdx, audioFilePath, codeSubmission);

    } catch (error) {
        console.error("❌ CRITICAL ERROR IN SUBMIT-ANSWER CONTROLLER:", error);

        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        res.json({
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack
        });
    }
});

const calculateOverallScore = async (sessionId) => {
    const results = await Session.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(sessionId) } },
        { $unwind: '$questions' },
        {
            $group: {
                _id: '$_id',
                avgTechnical: {
                    $avg: { $cond: [{ $eq: ['$questions.isEvaluated', true] }, '$questions.technicalScore', 0] }
                },
                avgConfidence: {
                    $avg: { $cond: [{ $eq: ['$questions.isEvaluated', true] }, '$questions.confidenceScore', 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                overallScore: { $round: [{ $avg: ['$avgTechnical', '$avgConfidence'] }, 0] },
                avgTechnical: { $round: ['$avgTechnical', 0] },
                avgConfidence: { $round: ['$avgConfidence', 0] },
            }
        }
    ]);

    return results[0] || { overallScore: 0, avgTechnical: 0, avgConfidence: 0 };
};

// @desc    End the session early
// @route   POST /api/sessions/:id/end
// @access  Private
const endSession = asyncHandler(async (req, res) => {
    const sessionId = req.params.id;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);

    if (!session || session.user.toString() !== userId.toString()) {
        res.status(404);
        throw new Error('Session not found or user unauthorized.');
    }
    const isProcessing = session.questions.some(q => q.isSubmitted && !q.isEvaluated);
    if (isProcessing) {
        res.status(400);
        throw new Error('Cannot end interview while AI is processing answers.');
    }
    if (session.status === 'completed') {
        res.status(400);
        throw new Error('Session is already completed.');
    }

    const scoreSummary = await calculateOverallScore(sessionId);

    session.overallScore = scoreSummary.overallScore || 0;
    session.status = 'completed';
    session.endTime = new Date();
    session.metrics = {
        avgTechnical: scoreSummary.avgTechnical,
        avgConfidence: scoreSummary.avgConfidence,
    };

    await session.save();

    const io = req.app.get('io');
    pushSocketUpdate(io, userId, sessionId, 'SESSION_COMPLETED', 'Interview session ended early.', session);

    res.json({ message: 'Session ended successfully.', session });
});

export {
    createSession,
    getSessionById,
    getSessions,
    submitAnswer,
    endSession,
    calculateOverallScore,
    deleteSession
};