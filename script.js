// 전역 변수
let messagesData = [];
let currentMessage = null;
let messageCounter = 0;
let filteredMessages = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    darkMode: false,
    fontSize: 1.0,
    dailyNotification: false,
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
    favoriteBtn: document.getElementById('favoriteBtn'),
    shareBtn: document.getElementById('shareBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    dateDisplay: document.getElementById('dateDisplay'),
    messageCounterDisplay: document.getElementById('messageCounter'),
    categoryFilter: document.getElementById('categoryFilter'),
    timeFilter: document.getElementById('timeFilter'),
    favoritesSection: document.getElementById('favoritesSection'),
    favoritesList: document.getElementById('favoritesList'),
    shareModal: document.getElementById('shareModal'),
    modalClose: document.getElementById('modalClose'),
    sharePreview: document.getElementById('sharePreview'),
    copyBtn: document.getElementById('copyBtn'),
    twitterBtn: document.getElementById('twitterBtn'),
    facebookBtn: document.getElementById('facebookBtn'),
    settingsModal: document.getElementById('settingsModal'),
    settingsModalClose: document.getElementById('settingsModalClose'),
    darkModeToggle: document.getElementById('darkModeToggle'),
    fontSizeSlider: document.getElementById('fontSizeSlider'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    dailyNotification: document.getElementById('dailyNotification'),
    notificationTime: document.getElementById('notificationTime'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    resetDataBtn: document.getElementById('resetDataBtn'),
    totalMessages: document.getElementById('totalMessages'),
    totalFavorites: document.getElementById('totalFavorites'),
    notificationModal: document.getElementById('notificationModal'),
    notificationModalClose: document.getElementById('notificationModalClose'),
    enableNotificationsBtn: document.getElementById('enableNotificationsBtn'),
    skipNotificationsBtn: document.getElementById('skipNotificationsBtn')
};

// 애플리케이션 초기화
async function initApp() {
    try {
        await loadMessages();
        setupEventListeners();
        applySettings();
        displayCurrentTime();
        displayCurrentDate();
        setupFilters();
        displayRandomMessage();
        checkNotificationPermission();
        
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
        filteredMessages = [...messagesData];
        
        if (messagesData.length === 0) {
            throw new Error('메시지 데이터가 비어있습니다');
        }
    } catch (error) {
        console.error('메시지 데이터 로드 실패:', error);
        messagesData = [{
            id: 1,
            text: "새로운 아침이 시작됩니다. 오늘도 좋은 하루 되세요!",
            author: "모닝",
            category: "새로운 시작",
            timeOfDay: "morning"
        }];
        filteredMessages = [...messagesData];
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 기본 버튼들
    elements.newQuoteBtn.addEventListener('click', displayRandomMessage);
    elements.favoriteBtn.addEventListener('click', toggleFavorites);
    elements.shareBtn.addEventListener('click', openShareModal);
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    
    // 필터링
    elements.categoryFilter.addEventListener('change', applyFilters);
    elements.timeFilter.addEventListener('change', applyFilters);
    
    // 모달 관련
    elements.modalClose.addEventListener('click', closeShareModal);
    elements.settingsModalClose.addEventListener('click', closeSettingsModal);
    elements.notificationModalClose.addEventListener('click', closeNotificationModal);
    
    // 설정 관련
    elements.darkModeToggle.addEventListener('change', toggleDarkMode);
    elements.fontSizeSlider.addEventListener('input', updateFontSize);
    elements.dailyNotification.addEventListener('change', toggleDailyNotification);
    elements.notificationTime.addEventListener('change', updateNotificationTime);
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.resetDataBtn.addEventListener('click', resetSettings);
    
    // 알림 관련
    elements.enableNotificationsBtn.addEventListener('click', enableNotifications);
    elements.skipNotificationsBtn.addEventListener('click', closeNotificationModal);
    
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
        if (e.target === elements.notificationModal) closeNotificationModal();
    });
    
    // 터치 제스처 (스와이프)
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

// 필터 설정
function setupFilters() {
    // 카테고리 필터 옵션 추가
    const categories = [...new Set(messagesData.map(msg => msg.category))].sort();
    elements.categoryFilter.innerHTML = '<option value="">모든 카테고리</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        elements.categoryFilter.appendChild(option);
    });
}

