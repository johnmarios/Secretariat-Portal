// Makes table rows that declare a `data-href` attribute behave like a
// link: clicking anywhere on the row (except an interactive child) or
// pressing Enter while focused on it navigates to the given URL.
//
// Used on the dashboard pages by every role — student/secretary/leader —
// because each of them has at least one table whose rows route through to
// a full-page ticket view via data-href.
document.addEventListener('DOMContentLoaded', () => {
    const rows = document.querySelectorAll('tr[data-href]');
    if (rows.length === 0) return;

    rows.forEach((row) => {
        row.style.cursor = 'pointer';
        row.tabIndex = 0;
    });

    const navigate = (row) => {
        if (row.dataset.href) window.location.href = row.dataset.href;
    };

    // Single delegated click handler — cheaper than per-row listeners and
    // keeps the navigation logic in one place.
    document.addEventListener('click', (event) => {
        const row = event.target.closest('tr[data-href]');
        if (!row) return;
        if (event.target.closest('form, button, a, input, select')) return;
        event.preventDefault();
        navigate(row);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const row = event.target.closest('tr[data-href]');
        if (!row) return;
        if (event.target.closest('form, button, a, input, select')) return;
        event.preventDefault();
        navigate(row);
    });
});
