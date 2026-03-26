const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function seed() {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                const adminPassword = await bcrypt.hash('admin123', 10);
                const operatorPassword = await bcrypt.hash('operator123', 10);

                // Insert admin
                db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, 
                    ['admin', adminPassword, 'admin'], 
                    (err) => {
                        if (err) console.error("Error inserting admin:", err.message);
                        else console.log("Admin inserted or already exists.");
                    }
                );
                
                // Insert operator
                db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, 
                    ['operator', operatorPassword, 'operator'],
                    (err) => {
                        if (err) console.error("Error inserting operator:", err.message);
                        else console.log("Operator inserted or already exists.");
                        
                        db.close();
                        resolve();
                    }
                );
                
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    });
}

seed().then(() => console.log("Seeding complete.")).catch(console.error);
