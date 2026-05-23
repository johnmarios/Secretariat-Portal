  const profileWrapper = document.querySelector('.profile-wrapper');
  const profileTrigger = document.querySelector('#avatar');

  if (profileWrapper && profileTrigger) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileWrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!profileWrapper.contains(e.target)) {
        profileWrapper.classList.remove('open');
      }
    });
  }

// ==========================================
//  TICKET DETAILS POP UP WINDOW
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
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
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const fileLabel = (fileName, fileType) => {
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

  const attachmentUrl = (filePath) => {
    if (!filePath) return '#';
    const cleanedPath = String(filePath).replace(/^\/public/, '');
    return `/files/${cleanedPath.split('/').pop()}`;
  };

  const basename = (value) => {
    if (!value) return '';
    const normalized = String(value).replace(/\\/g, '/');
    return normalized.split('/').pop();
  };

  const renderAttachmentList = (attachments) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
      return '<p class="file-empty-state">Δεν υπάρχουν επισυναπτόμενα αρχεία.</p>';
    }

    return attachments.map(file => `
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
  
  // Delegated download handler: try native download, then fetch blob fallback and try original stored path
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest && e.target.closest('.attachment-download');
    if (!anchor) return;

    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // allow modifier keys
    e.preventDefault();

    const fileItem = anchor.closest('.file-item');
    if (fileItem) fileItem.classList.add('downloading');

    const originalUrl = anchor.href;
    const storedPath = anchor.getAttribute('data-file-path');
    const filename = anchor.getAttribute('download') || basename(storedPath) || 'file';

    // Try native download via temporary anchor
    try {
      const temp = document.createElement('a');
      temp.href = originalUrl;
      temp.download = filename;
      temp.style.display = 'none';
      document.body.appendChild(temp);
      temp.click();
      document.body.removeChild(temp);
      if (fileItem) fileItem.classList.remove('downloading');
      return;
    } catch (err) {
      // fallback to fetch
    }

    const tryFetchAndDownload = async (url) => {
      try {
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) throw new Error('network');
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
        return true;
      } catch (e) {
        return false;
      }
    };

    (async () => {
      // try original href first
      let ok = await tryFetchAndDownload(originalUrl);
      if (!ok && storedPath) {
        // try stored path as-is
        ok = await tryFetchAndDownload(storedPath);
      }
      if (!ok && storedPath) {
        // try adding leading slash and converting backslashes
        const s = ('/' + String(storedPath).replace(/\\/g, '/')).replace(/\/\//g, '/');
        ok = await tryFetchAndDownload(s);
      }
      if (!ok) {
        // try /files/<basename>
        const base = basename(storedPath || originalUrl);
        if (base) ok = await tryFetchAndDownload(`/files/${base}`);
      }

      if (!ok) {
        // last resort: open original
        window.open(originalUrl, '_blank');
      }
      if (fileItem) fileItem.classList.remove('downloading');
    })();
  });
});





// gia tis karteles
function openTab(evt, tabName) {
  // Βρες όλα τα περιεχόμενα (πίνακες) και κρύψ'τα
  let tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].style.display = "none";
  }

  // Βρες όλα τα κουμπιά των tabs και βγάλε τους την κλάση "active" (το μπλε χρώμα)
  let tabLinks = document.getElementsByClassName("tab-link");
  for (let i = 0; i < tabLinks.length; i++) {
    tabLinks[i].classList.remove("active");
  }

  // Εμφάνισε τον πίνακα που ζητήθηκε και κάνε active το κουμπί που πατήθηκε
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
}

async function claimTicket(ticketId, buttonElement) {
    try {
        const response = await fetch(`/api/tickets/claim/${ticketId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            // Αν η βάση ενημερώθηκε επιτυχώς, κάνουμε ανανέωση τη σελίδα
            window.location.reload();
        } else {
            alert('Σφάλμα: ' + data.message);
        }
    } catch (error) {
        console.error('Σφάλμα δικτύου:', error);
        alert('Υπήρξε πρόβλημα με τη σύνδεση.');
    }
}
