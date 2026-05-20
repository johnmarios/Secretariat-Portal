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
