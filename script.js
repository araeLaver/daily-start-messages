// 전역 변수
let messagesData = [];
let currentMessage = null;
let messageCounter = 0;
let isWidgetMode = new URLSearchParams(window.location.search).has('widget');
let settings = JSON.parse(localStorage.getItem('settings')) || {
    darkMode: false,
    notifications: false,
    notificationTime: '08:00'
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
    speakBtn: document.getElementById('speakBtn'),
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
    darkModeToggle: document.getElementById('darkModeToggle'),
    notificationToggle: document.getElementById('notificationToggle'),
    notificationTime: document.getElementById('notificationTime'),
    notificationTimeRow: document.getElementById('notificationTimeRow')
};

// 애플리케이션 초기화
async function initApp() {
    try {
        await loadMessages();
        setupEventListeners();
        applySettings();
        displayCurrentTime();
        displayCurrentDate();
        
        // 위젯 모드 처리
        if (isWidgetMode) {
            setupWidgetMode();
        }
        
        displayRandomMessage();
        setupNotifications();
        
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
    elements.speakBtn.addEventListener('click', speakMessage);
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    
    // 모달 관련
    elements.modalClose.addEventListener('click', closeShareModal);
    elements.settingsModalClose.addEventListener('click', closeSettingsModal);
    
    // 설정 관련
    elements.darkModeToggle.addEventListener('change', toggleDarkMode);
    elements.notificationToggle.addEventListener('change', toggleNotifications);
    elements.notificationTime.addEventListener('change', updateNotificationTime);
    
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
    
    // 햅틱 피드백 (모바일)
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    setTimeout(() => {
        let randomIndex;
        
        do {
            randomIndex = Math.floor(Math.random() * messagesData.length);
        } while (messagesData.length > 1 && messagesData[randomIndex] === currentMessage);
        
        currentMessage = messagesData[randomIndex];
        messageCounter++;
        
        showMessage();
        updateMessageCounter();
        saveCurrentMessage();
        
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
    
    // 동적 폰트 크기 조정
    adjustFontSize();
    
    elements.quoteText.textContent = currentMessage.text;
    elements.quoteAuthor.textContent = currentMessage.author;
    elements.quoteCategory.textContent = currentMessage.category;
    
    elements.loading.style.display = 'none';
    elements.quoteContent.style.display = 'block';
    
    // 메시지 애니메이션
    elements.quoteContent.style.animation = 'slideIn 0.5s ease-out';
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
    
    // 알림 설정
    elements.notificationToggle.checked = settings.notifications;
    elements.notificationTime.value = settings.notificationTime;
    elements.notificationTimeRow.style.display = settings.notifications ? 'flex' : 'none';
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

// 알림 토글
async function toggleNotifications() {
    if (elements.notificationToggle.checked) {
        // 알림 권한 요청
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            settings.notifications = true;
            elements.notificationTimeRow.style.display = 'flex';
            showToast('알림이 활성화되었습니다! 📢', 'success');
            scheduleNotification();
        } else {
            elements.notificationToggle.checked = false;
            showToast('알림 권한이 필요합니다', 'warning');
        }
    } else {
        settings.notifications = false;
        elements.notificationTimeRow.style.display = 'none';
        showToast('알림이 비활성화되었습니다', 'info');
    }
    
    saveSettings();
}

// 알림 시간 업데이트
function updateNotificationTime() {
    settings.notificationTime = elements.notificationTime.value;
    saveSettings();
    
    if (settings.notifications) {
        scheduleNotification();
        showToast('알림 시간이 변경되었습니다', 'success');
    }
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
        case 'v':
        case 'V':
            if (!e.ctrlKey && !e.metaKey) {
                speakMessage();
            }
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            e.preventDefault();
            displayRandomMessage();
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

// 위젯 모드 설정
function setupWidgetMode() {
    document.body.classList.add('widget-mode');
    document.querySelector('.header').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';
}

// 동적 폰트 크기 조정
function adjustFontSize() {
    const textLength = currentMessage.text.length;
    const quoteTextElement = elements.quoteText;
    
    if (textLength > 100) {
        quoteTextElement.style.fontSize = '1rem';
    } else if (textLength > 50) {
        quoteTextElement.style.fontSize = '1.125rem';
    } else {
        quoteTextElement.style.fontSize = '1.25rem';
    }
}

// 현재 메시지 저장 (오프라인용)
function saveCurrentMessage() {
    const recentMessages = JSON.parse(localStorage.getItem('recentMessages')) || [];
    
    // 중복 제거 후 최신 메시지 추가
    const filtered = recentMessages.filter(msg => msg.id !== currentMessage.id);
    filtered.unshift(currentMessage);
    
    // 최대 20개까지만 저장
    const updated = filtered.slice(0, 20);
    localStorage.setItem('recentMessages', JSON.stringify(updated));
}

// 알림 설정
async function setupNotifications() {
    if (!('Notification' in window)) return;
    
    if (settings.notifications && Notification.permission === 'granted') {
        scheduleNotification();
    }
}

// 알림 스케줄링
function scheduleNotification() {
    const [hours, minutes] = settings.notificationTime.split(':');
    const now = new Date();
    const notificationTime = new Date();
    notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // 오늘 시간이 지났으면 내일로 설정
    if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
    }
    
    const timeUntilNotification = notificationTime - now;
    
    setTimeout(() => {
        showNotification();
        // 다음날을 위해 24시간 후 다시 스케줄링
        setTimeout(scheduleNotification, 24 * 60 * 60 * 1000);
    }, timeUntilNotification);
}

// 알림 표시
function showNotification() {
    if (Notification.permission === 'granted') {
        const randomMessage = messagesData[Math.floor(Math.random() * messagesData.length)];
        
        new Notification('모닝 - 새로운 메시지', {
            body: randomMessage.text,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'daily-message',
            requireInteraction: false
        });
    }
}

// 음성 읽기 기능
function speakMessage() {
    if (!currentMessage || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(currentMessage.text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    
    speechSynthesis.speak(utterance);
}

// 시간대별 색상 변경
function updateTimeBasedTheme() {
    const hour = new Date().getHours();
    const root = document.documentElement;
    
    if (hour >= 5 && hour < 12) {
        // 아침 - 주황색 계열
        root.style.setProperty('--primary-color', '#f59e0b');
        root.style.setProperty('--primary-dark', '#d97706');
    } else if (hour >= 12 && hour < 18) {
        // 낮 - 노란색 계열
        root.style.setProperty('--primary-color', '#eab308');
        root.style.setProperty('--primary-dark', '#ca8a04');
    } else if (hour >= 18 && hour < 22) {
        // 저녁 - 보라색 계열
        root.style.setProperty('--primary-color', '#8b5cf6');
        root.style.setProperty('--primary-dark', '#7c3aed');
    } else {
        // 밤 - 어두운 파란색
        root.style.setProperty('--primary-color', '#3b82f6');
        root.style.setProperty('--primary-dark', '#2563eb');
    }
}

// 오프라인 모드 처리
function handleOfflineMode() {
    if (!navigator.onLine) {
        const recentMessages = JSON.parse(localStorage.getItem('recentMessages')) || [];
        if (recentMessages.length > 0) {
            messagesData = recentMessages;
            showToast('오프라인 모드: 최근 메시지를 표시합니다', 'info');
        }
    }
}

// 페이지 로드 시 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    updateTimeBasedTheme();
    handleOfflineMode();
    
    // 온라인/오프라인 상태 감지
    window.addEventListener('online', () => {
        showToast('인터넷 연결이 복구되었습니다', 'success');
        loadMessages();
    });
    
    window.addEventListener('offline', () => {
        showToast('오프라인 모드로 전환됩니다', 'warning');
        handleOfflineMode();
    });
});

// 서비스 워커 등록 (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('서비스 워커 등록 성공:', registration.scope);
            
            // 위젯 지원을 위한 메시지 리스너
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'GET_DAILY_MESSAGE') {
                    const randomMessage = messagesData[Math.floor(Math.random() * messagesData.length)];
                    event.ports[0].postMessage({
                        type: 'DAILY_MESSAGE',
                        message: randomMessage
                    });
                }
            });
        } catch (error) {
            console.error('서비스 워커 등록 실패:', error);
        }
    });
}