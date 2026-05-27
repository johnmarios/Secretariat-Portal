export const getHomePage = (req, res) => {
    res.render('pages/index', {
        title: 'Αρχική - Secretariat Portal',
        bodyClass: 'index-page',
        isLoginPage: false
    });
};

export const getLoginPage = (req, res) => {
    res.render('pages/login', {
        title: 'Σύνδεση',
        bodyClass: 'login-page',
        isLoginPage: true
    });
};