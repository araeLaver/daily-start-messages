// 전역 변수
let messagesData = [];
let currentMessage = null;
let messageCounter = 0;
let isWidgetMode = new URLSearchParams(window.location.search).has('widget');
let settings = JSON.parse(localStorage.getItem('settings')) || {
    darkMode: false,
    notifications: false,
    notificationTime: '08:00',
    selectedCategory: 'all',
    userName: '',
    theme: 'default',
    displayMode: 'card'
};
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let messageHistory = JSON.parse(localStorage.getItem('messageHistory')) || [];

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
    favoritesBtn: document.getElementById('favoritesBtn'),
    historyBtn: document.getElementById('historyBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    dateDisplay: document.getElementById('dateDisplay'),
    messageCounter: document.getElementById('messageCounter'),
    shareModal: document.getElementById('shareModal'),
    modalClose: document.getElementById('modalClose'),
    sharePreview: document.getElementById('sharePreview'),
    copyBtn: document.getElementById('copyBtn'),
    kakaoBtn: document.getElementById('kakaoBtn'),
    twitterBtn: document.getElementById('twitterBtn'),
    facebookBtn: document.getElementById('facebookBtn'),
    webShareBtn: document.getElementById('webShareBtn'),
    settingsModal: document.getElementById('settingsModal'),
    settingsModalClose: document.getElementById('settingsModalClose'),
    darkModeToggle: document.getElementById('darkModeToggle'),
    notificationToggle: document.getElementById('notificationToggle'),
    notificationTime: document.getElementById('notificationTime'),
    notificationTimeRow: document.getElementById('notificationTimeRow'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    favoritesModal: document.getElementById('favoritesModal'),
    favoritesModalClose: document.getElementById('favoritesModalClose'),
    favoritesEmpty: document.getElementById('favoritesEmpty'),
    favoritesList: document.getElementById('favoritesList'),
    historyModal: document.getElementById('historyModal'),
    historyModalClose: document.getElementById('historyModalClose'),
    historyEmpty: document.getElementById('historyEmpty'),
    historyList: document.getElementById('historyList'),
    historyCount: document.getElementById('historyCount'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    categoryFilter: document.getElementById('categoryFilter'),
    userNameInput: document.getElementById('userNameInput'),
    themeSelect: document.getElementById('themeSelect'),
    displayModeSelect: document.getElementById('displayModeSelect')
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
        initializeKakao();
        checkWebShareSupport();
        
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
    elements.favoritesBtn.addEventListener('click', openFavoritesModal);
    elements.historyBtn.addEventListener('click', openHistoryModal);
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    
    // 즐겨찾기 관련
    elements.favoriteBtn.addEventListener('click', toggleFavorite);
    
    // 모달 관련
    elements.modalClose.addEventListener('click', closeShareModal);
    elements.settingsModalClose.addEventListener('click', closeSettingsModal);
    elements.favoritesModalClose.addEventListener('click', closeFavoritesModal);
    elements.historyModalClose.addEventListener('click', closeHistoryModal);
    
    // 히스토리 관련
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    
    // 카테고리 필터
    elements.categoryFilter.addEventListener('change', handleCategoryChange);
    
    // 개인화 설정
    elements.userNameInput.addEventListener('input', updateUserName);
    elements.themeSelect.addEventListener('change', changeTheme);
    elements.displayModeSelect.addEventListener('change', changeDisplayMode);
    
    // 설정 관련
    elements.darkModeToggle.addEventListener('change', toggleDarkMode);
    elements.notificationToggle.addEventListener('change', toggleNotifications);
    elements.notificationTime.addEventListener('change', updateNotificationTime);
    
    // 공유 버튼들
    elements.copyBtn.addEventListener('click', copyToClipboard);
    elements.kakaoBtn.addEventListener('click', shareToKakao);
    elements.twitterBtn.addEventListener('click', shareToTwitter);
    elements.facebookBtn.addEventListener('click', shareToFacebook);
    elements.webShareBtn.addEventListener('click', shareWithWebAPI);
    
    // 키보드 단축키
    document.addEventListener('keydown', handleKeyboard);
    
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
        if (e.target === elements.shareModal) closeShareModal();
        if (e.target === elements.settingsModal) closeSettingsModal();
        if (e.target === elements.favoritesModal) closeFavoritesModal();
        if (e.target === elements.historyModal) closeHistoryModal();
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
    
    // 사용자 이름이 있으면 개인화된 인사말
    if (settings.userName) {
        greeting += `, ${settings.userName}님`;
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
        const filteredMessages = getFilteredMessages();
        
        if (filteredMessages.length === 0) {
            showError('선택한 카테고리에 메시지가 없습니다.');
            return;
        }
        
        let randomIndex;
        
        do {
            randomIndex = Math.floor(Math.random() * filteredMessages.length);
        } while (filteredMessages.length > 1 && filteredMessages[randomIndex] === currentMessage);
        
        currentMessage = filteredMessages[randomIndex];
        messageCounter++;
        
        showMessage();
        updateMessageCounter();
        saveCurrentMessage();
        addToHistory();
        
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
    
    // 즐겨찾기 상태 업데이트
    updateFavoriteButton();
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
    
    // 카테고리 필터
    elements.categoryFilter.value = settings.selectedCategory;
    
    // 개인화 설정
    elements.userNameInput.value = settings.userName;
    elements.themeSelect.value = settings.theme;
    elements.displayModeSelect.value = settings.displayMode;
    
    // 테마 및 표시 방식 적용
    applyTheme();
    applyDisplayMode();
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

// 즐겨찾기 관련 함수들
function toggleFavorite() {
    if (!currentMessage) return;
    
    const messageId = currentMessage.id;
    const favoriteIndex = favorites.findIndex(fav => fav.id === messageId);
    
    if (favoriteIndex === -1) {
        // 즐겨찾기 추가
        favorites.push({
            ...currentMessage,
            addedAt: new Date().toISOString()
        });
        showToast('즐겨찾기에 추가되었습니다! ⭐', 'success');
        
        // 하트 애니메이션
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    } else {
        // 즐겨찾기 제거
        favorites.splice(favoriteIndex, 1);
        showToast('즐겨찾기에서 제거되었습니다', 'info');
    }
    
    saveFavorites();
    updateFavoriteButton();
}

function updateFavoriteButton() {
    if (!currentMessage) return;
    
    const isFavorite = favorites.some(fav => fav.id === currentMessage.id);
    const icon = elements.favoriteBtn.querySelector('.favorite-icon');
    
    if (isFavorite) {
        icon.textContent = '❤️';
        elements.favoriteBtn.setAttribute('aria-label', '즐겨찾기에서 제거');
    } else {
        icon.textContent = '🤍';
        elements.favoriteBtn.setAttribute('aria-label', '즐겨찾기에 추가');
    }
}

function openFavoritesModal() {
    displayFavorites();
    elements.favoritesModal.style.display = 'block';
}

function closeFavoritesModal() {
    elements.favoritesModal.style.display = 'none';
}

function displayFavorites() {
    if (favorites.length === 0) {
        elements.favoritesEmpty.style.display = 'block';
        elements.favoritesList.style.display = 'none';
        return;
    }
    
    elements.favoritesEmpty.style.display = 'none';
    elements.favoritesList.style.display = 'block';
    
    // 최근 추가된 순으로 정렬
    const sortedFavorites = [...favorites].sort((a, b) => 
        new Date(b.addedAt) - new Date(a.addedAt)
    );
    
    elements.favoritesList.innerHTML = sortedFavorites.map(message => `
        <div class="favorite-item" data-id="${message.id}">
            <div class="favorite-content">
                <blockquote class="favorite-text">"${message.text}"</blockquote>
                <cite class="favorite-author">— ${message.author}</cite>
                <div class="favorite-meta">
                    <span class="favorite-category">${message.category}</span>
                    <span class="favorite-date">${formatDate(message.addedAt)}</span>
                </div>
            </div>
            <div class="favorite-actions">
                <button class="favorite-action-btn" onclick="loadFavoriteMessage(${message.id})" aria-label="이 메시지 보기">
                    📖
                </button>
                <button class="favorite-action-btn" onclick="removeFavorite(${message.id})" aria-label="즐겨찾기에서 제거">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function loadFavoriteMessage(messageId) {
    const favorite = favorites.find(fav => fav.id === messageId);
    if (favorite) {
        currentMessage = favorite;
        showMessage();
        updateMessageCounter();
        closeFavoritesModal();
        showToast('즐겨찾기 메시지를 불러왔습니다! 📖', 'success');
    }
}

function removeFavorite(messageId) {
    const index = favorites.findIndex(fav => fav.id === messageId);
    if (index !== -1) {
        favorites.splice(index, 1);
        saveFavorites();
        displayFavorites();
        updateFavoriteButton();
        showToast('즐겨찾기에서 제거되었습니다', 'info');
    }
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays - 1}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
    });
}

// 히스토리 관련 함수들
function addToHistory() {
    if (!currentMessage) return;
    
    // 중복 제거 (같은 메시지가 이미 있으면 제거 후 최신으로 추가)
    const existingIndex = messageHistory.findIndex(item => item.id === currentMessage.id);
    if (existingIndex !== -1) {
        messageHistory.splice(existingIndex, 1);
    }
    
    // 새 히스토리 아이템 추가
    messageHistory.unshift({
        ...currentMessage,
        viewedAt: new Date().toISOString(),
        sessionId: Date.now() // 같은 세션에서 본 메시지들을 구분
    });
    
    // 최대 50개까지만 저장
    if (messageHistory.length > 50) {
        messageHistory = messageHistory.slice(0, 50);
    }
    
    saveHistory();
}

function openHistoryModal() {
    displayHistory();
    elements.historyModal.style.display = 'block';
}

function closeHistoryModal() {
    elements.historyModal.style.display = 'none';
}

function displayHistory() {
    const historyCount = messageHistory.length;
    elements.historyCount.textContent = historyCount;
    
    if (historyCount === 0) {
        elements.historyEmpty.style.display = 'block';
        elements.historyList.style.display = 'none';
        return;
    }
    
    elements.historyEmpty.style.display = 'none';
    elements.historyList.style.display = 'block';
    
    // 날짜별로 그룹화
    const groupedHistory = groupHistoryByDate(messageHistory);
    
    elements.historyList.innerHTML = Object.entries(groupedHistory).map(([date, messages]) => `
        <div class="history-group">
            <div class="history-date-header">${date}</div>
            <div class="history-group-items">
                ${messages.map(message => `
                    <div class="history-item" data-id="${message.id}">
                        <div class="history-content">
                            <div class="history-text">"${message.text}"</div>
                            <div class="history-meta">
                                <span class="history-author">${message.author}</span>
                                <span class="history-category">${message.category}</span>
                                <span class="history-time">${formatTime(message.viewedAt)}</span>
                            </div>
                        </div>
                        <div class="history-actions">
                            <button class="history-action-btn" onclick="loadHistoryMessage(${message.id})" aria-label="이 메시지 다시 보기">
                                📖
                            </button>
                            <button class="history-action-btn" onclick="addHistoryToFavorites(${message.id})" aria-label="즐겨찾기에 추가">
                                ⭐
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function groupHistoryByDate(history) {
    const groups = {};
    
    history.forEach(item => {
        const date = new Date(item.viewedAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let dateKey;
        if (date.toDateString() === today.toDateString()) {
            dateKey = '오늘';
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateKey = '어제';
        } else {
            dateKey = date.toLocaleDateString('ko-KR', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'short'
            });
        }
        
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(item);
    });
    
    return groups;
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
}

function loadHistoryMessage(messageId) {
    const historyItem = messageHistory.find(item => item.id === messageId);
    if (historyItem) {
        currentMessage = {
            id: historyItem.id,
            text: historyItem.text,
            author: historyItem.author,
            category: historyItem.category
        };
        showMessage();
        updateMessageCounter();
        closeHistoryModal();
        showToast('히스토리 메시지를 불러왔습니다! 📚', 'success');
    }
}

function addHistoryToFavorites(messageId) {
    const historyItem = messageHistory.find(item => item.id === messageId);
    if (historyItem) {
        const favoriteExists = favorites.some(fav => fav.id === messageId);
        
        if (!favoriteExists) {
            favorites.push({
                id: historyItem.id,
                text: historyItem.text,
                author: historyItem.author,
                category: historyItem.category,
                addedAt: new Date().toISOString()
            });
            saveFavorites();
            showToast('즐겨찾기에 추가되었습니다! ⭐', 'success');
        } else {
            showToast('이미 즐겨찾기에 있는 메시지입니다', 'info');
        }
    }
}

function clearHistory() {
    if (messageHistory.length === 0) {
        showToast('삭제할 히스토리가 없습니다', 'info');
        return;
    }
    
    if (confirm('모든 히스토리를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        messageHistory = [];
        saveHistory();
        displayHistory();
        showToast('히스토리가 삭제되었습니다', 'success');
    }
}

function saveHistory() {
    localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
}

// 카테고리 필터 관련 함수들
function getFilteredMessages() {
    const selectedCategory = settings.selectedCategory;
    
    if (selectedCategory === 'all') {
        return messagesData;
    }
    
    return messagesData.filter(message => message.category === selectedCategory);
}

function handleCategoryChange() {
    settings.selectedCategory = elements.categoryFilter.value;
    saveSettings();
    
    // 카테고리 변경 시 새 메시지 표시
    displayRandomMessage();
    
    const categoryName = elements.categoryFilter.options[elements.categoryFilter.selectedIndex].text;
    showToast(`${categoryName} 메시지로 변경되었습니다! 🎯`, 'success');
}

// 개인화 기능들
function updateUserName() {
    settings.userName = elements.userNameInput.value.trim();
    saveSettings();
    
    // 인사말 업데이트
    displayCurrentTime();
    
    if (settings.userName) {
        showToast(`안녕하세요, ${settings.userName}님! 👋`, 'success');
    }
}

function changeTheme() {
    settings.theme = elements.themeSelect.value;
    saveSettings();
    applyTheme();
    
    const themeName = elements.themeSelect.options[elements.themeSelect.selectedIndex].text;
    showToast(`${themeName} 테마가 적용되었습니다! 🎨`, 'success');
}

function changeDisplayMode() {
    settings.displayMode = elements.displayModeSelect.value;
    saveSettings();
    applyDisplayMode();
    
    const modeName = elements.displayModeSelect.options[elements.displayModeSelect.selectedIndex].text;
    showToast(`${modeName}로 변경되었습니다! 📱`, 'success');
}

function applyTheme() {
    const root = document.documentElement;
    
    // 기존 테마 클래스 제거
    document.body.classList.remove('theme-spring', 'theme-summer', 'theme-autumn', 'theme-winter');
    
    switch (settings.theme) {
        case 'spring':
            document.body.classList.add('theme-spring');
            root.style.setProperty('--primary-color', '#ec4899');
            root.style.setProperty('--primary-dark', '#db2777');
            root.style.setProperty('--background', '#fdf2f8');
            break;
        case 'summer':
            document.body.classList.add('theme-summer');
            root.style.setProperty('--primary-color', '#06b6d4');
            root.style.setProperty('--primary-dark', '#0891b2');
            root.style.setProperty('--background', '#f0f9ff');
            break;
        case 'autumn':
            document.body.classList.add('theme-autumn');
            root.style.setProperty('--primary-color', '#ea580c');
            root.style.setProperty('--primary-dark', '#c2410c');
            root.style.setProperty('--background', '#fff7ed');
            break;
        case 'winter':
            document.body.classList.add('theme-winter');
            root.style.setProperty('--primary-color', '#7c3aed');
            root.style.setProperty('--primary-dark', '#6d28d9');
            root.style.setProperty('--background', '#f8fafc');
            break;
        default:
            root.style.setProperty('--primary-color', '#f59e0b');
            root.style.setProperty('--primary-dark', '#d97706');
            root.style.setProperty('--background', '#fef3c7');
    }
}

function applyDisplayMode() {
    const quoteCard = document.querySelector('.quote-card');
    
    // 기존 표시 모드 클래스 제거
    quoteCard.classList.remove('display-minimal', 'display-typewriter');
    
    switch (settings.displayMode) {
        case 'minimal':
            quoteCard.classList.add('display-minimal');
            break;
        case 'typewriter':
            quoteCard.classList.add('display-typewriter');
            break;
        case 'card':
        default:
            // 기본 카드형은 추가 클래스 없음
            break;
    }
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

// 카카오 SDK 초기화
function initializeKakao() {
    if (typeof Kakao !== 'undefined' && Kakao.isInitialized() === false) {
        // 카카오 앱 키는 실제 서비스에서는 환경변수로 관리
        Kakao.init('your_kakao_app_key_here'); // 실제 키로 교체 필요
    }
}

// 카카오톡 공유
function shareToKakao() {
    if (!currentMessage) return;
    
    if (typeof Kakao === 'undefined') {
        showToast('카카오톡 공유 기능을 로드하는 중입니다...', 'info');
        return;
    }
    
    try {
        Kakao.Share.sendDefault({
            objectType: 'text',
            text: `"${currentMessage.text}"\n\n— ${currentMessage.author}`,
            link: {
                webUrl: window.location.href,
                mobileWebUrl: window.location.href
            },
            buttons: [
                {
                    title: '모닝 앱에서 더 보기',
                    link: {
                        webUrl: window.location.href,
                        mobileWebUrl: window.location.href
                    }
                }
            ]
        });
        
        closeShareModal();
        showToast('카카오톡으로 공유했습니다! 💬', 'success');
    } catch (error) {
        console.error('카카오톡 공유 실패:', error);
        // 카카오톡이 설치되지 않은 경우 웹 공유 API 사용
        shareWithWebAPI();
    }
}

// 웹 공유 API 지원 확인
function checkWebShareSupport() {
    if (navigator.share) {
        elements.webShareBtn.style.display = 'block';
    }
}

// 네이티브 웹 공유 API
async function shareWithWebAPI() {
    if (!currentMessage) return;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: '모닝 - 아침 메시지',
                text: `"${currentMessage.text}" — ${currentMessage.author}`,
                url: window.location.href
            });
            
            closeShareModal();
            showToast('공유가 완료되었습니다! 📱', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('웹 공유 실패:', error);
                showToast('공유에 실패했습니다', 'error');
            }
        }
    } else {
        showToast('이 기기에서는 네이티브 공유를 지원하지 않습니다', 'warning');
    }
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