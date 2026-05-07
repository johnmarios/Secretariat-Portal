document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('create-ticket-no-scroll');
    document.body.classList.add('create-ticket-no-scroll');

    const submitBtn = document.getElementById('submitTicketBtn');
    const form = document.getElementById('createTicketForm');

    if (!submitBtn || !form) {
        return;
    }

    submitBtn.addEventListener('click', async function (event) {
        event.preventDefault();

        const category = document.getElementById('category')?.value?.trim();
        const subject = document.getElementById('subject')?.value?.trim();
        const description = document.getElementById('description')?.value?.trim();

        if (!category || !subject || !description) {
            alert('Συμπλήρωσε όλα τα υποχρεωτικά πεδία');
            return;
        }

        submitBtn.disabled = true;

        try {
            const response = await fetch(form.action || '/tickets/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category,
                    subject,
                    description
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Σφάλμα κατά την υποβολή');
            }

            window.location.href = '/user_viewtickets';
        } catch (error) {
            console.error(error);
            alert(error.message || 'Σφάλμα κατά την υποβολή του αιτήματος');
        } finally {
            submitBtn.disabled = false;
        }
    });
});
