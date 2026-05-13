import express from 'express'
import { create } from 'express-handlebars'

import path from 'path'; 
import { fileURLToPath } from 'url';

// import customHelpers from './controllers/helpers.js';

import createTicketRouter from './routes/createTicket.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || '3000';

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


const hbs = create({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    extname: '.hbs',
    // helpers: customHelpers 
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views')); 

// app.use('/create-ticket', createTicketRouter);
app.use('/', createTicketRouter);
app.use('/tickets', createTicketRouter);

export default app;

