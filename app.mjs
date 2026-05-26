import express from 'express';
import { engine } from 'express-handlebars';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// 1. Εξωτερικές Βιβλιοθήκες (Πλέον με native import αντί για require)
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import flash from 'connect-flash';

// 2. Τοπικά Αρχεία (Προσέχουμε τις καταλήξεις!)
import configurePassport from './config/passport.mjs';
import pageRouter from './routes/pageRoutes.mjs';
import authRouter from './routes/authRoutes.mjs';
import dashboardRouter from './routes/dashboardRoutes.mjs';
import ticketRouter from './routes/ticketRoutes.mjs';
import helpers from './controllers/helpers.mjs';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = dirname(__filename); 

function createApp() {
    const app = express();

    configurePassport(passport);

    app.use(cors());
    app.use(express.json()); 
    app.use(express.urlencoded({ extended: true })); 
    app.use(session({
        secret: process.env.SESSION_SECRET || 'ενα_μυστικο_κλειδι_για_την_εργασια_μου',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 }
    }));

    //for the login error messages
    app.use(flash());
    app.use((req, res, next) => {
    let err = req.flash('error');
    res.locals.errorMessage = err.length > 0 ? err[0] : null; 
    next();
    });

    app.use(passport.initialize());
    app.use(passport.session());

    app.use((req, res, next) => {
        const user = req.user || null;
        let userInitials = '';

        if (user) {
            const first = (user.first_name || '').trim();
            const last = (user.last_name || '').trim();

            if (first || last) {
                userInitials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
            } else if (user.email) {
                userInitials = String(user.email).trim().charAt(0).toUpperCase();
            }
        }

        res.locals.currentUser = user;
        res.locals.userInitials = userInitials;
        next();
    });

    // Serve all static files from public folder
    app.use(express.static(resolve(__dirname, 'public')));

    // Ρυθμίσεις Handlebars (Διορθώθηκε η θέση των Layouts/Partials!)
    app.engine('hbs', engine({
        extname: 'hbs',
        defaultLayout: 'main',
        layoutsDir: resolve(__dirname, 'views', 'layouts'),
        partialsDir: resolve(__dirname, 'views', 'partials'),
        helpers: helpers
    }));
    app.set('view engine', 'hbs');
    app.set('views', resolve(__dirname, 'views'));

    // Σύνδεση των Routes
    app.use('/api', authRouter);
    app.use('/', pageRouter);
    app.use('/', dashboardRouter);
    app.use('/tickets', ticketRouter);

    return app;
}

const app = createApp();

export default app;
export { createApp };