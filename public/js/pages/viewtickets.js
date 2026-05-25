document.addEventListener('DOMContentLoaded', function () {
    const modalRoot = document.getElementById('modalRoot');
    const { renderAttachmentList } = window.AttachUtils;
    let escapeHandler = null;

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