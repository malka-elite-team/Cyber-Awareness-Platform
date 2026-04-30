import { API_BASE_URL } from './config.js';

if (!localStorage.getItem('token') && localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    
    const titleEl = document.getElementById('article-title');
    const descEl = document.getElementById('article-desc');
    const stepsContainer = document.getElementById('article-steps');
    const iconEl = document.getElementById('article-icon');
    const quizBtn = document.getElementById('quiz-btn');
    
    if (!idParam) {
        if (titleEl) titleEl.textContent = 'النصيحة غير موجودة';
        if (descEl) descEl.textContent = 'عذراً، لم يتم توفير معرف النصيحة.';
        if (stepsContainer) stepsContainer.parentElement.style.display = 'none';
        if (quizBtn) quizBtn.style.display = 'none';
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/tips/${idParam}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "ngrok-skip-browser-warning": "true"
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Tip not found');
        }

        const tip = await response.json();
        
        if (iconEl && tip.icon) iconEl.textContent = tip.icon;
        if (titleEl) titleEl.textContent = tip.title;
        if (descEl) descEl.textContent = tip.description;
        
        if (stepsContainer) {
            if (tip.steps && tip.steps.length > 0) {
                stepsContainer.innerHTML = tip.steps.map(step => `<li>${step}</li>`).join('');
            } else {
                stepsContainer.parentElement.style.display = 'none';
            }
        }

        if (quizBtn) {
            quizBtn.addEventListener('click', () => {
                window.location.href = 'quiz.html?tipId=' + idParam;
            });
        }
    } catch (error) {
        console.error(error);
        if (titleEl) titleEl.textContent = 'النصيحة غير موجودة';
        if (descEl) descEl.textContent = 'عذراً، لم نتمكن من العثور على المعلومات المطلوبة.';
        if (stepsContainer) stepsContainer.parentElement.style.display = 'none';
        if (quizBtn) quizBtn.style.display = 'none';
    }
});
