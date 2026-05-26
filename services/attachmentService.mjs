import * as db from '../model/db.js';

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
