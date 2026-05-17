export const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    if (req.method === 'GET') {
        return res.redirect('/login');
    }

    return res.status(401).json({
        success: false,
        message: 'Δεν είστε συνδεδεμένος'
    });
};