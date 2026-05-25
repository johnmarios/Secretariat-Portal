import { mapTicketStatus } from './statusMap.mjs';
import { formatDateToGreek } from './dateFormat.mjs';

// Shapes a raw ticket row from the various list queries into the
// uniform object the dashboard tables expect.
export const formatTicketRow = (row) => {
    const status = mapTicketStatus(row.status);
    const assignedName =
        row.first_name || row.last_name
            ? `${row.first_name || ''} ${row.last_name || ''}`.trim()
            : null;

    return {
        id: row.ticket_id,
        am: row.student_am,
        category: row.category,
        subject: row.subject,
        submittedAt: formatDateToGreek(row.created_at),
        completedAt: formatDateToGreek(row.resolved_at),
        status: status.label,
        statusClass: status.className,
        ...(assignedName ? { assignedSecretaryName: assignedName } : {}),
    };
};
