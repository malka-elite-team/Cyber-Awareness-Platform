import { API_BASE_URL } from './config.js';

tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "surface": "#f3fcef",
                    "on-tertiary-container": "#76231b",
                    "on-primary": "#ffffff",
                    "on-tertiary-fixed": "#410001",
                    "surface-container-highest": "#dce5d9",
                    "tertiary-fixed": "#ffdad5",
                    "error-container": "#ffdad6",
                    "on-tertiary-fixed-variant": "#7f2a21",
                    "on-background": "#161d16",
                    "on-secondary-fixed-variant": "#005320",
                    "tertiary": "#9e4036",
                    "tertiary-container": "#ff8b7c",
                    "outline-variant": "#bccbb9",
                    "surface-tint": "#006e2f",
                    "primary-fixed": "#6bff8f",
                    "inverse-surface": "#2a322a",
                    "on-surface-variant": "#3d4a3d",
                    "secondary-fixed-dim": "#62df7d",
                    "inverse-on-surface": "#ebf3e7",
                    "primary-container": "#22c55e",
                    "on-error-container": "#93000a",
                    "on-primary-fixed": "#002109",
                    "on-primary-container": "#004b1e",
                    "on-surface": "#161d16",
                    "surface-container-lowest": "#ffffff",
                    "secondary": "#006e2d",
                    "surface-container-high": "#e2ebde",
                    "on-secondary": "#ffffff",
                    "secondary-fixed": "#7ffc97",
                    "secondary-container": "#7cf994",
                    "tertiary-fixed-dim": "#ffb4a9",
                    "on-secondary-fixed": "#002109",
                    "background": "#f3fcef",
                    "on-tertiary": "#ffffff",
                    "surface-dim": "#d4ddd0",
                    "surface-variant": "#dce5d9",
                    "outline": "#6d7b6c",
                    "error": "#ba1a1a",
                    "inverse-primary": "#4ae176",
                    "primary": "#006e2f",
                    "on-error": "#ffffff",
                    "surface-container": "#e8f0e4",
                    "surface-container-low": "#edf6ea",
                    "on-secondary-container": "#007230",
                    "surface-bright": "#f3fcef",
                    "primary-fixed-dim": "#4ae176",
                    "on-primary-fixed-variant": "#005321"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "sm": "8px",
                    "margin": "20px",
                    "gutter": "16px",
                    "xs": "4px",
                    "lg": "24px",
                    "md": "16px",
                    "base": "8px",
                    "xl": "32px"
            },
            "fontFamily": {
                    "label-md": ["Plus Jakarta Sans"],
                    "button": ["Plus Jakarta Sans"],
                    "body-lg": ["Plus Jakarta Sans"],
                    "body-sm": ["Plus Jakarta Sans"],
                    "h1": ["Plus Jakarta Sans"],
                    "h2": ["Plus Jakarta Sans"],
                    "h3": ["Plus Jakarta Sans"],
                    "body-md": ["Plus Jakarta Sans"]
            },
            "fontSize": {
                    "label-md": ["14px", {"lineHeight": "16px", "fontWeight": "600"}],
                    "button": ["16px", {"lineHeight": "20px", "fontWeight": "600"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "h1": ["30px", {"lineHeight": "38px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "h2": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
                    "h3": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}]
            }
          },
        },
      }

let questions = [];
let userAnswers = [];
let currentQuestionIndex = 0;

if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const questionCountEl = document.getElementById('question-count');
    const progressTextEl = document.getElementById('progress-text');
    const progressBarEl = document.getElementById('progress-bar');
    const questionTextEl = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackBox = document.getElementById('feedback-box');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackText = document.getElementById('feedback-text');
    const actionBtn = document.getElementById('action-btn');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    const finalScoreEl = document.getElementById('final-score');
    const retryBtn = document.getElementById('retry-btn');

    if (!quizScreen) return;

    function loadQuestion() {
        if (questions.length === 0) return;
        
        const q = questions[currentQuestionIndex];
        
        questionCountEl.textContent = `السؤال ${currentQuestionIndex + 1} من ${questions.length}`;
        const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressTextEl.textContent = `${progressPercent}% مكتمل`;
        progressBarEl.style.width = `${progressPercent}%`;

        questionTextEl.textContent = q.question;
        optionsContainer.innerHTML = '';
        
        q.options.forEach((opt, index) => {
            const label = document.createElement('label');
            label.className = "flex items-center p-md border border-gray-200 rounded-xl cursor-pointer hover:bg-surface transition-all active:scale-[0.98]";
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'security_question';
            radio.className = "w-5 h-5 text-primary-container focus:ring-primary border-gray-300 transition-all";
            radio.value = index;

            const span = document.createElement('span');
            span.className = "mr-md font-body-lg text-body-lg text-on-surface";
            span.textContent = opt;

            label.appendChild(radio);
            label.appendChild(span);
            optionsContainer.appendChild(label);
        });

        feedbackBox.classList.add('hidden');
        actionBtn.textContent = 'التالي';
    }

    async function submitQuiz() {
        try {
            actionBtn.disabled = true;
            actionBtn.textContent = 'جاري إرسال الإجابات...';
            
            const token = localStorage.getItem('token');
            const urlParams = new URLSearchParams(window.location.search);
            const tipId = urlParams.get('tipId');
            
            const payload = { answers: userAnswers };
            if (tipId) {
                payload.tipId = tipId;
            }

            const response = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
                method: 'POST',
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error('Failed to submit quiz');
            
            const result = await response.json();
            showResults(result);
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء إرسال الإجابات');
            actionBtn.disabled = false;
            actionBtn.textContent = 'إنهاء الاختبار';
        }
    }

    actionBtn.addEventListener('click', async () => {
        const selectedOpt = document.querySelector('input[name="security_question"]:checked');
        if (!selectedOpt) {
            alert('يرجى اختيار إجابة أولاً');
            return;
        }

        const selectedIndex = parseInt(selectedOpt.value);
        userAnswers.push(selectedIndex);
        
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            await submitQuiz();
        }
    });

    function showResults(result) {
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        finalScoreEl.textContent = `${result.score} / ${result.total} (${result.percentage}%)`;
        progressBarEl.style.width = `100%`;
        progressTextEl.textContent = `100% مكتمل`;
    }

    retryBtn.addEventListener('click', () => {
        currentQuestionIndex = 0;
        userAnswers = [];
        resultScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        actionBtn.disabled = false;
        loadQuestion();
    });

    async function loadQuestionsFromAPI() {
        try {
            const token = localStorage.getItem('token');
            const urlParams = new URLSearchParams(window.location.search);
            const tipId = urlParams.get('tipId');
            
            let url = `${API_BASE_URL}/api/quiz/questions`;
            if (tipId) {
                url += `?tipId=${tipId}`;
            }

            const response = await fetch(url, {
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
                throw new Error('Failed to fetch questions');
            }
            questions = await response.json();
            loadQuestion();
        } catch (error) {
            console.error(error);
            questionTextEl.textContent = "حدث خطأ أثناء تحميل الأسئلة.";
        }
    }

    loadQuestionsFromAPI();
});
