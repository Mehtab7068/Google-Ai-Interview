import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use disk storage for audio files so they can be processed by transcription service
const uploadDir = path.resolve(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname) || '.webm';
        const sessionId = req.params.id || 'unknown';
        cb(null, `${sessionId}-${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (!file) return cb(null, true);

    const allowedMimeTypes = new Set([
        "audio/aac",
        "audio/flac",
        "audio/m4a",
        "audio/mp4",
        "audio/mpeg",
        "audio/ogg",
        "audio/wav",
        "audio/webm",
        "video/webm",
        "application/octet-stream",
    ]);
    const allowedExtensions = new Set([".aac", ".flac", ".m4a", ".mp3", ".mp4", ".ogg", ".wav", ".webm"]);
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid audio file. Use WAV, MP3, OGG, M4A, AAC, FLAC, MP4, or WebM."), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const uploadSingleAudio = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}. Ensure form-data key is 'file'.`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
};

export { uploadSingleAudio };