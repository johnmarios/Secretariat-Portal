(function () {
  const form = document.getElementById('createTicketForm');
  const input = document.getElementById('studentSearchInput');
  const autocomplete = document.getElementById('studentAutocompleteList');
  const searchMode = document.getElementById('studentSearchMode');
  const selectedCard = document.getElementById('selectedStudentCard');
  const changeButton = document.getElementById('changeStudentButton');
  const hiddenStudentId = document.getElementById('selectedStudentId');

  const selectedName = document.getElementById('selectedStudentName');
  const selectedAm = document.getElementById('selectedStudentAm');
  const selectedDepartment = document.getElementById('selectedStudentDepartment');
  const selectedEmail = document.getElementById('selectedStudentEmail');
  const selectedStudyYear = document.getElementById('selectedStudentStudyYear');

  if (!form || !input || !autocomplete || !searchMode || !selectedCard || !changeButton || !hiddenStudentId) {
    return;
  }

  let debounceTimer = null;
  let activeController = null;

  const hideDropdown = () => {
    autocomplete.hidden = true;
    autocomplete.innerHTML = '';
  };

  const showSearchMode = () => {
    selectedCard.hidden = true;
    searchMode.hidden = false;
    hiddenStudentId.value = '';
    input.value = '';
    input.disabled = false;
    input.focus();
    hideDropdown();
  };

  const showSelectedStudent = (student) => {
    hiddenStudentId.value = student.studentId;
    selectedName.textContent = student.fullName || '-';
    selectedAm.textContent = student.studentAm || '-';
    selectedDepartment.textContent = student.department || '-';
    selectedEmail.textContent = student.email || '-';
    selectedStudyYear.textContent = student.studyYear || '-';

    input.value = student.fullName || '';
    input.disabled = true;
    searchMode.hidden = true;
    selectedCard.hidden = false;
    hideDropdown();
  };

  const renderResults = (results) => {
    autocomplete.innerHTML = '';

    if (!results.length) {
      const empty = document.createElement('li');
      empty.className = 'student-autocomplete-empty';
      empty.textContent = 'Δεν βρέθηκαν φοιτητές.';
      autocomplete.appendChild(empty);
      autocomplete.hidden = false;
      return;
    }

    results.forEach((student) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'student-autocomplete-item';
      button.innerHTML = `
        <span class="student-autocomplete-item__title">${student.studentAm} - ${student.fullName}</span>
        <span class="student-autocomplete-item__meta">${student.email || ''}</span>
      `;

      button.addEventListener('click', () => showSelectedStudent(student));
      item.appendChild(button);
      autocomplete.appendChild(item);
    });

    autocomplete.hidden = false;
  };

  const searchStudents = async (term) => {
    if (activeController) {
      activeController.abort();
    }

    activeController = new AbortController();

    try {
      const response = await fetch(`/tickets/students/search?q=${encodeURIComponent(term)}`, {
        headers: { Accept: 'application/json' },
        signal: activeController.signal,
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const payload = await response.json();
      renderResults(Array.isArray(payload.results) ? payload.results : []);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      autocomplete.innerHTML = '<li class="student-autocomplete-empty">Σφάλμα αναζήτησης.</li>';
      autocomplete.hidden = false;
    }
  };

  input.addEventListener('input', () => {
    const term = input.value.trim();

    if (term.length < 2) {
      hideDropdown();
      return;
    }

    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => searchStudents(term), 220);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2 && autocomplete.children.length > 0) {
      autocomplete.hidden = false;
    }
  });

  changeButton.addEventListener('click', showSearchMode);

  form.addEventListener('submit', (event) => {
    const category = form.querySelector('[name="category_id"]');
    const subject = form.querySelector('[name="subject"]');
    const description = form.querySelector('[name="description"]');

    if (!hiddenStudentId.value) {
      event.preventDefault();
      alert('Επιλέξτε φοιτητή από την αναζήτηση.');
      return;
    }

    if (!category?.value) {
      event.preventDefault();
      alert('Επιλέξτε κατηγορία αιτήματος.');
      return;
    }

    if (!subject?.value.trim()) {
      event.preventDefault();
      alert('Συμπληρώστε θέμα.');
      return;
    }

    if (!description?.value.trim()) {
      event.preventDefault();
      alert('Συμπληρώστε περιγραφή.');
    }
  });
})();