exports.getHomePage = (req, res) => {
    res.render('pages/index', {
        title: 'Αρχική - Secretariat Portal',
        bodyClass: 'index-page'
    });
};

exports.getLoginPage = (req, res) => {
    res.render('pages/login', {
        title: 'Σύνδεση',
        bodyClass: 'login-page'
    });
};
