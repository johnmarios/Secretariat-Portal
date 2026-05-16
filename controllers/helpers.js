import path from 'path';

function isBlank(value) {
	return value === undefined || value === null || String(value).trim() === '';
}

function fallback(value, fallbackValue = '-') {
	return isBlank(value) ? fallbackValue : value;
}

function hasValue(value) {
	return !isBlank(value);
}

function hasItems(value) {
	return Array.isArray(value) && value.length > 0;
}

function headerTitle(firstMessage, ticketId) {
	if (!firstMessage) {
		return `Αίτημα #${ticketId}`;
	}

	return fallback(firstMessage.message_subject ?? firstMessage.subject, `Αίτημα #${ticketId}`);
}

function messageMeta(senderDisplay, createdAt) {
	const sender = fallback(senderDisplay, 'ΣΥΣΤΗΜΑ');

	if (!createdAt) {
		return sender;
	}

	const date = new Date(createdAt);
	return `${sender} • ${date.toLocaleDateString('el-GR')} ${date.toLocaleTimeString('el-GR', {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
}

function attachmentUrl(filePath) {
	if (!filePath) {
		return '#';
	}

	return `/files/${path.basename(filePath)}`;
}

export default {
	fallback,
	hasValue,
	hasItems,
	headerTitle,
	messageMeta,
	attachmentUrl,
};
