const BASE = process.env.BASE_URL || 'http://localhost:3000';

const accounts = [
    { label: 'secretary', email: 'secretary1@uni.gr', password: '123456' },
    { label: 'leader', email: 'leader1@uni.gr', password: '123456' },
    { label: 'student', email: 'student1@uni.gr', password: '123456' },
];

async function login(email, password) {
    const body = new URLSearchParams({ email, password });
    const res = await fetch(`${BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        redirect: 'manual',
    });

    const setCookie = res.headers.getSetCookie?.() || [];
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
    return { status: res.status, cookie, location: res.headers.get('location') };
}

async function get(path, cookie, headers = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { ...headers, Cookie: cookie },
        redirect: 'manual',
    });
    const text = await res.text();
    return { status: res.status, location: res.headers.get('location'), text, ok: res.ok };
}

function pass(label, detail = '') {
    console.log(`  OK  ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label, detail = '') {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
    console.log(`Smoke test @ ${BASE}\n`);

    const home = await get('/', '');
    if (home.status === 200) pass('GET /');
    else fail('GET /', `status ${home.status}`);

    for (const account of accounts) {
        console.log(`\n[${account.label}]`);
        const session = await login(account.email, account.password);
        if (!session.cookie) {
            fail('login', `status ${session.status}, no session cookie`);
            continue;
        }
        pass('login', `redirect ${session.location || '-'}`);

        if (account.label === 'secretary') {
            const page = await get('/secretary_viewtickets', session.cookie);
            if (page.status === 200 && page.text.includes('modalRoot')) pass('secretary_viewtickets');
            else fail('secretary_viewtickets', `status ${page.status}`);

            const api = await get('/api/ticket/1', session.cookie);
            if (api.status === 200 && api.text.includes('"success":true')) pass('GET /api/ticket/1');
            else fail('GET /api/ticket/1', `status ${api.status}`);

            const modal = await get('/tickets/unassigned-ticket-modal/2', session.cookie, {
                'X-Requested-With': 'XMLHttpRequest',
            });
            if (modal.status === 200 && modal.text.includes('ticketModal')) pass('modalGen fragment');
            else fail('modalGen fragment', `status ${modal.status}`);
        }

        if (account.label === 'leader') {
            const page = await get('/leader_viewtickets', session.cookie);
            if (page.status === 200 && page.text.includes('escalated-tab')) pass('leader_viewtickets');
            else fail('leader_viewtickets', `status ${page.status}`);

            const modalL = await get('/tickets/leader-unassigned-ticket-modal/2', session.cookie, {
                'X-Requested-With': 'XMLHttpRequest',
            });
            if (modalL.status === 200 && modalL.text.includes('ticketModal')) pass('modalLeader fragment');
            else fail('modalLeader fragment', `status ${modalL.status}`);

            const modalS = await get('/tickets/leader-view-ticket/ticket/1?modal=1', session.cookie, {
                'X-Requested-With': 'XMLHttpRequest',
            });
            if (modalS.status === 200 && modalS.text.includes('ticketModal')) pass('modalSpec fragment');
            else fail('modalSpec fragment', `status ${modalS.status}`);
        }

        if (account.label === 'student') {
            const page = await get('/user_viewtickets', session.cookie);
            if (page.status === 200 && page.text.includes('my-tickets')) pass('user_viewtickets');
            else fail('user_viewtickets', `status ${page.status}`);
        }
    }

    console.log('\nDone.');
}

main().catch((err) => {
    console.error('Smoke test error:', err);
    process.exitCode = 1;
});
