(function () {
  const form = document.getElementById('createTicketForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    const category = form.querySelector('[name="category"]');
    const subject = form.querySelector('[name="subject"]');
    const description = form.querySelector('[name="description"]');
    if (!category?.value) {
      e.preventDefault();
      alert('Επιλέξτε κατηγορία αιτήματος.');
      return;
    }
    if (!subject?.value.trim()) {
      e.preventDefault();
      alert('Συμπληρώστε θέμα.');
      return;
    }
    if (!description?.value.trim()) {
      e.preventDefault();
      alert('Συμπληρώστε περιγραφή.');
      return;
    }
  });
})();
