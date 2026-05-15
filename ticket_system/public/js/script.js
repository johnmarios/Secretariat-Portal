  const profileWrapper = document.querySelector('.profile-wrapper');
  const profileTrigger = document.querySelector('#avatar');

  if (profileWrapper && profileTrigger) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileWrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!profileWrapper.contains(e.target)) {
        profileWrapper.classList.remove('open');
      }
    });
  }

// ==========================================
//  TICKET DETAILS POP UP WINDOW
// ==========================================

const modal = document.getElementById('ticketModal');
const closeBtn = document.getElementById('closeModalBtn');
const tableRows = document.querySelectorAll('.requests-table tbody tr');

if (modal && closeBtn && tableRows.length > 0) {
  
  tableRows.forEach(row => {
    row.addEventListener('click', () => {
      modal.classList.add('open');
      // console.log("Opening modal.");
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });

}





// gia tis karteles
function openTab(evt, tabName) {
  // Βρες όλα τα περιεχόμενα (πίνακες) και κρύψ'τα
  let tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].style.display = "none";
  }

  // Βρες όλα τα κουμπιά των tabs και βγάλε τους την κλάση "active" (το μπλε χρώμα)
  let tabLinks = document.getElementsByClassName("tab-link");
  for (let i = 0; i < tabLinks.length; i++) {
    tabLinks[i].classList.remove("active");
  }

  // Εμφάνισε τον πίνακα που ζητήθηκε και κάνε active το κουμπί που πατήθηκε
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
}

async function claimTicket(ticketId, buttonElement) {
    try {
        const response = await fetch(`/api/tickets/claim/${ticketId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            // Αν η βάση ενημερώθηκε επιτυχώς, κάνουμε ανανέωση τη σελίδα
            window.location.reload();
        } else {
            alert('Σφάλμα: ' + data.message);
        }
    } catch (error) {
        console.error('Σφάλμα δικτύου:', error);
        alert('Υπήρξε πρόβλημα με τη σύνδεση.');
    }
}
