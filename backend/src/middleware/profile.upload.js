import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDirectory = path.join(process.cwd(), 'uploads', 'profile-pictures');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDirectory),
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = file.originalname
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-_.]/g, '')
            .replace(/-+/g, '-');
        const filename = `${req.user.id}-${Date.now()}-${safeName}${extension}`;
        cb(null, filename);
    },
});

export const profilePictureUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed')); // handled by error middleware
        }
    },
});

export const profileUploadErrorHandler = (err, _req, res, next) => {
    if (!err) {
        return next();
    }

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ msg: err.message });
    }

    return res.status(400).json({ msg: err.message || 'Unable to upload profile picture' });
};