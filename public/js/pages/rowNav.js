// Enables clicking anywhere on a table row with a data-href to navigate to that URL.
// Also adds keyboard accessibility via Enter key. Excludes clicks on interactive elements like buttons/links.
document.addEventListener('DOMContentLoaded', () => {
    const rows = document.querySelectorAll('tr[data-href]');
    if (rows.length === 0) return;

    rows.forEach((row) => {
        row.style.cursor = 'pointer';
        row.tabIndex = 0; 
    });

    const navigate = (row) => {
        // takes rows with a data-href and navigates to that URL
        if (row.dataset.href) window.location.href = row.dataset.href;
    };

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
