import { API_BASE_URL } from './config.js';

tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "inverse-primary": "#4ae176",
                    "inverse-surface": "#2a322a",
                    "on-primary": "#ffffff",
                    "surface-dim": "#d4ddd0",
                    "error": "#ba1a1a",
                    "tertiary-fixed-dim": "#ffb4a9",
                    "on-primary-fixed": "#002109",
                    "tertiary": "#9e4036",
                    "error-container": "#ffdad6",
                    "secondary-container": "#7cf994",
                    "surface-container-high": "#e2ebde",
                    "on-tertiary": "#ffffff",
                    "primary": "#006e2f",
                    "surface-container-lowest": "#ffffff",
                    "surface-variant": "#dce5d9",
                    "outline": "#6d7b6c",
                    "on-secondary-fixed-variant": "#005320",
                    "tertiary-fixed": "#ffdad5",
                    "on-surface": "#161d16",
                    "inverse-on-surface": "#ebf3e7",
                    "secondary-fixed": "#7ffc97",
                    "primary-container": "#22c55e",
                    "outline-variant": "#bccbb9",
                    "primary-fixed": "#6bff8f",
                    "on-secondary-fixed": "#002109",
                    "surface-container-low": "#edf6ea",
                    "on-primary-container": "#004b1e",
                    "surface-tint": "#006e2f",
                    "on-tertiary-container": "#76231b",
                    "on-error-container": "#93000a",
                    "secondary": "#006e2d",
                    "primary-fixed-dim": "#4ae176",
                    "surface-container-highest": "#dce5d9",
                    "secondary-fixed-dim": "#62df7d",
                    "on-surface-variant": "#3d4a3d",
                    "on-tertiary-fixed": "#410001",
                    "surface-container": "#e8f0e4",
                    "on-error": "#ffffff",
                    "background": "#f3fcef",
                    "on-secondary": "#ffffff",
                    "surface": "#f3fcef",
                    "surface-bright": "#f3fcef",
                    "tertiary-container": "#ff8b7c",
                    "on-primary-fixed-variant": "#005321",
                    "on-background": "#161d16",
                    "on-secondary-container": "#007230",
                    "on-tertiary-fixed-variant": "#7f2a21"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "margin-mobile": "20px",
                    "gutter-mobile": "12px",
                    "sm": "8px",
                    "md": "16px",
                    "base": "8px",
                    "xs": "4px",
                    "lg": "24px",
                    "xl": "32px"
            },
            "fontFamily": {
                    "h2": ["Manrope"],
                    "label-md": ["Manrope"],
                    "body-md": ["Manrope"],
                    "h1": ["Manrope"],
                    "body-lg": ["Manrope"],
                    "display": ["Manrope"],
                    "caption": ["Manrope"]
            },
            "fontSize": {
                    "h2": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "h1": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
                    "body-lg": ["18px", {"lineHeight": "26px", "fontWeight": "400"}],
                    "display": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "caption": ["12px", {"lineHeight": "16px", "fontWeight": "500"}]
            }
          },
        },
      }

document.addEventListener('DOMContentLoaded', () => {
    // Login Logic
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const errorMsg = document.getElementById('login-error');
            
            if (!emailInput.value.trim() || !passwordInput.value.trim()) {
                errorMsg.classList.remove('hidden');
                emailInput.classList.remove('border-outline-variant');
                emailInput.classList.add('border-error');
                passwordInput.classList.remove('border-outline-variant');
                passwordInput.classList.add('border-error');
            } else {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'ngrok-skip-browser-warning': 'true'
                        },
                        body: JSON.stringify({
                            email: emailInput.value.trim(),
                            password: passwordInput.value.trim()
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || 'الإيميل أو كلمة المرور غير الصحيحة');
                    }
                    
                    errorMsg.classList.add('hidden');
                    emailInput.classList.remove('border-error');
                    emailInput.classList.add('border-outline-variant');
                    passwordInput.classList.remove('border-error');
                    passwordInput.classList.add('border-outline-variant');
                    
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('isLoggedIn', 'true');
                    alert('تم تسجيل الدخول بنجاح!');
                    window.location.href = 'index.html';
                } catch (error) {
                    errorMsg.innerHTML = `${error.message} <span class="material-symbols-outlined text-[16px]">error</span>`;
                    errorMsg.classList.remove('hidden');
                }
            }
        });
    }

    // Signup Logic
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const errorMsg = document.getElementById('signup-error');
            const confirmInput = document.getElementById('signup-confirm-password');
            const errorMsgText = errorMsg.querySelector('p');
            
            if (password !== confirmPassword) {
                errorMsg.classList.remove('hidden');
                if (errorMsgText) errorMsgText.textContent = 'كلمتا المرور غير متطابقتين';
                confirmInput.classList.add('border-error');
                confirmInput.classList.remove('border-gray-200');
            } else {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'ngrok-skip-browser-warning': 'true'
                        },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || 'حدث خطأ أثناء إنشاء الحساب');
                    }
                    
                    errorMsg.classList.add('hidden');
                    confirmInput.classList.remove('border-error');
                    confirmInput.classList.add('border-gray-200');
                    
                    alert('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.');
                    window.location.href = 'login.html';
                } catch (error) {
                    if (errorMsgText) errorMsgText.textContent = error.message;
                    errorMsg.classList.remove('hidden');
                }
            }
        });
    }

    // Toggle Password Visibility
    const togglePassword = document.getElementById('toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const passwordInput = document.getElementById('signup-password');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePassword.textContent = 'visibility';
            } else {
                passwordInput.type = 'password';
                togglePassword.textContent = 'visibility_off';
            }
        });
    }
});
