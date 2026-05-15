const LocalStrategy = require('passport-local').Strategy;
const db = require('../model/db'); // Πάμε έναν φάκελο πίσω για να βρούμε το db.js
const { get } = require('../routes/auth');
const { getUserByEmailAndPassword, getUserById } = require('../model/queries');

module.exports = function(passport) {
    // Login
    passport.use(new LocalStrategy(
        { usernameField: 'email', passwordField: 'password' },
        async (email, password, done) => {
            try {
                const query = getUserByEmailAndPassword;
                const [rows] = await db.execute(query, [email, password]);

                if (rows.length === 0) {
                    return done(null, false, { message: 'Λάθος email ή κωδικός.' });
                }

                const user = rows[0];
                if (user.student_id) user.role = 'student'; // we add role field to know if it's student or secretary
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
            const query = getUserById;
            const [rows] = await db.execute(query, [id]);
            if (rows.length > 0) {
                const user = rows[0];
                if (user.student_id) user.role = 'student';
                else if (user.secretary_id) user.role = user.is_leader ? 'leader' : 'secretary'; // if user.is_leader is true then role is leader else secretary
                done(null, user); 
            } else {
                done(new Error("User not found"), null);
            }
        } catch (err) {
            done(err);
        }
    });
};