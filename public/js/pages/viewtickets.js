// Modal interactions for the secretary/leader dashboard tables.
//
// Clicking a row that carries a `data-modal-type` attribute (unassigned or
// escalated tickets) opens an inline modal. The modal HTML lives as a
// <template> element in viewtickets.hbs and is cloned client-side; data
// is populated via /api/ticket/:id — so no second HTTP round-trip for the
// shell HTML.
//
// The companion file rowNav.js handles `data-href` rows (full-page view
// navigation) and is loaded for every role.
document.addEventListener('DOMContentLoaded', () => {
    const modalRoot = document.getElementById('modalRoot');
    const { renderAttachmentList } = window.AttachUtils;
    let escapeHandler = null;

    // --- Modal: lifecycle -------------------------------------------------

    const closeModal = () => {
        if (escapeHandler) {
            document.removeEventListener('keydown', escapeHandler);
            escapeHandler = null;
        }
        if (modalRoot) modalRoot.replaceChildren();
        document.body.style.overflow = '';
    };

    // Returns a fresh DOM fragment for the requested modal type, cloned
    // from the appropriate <template id="modal-template-*"> in the page.
    const cloneModalShell = (modalType) => {
        const tpl = document.getElementById(`modal-template-${modalType}`);
        if (!tpl || !(tpl instanceof HTMLTemplateElement)) return null;
        return tpl.content.cloneNode(true);
    };

    const bindModalEvents = (root) => {
        const overlay = root.querySelector('#ticketModal');
        const closeBtn = root.querySelector('#closeModalBtn');

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) {
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) closeModal();
            });
        }

        escapeHandler = (event) => {
            if (event.key === 'Escape') closeModal();
        };
        document.addEventListener('keydown', escapeHandler);
    };

    // --- Modal: population ------------------------------------------------

    const setText = (root, id, value) => {
        const el = root.querySelector(`#${id}`);
        if (el) el.textContent = value ?? '-';
    };

    const populateLeaderSelect = (root, data) => {
        const select = root.querySelector('#modal-secretary-select');
        if (!select || !Array.isArray(data.secretaries)) return;

        const leaderName = data.leaderDisplayName || 'Προϊστάμενος';
        const leaderId = data.leaderSecretaryId;

        select.replaceChildren();

        if (leaderId) {
            const selfOption = document.createElement('option');
            selfOption.value = String(leaderId);
            selfOption.textContent = leaderName;
            selfOption.selected = true;
            select.appendChild(selfOption);
        }

        data.secretaries.forEach((sec) => {
            if (Number(sec.secretary_id) === Number(leaderId)) return;
            const option = document.createElement('option');
            option.value = String(sec.secretary_id);
            option.textContent = sec.displayName;
            select.appendChild(option);
        });
    };

    // Wires up the form action URLs once we know the ticket id + type.
    const configureModalActions = (root, ticketId, modalType) => {
        const assignForm = root.querySelector('#modalAssignForm');
        const acceptForm = root.querySelector('#modalAcceptEscalatedForm');
        const rejectForm = root.querySelector('#modalRejectEscalatedForm');

        if (modalType === 'escalated') {
            if (acceptForm) acceptForm.action = `/tickets/escalated/accept/${ticketId}`;
            if (rejectForm) rejectForm.action = `/tickets/escalated/reject/${ticketId}`;
            return;
        }

        if (assignForm) assignForm.action = `/tickets/assign/${ticketId}`;
    };

    const loadTicketIntoModal = async (root, ticketId, modalType) => {
        setText(root, 'modal-id', ticketId);
        setText(root, 'modal-description', 'Φόρτωση δεδομένων...');

        const attachmentsEl = root.querySelector('#modal-attachments');
        if (attachmentsEl) {
            attachmentsEl.replaceChildren();
            const loading = document.createElement('p');
            loading.className = 'file-empty-state';
            loading.textContent = 'Φόρτωση αρχείων...';
            attachmentsEl.appendChild(loading);
        }

        const response = await fetch(`/api/ticket/${ticketId}`, { credentials: 'same-origin' });
        const data = await response.json();
        if (!data.success) throw new Error('API returned failure');

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
            // renderAttachmentList escapes file metadata itself, so this is safe.
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

    // --- Modal: open from a clicked row -----------------------------------

    const openModalForRow = async (row) => {
        if (!modalRoot) return;

        const ticketId = row.getAttribute('data-ticket-id');
        const modalType = row.getAttribute('data-modal-type');
        if (!ticketId || !modalType) return;

        const fragment = cloneModalShell(modalType);
        if (!fragment) {
            console.error(`No <template id="modal-template-${modalType}"> in page`);
            return;
        }

        modalRoot.replaceChildren(fragment);
        document.body.style.overflow = 'hidden';

        const overlay = modalRoot.querySelector('#ticketModal');
        if (overlay) overlay.classList.add('open');

        bindModalEvents(modalRoot);

        try {
            await loadTicketIntoModal(modalRoot, ticketId, modalType);
        } catch (error) {
            console.error('Failed to load ticket details into modal:', error);
            closeModal();
            alert('Δεν ήταν δυνατή η φόρτωση του αιτήματος.');
        }
    };

    // --- Row click + keyboard delegation ----------------------------------

    // Inline assign form lives INSIDE the unassigned row for the leader's
    // quick-assign-without-modal flow; stop its events from bubbling up to
    // the row click handler that would otherwise open the modal.
    const isolateInlineForms = (element) => {
        ['click', 'mousedown', 'pointerdown', 'keydown'].forEach((eventName) => {
            element.addEventListener(eventName, (event) => event.stopPropagation());
        });
    };
    document
        .querySelectorAll('.leader-assign-form, .leader-secretary-select')
        .forEach(isolateInlineForms);

    document.querySelectorAll('tr[data-modal-type]').forEach((row) => {
        row.style.cursor = 'pointer';
        row.tabIndex = 0;
    });

    document.addEventListener('click', (event) => {
        const row = event.target.closest('tr[data-modal-type]');
        if (!row) return;
        if (event.target.closest('form, button, a, input, select')) return;
        event.preventDefault();
        openModalForRow(row);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const row = event.target.closest('tr[data-modal-type]');
        if (!row) return;
        if (event.target.closest('form, button, a, input, select')) return;
        event.preventDefault();
        openModalForRow(row);
    });
});
