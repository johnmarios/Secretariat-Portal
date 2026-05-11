// e.g studet_id=1
import pool from '../model/db.js';
import queries from '../model/queries.js';

export const renderCreateTicketPage = async (req, res) => {
    try {
        const [categories] = await pool.query(queries.getAllCategories);
        res.render('create-ticket', { categories });
    } catch (error) {
        console.error('Error rendering create ticket page:', error);
        res.status(500).send('Internal Server Error');
    }
};