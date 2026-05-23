// ==========================================
// ΠΡΟΦΙΛ - DROPDOWN MENU
// ==========================================
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
// TICKET DETAILS - ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  // Μετατρέπει τα Bytes σε KB/MB για να φαίνονται ωραία στο μάτι
  const formatFileSize = (bytes) => {
    if (bytes == null || Number.isNaN(Number(bytes))) return '';
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    const kb = size / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Βγάζει την ετικέτα (DOC, PDF, IMG) για το μπλε εικονίδιο δίπλα στο αρχείο
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

  // (Προαιρετικό) Αν κάποια άλλη JavaScript χτίζει δυναμικά λίστες αρχείων (π.χ. στο Modal)
  // χρησιμοποιούμε αυτή τη συνάρτηση με τα ΚΑΘΑΡΑ πλέον δεδομένα από το API!
  window.renderAttachmentList = (attachments) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
      return '<p class="file-empty-state">Δεν υπάρχουν επισυναπτόμενα αρχεία.</p>';
    }

    return attachments.map(file => `
      <div class="file-item">
        <div class="file-item-icon">${escapeHtml(fileLabel(file.file_name, file.file_type))}</div>
        <div class="file-item-info">
          <p class="file-item-name">${escapeHtml(file.file_name)}</p>
          <p class="file-item-size">${escapeHtml(formatFileSize(file.file_size))}</p>
        </div>
        <a href="${escapeHtml(file.file_path)}" class="attachment-download" aria-label="Download attachment" download="${escapeHtml(file.file_name)}" target="_blank" rel="noopener noreferrer">
          <img src="/images/file-download-svgrepo-com.svg" alt="Download">
        </a>
      </div>
    `).join('');
  };
});

// ==========================================
// TABS LOGIC (Εναλλαγή καρτελών)
// ==========================================
function openTab(evt, tabName) {
  let tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].style.display = "none";
  }

  let tabLinks = document.getElementsByClassName("tab-link");
  for (let i = 0; i < tabLinks.length; i++) {
    tabLinks[i].classList.remove("active");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
}

// ==========================================
// CLAIM TICKET LOGIC (Ανάληψη Αιτήματος)
// ==========================================
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