document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('create-ticket-no-scroll');
    document.body.classList.add('create-ticket-no-scroll');

    const submitBtn = document.getElementById('submitTicketBtn');
    const form = document.getElementById('createTicketForm');

    if (!submitBtn || !form) {
        return;
    }

    submitBtn.addEventListener('click', async function (event) {
        event.preventDefault(); // Prevent default form submission

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

            const contentType = response.headers.get('content-type') || '';
            let data = null;

            if (contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const rawResponse = await response.text();

                // Usually means auth/session redirect or server returned an HTML error page
                if (response.redirected || rawResponse.trim().startsWith('<!DOCTYPE')) {
                    throw new Error('Η συνεδρία σου έληξε ή η απάντηση του server δεν ήταν JSON. Κάνε ξανά σύνδεση.');
                }

                throw new Error(rawResponse || 'Μη έγκυρη απάντηση από τον server');
            }

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
