# Student Info Partial - Οδηγός Χρήσης

## 📋 Περιγραφή

Το `student-info` partial είναι ένα **επαναχρησιμοποιούμενο στοιχείο** που εμφανίζει τα στοιχεία ενός φοιτητή. Μπορείτε να το χρησιμοποιήσετε σε πολλές σελίδες χωρίς να χρειάζεται να κάνετε duplicate κώδικα.

## ✨ Χαρακτηριστικά

- ✅ Δυναμική φόρτωση δεδομένων φοιτητή από τη βάση
- ✅ Skeleton loader ενώ φορτώνονται τα δεδομένα
- ✅ Xειρισμός σφαλμάτων
- ✅ Responsive design
- ✅ Αυτόματος υπολογισμός έτους σπουδών

## 📦 Αρχεία που δημιουργήθηκαν

```
views/partials/student-info.hbs      ← Το partial με HTML + Inline JS
css/student-info.css                 ← Styling
routes/studentRoutes.js              ← API endpoint
model/sql/queries.js                 ← Νέο query (getStudentInfo)
```

## 🚀 Πώς να το χρησιμοποιήσετε

### 1. Σε ένα HBS view

```hbs
<!-- Στην κεφαλή του αρχείου, προσθέστε το CSS -->
<link href="../css/student-info.css" rel="stylesheet">

<!-- Μέσα στο HTML, χρησιμοποιήστε το partial -->
<div class="student-info-card" data-student-id="{{studentId}}">
    {{>student-info}}
</div>
```

### 2. Αποδίδει το ακόλουθο:

```
┌─────────────────────────────┐
│   Στοιχεία Φοιτητή          │
├─────────────────────────────┤
│         [Avatar]            │
│   Γεώργιος Παπαδόπουλος     │
├─────────────────────────────┤
│ ΑΜ: 2020045678              │
│ Τύπος: Προπτυχιακός         │
│ Email: g.papad@student.uoa  │
│ Έτος Σπουδών: 3ο            │
│ Έτος Εγγραφής: 2022         │
└─────────────────────────────┘
```

## 🔧 Τεχνικές Λεπτομέρειες

### API Endpoint

```
GET /api/student/:student_id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": 1,
    "firstName": "Γεώργιος",
    "lastName": "Παπαδόπουλος",
    "fullName": "Γεώργιος Παπαδόπουλος",
    "email": "g.papad@student.uoa.gr",
    "studentAm": "2020045678",
    "enrollmentYear": 2022,
    "type": "undergrad",
    "studyYear": 3,
    "typeLabel": "Προπτυχιακός"
  }
}
```

### CSS Classes

| Class | Σκοπός |
|-------|--------|
| `.student-info-card` | Container |
| `.student-info-title` | Τίτλος |
| `.student-card-content` | Content area |
| `.student-avatar` | Avatar container |
| `.info-item` | Κάθε πεδίο πληροφορίας |
| `.study-year` | Badge για έτος σπουδών |
| `.skeleton-loader` | Loading state |

## 📱 Responsive

Το partial είναι fully responsive και προσαρμόζεται:
- Desktop (>768px)
- Tablet (768px)
- Mobile (<768px)

## 🎯 Παραδείγματα χρήσης

### Παράδειγμα 1: Σε σελίδα λεπτομέρειας αιτήματος

```hbs
{{!-- views/pages/ticket.hbs --}}
<div class="ticket-content">
    <aside class="ticket-sidebar">
        <div class="student-info-card" data-student-id="{{ticket.student_id}}">
            {{>student-info}}
        </div>
    </aside>
</div>
```

### Παράδειγμα 2: Σε διαφορετική σελίδα

```hbs
{{!-- views/pages/admin-viewtickets.hbs --}}
<div class="ticket-list">
    {{#each tickets}}
    <div class="ticket-item">
        <div class="student-info-card" data-student-id="{{this.student_id}}">
            {{>student-info}}
        </div>
        <!-- Υπόλοιπο περιεχόμενο αιτήματος -->
    </div>
    {{/each}}
</div>
```

## ⚙️ Πώς λειτουργεί τεχνικά

1. **Φόρτωση Partial**: Το HBS φορτώνει το partial και θέτει `data-student-id`
2. **DOMContentLoaded**: Το inline JavaScript περιμένει το έγγραφο να φορτώσει
3. **Fetch Request**: Κάνει αίτημα στο `/api/student/:student_id`
4. **Render**: Εμφανίζει τα δεδομένα ή το σφάλμα

## 🛠️ Troubleshooting

### "Student ID is required"
```
Λύση: Βεβαιωθείτε ότι έχετε το data-student-id στο container:
<div class="student-info-card" data-student-id="123">
```

### "Student not found"
```
Λύση: Ελέγξτε ότι το student_id υπάρχει στη βάση δεδομένων
```

### Δεν φορτώνονται τα δεδομένα
```
Λύση: Ελέγξτε:
1. Ότι το server τρέχει
2. Ότι το CSS είναι συνδεδεμένο
3. Την browser console για σφάλματα
```

## 📝 Σημειώσεις

- Το partial αυτοδιαχειρίζεται την φόρτωση δεδομένων
- Δεν χρειάζεται να περάσετε δεδομένα από τον controller
- Το error handling είναι ήδη ενσωματωμένο

## 🎨 Customization

Για να αλλάξετε το styling, τροποποιήστε το `css/student-info.css` και όλες οι σελίδες που χρησιμοποιούν το partial θα ενημερωθούν αυτόματα!
