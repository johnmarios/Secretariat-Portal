document.addEventListener('DOMContentLoaded', function () {
    const modalRoot = document.getElementById('modalRoot');
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

    const openModalFromUrl = async (url) => {
        if (!modalRoot || !url) {
            return;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load modal (${response.status})`);
            }

            const html = await response.text();
            modalRoot.innerHTML = html;
            document.body.style.overflow = 'hidden';

            const modal = modalRoot.querySelector('#modalGen');
            const closeBtn = modalRoot.querySelector('#closeModalBtn');
            const cancelBtn = modalRoot.querySelector('#cancelModalBtn');

            const bindClose = () => closeModal();

            if (closeBtn) {
                closeBtn.addEventListener('click', bindClose);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', bindClose);
            }

            if (modal) {
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        closeModal();
                    }
                });
            }

            escapeHandler = function handleEscape(event) {
                if (event.key === 'Escape') {
                    closeModal();
                }
            };

            document.addEventListener('keydown', escapeHandler);
        } catch (error) {
            console.error('Error opening modal:', error);
            alert('Δεν ήταν δυνατή η φόρτωση του αιτήματος.');
        }
    };

    document.addEventListener('click', async function (event) {
        const row = event.target.closest('tr[data-modal-url], tr[data-href]');
        if (!row) {
            return;
        }

        if (event.target.closest('form') || event.target.closest('button') || event.target.closest('a') || event.target.closest('input')) {
            return;
        }

        if (row.dataset.modalUrl) {
            event.preventDefault();
            await openModalFromUrl(row.dataset.modalUrl);
            return;
        }

        const href = row.dataset.href;
        if (href) {
            window.location.href = href;
        }
    });

    document.querySelectorAll('tr[data-modal-url], tr[data-href]').forEach((row) => {
        row.style.cursor = 'pointer';
        row.tabIndex = 0;
        row.addEventListener('keydown', async function (event) {
            if (event.key !== 'Enter') {
                return;
            }

            if (this.dataset.modalUrl) {
                await openModalFromUrl(this.dataset.modalUrl);
                return;
            }

            const href = this.dataset.href;
            if (href) {
                window.location.href = href;
            }
        });
    });
});