// 필터 적용
function applyFilters() {
    const categoryFilter = elements.categoryFilter.value;
    const timeFilter = elements.timeFilter.value;
    
    filteredMessages = messagesData.filter(message => {
        const categoryMatch = !categoryFilter || message.category === categoryFilter;
        const timeMatch = !timeFilter || message.timeOfDay === timeFilter;
        return categoryMatch && timeMatch;
    });
    
    if (filteredMessages.length === 0) {
        filteredMessages = messagesData;
        showToast('조건에 맞는 메시지가 없어 전체 메시지를 표시합니다.', 'info');
    }
}

// 랜덤 메시지 표시
function displayRandomMessage() {
    showLoading();
    
    setTimeout(() => {
        let randomIndex;
        const availableMessages = filteredMessages.length > 0 ? filteredMessages : messagesData;
        
        do {
            randomIndex = Math.floor(Math.random() * availableMessages.length);
        } while (availableMessages.length > 1 && availableMessages[randomIndex] === currentMessage);
        
        currentMessage = availableMessages[randomIndex];
        messageCounter++;
        
        showMessage();
        updateMessageCounter();
        updateFavoriteButton();
        
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
    elements.messageCounterDisplay.textContent = messageCounter;
}

// 즐겨찾기 토글
function toggleFavorites() {
    if (elements.favoritesSection.style.display === 'none' || !elements.favoritesSection.style.display) {
        showFavorites();
    } else {
        hideFavorites();
    }
}

// 즐겨찾기 표시
function showFavorites() {
    elements.favoritesSection.style.display = 'block';
    renderFavorites();
    elements.favoriteBtn.querySelector('.btn-icon').textContent = '📝';
}

// 즐겨찾기 숨기기
function hideFavorites() {
    elements.favoritesSection.style.display = 'none';
    elements.favoriteBtn.querySelector('.btn-icon').textContent = '❤️';
}

// 즐겨찾기 렌더링
function renderFavorites() {
    elements.favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        elements.favoritesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">아직 즐겨찾기한 메시지가 없습니다.</p>';
        return;
    }
    
    favorites.forEach((fav, index) => {
        const favItem = document.createElement('div');
        favItem.className = 'favorite-item';
        favItem.innerHTML = `
            <div class="quote-text">${fav.text}</div>
            <div class="quote-author">— ${fav.author}</div>
            <button class="favorite-remove" onclick="removeFavorite(${index})">×</button>
        `;
        
        favItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('favorite-remove')) {
                currentMessage = fav;
                showMessage();
                hideFavorites();
            }
        });
        
        elements.favoritesList.appendChild(favItem);
    });
}

// 즐겨찾기 추가/제거
function toggleCurrentFavorite() {
    if (!currentMessage) return;
    
    const existingIndex = favorites.findIndex(fav => fav.id === currentMessage.id);
    
    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
        showToast('즐겨찾기에서 제거되었습니다.', 'info');
    } else {
        favorites.push(currentMessage);
        showToast('즐겨찾기에 추가되었습니다! ❤️', 'success');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButton();
    updateStats();
}

// 즐겨찾기 제거
function removeFavorite(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    updateFavoriteButton();
    updateStats();
    showToast('즐겨찾기에서 제거되었습니다.', 'info');
}

// 즐겨찾기 버튼 업데이트
function updateFavoriteButton() {
    if (!currentMessage) return;
    
    const isFavorite = favorites.some(fav => fav.id === currentMessage.id);
    const heartIcon = elements.favoriteBtn.querySelector('.btn-icon');
    
    if (elements.favoritesSection.style.display === 'block') {
        heartIcon.textContent = '📝';
    } else {
        heartIcon.textContent = isFavorite ? '💖' : '❤️';
    }
}

