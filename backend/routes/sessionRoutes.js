import express from "express";
import { 
    createSession, 
    deleteSession, 
    endSession, 
    getSessionById, 
    getSessions, 
    submitAnswer
} from "../controllers/sessionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadSingleAudio } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// CRITICAL FIX: Auth protection must be declared FIRST before any routes
router.use(protect);

// 1. Root Routes ("/") - Now safely protected by JWT verification
router.route("/")
    .get(getSessions)      // Fetch all sessions
    .post(createSession);  // Create new session

// 2. ID Routes ("/:id")
router.route("/:id")
    .get(getSessionById)   // View session details
    .delete(deleteSession); // Delete session

// 3. Action Routes
// Ensure 'uploadSingleAudio' middleware expects the exact field name your frontend appends to FormData (e.g., 'file' or 'audio')
// router.route("/:id/submit-answer").post(uploadSingleAudio, submitAnswer);
router.route("/:id/submit-answer").post((req, res, next) => {
    // 1. Manually invoke Multer so we can catch its direct pipeline failures
    uploadSingleAudio(req, res, function (err) {
        if (err) {
            console.error("❌ MULTER UPLOAD CRASHED:", err);
            res.status(500);
            return res.json({ 
                message: "File processing failure inside Multer middleware.", 
                error: err.message 
            });
        }
        // 2. No errors? Pass control to your session controller safely!
        next();
    });
}, submitAnswer);
router.route("/:id/end").post(endSession);

export default router;