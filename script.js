// 전역 변수
let messagesData = [];
let currentMessage = null;
let messageCounter = 0;
let settings = JSON.parse(localStorage.getItem('settings')) || {
    darkMode: false
};

// DOM 요소
const elements = {
    loading: document.getElementById('loading'),
    quoteContent: document.getElementById('quoteContent'),
    quoteText: document.getElementById('quoteText'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    quoteCategory: document.getElementById('quoteCategory'),
    timeGreeting: document.getElementById('timeGreeting'),
    newQuoteBtn: document.getElementById('newQuoteBtn'),
    shareBtn: document.getElementById('shareBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    dateDisplay: document.getElementById('dateDisplay'),
    messageCounter: document.getElementById('messageCounter'),
    shareModal: document.getElementById('shareModal'),
    modalClose: document.getElementById('modalClose'),
    sharePreview: document.getElementById('sharePreview'),
    copyBtn: document.getElementById('copyBtn'),
    twitterBtn: document.getElementById('twitterBtn'),
    facebookBtn: document.getElementById('facebookBtn'),
    settingsModal: document.getElementById('settingsModal'),
    settingsModalClose: document.getElementById('settingsModalClose'),
    darkModeToggle: document.getElementById('darkModeToggle')
};

// 애플리케이션 초기화
async function initApp() {
    try {
        await loadMessages();
        setupEventListeners();
        applySettings();
        displayCurrentTime();
        displayCurrentDate();
        displayRandomMessage();
        
    } catch (error) {
        console.error('앱 초기화 실패:', error);
        showError('앱을 초기화하는 중 오류가 발생했습니다.');
    }
}

// 메시지 데이터 로드
async function loadMessages() {
    try {
        const response = await fetch('messages.json');
        if (!response.ok) {
            throw new Error('네트워크 응답이 올바르지 않습니다');
        }
        const data = await response.json();
        messagesData = data.messages;
        
        if (messagesData.length === 0) {
            throw new Error('메시지 데이터가 비어있습니다');
        }
    } catch (error) {
        console.error('메시지 데이터 로드 실패:', error);
        messagesData = [
            {
                id: 1,
                text: "새로운 아침이 시작됩니다. 오늘도 좋은 하루 되세요!",
                author: "모닝",
                category: "새로운 시작"
            },
            {
                id: 2,
                text: "작은 변화가 큰 차이를 만듭니다.",
                author: "익명",
                category: "동기부여"
            },
            {
                id: 3,
                text: "오늘 하루도 감사한 마음으로 시작해보세요.",
                author: "모닝",
                category: "감사"
            }
        ];
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 기본 버튼들
    elements.newQuoteBtn.addEventListener('click', displayRandomMessage);
    elements.shareBtn.addEventListener('click', openShareModal);
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    
    // 모달 관련
    elements.modalClose.addEventListener('click', closeShareModal);
    elements.settingsModalClose.addEventListener('click', closeSettingsModal);
    
    // 설정 관련
    elements.darkModeToggle.addEventListener('change', toggleDarkMode);
    
    // 공유 버튼들
    elements.copyBtn.addEventListener('click', copyToClipboard);
    elements.twitterBtn.addEventListener('click', shareToTwitter);
    elements.facebookBtn.addEventListener('click', shareToFacebook);
    
    // 키보드 단축키
    document.addEventListener('keydown', handleKeyboard);
    
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
        if (e.target === elements.shareModal) closeShareModal();
        if (e.target === elements.settingsModal) closeSettingsModal();
    });
    
    // 터치 제스처 (스와이프로 새 메시지)
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 100;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                displayRandomMessage();
            }
        }
    }
}

// 현재 시간 인사말 표시
function displayCurrentTime() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = '';
    
    if (hour >= 5 && hour < 12) {
        greeting = '🌅 좋은 아침입니다';
    } else if (hour >= 12 && hour < 18) {
        greeting = '☀️ 좋은 오후입니다';
    } else if (hour >= 18 && hour < 22) {
        greeting = '🌆 좋은 저녁입니다';
    } else {
        greeting = '🌙 늦은 시간이네요';
    }
    
    elements.timeGreeting.textContent = greeting;
}

// 현재 날짜 표시
function displayCurrentDate() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    };
    
    const dateString = now.toLocaleDateString('ko-KR', options);
    elements.dateDisplay.textContent = dateString;
}

