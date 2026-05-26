import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';

const uploadDirectory = path.join('public', 'files');
fs.mkdirSync(uploadDirectory, { recursive: true }); 
// makes sure the upload directory exists, creating it if necessary. This prevents errors when saving files.

function buildUniqueFileName(originalName) {
    const extension = path.extname(originalName);
    const baseName = path
        .basename(originalName, extension)
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'upload';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return `${baseName}-${uniqueSuffix}${extension}`;
}
// document.pdf
// baseName: "document"
// uniqueSuffix: "1634567890123-123456789"
// Αποτέλεσμα: "document-1634567890123-123456789.pdf"

// Η αναφορά μου!.docx
// baseName: "Η_αναφορά_μου_" (ειδικοί χαρακτήρες γίνονται _)
// Αποτέλεσμα: "Η_αναφορά_μου-1634567890123-123456789.docx"

// !!!.jpg
// baseName: "" -> "upload"
// Αποτέλεσμα: "upload-1634567890123-123456789.jpg"

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDirectory),
    filename: (req, file, cb) => cb(null, buildUniqueFileName(file.originalname)),
});

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
});

// middleware to handle file uploads in routes, allowing up to 10 files per request
export const uploadFiles = upload.array('files', 10);
