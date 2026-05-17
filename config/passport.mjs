import { Strategy as LocalStrategy } from 'passport-local';
import fs from 'node:fs';
import path from 'node:path';

// ΝΕΟ IMPORT: Παίρνουμε το pool (για σένα) ΚΑΙ τα functions (για τον συνεργάτη)
import dbPool, * as db from '../model/db.js';
import * as sql from '../model/queries.mjs';

export default function configurePassport(passport) {
    // Login
    passport.use(new LocalStrategy(
        { usernameField: 'email', passwordField: 'password' },
        async (email, password, done) => {
            try {
                // Επειδή κάναμε * as queries, το καλούμε έτσι:
                const query = sql.getUserByEmailAndPassword;
                const [rows] = await dbPool.execute(query, [email, password]);

                if (rows.length === 0) {
                    return done(null, false, { message: 'Λάθος email ή κωδικός.' });
                }

                const user = rows[0];
                if (user.student_id) user.role = 'student'; 
                else if (user.secretary_id) user.role = user.is_leader ? 'leader' : 'secretary';
                else user.role = 'unknown';

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    // what we save inside browser cookie (session) to identify the user (user_id)
    passport.serializeUser((user, done) => {
        done(null, user.user_id);
    });

    // how we get the user details back from the session cookie (user_id) to req.user in every request
    passport.deserializeUser(async (id, done) => {
        try {
            const query = sql.getUserById;
            const [rows] = await dbPool.execute(query, [id]);
            if (rows.length > 0) {
                const user = rows[0];
                if (user.student_id) user.role = 'student';
                else if (user.secretary_id) user.role = user.is_leader ? 'leader' : 'secretary'; 
                done(null, user); 
            } else {
                done(new Error("User not found"), null);
            }
        } catch (err) {
            done(err);
        }
    });
}