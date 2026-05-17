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

function basename(value) {
	if (!value) return '';
	return path.basename(String(value));
}

function formatFileSize(bytes) {
	if (bytes == null || isNaN(bytes)) return '';
	const b = Number(bytes);
	if (b < 1024) return `${b} B`;
	const kb = b / 1024;
	if (kb < 1024) return `${Math.round(kb)} KB`;
	const mb = kb / 1024;
	return `${mb.toFixed(1)} MB`;
}

function fileLabel(fileName, fileType) {
	if (fileName) {
		const ext = fileName.split('.').pop();
		if (ext && ext.length <= 5) return ext.toUpperCase();
	}
	if (fileType) {
		if (fileType.includes('pdf')) return 'PDF';
		if (fileType.includes('word') || fileType.includes('msword')) return 'DOC';
		if (fileType.includes('image')) return 'IMG';
	}
	return 'FILE';
}

export default {
	fallback,
	hasValue,
	hasItems,
	headerTitle,
	messageMeta,
	attachmentUrl,
	basename,
	formatFileSize,
	fileLabel,
};
