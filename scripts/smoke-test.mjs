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
            const page = await get('/secretary-viewtickets', session.cookie);
            const hasShell = page.text.includes('id="modal-template-secretary"');
            if (page.status === 200 && page.text.includes('modalRoot') && hasShell) {
                pass('secretary-viewtickets', 'inline secretary modal template present');
            } else {
                fail('secretary-viewtickets', `status ${page.status}, shell=${hasShell}`);
            }

            const api = await get('/api/ticket/1', session.cookie);
            if (api.status === 200 && api.text.includes('"success":true')) pass('GET /api/ticket/1');
            else fail('GET /api/ticket/1', `status ${api.status}`);
        }

        if (account.label === 'leader') {
            const page = await get('/leader-viewtickets', session.cookie);
            const hasLeader = page.text.includes('id="modal-template-leader"');
            const hasEscalated = page.text.includes('id="modal-template-escalated"');
            if (page.status === 200 && page.text.includes('escalated-tab') && hasLeader && hasEscalated) {
                pass('leader-viewtickets', 'inline leader+escalated modal templates present');
            } else {
                fail(
                    'leader-viewtickets',
                    `status ${page.status}, leader=${hasLeader}, escalated=${hasEscalated}`
                );
            }
        }

        if (account.label === 'student') {
            const page = await get('/student-viewtickets', session.cookie);
            if (page.status === 200 && page.text.includes('my-tickets')) pass('student-viewtickets');
            else fail('student-viewtickets', `status ${page.status}`);
        }
    }

    console.log('\nDone.');
}

main().catch((err) => {
    console.error('Smoke test error:', err);
    process.exitCode = 1;
});
