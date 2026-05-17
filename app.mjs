import express from 'express';
import { engine } from 'express-handlebars';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// 1. Εξωτερικές Βιβλιοθήκες (Πλέον με native import αντί για require)
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';

// 2. Τοπικά Αρχεία (Προσέχουμε τις καταλήξεις!)
import configurePassport from './config/passport.mjs'; 
import pageRoutes from './routes/pageRoutes.mjs';
import authRoutes from './routes/authRoutes.mjs';
// import studentRoutes from './routes/studentRoutes.js'; 
import createTicketRoutes from './routes/createTicket.mjs'; 
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

    app.use(passport.initialize());
    app.use(passport.session());

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
    app.use('/', pageRoutes);
    app.use('/api', authRoutes);
    app.use('/tickets', createTicketRoutes); // <-- Βάλαμε το '/tickets' εδώ
    // app.use('/api/students', studentRoutes); // Σύνδεσέ το κι αυτό αν το χρειάζεσαι κάπου!

    return app;
}

const app = createApp();

export default app;
export { createApp };