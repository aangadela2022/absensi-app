/**
 * storage.js - Module for interacting with Local Storage
 * Implements logic to get/set users, students, and attendance.
 */

const StorageApp = {
    // Keys
    KEYS: {
        USERS: 'users',
        STUDENTS: 'students',
        ATTENDANCE: 'attendance',
        CURRENT_USER: 'currentUser'
    },

    // Initialize default users if empty
    initUsers: function() {
        const users = this.get(this.KEYS.USERS);
        if (!users || users.length === 0) {
            // Seed initial users based on blueprint
            const seedUsers = [
                { username: "admin", password: "admin123", role: "admin" },
                { username: "operator", password: "operator123", role: "operator" }
            ];
            this.set(this.KEYS.USERS, seedUsers);
            console.log("Users initialized.");
        }
    },

    initStudents: function() {
        const students = this.get(this.KEYS.STUDENTS);
        if (!students) {
            this.set(this.KEYS.STUDENTS, []);
        }
    },

    initAttendance: function() {
        const attendance = this.get(this.KEYS.ATTENDANCE);
        if (!attendance) {
            this.set(this.KEYS.ATTENDANCE, []);
        }
    },

    initAll: function() {
        this.initUsers();
        this.initStudents();
        this.initAttendance();
    },

    // Get item from local storage
    get: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Error reading ${key} from storage`, e);
            return null;
        }
    },

    // Set item to local storage
    set: function(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {
            console.error(`Error writing ${key} to storage`, e);
        }
    },
    
    // Clear user session
    clearSession: function() {
        localStorage.removeItem(this.KEYS.CURRENT_USER);
    }
};

// Initialize on load
StorageApp.initAll();
