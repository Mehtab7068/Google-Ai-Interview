import multer from "multer";

// Use memoryStorage for cloud/deployed environments like Render
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (!file) return cb(null, true);

    if (
        file.mimetype.startsWith("audio/") || 
        file.mimetype.startsWith("video/") ||
        file.mimetype === "application/octet-stream"
    ) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only audio uploads are allowed!"), false);
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