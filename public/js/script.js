// ==========================================
// ΠΡΟΦΙΛ - DROPDOWN MENU
// ==========================================
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
// TABS LOGIC (Εναλλαγή καρτελών)
// ==========================================
function openTab(evt, tabName) {
  let tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].style.display = "none";
  }

  let tabLinks = document.getElementsByClassName("tab-link");
  for (let i = 0; i < tabLinks.length; i++) {
    tabLinks[i].classList.remove("active");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.classList.add("active");
}
