// Maps the raw DB enum value of ticket.status into a display label + CSS class.
export const mapTicketStatus = (status) => {
    switch (status) {
        case 'open': return { label: 'Μη Εκχωρημένο', className: 'status-open' };
        case 'in_progress': return { label: 'Σε Εξέλιξη', className: 'status-in-progress' };
        case 'escalated': return { label: 'Προωθημένο', className: 'status-escalated' };
        case 'pending': return { label: 'Σε Αναμονή', className: 'status-pending' };
        case 'resolved': return { label: 'Ολοκληρωμένο', className: 'status-resolved' };
        case 'closed': return { label: 'Κλειστό', className: 'status-closed' };
        default: return { label: status, className: 'status-default' };
    }
};
