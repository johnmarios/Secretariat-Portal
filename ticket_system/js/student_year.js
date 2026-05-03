document.addEventListener('DOMContentLoaded', function () {
  var currentYear = new Date().getFullYear();
  var studyYearElements = document.querySelectorAll('.study-year[data-enrollment-year]');

  studyYearElements.forEach(function (element) {
    var enrollmentYear = parseInt(element.dataset.enrollmentYear, 10);

    if (Number.isNaN(enrollmentYear)) {
      element.textContent = '-';
      return;
    }

    var studyYear = currentYear - enrollmentYear;
    element.textContent = studyYear > 0 ? studyYear + 'ο Έτος Σπουδών' : '-';
  });
});