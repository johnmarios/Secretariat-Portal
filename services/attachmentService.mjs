import * as db from '../model/db.js';

// Persists every uploaded file as an ATTACHMENT row linked to the given message.
// Centralizes the file-save loop that used to be duplicated across the 4 submit
// handlers (create ticket, secretary reply, student reply, internal message).
export async function saveAttachmentsForMessage(messageId, files) {
    if (!files || files.length === 0) return;

    for (const file of files) {
        await db.saveAttachment({
            file_path: file.path,
            file_name: file.originalname,
            file_size: file.size,
            file_type: file.mimetype,
            file_id: file.filename,
            for_message_id: messageId,
        });
    }
}
