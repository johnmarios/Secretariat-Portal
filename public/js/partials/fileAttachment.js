document.addEventListener('DOMContentLoaded', function () {
    // waits for the DOM to be fully loaded before running the script

    // get all necessary elements from the DOM
    const uploadZone = document.getElementById('fileUploadZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const fileError = document.getElementById('fileError');

    if (!uploadZone || !fileInput || !fileList || !fileError) {
        return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ];
    let selectedFiles = [];

    //events: 

    //dragenter: mouse enters file upload zone

    //dragover: mouse is moving inside the file upload zone
    //here we need to preventDefault to allow dropping files, 
    // because by default browser doesn't allow dropping files into an element
    
    //dragleave: mouse leaves the file upload zone

    //drop: files are dropped into the file upload zone     
    //here without preventDefault browser opens the file on drop, 
    // so we need to prevent that default behavior 
    //and handle the files ourselves

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
    // from event gets dataTransfer property which contains the files that were dropped
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => handleFiles(event.target.files));


    // prevent browser to open the file to a new tab 
    function preventDefaults(event) {
        event.preventDefault(); // useful on dragover and drop
        event.stopPropagation(); // don't let the event to go up the DOM tree (to parent elements),
        //  which could trigger unwanted behaviors
    }

    function handleFiles(files) {
        fileError.textContent = ''; // clear previous errors
        fileError.classList.add('hidden'); // hide error message if it was shown before

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                showError(`Το αρχείο "${file.name}" είναι πολύ μεγάλο (max 10MB)`);
                continue;
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                showError(`Ο τύπος αρχείου "${file.name}" δεν υποστηρίζεται`);
                continue;
            }
            //checks if at least one element has the same name with the file we want to add
            if (selectedFiles.some((storedFile) => storedFile.name === file.name)) {
                showError(`Το αρχείο "${file.name}" έχει ήδη επιλεγεί`);
                continue;
            }

            selectedFiles.push(file);
        }

        // after we update the selectedFiles array, we need to sync it with the file input 
        // and re-render the file list in the UI
        syncInputFiles();
        renderFileList();
    }

    // input == fileInput
    // .files: built in property, readonly | by default it has every file we select but with the help of 
    // datatrasnfer, we select which files we want to be in the file input and which not
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

        // add class to show the file list container when there are files to display
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
                // remove the file from the selectedFiles array based on the index of the file item we want to remove
                selectedFiles.splice(index, 1); // (position to start the removal, number of items to remove)
                // we rerender the file list and sync the file input after we update the selectedFiles array,
                // to reflect the changes in the UI and in the file input
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
        // converts bytes to a human-readable format (KB, MB) with 2 decimal places
        if (bytes === 0) return '0 Bytes';
        const kiloBytes = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];

        // 1KB = 1024 bytes, 1MB = 1024 KB = 1024^2 bytes, 1GB = 1024 MB = 1024^3 bytes
        // unit number:
        // 0: 0-1023 bytes
        // 1: 1024-1048575 bytes | 1024^2 - 1 = 2^20 - 1 bytes | 1KB-1023.99KB
        // 2: 1048576-1073741823 bytes | 1024^3 - 1 bytes = 2^30 - 1 bytes | 1MB-1023.99MB

        const unitIndex = Math.floor(Math.log(bytes) / Math.log(kiloBytes));

        // safe index to prevent going out of bounds of the sizes array, in case we have a file larger than 1GB 
        // (which is not allowed in our case, but just for safety)
        const safeIndex = Math.min(unitIndex, sizes.length - 1);
        // now we have sizes.lenth = 3, so the max index is 2, which corresponds to MB,
        //  and if we have a file larger than 1GB, we will still show it in MB instead of 
        // going out of bounds of the sizes array


        const value = bytes / Math.pow(kiloBytes, safeIndex);

        // * 100 / 100 to round to 2 decimal places, and add the unit from the sizes array based on the safe index
        return `${Math.round(value * 100) / 100} ${sizes[safeIndex]}`;
    }

    function showError(message) {
        fileError.textContent = message;
        fileError.classList.remove('hidden'); 
        // it appears when we remove the hidden class
    }

    renderFileList();
});
