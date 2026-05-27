// Shared client-side helpers for rendering attachment lists.
// Exposed on window.AttachUtils so both viewtickets.js and script.js can
// reuse the same logic without duplicating it.
(function () {
    const escapeHtml = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const formatFileSize = (bytes) => {
        if (bytes == null || Number.isNaN(Number(bytes))) return '';
        const size = Number(bytes);
        if (size < 1024) return `${size} B`;
        const kb = size / 1024;
        if (kb < 1024) return `${Math.round(kb)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    const fileLabel = (fileName, fileType) => {
        // checks first file name and then file type
        if (fileName) {
            const ext = String(fileName).split('.').pop();
            if (ext && ext.length <= 5) return ext.toUpperCase();
        }
        if (fileType) {
            if (fileType.includes('pdf')) return 'PDF';
            if (fileType.includes('word') || fileType.includes('msword')) return 'DOC';
            if (fileType.includes('image')) return 'IMG';
        }
        return 'FILE';
    };

    const basename = (value) => {
        // if value is a file path, extract the file name; otherwise return an empty string
        // C:\uploads\files\maths.pdf -> maths.pdf
        if (!value) return '';
        return String(value).replace(/\\/g, '/').split('/').pop();
    };

    const attachmentUrl = (filePath) => {
        // creates the link to download the attachment; if filePath is invalid, returns '#' to avoid broken links
        if (!filePath) return '#';
        const cleanedPath = String(filePath).replace(/\\/g, '/').replace(/^\/?public/, '');
        return `/files/${cleanedPath.split('/').pop()}`;
    };

    const renderAttachmentList = (attachments) => {
        if (!Array.isArray(attachments) || attachments.length === 0) {
            return '<p class="file-empty-state">Δεν υπάρχουν επισυναπτόμενα αρχεία.</p>';
        }

        return attachments.map((file) => `
            <div class="file-item">
                <div class="file-item-icon">${escapeHtml(fileLabel(file.file_name, file.file_type))}</div>
                <div class="file-item-info">
                    <p class="file-item-name">${escapeHtml(basename(file.file_name))}</p>
                    <p class="file-item-size">${escapeHtml(formatFileSize(file.file_size))}</p>
                </div>
                <a href="${escapeHtml(attachmentUrl(file.file_path))}" class="attachment-download" aria-label="Download attachment" download="${escapeHtml(basename(file.file_name))}" data-file-path="${escapeHtml(file.file_path)}" target="_blank" rel="noopener noreferrer">
                    <img src="/images/file-download-svgrepo-com.svg" alt="Download">
                </a>
            </div>
        `).join('');
    };

    window.AttachUtils = {
        escapeHtml,
        formatFileSize,
        fileLabel,
        basename,
        attachmentUrl,
        renderAttachmentList,
    };

    // Expose the main render function directly on window for convenience
    window.renderAttachmentList = renderAttachmentList;
})();
