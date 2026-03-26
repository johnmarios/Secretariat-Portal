// 1. Grab the elements from the HTML
  const profileWrapper = document.querySelector('.profile-wrapper');
  const profileTrigger = document.querySelector('.profile-trigger');

  // 2. Listen for a click on the circle
  profileTrigger.addEventListener('click', (e) => {
    // This stops the click from "bubbling up" and immediately triggering the document listener below
    e.stopPropagation(); 
    
    // Toggle the menu open or closed
    profileWrapper.classList.toggle('open');
  });

  // 3. Listen for clicks anywhere else on the whole webpage
  document.addEventListener('click', (e) => {
    // If the click was NOT inside the profile wrapper, close the menu safely
    if (!profileWrapper.contains(e.target)) {
      profileWrapper.classList.remove('open');
    }
  });

  // ==========================================
// 4. TICKET DETAILS POP UP WINDOW
// ==========================================
const modal = document.getElementById('ticketModal');
const closeBtn = document.getElementById('closeModalBtn');
const tableRows = document.querySelectorAll('.requests-table tbody tr');

if (modal && tableRows.length > 0) {
  
  // 1. Loop through every row in the table and add a click listener
  tableRows.forEach(row => {
    row.addEventListener('click', () => {
      modal.classList.add('open');
      console.log("📄 Row clicked! Opening modal.");
    });
  });

  // 2. Close modal when the back arrow is clicked
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  // 3. Close modal if the user clicks the dark background outside the white card
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });

}