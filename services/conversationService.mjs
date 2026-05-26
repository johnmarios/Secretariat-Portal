import * as db from '../model/db.js';
import { formatAttachment } from '../utils/attachmentFormat.mjs';

const isInternalMessage = (m) =>
    Number(m.is_internal) === 1 || m.is_internal === true;

// Loads the entire conversation thread for a ticket and returns
// everything the view templates need in one shot.
export async function buildTicketConversation(ticketId, studentRow) {
    const numericTicketId = Number(ticketId);

    const firstMessage = await db.getFirstMessageByTicketId(numericTicketId);
    if (!firstMessage) return null;

    const firstMessageAttachmentsRaw = await db.getAttachmentsByMessageId(firstMessage.message_id);
    const firstMessageAttachments = firstMessageAttachmentsRaw.map(formatAttachment);

    const restStudentMessages = await db.getRestStudentMessagesByTicketId(numericTicketId);
    const secretaryMessages = await db.getSecretaryMessagesByTicketId(numericTicketId);
    const allMessages = [...restStudentMessages, ...secretaryMessages]
        .sort((a, b) => a.message_id - b.message_id);

    const messageIds = allMessages.map((m) => m.message_id);
    const allAttachments = messageIds.length
        ? await db.getAttachmentsByMessagesId(messageIds)
        : [];

    const attachmentsMap = new Map();
    for (const att of allAttachments) {
        if (!attachmentsMap.has(att.for_message_id)) {
            attachmentsMap.set(att.for_message_id, []);
        }
        attachmentsMap.get(att.for_message_id).push(att);
    }

    const studentUserId = Number(studentRow?.user_id);

    const formatMessage = (message) => {
        const isFromStudent = Number(message.for_user_id) === studentUserId;
        const rawAtts = attachmentsMap.get(message.message_id) || [];
        return {
            ...message,
            attachments: rawAtts.map(formatAttachment),
            senderDisplay: isFromStudent ? 'ΦΟΙΤΗΤΗΣ' : 'ΓΡΑΜΜΑΤΕΙΑ',
            bubbleClass: isFromStudent ? 'student-message' : 'staff-message',
            created_at: message.created_at,
        };
    };

    const visibleMessages = allMessages.filter((m) => !isInternalMessage(m)).map(formatMessage);
    const internalMessages = allMessages.filter(isInternalMessage).map(formatMessage);

    return {
        firstMessage,
        firstMessageAttachments,
        messages: visibleMessages,
        internalMessages,
        messagesCount: visibleMessages.length + 1,
    };
}
