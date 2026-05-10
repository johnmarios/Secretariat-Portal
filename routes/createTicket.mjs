import express from 'express';

const router = express.Router();


router.get('/create-ticket', (req, res) => {
    res.render('create-ticket', { 
        title: 'Νέο Αίτημα' 
    });
});

export default router;