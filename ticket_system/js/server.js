// const express = require('express'); 
// const app = express();
// const path = require('path'); // to handle file paths
// const { engine } = require('express-handlebars'); 

// const port = process.env.PORT || 3000;

// // View engine setup (Handlebars)
// app.engine('hbs', engine({ 
//   extname: 'hbs',
//   defaultLayout: 'main',
//   layoutsDir: path.join(__dirname, '../src/views/layouts'),
//   partialsDir: path.join(__dirname, '../src/views/partials')
// }));
// app.set('view engine', 'hbs');
// app.set('views', path.join(__dirname, '../src/views'));

// // Static files (CSS, JS, Images)
// app.use('/css', express.static(path.join(__dirname, '../css')));
// app.use('/js', express.static(path.join(__dirname, '../js')));
// app.use('/images', express.static(path.join(__dirname, '../images')));

// // Middleware
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());

// // Routes
// const pageRoutes = require('../routes/pageRoutes');
// app.use('/', pageRoutes);

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });































// const express = require('express');
// const path = require('path');
// const { engine } = require('express-handlebars');

// const app = express();
// const port = process.env.PORT || 3000;

// const infoCards = [
//   {
//     icon: 'Ανώνυμο-σχέδιο.svg',
//     alt: 'phone-icon',
//     title: 'Τηλέφωνο',
//     text: '+30 210 1234567 <br> +30 6978403742',
//     footer: 'Last updated 5 months ago',
//     cardClass: 'phone'
//   },
//   {
//     icon: '2124ac0db949622e8b42892a5df9989b4f00f223.svg',
//     alt: 'mail-icon',
//     title: 'Email',
//     text: 'secretariat@university.edu.gr <br> info@university.edu.gr',
//     footer: 'Last updated 3 years ago',
//     cardClass: 'email'
//   },
//   {
//     icon: '8fb34c687b85d23d0971f138df5282589d9d02a5.svg',
//     alt: 'hours-icon',
//     title: 'Ωράριο Γραφείου',
//     text: 'Δευτέρα - Παρασκευή: <br>11:00 - 13:00',
//     footer: 'Last updated 1 year ago',
//     cardClass: 'hours'
//   }
// ];

// const teamMembers = [
//   {
//     name: 'Γιάννης Παπαδόπουλος',
//     role: 'Electrical and Computer Engineer',
//     email: 'jnmrs03@gmail.com',
//     github: 'github.com/johnmarios',
//     githubLink: 'https://github.com/johnmarios',
//     image: 'IMG_2343.jpg',
//     alt: 'giannis-icon'
//   },
//   {
//     name: 'Αλέξης Λωρίδας',
//     role: 'Electrical and Computer Engineer',
//     email: 'alexisloridas@gmail.com',
//     github: 'github.com/iLuvPuns',
//     githubLink: 'https://github.com/iLuvPuns',
//     image: '20251126_182827.jpg',
//     alt: 'alexis-icon'
//   }
// ];

// const tickets = [
//   {
//     id: 6,
//     subject: 'Βεβαίωση Σπουδών',
//     submittedAt: '20/11/23',
//     completedAt: '-',
//     status: 'Σε εξέλιξη',
//     statusClass: 'status-green',
//     actionClass: 'disabled'
//   },
//   {
//     id: 5,
//     subject: 'Εκπρόθεσμη Δήλωση Μαθ...',
//     submittedAt: '20/11/22',
//     completedAt: '-',
//     status: 'Σε αναμονή',
//     statusClass: 'status-orange',
//     actionClass: 'active'
//   },
//   {
//     id: 4,
//     subject: 'Αναβαθμολόγηση',
//     submittedAt: '20/11/21',
//     completedAt: '28/11/21',
//     status: 'Κλειστό',
//     statusClass: 'status-red',
//     actionClass: 'disabled'
//   },
//   {
//     id: 3,
//     subject: 'Έκδοση Πάσου',
//     submittedAt: '20/11/20',
//     completedAt: '-',
//     status: 'Σε αναμονή',
//     statusClass: 'status-orange',
//     actionClass: 'active'
//   }
// ];

// const selectedTicket = {
//   id: 6,
//   submittedAt: '25/03/26',
//   completedAt: '-',
//   status: 'Σε εξέλιξη',
//   subject: 'Βεβαίωση Σπουδών',
//   name: 'Σάκης Ρουβάς',
//   email: 'sakisrouvas@upatras.gr',
//   attachments: '-',
//   description: ''
// };

// app.engine('hbs', engine({
//   extname: '.hbs',
//   defaultLayout: 'main',
//   layoutsDir: path.join(__dirname, 'views/layouts'),
//   partialsDir: path.join(__dirname, 'views/partials'),
//   helpers: {
//     add: (value, increment) => value + increment
//   }
// }));
// app.set('view engine', 'hbs');
// app.set('views', path.join(__dirname, 'views'));

// app.use('/css', express.static(path.join(__dirname, 'css')));
// app.use('/js', express.static(path.join(__dirname, 'js')));
// app.use('/images', express.static(path.join(__dirname, 'images')));

// app.get('/', (req, res) => {
//   res.render('pages/index', {
//     title: 'Σύστημα Διαχείρισης Αιτημάτων Γραμματείας',
//     bodyClass: 'index-page',
//     infoCards,
//     teamMembers
//   });
// });

// app.get('/login', (req, res) => {
//   res.render('pages/login', {
//     title: 'Σύνδεση - Secretariat Portal',
//     bodyClass: 'login-page'
//   });
// });

// app.get('/user/submit', (req, res) => {
//   res.render('pages/user-submit', {
//     title: 'Νέο Αίτημα - Secretariat Portal',
//     bodyClass: 'ticket-submit'
//   });
// });

// app.get('/user/tickets', (req, res) => {
//   res.render('pages/user-viewtickets', {
//     title: 'Αιτήματα - Secretariat Portal',
//     bodyClass: 'ticket-list',
//     tickets
//   });
// });

// app.get('/admin/submit', (req, res) => {
//   res.render('pages/admin-submit', {
//     title: 'Νέο Αίτημα - Secretariat Portal',
//     bodyClass: 'ticket-submit'
//   });
// });

// app.get('/admin/tickets', (req, res) => {
//   res.render('pages/admin-viewtickets', {
//     title: 'Αιτήματα - Secretariat Portal',
//     bodyClass: 'ticket-list',
//     tickets,
//     selectedTicket
//   });
// });

// app.listen(port, () => {
//   console.log(`Ticket system running on http://localhost:${port}`);
// });