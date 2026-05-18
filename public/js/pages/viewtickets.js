document.addEventListener('DOMContentLoaded', function () {
    const rows = document.querySelectorAll('tr[data-href]');
    rows.forEach(row => {
        row.style.cursor = 'pointer';
        row.tabIndex = 0;
        row.addEventListener('click', function (e) {
            // ignore clicks on interactive elements (buttons, inputs, forms, anchors)
            if (e.target.closest('form') || e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
            const href = this.dataset.href;
            if (href) window.location.href = href;
        });
        row.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                const href = this.dataset.href;
                if (href) window.location.href = href;
            }
        });
    });
});
