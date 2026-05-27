import passport from 'passport';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

import dbPool, * as db from '../model/db.js';
import * as queries from '../model/queries.mjs';

//LOGIN
export const login = (req, res, next) => {
    console.log("=== ΝΕΑ ΠΡΟΣΠΑΘΕΙΑ ΣΥΝΔΕΣΗΣ ===");
    console.log("Email που ήρθε:", req.body.email);
    
    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            console.log("❌ Έσκασε σφάλμα στο Passport:", err);
            return res.status(500).send("Σφάλμα server");
        }
        
        if (!user) {
            console.log("⛔ Η Πρόσβαση απορρίφθηκε! Αιτία:", info ? info.message : "Άγνωστο");
            return res.send("Αποτυχία σύνδεσης: Κοίτα το τερματικό για την αιτία!");
        }
        
        console.log("✅ Ο κωδικός είναι ΣΩΣΤΟΣ! Χρήστης:", user.email);
        
        req.logIn(user, async (err) => {
            if (err) return next(err);
            
            try {
                const userId = user.user_id || user.id; 
                console.log("🔍 Ψάχνω τον ρόλο για το ID:", userId);

                // Έλεγχος για Γραμματεία
                const [secRows] = await dbPool.execute(queries.getSecretaryIdByForId, [userId]);
                if (secRows.length > 0) {
                    req.user.secretary_id = secRows[0].secretary_id;
                    req.user.role = 'secretary';
                    console.log("🚀 Είναι Γραμματεία!");
                    return res.redirect('/secretary-viewtickets');
                } 

                // Έλεγχος για Φοιτητή
                const [studentRows] = await dbPool.execute(queries.getStudentIdByForId, [userId]);
                if (studentRows.length > 0) {
                    req.user.student_id = studentRows[0].student_id;
                    req.user.role = 'student';
                    console.log("🎓 Είναι Φοιτητής!");
                    return res.redirect('/student-viewtickets');
                }

                res.send("Ο χρήστης συνδέθηκε, αλλά δεν υπάρχει ούτε σαν Γραμματεία ούτε σαν Φοιτητής!");
            } catch (error) {
                console.error("Σφάλμα βάσης:", error);
                res.send("Σφάλμα κατά την ανάγνωση του ρόλου.");
            }
        });
    })(req, res, next);
};

// LOGOUT
export const logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.json({ success: true, message: "Αποσυνδεθήκατε" });
    });
};

// USER INFO 
export const getMe = (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.status(401).json({ authenticated: false, message: "Δεν είστε συνδεδεμένος" });
    }
};

// REGISTER
export const register = async (req, res) => {
    const { firstName, lastName, email, password, role, isHead } = req.body;

    try {
        const [existing] = await dbPool.execute(queries.getUserByEmail, [email]);
    if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Το email χρησιμοποιείται ήδη.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [userResult] = await dbPool.execute(queries.insertUser, [firstName, lastName, email, hashedPassword]);
        const newUserId = userResult.insertId;

        if (role === 'student') {
            await dbPool.execute(queries.insertStudent, [newUserId]);
        } else if (role === 'secretary') {
            const isLeaderValue = isHead ? 1 : 0; 
            await dbPool.execute(queries.insertSecretary, [newUserId, isLeaderValue]);
        } else {
            return res.status(400).json({ success: false, message: 'Μη έγκυρος ρόλος χρήστη.' });
        }

        res.status(201).json({ success: true, message: 'Ο λογαριασμός δημιουργήθηκε επιτυχώς!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή κατά την εγγραφή.' });
    }
};