const db = require('./server/db.js');

async function test() {
    try {
        const { rows } = await db.query('SELECT * FROM attendance');
        console.log("Total attendance records:", rows.length);
        if (rows.length > 0) {
            console.log("Sample records:", rows.slice(0, 5));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
