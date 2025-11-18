document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    console.log('Login attempt:', email);
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري تسجيل الدخول...';
    errorMsg.textContent = '';
    
    try {
        console.log('Calling AuthAPI.login...');
        const user = await AuthAPI.login(email, password);
        console.log('Login successful, user:', user);
        
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        console.log('User saved to sessionStorage');
        
        console.log('Redirecting to dashboard...');
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        errorMsg.textContent = error.message || 'حدث خطأ أثناء تسجيل الدخول';
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الدخول';
    }
});
