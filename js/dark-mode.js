// Dark Mode Toggle Script

// Check for saved dark mode preference
const isDarkMode = localStorage.getItem('darkMode') === 'true';

// Apply dark mode on page load
if (isDarkMode) {
    document.body.classList.add('dark-mode');
}

// Create dark mode toggle button
function createDarkModeToggle() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'dark-mode-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle Dark Mode');
    toggleBtn.innerHTML = isDarkMode ? '☀️' : '🌙';
    toggleBtn.onclick = toggleDarkMode;
    document.body.appendChild(toggleBtn);
}

// Toggle dark mode
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    
    // Save preference
    localStorage.setItem('darkMode', isDark);
    
    // Update button icon
    const toggleBtn = document.querySelector('.dark-mode-toggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = isDark ? '☀️' : '🌙';
    }
    
    // Add animation
    body.style.transition = 'background 0.3s ease';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', createDarkModeToggle);
