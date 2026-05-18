import express from 'express';
import * as ticketController from '../controllers/ticketController.mjs';

const router = express.Router();

import path from 'path';
import fs from 'fs';
import multer from 'multer';

const uploadDirectory = path.join('public', 'files');
fs.mkdirSync(uploadDirectory, { recursive: true });

function buildUniqueFileName(originalName) {
    const extension = path.extname(originalName);
    const baseName = path
        .basename(originalName, extension)
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'upload';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return `${baseName}-${uniqueSuffix}${extension}`;
}

// Specify the destination and filename for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
        cb(null, buildUniqueFileName(file.originalname));
    }
});

const upload = multer({
     storage: storage,
     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
     fileFilter: function (req, file, cb) {
         const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
         if (allowedTypes.includes(file.mimetype)) {
             cb(null, true);
         } else {
             cb(new Error('Invalid file type'), false);
         }
     }
});

router.get('/create-ticket/student/:student_id', ticketController.renderCreateTicketPage);
router.post('/create-ticket/student/:student_id', upload.array('files', 10), ticketController.submitCreateTicket);

router.get('/secretary-view-ticket/ticket/:ticket_id', ticketController.renderSecretaryViewTicketPage);
router.post('/secretary-view-ticket/ticket/:ticket_id', upload.array('files', 10), ticketController.submitSecretaryReply);
router.post('/secretary-view-ticket/ticket/:ticket_id/reply', upload.array('files', 10), ticketController.submitSecretaryReply);

router.get('/student-view-ticket/ticket/:ticket_id', ticketController.renderStudentViewTicketPage);
router.post('/student-view-ticket/ticket/:ticket_id', upload.array('files', 10), ticketController.submitStudentReply);
router.post('/student-view-ticket/ticket/:ticket_id/reply', upload.array('files', 10), ticketController.submitStudentReply);



// clear duplicate files 
router.get('/clear-duplicate-uploads/',ticketController.clearDuplicateFiles);


export default router;