const db = require('./lib/db');

async function checkUsers() {
    try {
        const res = await db.execute("SELECT * FROM users");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkUsers();