// 더블클릭으로 즐겨찾기 추가
elements.quoteContent.addEventListener('dblclick', toggleCurrentFavorite);

// 설정 적용
function applySettings() {
    // 다크모드
    elements.darkModeToggle.checked = settings.darkMode;
    if (settings.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // 폰트 크기
    elements.fontSizeSlider.value = settings.fontSize;
    updateFontSize();
    
    // 알림 설정
    elements.dailyNotification.checked = settings.dailyNotification;
    elements.notificationTime.value = settings.notificationTime;
    
    updateStats();
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

// 폰트 크기 업데이트
function updateFontSize() {
    const fontSize = elements.fontSizeSlider.value;
    settings.fontSize = parseFloat(fontSize);
    
    document.documentElement.style.fontSize = `${fontSize}rem`;
    elements.fontSizeValue.textContent = `${Math.round(fontSize * 100)}%`;
    
    saveSettings();
}

// 일일 알림 토글
function toggleDailyNotification() {
    settings.dailyNotification = elements.dailyNotification.checked;
    
    if (settings.dailyNotification) {
        scheduleNotification();
    } else {
        cancelNotification();
    }
    
    saveSettings();
}

// 알림 시간 업데이트
function updateNotificationTime() {
    settings.notificationTime = elements.notificationTime.value;
    
    if (settings.dailyNotification) {
        scheduleNotification();
    }
    
    saveSettings();
}

// 설정 저장
function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

// 데이터 내보내기
function exportData() {
    const data = {
        favorites: favorites,
        settings: settings,
        stats: {
            totalViewed: messageCounter,
            exportDate: new Date().toISOString()
        }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `모닝앱_데이터_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('데이터가 내보내기되었습니다! 📁', 'success');
}

// 설정 초기화
function resetSettings() {
    if (confirm('모든 설정과 즐겨찾기를 초기화하시겠습니까?')) {
        localStorage.removeItem('settings');
        localStorage.removeItem('favorites');
        
        settings = {
            darkMode: false,
            fontSize: 1.0,
            dailyNotification: false,
            notificationTime: '08:00'
        };
        favorites = [];
        
        applySettings();
        updateStats();
        showToast('설정이 초기화되었습니다.', 'info');
    }
}

// 통계 업데이트
function updateStats() {
    elements.totalMessages.textContent = messagesData.length;
    elements.totalFavorites.textContent = favorites.length;
}

// 알림 권한 확인
function checkNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            elements.notificationModal.style.display = 'block';
        }, 3000);
    }
}

// 알림 활성화
async function enableNotifications() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            settings.dailyNotification = true;
            elements.dailyNotification.checked = true;
            scheduleNotification();
            saveSettings();
            showToast('알림이 활성화되었습니다! 🔔', 'success');
        } else {
            showToast('알림 권한이 거부되었습니다.', 'error');
        }
    }
    
    closeNotificationModal();
}

// 알림 스케줄링
function scheduleNotification() {
    // 서비스 워커를 통한 알림 스케줄링 (실제 구현 시)
    console.log('알림 예약:', settings.notificationTime);
}

// 알림 취소
function cancelNotification() {
    console.log('알림 취소');
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
    updateStats();
}

function closeSettingsModal() {
    elements.settingsModal.style.display = 'none';
}

function closeNotificationModal() {
    elements.notificationModal.style.display = 'none';
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
        elements.settingsModal.style.display === 'block' ||
        elements.notificationModal.style.display === 'block') {
        if (e.key === 'Escape') {
            closeShareModal();
            closeSettingsModal();
            closeNotificationModal();
        }
        return;
    }
    
    switch (e.key) {
        case ' ':
        case 'Enter':
            e.preventDefault();
            displayRandomMessage();
            break;
        case 'f':
        case 'F':
            if (!e.ctrlKey && !e.metaKey) {
                toggleCurrentFavorite();
            }
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