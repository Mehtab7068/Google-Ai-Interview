import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    if (!file) {
        return cb(null, true); 
    }

    if (
        file.mimetype.startsWith("audio/") || 
        file.mimetype === "application/octet-stream" ||
        file.mimetype === "video/webm"
    ) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only audio uploads are allowed!"), false); 
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 10 }, 
});

// Middleware wrapper that gracefully handles Multer field errors instead of crashing Express
const uploadSingleAudio = (req, res, next) => {
    // Accepts 'file' as the primary field key
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

// curl -X POST http://localhost:8000/transcribe -F "file=@C:\Ai Iinterview\backend\middleware\audio1.webm"
