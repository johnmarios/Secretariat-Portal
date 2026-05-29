// Auto-update navbar active link 

document.addEventListener('scroll', function () {
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.navbar-nav .nav-item.left');

    if (sections.length === 0 || navItems.length === 0) {
        return;
    }

    let currentSection = null;
    let maxVisibility = 0;

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        //console.log(`Section ${section.id}: top=${rect.top}, bottom=${rect.bottom} windowHeight=${window.innerHeight}`);
        if (rect.top < window.innerHeight * 0.5) {
            currentSection = section.id;
        }
    });
    // Update active class based on current section
    navItems.forEach(item => {
        const link = item.querySelector('a');
        const href = link.getAttribute('href').substring(1); // Remove the #

        if (href === currentSection) {
            item.classList.add('active');
            item.classList.remove('not-active');
        } else {
            item.classList.remove('active');
            item.classList.add('not-active');
        }
    });
});

// Tickets search in navbar (for secretary/leader)
document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('ticketsSearchInput');
    const resultsBox = document.getElementById('ticketsSearchResults');
    let timer = null;
    if (!input || !resultsBox) return;

    // prevent browser autofill dropdowns from showing previous entries in many browsers
    try {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');

        // Trick: keep input readonly until user focuses - this prevents some browsers
        // from showing saved suggestions/autofill. Remove readonly on focus so typing works.
        input.readOnly = true;
        input.addEventListener('focus', () => {
            input.readOnly = false;
            // move cursor to end
            const val = input.value;
            input.value = '';
            input.value = val;
        }, { once: true });
    } catch (e) {
        // ignore
    }

    function clearResults() {
        resultsBox.innerHTML = '';
        resultsBox.classList.remove('open');
    }

    function renderResults(items) {
        resultsBox.innerHTML = '';
        if (!items || items.length === 0) return clearResults();
        const ul = document.createElement('ul');
        ul.className = 'tickets-search-list';
        items.forEach(it => {
            const li = document.createElement('li');
            li.className = 'tickets-search-item';
            const a = document.createElement('a');
            a.href = `/tickets/secretary-view-ticket/ticket/${it.id}`;
            a.textContent = `${it.am} — ${it.studentName} — ${it.subject}`;

            // If we're on the viewtickets page and the unassigned tab contains
            // this ticket (meaning it's not yet assigned), we open the modal
            // instead of navigating
            try {
                const unassignedRow = document.querySelector(`#unassigned tr[data-ticket-id="${it.id}"]`);
                const modalRootExists = document.getElementById('modalRoot');
                if (unassignedRow && modalRootExists && typeof window.openTicketModal === 'function') {
                    a.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        const modalType = document.getElementById('modal-template-leader') ? 'leader' : 'secretary';
                        window.openTicketModal(String(it.id), modalType).catch((err) => {
                            console.error('Failed to open modal from search:', err);
                            // fallback to navigation if modal fails
                            window.location.href = `/tickets/secretary-view-ticket/ticket/${it.id}`;
                        });
                    });
                }
            } catch (e) {
                // ignore and keep anchor as normal link
            }

            li.appendChild(a);
            ul.appendChild(li);
        });
        resultsBox.appendChild(ul);
        resultsBox.classList.add('open');
    }

    async function doSearch(q) {
        try {
            const res = await fetch(`/tickets/search?q=${encodeURIComponent(q)}`, { credentials: 'same-origin' });
            const data = await res.json();
            if (data && data.success) {
                renderResults(data.results);
            } else {
                clearResults();
            }
        } catch (err) {
            console.error('Navbar search error', err);
            clearResults();
        }
    }

    input.addEventListener('input', (e) => {
        const q = String(e.target.value || '').trim();
        if (timer) clearTimeout(timer);
        if (q.length < 1) return clearResults();
        timer = setTimeout(() => doSearch(q), 250);
    });

    document.addEventListener('click', (ev) => {
        if (!resultsBox.contains(ev.target) && ev.target !== input) clearResults();
    });
});
