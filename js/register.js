// Show/hide department field based on role
document.getElementById('role').addEventListener('change', function() {
    const departmentGroup = document.getElementById('departmentGroup');
    const departmentSelect = document.getElementById('department');
    
    if (this.value === 'employee') {
        departmentGroup.style.display = 'block';
        departmentSelect.required = true;
    } else {
        departmentGroup.style.display = 'none';
        departmentSelect.required = false;
        departmentSelect.value = '';
    }
});

// Handle form submission
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const department = document.getElementById('department').value;
    
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    // Clear messages
    errorMsg.textContent = '';
    successMsg.textContent = '';
    
    // Validation
    if (!name || !email || !password || !role) {
        errorMsg.textContent = 'يرجى ملء جميع الحقول المطلوبة';
        return;
    }
    
    if (password !== confirmPassword) {
        errorMsg.textContent = 'كلمة المرور وتأكيد كلمة المرور غير متطابقين';
        return;
    }
    
    if (password.length < 6) {
        errorMsg.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        return;
    }
    
    if (role === 'employee' && !department) {
        errorMsg.textContent = 'يرجى اختيار القسم';
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري إنشاء الحساب...';
    
    try {
        const userData = {
            name,
            email,
            password,
            role,
            department: role === 'employee' ? department : null
        };
        
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        }).catch(err => {
            throw new Error('تعذر الاتصال بالسيرفر. تأكد من تشغيل السيرفر بالأمر: npm start');
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('السيرفر غير شغال. يرجى تشغيل السيرفر بالأمر: npm start');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'حدث خطأ أثناء إنشاء الحساب');
        }
        
        // Success
        successMsg.textContent = 'تم إنشاء الحساب بنجاح! سيتم تحويلك لصفحة تسجيل الدخول...';
        successMsg.style.display = 'block';
        
        // Reset form
        this.reset();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        errorMsg.textContent = error.message;
        submitBtn.disabled = false;
        submitBtn.textContent = 'إنشاء الحساب';
    }
});
