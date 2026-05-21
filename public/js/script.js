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
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('ticketModal');
  const closeBtn = document.getElementById('closeModalBtn');
  
  // Στοχεύουμε τα tr στα Μη Εκχωρημένα και στα Προωθημένα
  const tableRows = document.querySelectorAll('#unassigned tr[data-ticket-id], #escalated-tab tr[data-ticket-id]'); 

  if (modal && closeBtn && tableRows.length > 0) {
    
    tableRows.forEach(row => {
      row.addEventListener('click', () => {
        const ticketId = row.getAttribute('data-ticket-id');
        
        // Αναγνωρίζουμε από ποιο tab έγινε το κλικ
        const isEscalated = row.closest('#escalated-tab') !== null;
        const isUnassigned = row.closest('#unassigned') !== null;
        
        // Εμφανίζουμε προσωρινά ένα "Loading..."
        document.getElementById('modal-id').textContent = ticketId;
        document.getElementById('modal-description').textContent = "Φόρτωση δεδομένων...";
        document.getElementById('modal-attachments').innerHTML = "";

        // Ζητάμε τα δεδομένα από το API
        fetch(`/api/ticket/${ticketId}`)
          .then(res => res.json())
          .then(data => {
            if(data.success) {
              // Γέμισμα βασικών πεδίων
              document.getElementById('modal-subject').textContent = data.subject;
              document.getElementById('modal-category').textContent = data.category;
              document.getElementById('modal-student').textContent = data.studentName;
              document.getElementById('modal-am').textContent = data.studentAm;
              document.getElementById('modal-email').textContent = data.studentEmail;
              document.getElementById('modal-year').textContent = data.enrollmentYear;
              document.getElementById('modal-date').textContent = data.date;
              document.getElementById('modal-description').textContent = data.description;

              // Εμφάνιση Συνημμένων
              if (data.attachments && data.attachments.length > 0) {
                let attHtml = '';
                data.attachments.forEach(file => {
                   let cleanPath = file.file_path.replace('/public', ''); 
                   attHtml += `<a href="${cleanPath}" target="_blank" style="display:block; margin-bottom:5px;">📎 ${file.file_name}</a>`;
                });
                document.getElementById('modal-attachments').innerHTML = attHtml;
              } else {
                document.getElementById('modal-attachments').textContent = "Κανένα αρχείο";
              }

              // --- ΛΟΓΙΚΗ ΓΙΑ ΤΙΣ ΣΤΗΛΕΣ ΚΑΙ ΤΑ ΚΟΥΜΠΙΑ ---
              const assignForm = document.getElementById('modalAssignForm');
              const internalCol = document.getElementById('modal-internal-col');
              const modalContent = document.querySelector('.modal-content');

              if (isEscalated) {
                  // Leader προβολή: Δείχνουμε 4η στήλη, κρύβουμε το απλό "Αναλαμβάνω"
                  modalContent.classList.add('escalated-view'); // Απλώνει το modal
                  if(internalCol) internalCol.style.display = 'flex';
                  if(assignForm) assignForm.style.display = 'none';

                  // Γέμισμα 4ης στήλης
                  // if (document.getElementById('modal-internal-author')) {
                  //     document.getElementById('modal-internal-author').textContent = data.internalMessage ? data.internalMessage.author : 'Άγνωστο';
                  // }
                  if (document.getElementById('modal-internal-desc')) {
                      document.getElementById('modal-internal-desc').textContent = data.internalMessage ? data.internalMessage.text : 'Δεν βρέθηκε σχόλιο.';
                  }
                  
                  // Ρύθμιση των actions στα κουμπιά της 4ης στήλης
                  if (document.getElementById('modalAcceptEscalatedForm')) {
                      document.getElementById('modalAcceptEscalatedForm').action = `/tickets/escalated/accept/${ticketId}`;
                  }
                  if (document.getElementById('modalRejectEscalatedForm')) {
                      document.getElementById('modalRejectEscalatedForm').action = `/tickets/escalated/reject/${ticketId}`;
                  }
              } else if (isUnassigned) {
                  // Γραμματεία προβολή: Κρύβουμε 4η στήλη, δείχνουμε το απλό "Αναλαμβάνω"
                  modalContent.classList.remove('escalated-view');
                  if(internalCol) internalCol.style.display = 'none';
                  
                  if(assignForm) {
                      assignForm.style.display = 'block'; 
                      assignForm.action = `/tickets/assign/${ticketId}`;
                  }
              }
            }
          })
          .catch(err => console.error("Σφάλμα φόρτωσης API:", err));

        modal.classList.add('open');
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
});





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
