const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. Βασικές Ρυθμίσεις (Middleware)
// Επιτρέπουν στον server να καταλαβαίνει δεδομένα από φόρμες και JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Ρύθμιση Session (Απαραίτητο για το Passport.js - Σελίδες 1-5 του PDF)
// Δημιουργεί το "cookie" για να θυμάται ο server ποιος χρήστης έκανε login
app.use(session({
    secret: process.env.SESSION_SECRET || 'ενα_μυστικο_κλειδι_για_την_εργασια_μου',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Το session λήγει σε 24 ώρες
}));

// 3. Φόρτωση του config του Passport (από τον φάκελο config που φτιάξαμε)
require('./config/passport')(passport);

// 4. Αρχικοποίηση του Passport.js
app.use(passport.initialize());
app.use(passport.session());

// 5. Σύνδεση των Διαδρομών / Routes (από τον φάκελο routes)
// Όλα τα requests που ξεκινούν με '/api' θα πηγαίνουν στο auth.js
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

// 6. Εκκίνηση του Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Ο Server ξεκίνησε επιτυχώς και τρέχει στο http://localhost:${PORT}`);
});