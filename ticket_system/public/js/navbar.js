// Auto-update navbar active link 

document.addEventListener('scroll', function () {
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.navbar-nav .nav-item.left');

    if (sections.length === 0 || navItems.length === 0) {
        return;
    }

    let currentSection = null;
    let maxVisibility = 0;

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        //console.log(`Section ${section.id}: top=${rect.top}, bottom=${rect.bottom} windowHeight=${window.innerHeight}`);
        if (rect.top < window.innerHeight * 0.5) {
            currentSection = section.id;
        }
    });
    // Update active class based on current section
    navItems.forEach(item => {
        const link = item.querySelector('a');
        const href = link.getAttribute('href').substring(1); // Remove the #

        if (href === currentSection) {
            item.classList.add('active');
            item.classList.remove('not-active');
        } else {
            item.classList.remove('active');
            item.classList.add('not-active');
        }
    });
});
