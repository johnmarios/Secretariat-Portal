document.addEventListener('DOMContentLoaded', function () {
    const uploadZone = document.getElementById('fileUploadZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const fileError = document.getElementById('fileError');

    if (!uploadZone || !fileInput || !fileList || !fileError) {
        return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ];
    let selectedFiles = [];

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.add('drag-over'));
    });

    ['dragleave', 'drop'].forEach((eventName) => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('drag-over'));
    });

    uploadZone.addEventListener('drop', (event) => handleFiles(event.dataTransfer.files));
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => handleFiles(event.target.files));

    function preventDefaults(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    function handleFiles(files) {
        fileError.textContent = '';
        fileError.classList.add('hidden');

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                showError(`Το αρχείο "${file.name}" είναι πολύ μεγάλο (max 10MB)`);
                continue;
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                showError(`Ο τύπος αρχείου "${file.name}" δεν υποστηρίζεται`);
                continue;
            }

            if (selectedFiles.some((storedFile) => storedFile.name === file.name)) {
                showError(`Το αρχείο "${file.name}" έχει ήδη επιλεγεί`);
                continue;
            }

            selectedFiles.push(file);
        }

        syncInputFiles();
        renderFileList();
    }

    function syncInputFiles() {
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach((file) => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
    }

    function renderFileList() {
        fileList.innerHTML = '';

        if (selectedFiles.length === 0) {
            fileList.classList.remove('has-items');
            return;
        }

        fileList.classList.add('has-items');

        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            const fileIcon = getFileIcon(file.type);
            const fileSize = formatFileSize(file.size);

            const iconElement = document.createElement('div');
            iconElement.className = 'file-item-icon';
            iconElement.textContent = fileIcon;

            const infoElement = document.createElement('div');
            infoElement.className = 'file-item-info';

            const nameElement = document.createElement('p');
            nameElement.className = 'file-item-name';
            nameElement.textContent = file.name;

            const sizeElement = document.createElement('p');
            sizeElement.className = 'file-item-size';
            sizeElement.textContent = fileSize;

            infoElement.appendChild(nameElement);
            infoElement.appendChild(sizeElement);

            const removeButton = document.createElement('button');
            removeButton.className = 'file-item-remove';
            removeButton.type = 'button';
            removeButton.textContent = '✕';
            removeButton.addEventListener('click', () => {
                selectedFiles.splice(index, 1);
                syncInputFiles();
                renderFileList();
            });

            fileItem.appendChild(iconElement);
            fileItem.appendChild(infoElement);
            fileItem.appendChild(removeButton);

            fileList.appendChild(fileItem);
        });
    }

    function getFileIcon(mimeType) {
        if (mimeType === 'application/pdf') return 'PDF';
        if (mimeType.includes('word')) return 'DOC';
        if (mimeType.includes('image')) return 'IMG';
        return 'FILE';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const kiloBytes = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const unitIndex = Math.floor(Math.log(bytes) / Math.log(kiloBytes));
        const safeIndex = Math.min(unitIndex, sizes.length - 1);
        const value = bytes / Math.pow(kiloBytes, safeIndex);
        return `${Math.round(value * 100) / 100} ${sizes[safeIndex]}`;
    }

    function showError(message) {
        fileError.textContent = message;
        fileError.classList.remove('hidden');
    }

    renderFileList();
});
