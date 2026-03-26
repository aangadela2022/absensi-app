/**
 * auth.js - Handles the login logic natively via API.
 * Depends on api.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    // Check if already logged in -> redirect to dashboard
    const currentUser = Api.getCurrentUser();
    if (currentUser && currentUser.role && window.location.pathname.endsWith('login.html')) {
        window.location.href = 'dashboard.html';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const alertBox = document.getElementById('loginAlert');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // Set loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Memproses...';

            try {
                const response = await Api.fetchData('/auth/login', 'POST', { username, password });

                if (response.success) {
                    // Save session
                    Api.saveSession(response.token, response.user);
                    
                    // Redirect
                    window.location.href = 'dashboard.html';
                } else {
                    // Show error
                    alertBox.textContent = response.message || 'Username atau password salah!';
                    alertBox.className = 'alert alert-danger';
                    alertBox.classList.remove('hidden');
                    
                    // Shake effect
                    loginForm.classList.add('shake');
                    setTimeout(() => {
                        loginForm.classList.remove('shake');
                    }, 500);
                }
            } catch (error) {
                alertBox.textContent = 'Terjadi kesalahan sistem';
                alertBox.className = 'alert alert-danger';
                alertBox.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });
    }
});

/**
 * Logout utility function
 */
function logout() {
    Api.clearSession();
    window.location.href = 'login.html';
}
