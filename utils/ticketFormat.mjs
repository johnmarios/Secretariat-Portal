import { mapTicketStatus } from './statusMap.mjs';
import { formatDateToGreek } from './dateFormat.mjs';
import { formatUserDisplayName } from './displayName.mjs';

// for displaying the ticket rows in the dashboard tables, we need to format the date and status, 
// and also get the assigned secretary's name if applicable
export const formatTicketRow = (row) => {
    const status = mapTicketStatus(row.status);
    const assignedName = formatUserDisplayName(row);

    return {
        id: row.ticket_id,
        am: row.student_am,
        category: row.category,
        subject: row.subject,
        submittedAt: formatDateToGreek(row.created_at),
        completedAt: formatDateToGreek(row.resolved_at),
        status: status.label,
        statusClass: status.className,
        assignedSecretaryName: assignedName,
    };
};
