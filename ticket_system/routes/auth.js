const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const db = require('../model/db');

// POST /api/login means that passport authenticated the user 
// POST /login
// POST /login (Με αναλυτικό κοριό)
router.post('/login', (req, res, next) => {
    
    console.log("=== ΝΕΑ ΠΡΟΣΠΑΘΕΙΑ ΣΥΝΔΕΣΗΣ ===");
    console.log("Email που ήρθε:", req.body.email);
    // Καλούμε το Passport χειροκίνητα για να δούμε τι ακριβώς κάνει
    passport.authenticate('local', async (err, user, info) => {
        
        if (err) {
            console.log("❌ Έσκασε σφάλμα στο Passport:", err);
            return res.status(500).send("Σφάλμα server");
        }
        
        if (!user) {
            console.log("⛔ Ο Πορτιέρης έριξε πόρτα! Αιτία:", info ? info.message : "Άγνωστο");
            return res.send("Αποτυχία σύνδεσης: Κοίτα το τερματικό για την αιτία!");
        }
        
        console.log("✅ Ο κωδικός είναι ΣΩΣΤΟΣ! Χρήστης:", user.email);
        
        // Βάζουμε τον χρήστη μέσα
        req.logIn(user, async (err) => {
            if (err) return next(err);
            
            try {
                const userId = user.user_id || user.id; 
                console.log("🔍 Ψάχνω τον ρόλο για το ID:", userId);

                const [secRows] = await db.execute('SELECT secretary_id FROM SECRETARY WHERE for_id = ?', [userId]);
                if (secRows.length > 0) {
                    req.user.secretary_id = secRows[0].secretary_id;
                    req.user.role = 'secretary';
                    console.log("🚀 Είναι Γραμματεία! Πάμε στα Tabs!");
                    return res.redirect('/secretary_viewtickets');
                } 

                const [studentRows] = await db.execute('SELECT student_id FROM STUDENT WHERE for_id = ?', [userId]);
                if (studentRows.length > 0) {
                    req.user.student_id = studentRows[0].student_id;
                    req.user.role = 'student';
                    console.log("🎓 Είναι Φοιτητής! Πάμε στα δικά του Tickets!");
                    return res.redirect('/user_viewtickets');
                }

                res.send("Ο χρήστης συνδέθηκε, αλλά δεν υπάρχει ούτε σαν Γραμματεία ούτε σαν Φοιτητής!");
            } catch (error) {
                console.error("Σφάλμα βάσης:", error);
                res.send("Σφάλμα κατά την ανάγνωση του ρόλου.");
            }
        });
    })(req, res, next);
});

// POST /api/logout
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.json({ success: true, message: "Αποσυνδεθήκατε" });
    });
});

// GET /api/me to check if the user is authenticated and get their info
router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.status(401).json({ authenticated: false, message: "Δεν είστε συνδεδεμένος" });
    }
});

// Διαδρομή: POST /api/register
router.post('/register', async (req, res) => {
    // 1. Παίρνουμε τα δεδομένα που στέλνει το Figma/Frontend
    const { firstName, lastName, email, password, role, isHead } = req.body;

    try {
        // 2. Ελέγχουμε αν το email υπάρχει ήδη στη βάση
        const [existing] = await db.execute('SELECT email FROM USER WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Το email χρησιμοποιείται ήδη.' });
        }

        // 3. Κρυπτογράφηση του κωδικού
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Εισαγωγή στον κεντρικό πίνακα USER (Η Υπερκλάση)
        const insertUserQuery = 'INSERT INTO USER (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
        const [userResult] = await db.execute(insertUserQuery, [firstName, lastName, email, hashedPassword]);
        
        // Παίρνουμε το ID που μόλις δημιουργήθηκε για αυτόν τον χρήστη
        const newUserId = userResult.insertId;

        // 5. Εισαγωγή στην κατάλληλη υποκλάση (STUDENT ή SECRETARY)
        if (role === 'student') {
            await db.execute('INSERT INTO STUDENT (for_id) VALUES (?)', [newUserId]);
            
        } else if (role === 'secretary') {
            // Αν το isHead είναι true, βάζουμε 1, αλλιώς 0
            const isLeaderValue = isHead ? 1 : 0; 
            await db.execute('INSERT INTO SECRETARY (for_id, is_leader) VALUES (?, ?)', [newUserId, isLeaderValue]);
        } else {
            return res.status(400).json({ success: false, message: 'Μη έγκυρος ρόλος χρήστη.' });
        }

        // 6. Όλα πήγαν καλά!
        res.status(201).json({ success: true, message: 'Ο λογαριασμός δημιουργήθηκε επιτυχώς!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή κατά την εγγραφή.' });
    }
});

module.exports = router;