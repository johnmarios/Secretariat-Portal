export const getHomePage = (req, res) => {
    res.render('index', {
        title: 'Αρχική - Secretariat Portal',
        bodyClass: 'index-page'
    });
};

export const getLoginPage = (req, res) => {
    res.render('login', {
        title: 'Σύνδεση',
        bodyClass: 'login-page'
    });
};

export const getCreateTicketPage = (req, res) => {
    res.render('createTicket', {
        title: 'Δημιουργία Αιτήματος',
        bodyClass: 'create-ticket-page'
    });
};