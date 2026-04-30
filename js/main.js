import { API_BASE_URL } from './config.js';

tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            "colors": {
                "on-primary-container": "#004b1e",
                "tertiary-fixed": "#ffdad5",
                "on-primary-fixed": "#002109",
                "secondary-fixed-dim": "#62df7d",
                "on-background": "#161d16",
                "primary": "#006e2f",
                "secondary": "#006e2d",
                "on-primary-fixed-variant": "#005321",
                "background": "#f3fcef",
                "primary-container": "#22c55e",
                "surface-dim": "#d4ddd0",
                "surface": "#f3fcef",
                "surface-container-low": "#edf6ea",
                "error": "#ba1a1a",
                "on-tertiary": "#ffffff",
                "outline": "#6d7b6c",
                "on-secondary-fixed": "#002109",
                "tertiary": "#9e4036",
                "tertiary-fixed-dim": "#ffb4a9",
                "on-secondary-fixed-variant": "#005320",
                "tertiary-container": "#ff8b7c",
                "surface-container": "#e8f0e4",
                "primary-fixed-dim": "#4ae176",
                "on-surface-variant": "#3d4a3d",
                "on-tertiary-fixed-variant": "#7f2a21",
                "surface-bright": "#f3fcef",
                "on-error-container": "#93000a",
                "on-secondary": "#ffffff",
                "secondary-fixed": "#7ffc97",
                "on-secondary-container": "#007230",
                "surface-container-highest": "#dce5d9",
                "on-tertiary-fixed": "#410001",
                "surface-tint": "#006e2f",
                "on-tertiary-container": "#76231b",
                "error-container": "#ffdad6",
                "surface-container-lowest": "#ffffff",
                "primary-fixed": "#6bff8f",
                "secondary-container": "#7cf994",
                "inverse-on-surface": "#ebf3e7",
                "inverse-surface": "#2a322a",
                "outline-variant": "#bccbb9",
                "on-surface": "#161d16",
                "on-error": "#ffffff",
                "inverse-primary": "#4ae176",
                "on-primary": "#ffffff",
                "surface-variant": "#dce5d9",
                "surface-container-high": "#e2ebde"
            },
            "borderRadius": {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
            "spacing": {
                "container-max": "1280px",
                "gutter": "24px",
                "sm": "12px",
                "base": "8px",
                "lg": "48px",
                "xl": "80px",
                "md": "24px",
                "xs": "4px"
            },
            "fontFamily": {
                "h3": ["Manrope"],
                "h1": ["Manrope"],
                "body-lg": ["Inter"],
                "body-md": ["Inter"],
                "label-bold": ["Inter"],
                "caption": ["Inter"],
                "h2": ["Manrope"]
            },
            "fontSize": {
                "h3": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                "h1": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                "label-bold": ["14px", {"lineHeight": "20px", "fontWeight": "600"}],
                "caption": ["12px", {"lineHeight": "16px", "fontWeight": "400"}],
                "h2": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('tips-grid');
    if (grid) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tips`, {
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "ngrok-skip-browser-warning": "true"
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.logout();
                    return;
                }
                throw new Error('Failed to fetch tips');
            }
            
            const tipsData = await response.json();
            
            grid.innerHTML = tipsData.map(tip => `
            <div class="bg-white border border-gray-200 rounded-lg p-md hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all group relative overflow-hidden flex flex-col">
            <div class="absolute top-0 right-0 w-1.5 h-full bg-primary-container"></div>
            <div class="flex items-start gap-4 mb-4">
            <div class="w-12 h-12 shrink-0 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container">
            <span class="material-symbols-outlined">${tip.icon}</span>
            </div>
            <div class="flex-1">
            <h4 class="font-h3 text-[20px] text-primary mb-xs">${tip.title}</h4>
            <p class="font-body-md text-secondary leading-relaxed">${tip.description || tip.desc}</p>
            </div>
            </div>
            <div class="mt-auto pt-2">
            <button onclick="window.location.href='article.html?id=${tip.id}'" class="w-full py-2 bg-primary-container text-white font-label-bold rounded-lg hover:opacity-90 transition-opacity">اقرأ المزيد</button>
            </div>
            </div>
            `).join('');
        } catch (error) {
            console.error(error);
            grid.innerHTML = '<p class="text-error col-span-full text-center py-4">حدث خطأ أثناء تحميل النصائح. يرجى المحاولة لاحقاً.</p>';
        }
    }
});

if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

window.logout = async function() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "ngrok-skip-browser-warning": "true"
                }
            });
        }
    } catch (e) {
        console.error('Logout error:', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}