// 랜덤 메시지 표시
function displayRandomMessage() {
    showLoading();
    
    setTimeout(() => {
        let randomIndex;
        
        do {
            randomIndex = Math.floor(Math.random() * messagesData.length);
        } while (messagesData.length > 1 && messagesData[randomIndex] === currentMessage);
        
        currentMessage = messagesData[randomIndex];
        messageCounter++;
        
        showMessage();
        updateMessageCounter();
        
    }, 600);
}

// 로딩 상태 표시
function showLoading() {
    elements.loading.style.display = 'flex';
    elements.quoteContent.style.display = 'none';
}

// 메시지 표시
function showMessage() {
    if (!currentMessage) return;
    
    elements.quoteText.textContent = currentMessage.text;
    elements.quoteAuthor.textContent = currentMessage.author;
    elements.quoteCategory.textContent = currentMessage.category;
    
    elements.loading.style.display = 'none';
    elements.quoteContent.style.display = 'block';
}

// 메시지 카운터 업데이트
function updateMessageCounter() {
    elements.messageCounter.textContent = messageCounter;
}

// 설정 적용
function applySettings() {
    // 다크모드
    elements.darkModeToggle.checked = settings.darkMode;
    if (settings.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// 다크모드 토글
function toggleDarkMode() {
    settings.darkMode = elements.darkModeToggle.checked;
    
    if (settings.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    saveSettings();
}


// 설정 저장
function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

// 모달 관련 함수들
function openShareModal() {
    if (!currentMessage) return;
    
    const shareText = `"${currentMessage.text}"\n\n— ${currentMessage.author}`;
    elements.sharePreview.textContent = shareText;
    elements.shareModal.style.display = 'block';
}

function closeShareModal() {
    elements.shareModal.style.display = 'none';
}

function openSettingsModal() {
    elements.settingsModal.style.display = 'block';
}

function closeSettingsModal() {
    elements.settingsModal.style.display = 'none';
}

// 공유 기능들
async function copyToClipboard() {
    if (!currentMessage) return;
    
    const shareText = `"${currentMessage.text}"\n\n— ${currentMessage.author}`;
    
    try {
        await navigator.clipboard.writeText(shareText);
        showToast('클립보드에 복사되었습니다! 📋', 'success');
        closeShareModal();
    } catch (error) {
        console.error('복사 실패:', error);
        showToast('복사에 실패했습니다.', 'error');
    }
}

function shareToTwitter() {
    if (!currentMessage) return;
    
    const shareText = `"${currentMessage.text}" — ${currentMessage.author}`;
    const hashtags = '모닝,아침메시지,명언';
    const url = encodeURIComponent(window.location.href);
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=${hashtags}&url=${url}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    closeShareModal();
}

function shareToFacebook() {
    if (!currentMessage) return;
    
    const url = encodeURIComponent(window.location.href);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    closeShareModal();
}

// 키보드 이벤트 처리
function handleKeyboard(e) {
    if (elements.shareModal.style.display === 'block' || 
        elements.settingsModal.style.display === 'block') {
        if (e.key === 'Escape') {
            closeShareModal();
            closeSettingsModal();
        }
        return;
    }
    
    switch (e.key) {
        case ' ':
        case 'Enter':
            e.preventDefault();
            displayRandomMessage();
            break;
        case 's':
        case 'S':
            if (!e.ctrlKey && !e.metaKey) {
                openShareModal();
            }
            break;
    }
}

// 토스트 메시지 표시
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: colors[type] || colors.success,
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: '500',
        zIndex: '2000',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        opacity: '0',
        transition: 'opacity 0.3s ease'
    });
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 에러 표시
function showError(message) {
    elements.loading.style.display = 'none';
    elements.quoteContent.innerHTML = `
        <div style="text-align: center; color: #ef4444;">
            <p>⚠️ ${message}</p>
            <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                다시 시도
            </button>
        </div>
    `;
    elements.quoteContent.style.display = 'block';
}

// 페이지 로드 시 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', initApp);

// 서비스 워커 등록 (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('서비스 워커 등록 성공:', registration.scope);
        } catch (error) {
            console.error('서비스 워커 등록 실패:', error);
        }
    });
}