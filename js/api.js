/**
 * api.js - Module for interacting with the Backend API
 * Replaces the old storage.js Local Storage implementation
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : '/api';

const Api = {
    // Get JWT Token from storage
    getToken: function() {
        return localStorage.getItem('token');
    },

    // Save token and user info
    saveSession: function(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
    },

    // Clear session
    clearSession: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    },

    // Get current user
    getCurrentUser: function() {
        try {
            const data = localStorage.getItem('currentUser');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    // Helper for fetch with auth header
    fetchData: async function(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const data = await response.json();
            
            // Handle unauthorized globally
            if (response.status === 401 || response.status === 403) {
                if (window.location.pathname !== '/login.html' && window.location.pathname !== '/') {
                    this.clearSession();
                    window.location.href = 'login.html';
                }
            }
            
            return {
                status: response.status,
                ok: response.ok,
                ...data
            };
        } catch (error) {
            console.error('API Error:', error);
            return {
                ok: false,
                success: false,
                message: 'Tidak dapat terhubung ke server.'
            };
        }
    }
};
