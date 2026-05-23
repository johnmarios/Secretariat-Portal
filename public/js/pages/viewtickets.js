document.addEventListener('DOMContentLoaded', function () {
    const modalRoot = document.getElementById('modalRoot');
    let escapeHandler = null;

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

    // 1. Το Helper που καθαρίζει το όνομα (ακριβώς όπως στο HBS)
    const basename = (value) => {
        if (!value) return '';
        return String(value).replace(/\\/g, '/').split('/').pop();
    };

    // 2. Το Helper που φτιάχνει το σωστό URL (ακριβώς όπως στο HBS)
    const attachmentUrl = (filePath) => {
        if (!filePath) return '#';
        const cleanedPath = String(filePath).replace(/\\/g, '/').replace(/^\/?public/, '');
        return `/files/${cleanedPath.split('/').pop()}`;
    };

    // 3. Η συνάρτηση που χτίζει την HTML
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

    const closeModal = () => {
        if (escapeHandler) {
            document.removeEventListener('keydown', escapeHandler);
            escapeHandler = null;
        }

        if (modalRoot) {
            modalRoot.innerHTML = '';
        }
        document.body.style.overflow = '';
    };

    const setText = (root, id, value) => {
        const el = root.querySelector(`#${id}`);
        if (el) el.textContent = value ?? '-';
    };

    const populateLeaderSelect = (root, data) => {
        const select = root.querySelector('#modal-secretary-select');
        if (!select || !Array.isArray(data.secretaries)) return;

        const leaderName = data.leaderDisplayName || 'Προϊστάμενος';
        const leaderId = data.leaderSecretaryId;

        select.innerHTML = '';

        if (leaderId) {
            const selfOption = document.createElement('option');
            selfOption.value = String(leaderId);
            selfOption.textContent = `${leaderName}`;
            selfOption.selected = true;
            select.appendChild(selfOption);
        }

        data.secretaries.forEach((sec) => {
            if (Number(sec.secretary_id) === Number(leaderId)) return;
            const option = document.createElement('option');
            option.value = String(sec.secretary_id);
            option.textContent = `${sec.first_name} ${sec.last_name}`;
            select.appendChild(option);
        });
    };

    const configureModalActions = (root, ticketId, modalType) => {
        const assignForm = root.querySelector('#modalAssignForm');
        const internalCol = root.querySelector('#modal-internal-col');
        const modalContent = root.querySelector('.modal-content');
        const acceptForm = root.querySelector('#modalAcceptEscalatedForm');
        const rejectForm = root.querySelector('#modalRejectEscalatedForm');

        if (modalType === 'escalated') {
            if (modalContent) modalContent.classList.add('escalated-view');
            if (internalCol) internalCol.style.display = 'flex';
            if (assignForm) assignForm.style.display = 'none';
            if (acceptForm) acceptForm.action = `/tickets/escalated/accept/${ticketId}`;
            if (rejectForm) rejectForm.action = `/tickets/escalated/reject/${ticketId}`;
            return;
        }

        if (modalContent) modalContent.classList.remove('escalated-view');
        if (internalCol) internalCol.style.display = 'none';

        if (assignForm) {
            assignForm.style.display = 'block';
            assignForm.action = `/tickets/assign/${ticketId}`;
        }
    };

    const loadTicketIntoModal = async (root, ticketId, modalType) => {
        setText(root, 'modal-id', ticketId);
        setText(root, 'modal-description', 'Φόρτωση δεδομένων...');

        const attachmentsEl = root.querySelector('#modal-attachments');
        if (attachmentsEl) {
            attachmentsEl.innerHTML = '<p class="file-empty-state">Φόρτωση αρχείων...</p>';
        }

        const response = await fetch(`/api/ticket/${ticketId}`, { credentials: 'same-origin' });
        const data = await response.json();

        if (!data.success) {
            throw new Error('API returned failure');
        }

        setText(root, 'modal-subject', data.subject);
        setText(root, 'modal-category', data.category);
        setText(root, 'modal-student', data.studentName);
        setText(root, 'modal-am', data.studentAm);
        setText(root, 'modal-email', data.studentEmail);
        setText(root, 'modal-year', data.enrollmentYear);
        setText(root, 'modal-date', data.date);
        setText(root, 'modal-description', data.description);

        if (attachmentsEl) {
            attachmentsEl.classList.add('has-items');
            attachmentsEl.innerHTML = renderAttachmentList(data.attachments || []);
        }

        if (modalType === 'escalated') {
            setText(root, 'modal-internal-desc', data.internalMessage?.text || 'Δεν βρέθηκε σχόλιο.');
        }

        if (modalType === 'leader') {
            populateLeaderSelect(root, data);
        }

        configureModalActions(root, ticketId, modalType);
    };

    const bindModalEvents = (root) => {
        const modalOverlay = root.querySelector('#ticketModal');
        const closeBtn = root.querySelector('#closeModalBtn');

        const bindClose = () => closeModal();
        if (closeBtn) closeBtn.addEventListener('click', bindClose);

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (event) => {
                if (event.target === modalOverlay) closeModal();
            });
        }

        escapeHandler = function handleEscape(event) {
            if (event.key === 'Escape') closeModal();
        };
        document.addEventListener('keydown', escapeHandler);
    };

    const openModalFromUrl = async (url, row) => {
        if (!modalRoot || !url || !row) return;

        const ticketId = row.getAttribute('data-ticket-id');
        const modalType = row.getAttribute('data-modal-type') || 'secretary';

        try {
            const response = await fetch(url, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin'
            });

            if (response.redirected || String(response.url).includes('/login')) {
                window.location.href = response.url;
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to load modal (${response.status})`);
            }

            const html = await response.text();
            const isFullPage = /<!DOCTYPE|<html[\s>]/i.test(html);
            if (isFullPage) {
                window.location.href = url;
                return;
            }

            modalRoot.innerHTML = html;
            document.body.style.overflow = 'hidden';

            const modalOverlay = modalRoot.querySelector('#ticketModal');
            if (modalOverlay) modalOverlay.classList.add('open');

            bindModalEvents(modalRoot);
            await loadTicketIntoModal(modalRoot, ticketId, modalType);
        } catch (error) {
            closeModal();
            alert('Δεν ήταν δυνατή η φόρτωση του αιτήματος.');
        }
    };

    const stopModalBubbling = (element) => {
        if (!element) return;
        ['click', 'mousedown', 'pointerdown', 'keydown'].forEach((eventName) => {
            element.addEventListener(eventName, (event) => event.stopPropagation());
        });
    };

    document.querySelectorAll('.leader-assign-form, .leader-secretary-select').forEach(stopModalBubbling);

    document.addEventListener('click', async function (event) {
        const row = event.target.closest('tr[data-modal-url], tr[data-href]');
        if (!row) return;

        if (event.target.closest('form, button, a, input, select')) return;

        if (row.dataset.modalUrl) {
            event.preventDefault();
            await openModalFromUrl(row.dataset.modalUrl, row);
            return;
        }

        const href = row.dataset.href;
        if (href) window.location.href = href;
    });

    document.querySelectorAll('tr[data-modal-url], tr[data-href]').forEach((row) => {
        row.style.cursor = 'pointer';
        row.tabIndex = 0;
        row.addEventListener('keydown', async function (event) {
            if (event.key !== 'Enter') return;

            if (this.dataset.modalUrl) {
                await openModalFromUrl(this.dataset.modalUrl, this);
                return;
            }

            const href = this.dataset.href;
            if (href) window.location.href = href;
        });
    });
});