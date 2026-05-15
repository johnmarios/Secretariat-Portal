document.addEventListener('DOMContentLoaded', function () {
  var fileInput = document.getElementById('replyFiles');
  var dropzone = document.getElementById('replyDropzone');
  var fileList = document.getElementById('replyFileList');
  var fileStore = [];

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }

    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function renderFiles() {
    fileList.innerHTML = '';

    if (!fileStore.length) {
      var emptyState = document.createElement('p');
      emptyState.className = 'staging-empty';
      emptyState.textContent = 'Δεν έχουν επιλεγεί αρχεία ακόμη.';
      fileList.appendChild(emptyState);
      return;
    }

    fileStore.forEach(function (file, index) {
      var item = document.createElement('div');
      item.className = 'staging-item';

      item.innerHTML =
        '<span class="staging-icon">📄</span>' +
        '<div class="staging-info">' +
        '<p class="staging-name" title="' + file.name + '">' + file.name + '</p>' +
        '<span class="staging-size">' + formatSize(file.size) + '</span>' +
        '</div>' +
        '<button type="button" class="staging-remove" aria-label="Αφαίρεση αρχείου">×</button>';

      item.querySelector('.staging-remove').addEventListener('click', function () {
        fileStore.splice(index, 1);
        syncInput();
        renderFiles();
      });

      fileList.appendChild(item);
    });
  }

  function syncInput() {
    var dataTransfer = new DataTransfer();
    fileStore.forEach(function (file) {
      dataTransfer.items.add(file);
    });
    fileInput.files = dataTransfer.files;
  }

  function addFiles(files) {
    Array.from(files).forEach(function (file) {
      fileStore.push(file);
    });
    syncInput();
    renderFiles();
  }

  fileInput.addEventListener('change', function () {
    addFiles(fileInput.files);
  });

  dropzone.addEventListener('click', function () {
    fileInput.click();
  });

  dropzone.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });

  renderFiles();
});