import express from 'express';
import { engine } from 'express-handlebars';
import { createRequire } from 'node:module'; // to use require 
import { dirname, resolve } from 'node:path'; // to find the correct paths of folders and files
import { fileURLToPath } from 'node:url'; // converts the URL of the current file to a path 
import createTicketRouter from './routes/createTicket.js';

const require = createRequire(import.meta.url); 
const cors = require('cors'); //allows to other pages to access the server
const session = require('express-session'); // allows to create sessions for users so that they can stay logged in
const passport = require('passport');
const configurePassport = require('./config/passport.js');
const pageRoutes = require('./routes/pageRoutes.js'); // routes for rendering pages
const authRoutes = require('./routes/auth.js'); // routes for authentication 
const studentRoutes = require('./routes/studentRoutes.js'); // routes for student-related API endpoints
const createTicketRoutes = require('./routes/createTicket.js'); 

const __filename = fileURLToPath(import.meta.url); 
const __dirname = dirname(__filename); 

function createApp() {
    const app = express();

    configurePassport(passport);

    app.use(cors());
    app.use(express.json()); // allows the server to understand JSON data sent in requests
    app.use(express.urlencoded({ extended: true })); // allows the server to understand URL-encoded data (like form submissions)
    app.use(session({
        secret: process.env.SESSION_SECRET || 'ενα_μυστικο_κλειδι_για_την_εργασια_μου',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // Serve all static files from public folder (includes CSS, JS, images)
    app.use(express.static(resolve(__dirname, 'public')));

    app.engine('hbs', engine({
        extname: 'hbs',
        defaultLayout: 'main',
        helpers: {
        add: function (a, b) {
            return a + b;
        },
        layoutsDir: resolve(__dirname, 'views', 'layouts'),
        partialsDir: resolve(__dirname, 'views', 'partials')
    }}));
    app.set('view engine', 'hbs');
    app.set('views', resolve(__dirname, 'views'));

    app.use('/', pageRoutes);
    app.use('/api', authRoutes);
    app.use('/', createTicketRoutes);

    return app;
}

const app = createApp();

export default app;
export { createApp };

