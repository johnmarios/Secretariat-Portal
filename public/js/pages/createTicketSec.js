(function () {
  const form = document.getElementById('createTicketForm');
  const input = document.getElementById('studentSearchInput');
  const autocomplete = document.getElementById('studentAutocompleteList');
  const searchMode = document.getElementById('studentSearchMode');
  const selectedCard = document.getElementById('selectedStudentCard');
  const changeButton = document.getElementById('changeStudentButton');
  const hiddenStudentId = document.getElementById('selectedStudentId');

  // get elements from studentCardContent
  const selectedName = document.getElementById('studentCardName');
  const selectedAm = document.getElementById('studentCardAm');
  const selectedDepartment = document.getElementById('studentCardDepartment');
  const selectedEmail = document.getElementById('studentCardEmail');
  const selectedStudyYear = document.getElementById('studentCardStudyYear');
  const selectedType = document.getElementById('studentCardType');

  if (!form || !input || !autocomplete || !searchMode || !selectedCard || !changeButton || !hiddenStudentId) {
    return;
  }

  let debounceTimer = null;
  let activeController = null;

  const hideDropdown = () => {
    autocomplete.hidden = true;
    autocomplete.replaceChildren(); // clear previous results
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
    selectedType.textContent = student.type || '-';

    input.value = student.fullName || '';
    input.disabled = true;
    searchMode.hidden = true;
    selectedCard.hidden = false;
    hideDropdown();
  };

  const renderResults = (results) => {
    autocomplete.replaceChildren(); // clear previous results

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

      const title = document.createElement('span');
      title.className = 'student-autocomplete-item__title';
      title.textContent = `${student.studentAm} - ${student.fullName}`;

      const meta = document.createElement('span');
      meta.className = 'student-autocomplete-item__meta';
      meta.textContent = student.email || '';

      button.append(title, meta);
      button.addEventListener('click', () => showSelectedStudent(student));
      item.appendChild(button);
      autocomplete.appendChild(item);
    });

    autocomplete.hidden = false;
  };

  const searchStudents = async (term) => {
    // term : the search query entered by the user in the input field, used to find matching students
    if (activeController) {
      activeController.abort();
    }

    // create switch to cancel fetch requests if user types a new character before previous search completes, 
    // preventing race conditions where slower responses could overwrite newer results. 
    // Each search gets a new AbortController, and the previous one is aborted when a new search starts.
    activeController = new AbortController();
    
    // Gr (sends fetch1)
    // Gra (sends fetch2, aborts fetch1)
    // ...

    try {
      const response = await fetch(`/tickets/students/search?q=${encodeURIComponent(term)}`, {
        headers: { Accept: 'application/json' },
        signal: activeController.signal,
      });
      // we wait for json response, singal is for aborting the request if user types a new character before this search completes

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const payload = await response.json();
      renderResults(Array.isArray(payload.results) ? payload.results : []);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      const errorItem = document.createElement('li');
      errorItem.className = 'student-autocomplete-empty';
      errorItem.textContent = 'Σφάλμα αναζήτησης.';
      autocomplete.replaceChildren(errorItem);
      autocomplete.hidden = false;
    }
  };

  input.addEventListener('input', () => {
    const term = input.value.trim();

    if (term.length < 2) {
      hideDropdown();
      return;
    }

    // delays the search for 220ms after the user stops typing
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => searchStudents(term), 220);
  });

  // the results dropdown is shown when the input is focused 
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2 && autocomplete.children.length > 0) {
      autocomplete.hidden = false;
    }
  });

  changeButton.addEventListener('click', showSearchMode); // allows user to change the selected student and perform a new search

  // handles the form submission 
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