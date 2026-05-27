document.addEventListener('DOMContentLoaded', () => {
    // get <div> where modals will be injected 
    const modalRoot = document.getElementById('modalRoot');
    const { renderAttachmentList } = window.AttachUtils;
    let escapeHandler = null; // here is saved the reference to the Escape key handler so we can remove it when the modal closes

    // LIFECYCLE 

    // when the modal is created we have escape handler which is an event listener for the Escape key to close the modal
    // if we open/close the modal multiple times, then we would have multiple event listeners, 
    // so we need to remove the previous one when the modal closes
    const closeModal = () => {
        if (escapeHandler) {
            document.removeEventListener('keydown', escapeHandler);
            escapeHandler = null;
        }
        if (modalRoot) modalRoot.replaceChildren(); // empties div content
        document.body.style.overflow = ''; // we lock the background scroll when the modal is open, so we need to restore it when the modal closes
    };


    const cloneModalShell = (modalType) => {
        const tpl = document.getElementById(`modal-template-${modalType}`);
        if (!tpl || !(tpl instanceof HTMLTemplateElement)) return null;
        return tpl.content.cloneNode(true); // deep copy the template content to get 
        // a fresh instance of the modal's HTML structure
    };

    const bindModalEvents = (root) => {
        const overlay = root.querySelector('#ticketModal');
        const closeBtn = root.querySelector('#closeModalBtn');

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) {
            // if the user clicks outside the modal content (on the overlay), close the modal;
            // but if they click inside the modal content, do nothing
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) closeModal();
            });
        }

        escapeHandler = (event) => {
            if (event.key === 'Escape') closeModal();
        };
        document.addEventListener('keydown', escapeHandler);
    };

    // POPULATION

    const setText = (root, id, value) => {
        // inside root(modal) finds an element with the given id 
        // and sets its textContent to the given value (or '-' if value is null/undefined)
        const el = root.querySelector(`#${id}`);
        if (el) el.textContent = value ?? '-';
    };

    const populateLeaderSelect = (root, data) => {
        // populates the secretary select in the leader's assign modal with the list of secretaries from the API;
        // gets dropdown elememt 
        const select = root.querySelector('#modal-secretary-select');
        if (!select || !Array.isArray(data.secretaries)) return;

        const leaderName = data.leaderDisplayName || 'Προϊστάμενος';
        const leaderId = data.leaderSecretaryId;

        select.replaceChildren(); // clears previous options

        // sets up leader option first 
        if (leaderId) {
            const selfOption = document.createElement('option');
            selfOption.value = String(leaderId);
            selfOption.textContent = leaderName;
            selfOption.selected = true;
            select.appendChild(selfOption);
        }

        // and then adds the rest of the secretaries
        data.secretaries.forEach((sec) => {
            if (Number(sec.secretary_id) === Number(leaderId)) return;
            const option = document.createElement('option');
            option.value = String(sec.secretary_id);
            option.textContent = sec.displayName;
            select.appendChild(option);
        });
    };

    // set up the form action URLs once we know the ticket id + type.
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
        // before the text is populated from the API, we show a loading state in the description field 

        const attachmentsEl = root.querySelector('#modal-attachments');
        if (attachmentsEl) {
            attachmentsEl.replaceChildren();
            const loading = document.createElement('p');
            loading.className = 'file-empty-state';
            loading.textContent = 'Φόρτωση αρχείων...';
            attachmentsEl.appendChild(loading);
        }
        // credentials are sended, because endpoint is protected with authentication and we need to send the cookies
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

    // OPEN FROM A CLICKED ROW 

    const openModalForRow = async (row) => {
        if (!modalRoot) return; // check if the modal root element exists 

        const ticketId = row.getAttribute('data-ticket-id');
        const modalType = row.getAttribute('data-modal-type');
        if (!ticketId || !modalType) return;

        const fragment = cloneModalShell(modalType); // get a copy of the modal HTML structure 
        if (!fragment) {
            console.error(`No <template id="modal-template-${modalType}"> in page`);
            return;
        }

        modalRoot.replaceChildren(fragment); // inject the modal HTML into the page
        document.body.style.overflow = 'hidden'; // lock background scroll when modal is open

        const overlay = modalRoot.querySelector('#ticketModal');
        if (overlay) overlay.classList.add('open'); // trigger CSS animation 

        bindModalEvents(modalRoot); // set up event listeners for closing the modal

        try {
            await loadTicketIntoModal(modalRoot, ticketId, modalType); // fetch ticket data from API and populate the modal fields
        } catch (error) {
            console.error('Failed to load ticket details into modal:', error);
            closeModal();
            alert('Δεν ήταν δυνατή η φόρτωση του αιτήματος.');
        }
    };

 
    // OTHER UI ENHANCEMENTS

    // this function stops click/key events from propagating to the row when they originate from interactive elements inside the modal
    //  (like buttons, forms, selects);
    //  so when the user presses select dropdown the modal doesn't open 
    const isolateInlineForms = (element) => {
        ['click', 'mousedown', 'pointerdown', 'keydown'].forEach((eventName) => {
            element.addEventListener(eventName, (event) => event.stopPropagation());
        });
    };
    document
        .querySelectorAll('.leader-assign-form, .leader-secretary-select')
        .forEach(isolateInlineForms);

    
    // enhances the accessibility because the modal can be opened by keyboard,
    // so we need to make sure that interactive elements inside the modal are accessible
    // and don't trigger the modal open/close when interacted with
    // with other words the row can be selected with tab and navigate to the table 
    document.querySelectorAll('tr[data-modal-type]').forEach((row) => {
        row.style.cursor = 'pointer';
        row.tabIndex = 0;
    });

    // we insert an one and only listener on the document 

    document.addEventListener('click', (event) => {
        const row = event.target.closest('tr[data-modal-type]');
        if (!row) return;
        if (event.target.closest('form, button, a, input, select')) return;
        event.preventDefault();
        openModalForRow(row);
    });

    // navigate with tab and enter (same functionality with click)
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const row = event.target.closest('tr[data-modal-type]');
        if (!row) return;
        if (event.target.closest('form, button, a, input, select')) return;
        event.preventDefault();
        openModalForRow(row);
    });
});
