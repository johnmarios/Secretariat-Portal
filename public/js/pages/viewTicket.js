// Pre-selects the ticket's current status in the secretary/leader status <select>
// and disables it when the ticket is already closed (secretary view only).
document.addEventListener('DOMContentLoaded', function () {
    try {
        const select = document.getElementById('status');
        if (!select) return;

        const current = select.dataset.current;
        if (current) select.value = current;

        if (current === 'closed' && !select.dataset.allowClosedEdit) {
            select.disabled = true;
            select.title = 'Το αίτημα είναι κλειστό — δεν επιτρέπεται αλλαγή κατάστασης.';
        }
    } catch (e) {
        console.error(e);
    }
});
