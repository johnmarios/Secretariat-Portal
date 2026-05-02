  const profileWrapper = document.querySelector('.profile-wrapper');
  const profileTrigger = document.querySelector('#avatar');

  // profileTrigger.addEventListener('click', (e) => {
  //   e.stopPropagation(); 
  //   profileWrapper.classList.toggle('open');
  // });

  // document.addEventListener('click', (e) => {
  //   if (!profileWrapper.contains(e.target)) {
  //     profileWrapper.classList.remove('open');
  //   }
  // });

// ==========================================
//  TICKET DETAILS POP UP WINDOW
// ==========================================

const modal = document.getElementById('ticketModal');
const closeBtn = document.getElementById('closeModalBtn');
const tableRows = document.querySelectorAll('.requests-table tbody tr');

if (modal && tableRows.length > 0) {
  
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