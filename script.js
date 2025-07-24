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
    displayMode: 'card',
    seasonalMessages: true,
    specialDayMessages: true,
    eventMessages: true
};
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let messageHistory = JSON.parse(localStorage.getItem('messageHistory')) || [];
let messageStats = JSON.parse(localStorage.getItem('messageStats')) || {};
let userReactions = JSON.parse(localStorage.getItem('userReactions')) || {};
let dailyJournal = JSON.parse(localStorage.getItem('dailyJournal')) || {};
let habitTracker = JSON.parse(localStorage.getItem('habitTracker')) || {};
let userGoals = JSON.parse(localStorage.getItem('userGoals')) || [];
let userMessages = JSON.parse(localStorage.getItem('userMessages')) || [];
let communityMessages = JSON.parse(localStorage.getItem('communityMessages')) || [];

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
    seasonalToggle: document.getElementById('seasonalToggle'),
    specialDayToggle: document.getElementById('specialDayToggle'),
    eventToggle: document.getElementById('eventToggle'),
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
    displayModeSelect: document.getElementById('displayModeSelect'),
    // 소셜 기능 관련
    popularBtn: document.getElementById('popularBtn'),
    inviteBtn: document.getElementById('inviteBtn'),
    popularModal: document.getElementById('popularModal'),
    popularModalClose: document.getElementById('popularModalClose'),
    popularEmpty: document.getElementById('popularEmpty'),
    popularList: document.getElementById('popularList'),
    inviteModal: document.getElementById('inviteModal'),
    inviteModalClose: document.getElementById('inviteModalClose'),
    inviteText: document.getElementById('inviteText'),
    copyInviteBtn: document.getElementById('copyInviteBtn'),
    shareInviteBtn: document.getElementById('shareInviteBtn'),
    // 반응 버튼들
    likeBtn: document.getElementById('likeBtn'),
    heartBtn: document.getElementById('heartBtn'),
    fireBtn: document.getElementById('fireBtn'),
    likeCount: document.getElementById('likeCount'),
    heartCount: document.getElementById('heartCount'),
    fireCount: document.getElementById('fireCount'),
    // 생산성 도구 관련
    journalBtn: document.getElementById('journalBtn'),
    habitTrackerBtn: document.getElementById('habitTrackerBtn'),
    streakNumber: document.getElementById('streakNumber'),
    journalModal: document.getElementById('journalModal'),
    journalModalClose: document.getElementById('journalModalClose'),
    habitModal: document.getElementById('habitModal'),
    habitModalClose: document.getElementById('habitModalClose'),
    inspirationQuote: document.getElementById('inspirationQuote'),
    journalDate: document.getElementById('journalDate'),
    journalText: document.getElementById('journalText'),
    charCount: document.getElementById('charCount'),
    saveJournalBtn: document.getElementById('saveJournalBtn'),
    cancelJournalBtn: document.getElementById('cancelJournalBtn'),
    journalList: document.getElementById('journalList'),
    currentStreak: document.getElementById('currentStreak'),
    totalDays: document.getElementById('totalDays'),
    journalCount: document.getElementById('journalCount'),
    calendarGrid: document.getElementById('calendarGrid'),
    // 목표 설정 관련
    goalsBtn: document.getElementById('goalsBtn'),
    goalsModal: document.getElementById('goalsModal'),
    goalsModalClose: document.getElementById('goalsModalClose'),
    weeklyGoalText: document.getElementById('weeklyGoalText'),
    weeklyGoalCategory: document.getElementById('weeklyGoalCategory'),
    addWeeklyGoalBtn: document.getElementById('addWeeklyGoalBtn'),
    weeklyGoalsList: document.getElementById('weeklyGoalsList'),
    monthlyGoalText: document.getElementById('monthlyGoalText'),
    monthlyGoalCategory: document.getElementById('monthlyGoalCategory'),
    addMonthlyGoalBtn: document.getElementById('addMonthlyGoalBtn'),
    monthlyGoalsList: document.getElementById('monthlyGoalsList'),
    weeklyProgress: document.getElementById('weeklyProgress'),
    monthlyProgress: document.getElementById('monthlyProgress'),
    completedGoals: document.getElementById('completedGoals'),
    achievementsList: document.getElementById('achievementsList'),
    motivationText: document.getElementById('motivationText'),
    // 사용자 제출 관련
    submitBtn: document.getElementById('submitBtn'),
    submitModal: document.getElementById('submitModal'),
    submitModalClose: document.getElementById('submitModalClose'),
    messageText: document.getElementById('messageText'),
    messageAuthor: document.getElementById('messageAuthor'),
    messageCategory: document.getElementById('messageCategory'),
    messageTimeOfDay: document.getElementById('messageTimeOfDay'),
    messageSeason: document.getElementById('messageSeason'),
    messageCharCount: document.getElementById('messageCharCount'),
    previewMessageBtn: document.getElementById('previewMessageBtn'),
    submitMessageBtn: document.getElementById('submitMessageBtn'),
    myMessagesCount: document.getElementById('myMessagesCount'),
    myMessagesEmpty: document.getElementById('myMessagesEmpty'),
    myMessagesList: document.getElementById('myMessagesList'),
    communityCount: document.getElementById('communityCount'),
    communityEmpty: document.getElementById('communityEmpty'),
    communityList: document.getElementById('communityList'),
    communityFilter: document.getElementById('communityFilter'),
    previewModal: document.getElementById('previewModal'),
    previewModalClose: document.getElementById('previewModalClose'),
    previewText: document.getElementById('previewText'),
    previewAuthor: document.getElementById('previewAuthor'),
    previewCategory: document.getElementById('previewCategory'),
    previewTimeOfDay: document.getElementById('previewTimeOfDay'),
    previewSeason: document.getElementById('previewSeason'),
    editMessageBtn: document.getElementById('editMessageBtn'),
    confirmSubmitBtn: document.getElementById('confirmSubmitBtn')
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
        
        // 메시지 데이터가 로드된 후 첫 메시지 표시
        if (messagesData.length > 0 || currentMessage) {
            displayRandomMessage();
        } else {
            // 메시지 로드 실패 시 기본 메시지 직접 표시
            currentMessage = {
                id: 0,
                text: "새로운 하루가 시작됩니다. 오늘도 좋은 하루 되세요! ✨",
                author: "모닝",
                category: "새로운 시작"
            };
            showMessage();
        }
        
        setupNotifications();
        initializeKakao();
        checkWebShareSupport();
        initializeHabitTracker();
        updateStreakDisplay();
        initializeGoals();
        initializeUserSubmissions();
        
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
    elements.popularBtn.addEventListener('click', openPopularModal);
    elements.inviteBtn.addEventListener('click', openInviteModal);
    elements.journalBtn.addEventListener('click', openJournalModal);
    elements.habitTrackerBtn.addEventListener('click', openHabitModal);
    elements.goalsBtn.addEventListener('click', openGoalsModal);
    elements.submitBtn.addEventListener('click', openSubmitModal);
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    
    // 즐겨찾기 관련
    elements.favoriteBtn.addEventListener('click', toggleFavorite);
    
    // 모달 관련
    elements.modalClose.addEventListener('click', closeShareModal);
    elements.settingsModalClose.addEventListener('click', closeSettingsModal);
    elements.favoritesModalClose.addEventListener('click', closeFavoritesModal);
    elements.historyModalClose.addEventListener('click', closeHistoryModal);
    elements.popularModalClose.addEventListener('click', closePopularModal);
    elements.inviteModalClose.addEventListener('click', closeInviteModal);
    elements.journalModalClose.addEventListener('click', closeJournalModal);
    elements.habitModalClose.addEventListener('click', closeHabitModal);
    elements.goalsModalClose.addEventListener('click', closeGoalsModal);
    elements.submitModalClose.addEventListener('click', closeSubmitModal);
    elements.previewModalClose.addEventListener('click', closePreviewModal);
    
    // 히스토리 관련
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    
    // 카테고리 필터
    elements.categoryFilter.addEventListener('change', handleCategoryChange);
    
    // 개인화 설정
    elements.userNameInput.addEventListener('input', updateUserName);
    elements.themeSelect.addEventListener('change', changeTheme);
    elements.displayModeSelect.addEventListener('change', changeDisplayMode);
    
    // 소셜 기능
    elements.likeBtn.addEventListener('click', () => handleReaction('like'));
    elements.heartBtn.addEventListener('click', () => handleReaction('heart'));
    elements.fireBtn.addEventListener('click', () => handleReaction('fire'));
    elements.copyInviteBtn.addEventListener('click', copyInviteMessage);
    elements.shareInviteBtn.addEventListener('click', shareInviteMessage);
    
    // 생산성 도구
    elements.saveJournalBtn.addEventListener('click', saveJournal);
    elements.cancelJournalBtn.addEventListener('click', closeJournalModal);
    elements.journalText.addEventListener('input', updateCharCount);
    elements.addWeeklyGoalBtn.addEventListener('click', addWeeklyGoal);
    elements.addMonthlyGoalBtn.addEventListener('click', addMonthlyGoal);
    
    // 사용자 제출 관련
    elements.messageText.addEventListener('input', updateMessageCharCount);
    elements.previewMessageBtn.addEventListener('click', previewMessage);
    elements.submitMessageBtn.addEventListener('click', submitMessage);
    elements.editMessageBtn.addEventListener('click', editMessage);
    elements.confirmSubmitBtn.addEventListener('click', confirmSubmitMessage);
    elements.communityFilter.addEventListener('change', filterCommunityMessages);
    
    // 기분 선택 버튼들
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', (e) => selectMood(e.target.dataset.mood));
    });
    
    // 설정 관련
    elements.darkModeToggle.addEventListener('change', toggleDarkMode);
    elements.notificationToggle.addEventListener('change', toggleNotifications);
    elements.notificationTime.addEventListener('change', updateNotificationTime);
    elements.seasonalToggle.addEventListener('change', toggleSeasonalMessages);
    elements.specialDayToggle.addEventListener('change', toggleSpecialDayMessages);
    elements.eventToggle.addEventListener('change', toggleEventMessages);
    
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
        if (e.target === elements.popularModal) closePopularModal();
        if (e.target === elements.inviteModal) closeInviteModal();
        if (e.target === elements.journalModal) closeJournalModal();
        if (e.target === elements.habitModal) closeHabitModal();
        if (e.target === elements.goalsModal) closeGoalsModal();
        if (e.target === elements.submitModal) closeSubmitModal();
        if (e.target === elements.previewModal) closePreviewModal();
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
        let filteredMessages = getFilteredMessages();
        
        // 필터링된 메시지가 없으면 전체 메시지에서 선택
        if (filteredMessages.length === 0) {
            console.log('필터링된 메시지가 없음, 전체 메시지에서 선택');
            filteredMessages = messagesData;
        }
        
        // 전체 메시지도 없으면 기본 메시지 사용
        if (filteredMessages.length === 0) {
            console.log('메시지 데이터가 없음, 기본 메시지 사용');
            currentMessage = {
                id: 0,
                text: "새로운 하루가 시작됩니다. 오늘도 좋은 하루 되세요! ✨",
                author: "모닝",
                category: "새로운 시작"
            };
        } else {
            let randomIndex;
            
            do {
                randomIndex = Math.floor(Math.random() * filteredMessages.length);
            } while (filteredMessages.length > 1 && filteredMessages[randomIndex] === currentMessage);
            
            currentMessage = filteredMessages[randomIndex];
        }
        
        messageCounter++;
        
        showMessage();
        updateMessageCounter();
        saveCurrentMessage();
        addToHistory();
        updateHabitTracker('message');
        
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
    
    // 반응 상태 업데이트
    updateReactionCounts();
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
    
    // 계절별 메시지 설정
    elements.seasonalToggle.checked = settings.seasonalMessages;
    elements.specialDayToggle.checked = settings.specialDayMessages;
    elements.eventToggle.checked = settings.eventMessages;
    
    // 테마 및 표시 방식 적용
    applyTheme();
    applyDisplayMode();
    
    // 계절 표시기 업데이트
    updateSeasonalDisplay();
    
    // 이벤트 표시기 업데이트
    updateEventDisplay();
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

// 계절별 메시지 토글
function toggleSeasonalMessages() {
    settings.seasonalMessages = elements.seasonalToggle.checked;
    saveSettings();
    
    const seasonInfo = getSeasonInfo();
    const message = settings.seasonalMessages ? 
        `${seasonInfo.icon} 계절별 메시지가 활성화되었습니다!` :
        '계절별 메시지가 비활성화되었습니다';
    
    showToast(message, 'success');
}

// 특별한 날 메시지 토글
function toggleSpecialDayMessages() {
    settings.specialDayMessages = elements.specialDayToggle.checked;
    saveSettings();
    
    const message = settings.specialDayMessages ? 
        '🎊 특별한 날 메시지가 활성화되었습니다!' :
        '특별한 날 메시지가 비활성화되었습니다';
        
    showToast(message, 'success');
}

// 이벤트 메시지 토글
function toggleEventMessages() {
    settings.eventMessages = elements.eventToggle.checked;
    saveSettings();
    
    const message = settings.eventMessages ? 
        '📅 이벤트 메시지가 활성화되었습니다!' :
        '이벤트 메시지가 비활성화되었습니다';
        
    showToast(message, 'success');
    
    // 이벤트 표시기 업데이트
    updateEventDisplay();
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
    let filtered = messagesData;
    
    // 카테고리 필터링
    const selectedCategory = settings.selectedCategory;
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(message => message.category === selectedCategory);
    }
    
    // 계절별 메시지 우선 표시
    if (settings.seasonalMessages) {
        const currentSeason = getCurrentSeason();
        const seasonalMessages = filtered.filter(message => 
            message.season === currentSeason || message.season === 'all'
        );
        
        // 계절별 메시지가 있으면 70% 확률로 계절 메시지 우선
        if (seasonalMessages.length > 0 && Math.random() < 0.7) {
            filtered = seasonalMessages;
        }
    }
    
    // 특별한 날 메시지 최우선 표시
    if (settings.specialDayMessages) {
        const specialDayMessages = getSpecialDayMessages(filtered);
        if (specialDayMessages.length > 0) {
            return specialDayMessages; // 특별한 날 메시지가 있으면 무조건 우선
        }
    }
    
    // 이벤트 메시지 우선 표시
    if (settings.eventMessages) {
        const eventMessages = getEventMessages(filtered);
        if (eventMessages.length > 0 && Math.random() < 0.6) {
            return eventMessages; // 60% 확률로 이벤트 메시지 우선
        }
    }
    
    return filtered;
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

// 소셜 기능들
function handleReaction(reactionType) {
    if (!currentMessage) return;
    
    const messageId = currentMessage.id;
    
    // 메시지 통계 초기화
    if (!messageStats[messageId]) {
        messageStats[messageId] = {
            like: 0,
            heart: 0,
            fire: 0,
            shares: 0
        };
    }
    
    // 사용자 반응 초기화
    if (!userReactions[messageId]) {
        userReactions[messageId] = {};
    }
    
    // 이미 같은 반응을 했는지 확인
    if (userReactions[messageId][reactionType]) {
        // 반응 제거
        messageStats[messageId][reactionType]--;
        delete userReactions[messageId][reactionType];
        showToast('반응이 취소되었습니다', 'info');
    } else {
        // 새 반응 추가
        messageStats[messageId][reactionType]++;
        userReactions[messageId][reactionType] = true;
        
        // 햅틱 피드백
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        const reactionEmojis = {
            like: '👍',
            heart: '❤️',
            fire: '🔥'
        };
        
        showToast(`${reactionEmojis[reactionType]} 반응을 남겼습니다!`, 'success');
    }
    
    saveMessageStats();
    saveUserReactions();
    updateReactionCounts();
}

function updateReactionCounts() {
    if (!currentMessage) return;
    
    const messageId = currentMessage.id;
    const stats = messageStats[messageId] || { like: 0, heart: 0, fire: 0 };
    const reactions = userReactions[messageId] || {};
    
    // 카운트 업데이트
    elements.likeCount.textContent = stats.like;
    elements.heartCount.textContent = stats.heart;
    elements.fireCount.textContent = stats.fire;
    
    // 사용자가 반응한 버튼 스타일 변경
    elements.likeBtn.classList.toggle('reacted', !!reactions.like);
    elements.heartBtn.classList.toggle('reacted', !!reactions.heart);
    elements.fireBtn.classList.toggle('reacted', !!reactions.fire);
}

function openPopularModal() {
    displayPopularMessages();
    elements.popularModal.style.display = 'block';
}

function closePopularModal() {
    elements.popularModal.style.display = 'none';
}

function displayPopularMessages() {
    // 인기 메시지 계산
    const popularMessages = calculatePopularMessages();
    
    if (popularMessages.length === 0) {
        elements.popularEmpty.style.display = 'block';
        elements.popularList.style.display = 'none';
        return;
    }
    
    elements.popularEmpty.style.display = 'none';
    elements.popularList.style.display = 'block';
    
    elements.popularList.innerHTML = popularMessages.map((item, index) => `
        <div class="popular-item" data-id="${item.message.id}">
            <div class="popular-rank">#${index + 1}</div>
            <div class="popular-content">
                <div class="popular-text">"${item.message.text}"</div>
                <div class="popular-author">— ${item.message.author}</div>
                <div class="popular-stats">
                    <span class="stat-item">👍 ${item.stats.like}</span>
                    <span class="stat-item">❤️ ${item.stats.heart}</span>
                    <span class="stat-item">🔥 ${item.stats.fire}</span>
                    <span class="stat-total">총 ${item.totalReactions}개</span>
                </div>
            </div>
            <div class="popular-actions">
                <button class="popular-action-btn" onclick="loadPopularMessage(${item.message.id})" aria-label="이 메시지 보기">
                    📖
                </button>
            </div>
        </div>
    `).join('');
}

function calculatePopularMessages() {
    const messageScores = [];
    
    // 모든 메시지의 반응 점수 계산
    messagesData.forEach(message => {
        const stats = messageStats[message.id];
        if (stats) {
            const totalReactions = stats.like + stats.heart + stats.fire;
            if (totalReactions > 0) {
                messageScores.push({
                    message,
                    stats,
                    totalReactions
                });
            }
        }
    });
    
    // 반응 수 기준으로 정렬
    return messageScores.sort((a, b) => b.totalReactions - a.totalReactions).slice(0, 10);
}

function loadPopularMessage(messageId) {
    const message = messagesData.find(msg => msg.id === messageId);
    if (message) {
        currentMessage = message;
        showMessage();
        updateMessageCounter();
        closePopularModal();
        showToast('인기 메시지를 불러왔습니다! 🔥', 'success');
    }
}

function openInviteModal() {
    // 초대 메시지에서 앱 URL 설정
    const appUrl = window.location.origin + window.location.pathname;
    const inviteText = elements.inviteText.textContent.replace('{{APP_URL}}', appUrl);
    elements.inviteText.textContent = inviteText;
    
    elements.inviteModal.style.display = 'block';
}

function closeInviteModal() {
    elements.inviteModal.style.display = 'none';
}

async function copyInviteMessage() {
    try {
        await navigator.clipboard.writeText(elements.inviteText.textContent);
        showToast('초대 메시지가 복사되었습니다! 📋', 'success');
        closeInviteModal();
    } catch (error) {
        console.error('복사 실패:', error);
        showToast('복사에 실패했습니다.', 'error');
    }
}

async function shareInviteMessage() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: '모닝 - 아침 메시지',
                text: elements.inviteText.textContent,
                url: window.location.href
            });
            
            showToast('초대 메시지를 공유했습니다! 👥', 'success');
            closeInviteModal();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('공유 실패:', error);
                copyInviteMessage();
            }
        }
    } else {
        copyInviteMessage();
    }
}

function saveMessageStats() {
    localStorage.setItem('messageStats', JSON.stringify(messageStats));
}

function saveUserReactions() {
    localStorage.setItem('userReactions', JSON.stringify(userReactions));
}

// 생산성 도구 기능들
let selectedMood = '';

function openJournalModal() {
    // 오늘의 메시지를 영감 구역에 표시
    if (currentMessage) {
        elements.inspirationQuote.textContent = `"${currentMessage.text}" — ${currentMessage.author}`;
    }
    
    // 오늘 날짜 설정
    const today = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    elements.journalDate.textContent = today;
    
    // 기존 일기가 있다면 로드
    loadTodayJournal();
    
    // 지난 일기들 표시
    displayJournalHistory();
    
    elements.journalModal.style.display = 'block';
}

function closeJournalModal() {
    elements.journalModal.style.display = 'none';
    clearJournalForm();
}

function loadTodayJournal() {
    const today = new Date().toDateString();
    const todayJournal = dailyJournal[today];
    
    if (todayJournal) {
        elements.journalText.value = todayJournal.text || '';
        selectedMood = todayJournal.mood || '';
        updateCharCount();
        
        // 기분 버튼 선택 상태 복원
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.mood === selectedMood);
        });
    }
}

function clearJournalForm() {
    elements.journalText.value = '';
    selectedMood = '';
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    updateCharCount();
}

function selectMood(mood) {
    selectedMood = mood;
    
    // 모든 기분 버튼의 선택 상태 초기화
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 선택된 버튼 활성화
    document.querySelector(`[data-mood="${mood}"]`).classList.add('selected');
    
    // 햅틱 피드백
    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

function updateCharCount() {
    const textLength = elements.journalText.value.length;
    elements.charCount.textContent = textLength;
    
    // 글자 수에 따른 색상 변경
    if (textLength > 900) {
        elements.charCount.style.color = '#ef4444';
    } else if (textLength > 800) {
        elements.charCount.style.color = '#f59e0b';
    } else {
        elements.charCount.style.color = '#6b7280';
    }
}

function saveJournal() {
    const text = elements.journalText.value.trim();
    
    if (!text && !selectedMood) {
        showToast('일기 내용이나 기분을 선택해주세요', 'warning');
        return;
    }
    
    const today = new Date().toDateString();
    const now = new Date();
    
    dailyJournal[today] = {
        text: text,
        mood: selectedMood,
        inspirationMessage: currentMessage ? {
            text: currentMessage.text,
            author: currentMessage.author
        } : null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
    };
    
    saveDailyJournal();
    updateHabitTracker('journal');
    closeJournalModal();
    
    showToast('일기가 저장되었습니다! 📝', 'success');
}

function displayJournalHistory() {
    const journals = Object.entries(dailyJournal)
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .slice(0, 5); // 최근 5개만 표시
    
    if (journals.length === 0) {
        elements.journalList.innerHTML = '<p class="no-journals">아직 작성한 일기가 없습니다</p>';
        return;
    }
    
    elements.journalList.innerHTML = journals.map(([date, journal]) => {
        const displayDate = new Date(date).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
        
        const moodEmoji = {
            great: '😄',
            good: '😊',
            okay: '😐',
            bad: '😔',
            terrible: '😢'
        };
        
        return `
            <div class="journal-history-item">
                <div class="journal-history-header">
                    <span class="journal-history-date">${displayDate}</span>
                    <span class="journal-history-mood">${moodEmoji[journal.mood] || '😐'}</span>
                </div>
                <div class="journal-history-preview">
                    ${journal.text.substring(0, 80)}${journal.text.length > 80 ? '...' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function openHabitModal() {
    updateHabitStats();
    generateHabitCalendar();
    elements.habitModal.style.display = 'block';
}

function closeHabitModal() {
    elements.habitModal.style.display = 'none';
}

function initializeHabitTracker() {
    const today = new Date().toDateString();
    
    // 오늘 첫 방문이면 습관 트래커 업데이트
    if (!habitTracker.lastVisit || habitTracker.lastVisit !== today) {
        updateHabitTracker('visit');
    }
}

function updateHabitTracker(activity) {
    const today = new Date().toDateString();
    
    if (!habitTracker.visits) {
        habitTracker.visits = {};
    }
    
    if (!habitTracker.visits[today]) {
        habitTracker.visits[today] = {
            visited: false,
            journalWritten: false,
            messagesViewed: 0
        };
    }
    
    switch (activity) {
        case 'visit':
            if (!habitTracker.visits[today].visited) {
                habitTracker.visits[today].visited = true;
                habitTracker.lastVisit = today;
                updateStreakCounter();
            }
            break;
        case 'journal':
            habitTracker.visits[today].journalWritten = true;
            break;
        case 'message':
            habitTracker.visits[today].messagesViewed++;
            break;
    }
    
    saveHabitTracker();
    updateStreakDisplay();
}

function updateStreakCounter() {
    let currentStreak = 0;
    let checkDate = new Date();
    
    // 연속 방문일 계산
    while (true) {
        const dateStr = checkDate.toDateString();
        
        if (habitTracker.visits[dateStr] && habitTracker.visits[dateStr].visited) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    habitTracker.currentStreak = currentStreak;
}

function updateStreakDisplay() {
    const streak = habitTracker.currentStreak || 0;
    elements.streakNumber.textContent = streak;
    
    // 스트릭에 따른 색상 변경
    if (streak >= 30) {
        elements.streakNumber.style.color = '#10b981'; // 초록
    } else if (streak >= 7) {
        elements.streakNumber.style.color = '#f59e0b'; // 주황
    } else {
        elements.streakNumber.style.color = '#6b7280'; // 회색
    }
}

function updateHabitStats() {
    const totalDays = Object.keys(habitTracker.visits || {}).length;
    const journalDays = Object.values(habitTracker.visits || {})
        .filter(day => day.journalWritten).length;
    
    elements.currentStreak.textContent = habitTracker.currentStreak || 0;
    elements.totalDays.textContent = totalDays;
    elements.journalCount.textContent = journalDays;
}

function generateHabitCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // 이번 달의 첫 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let calendarHTML = '';
    
    // 요일 헤더
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    calendarHTML += '<div class="calendar-header">';
    weekdays.forEach(day => {
        calendarHTML += `<div class="calendar-weekday">${day}</div>`;
    });
    calendarHTML += '</div>';
    
    // 날짜 그리드
    calendarHTML += '<div class="calendar-days">';
    
    // 빈 칸 (이번 달 시작 전)
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // 이번 달 날짜들
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toDateString();
        const dayData = habitTracker.visits && habitTracker.visits[dateStr];
        const isToday = date.toDateString() === today.toDateString();
        
        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' today';
        if (dayData && dayData.visited) dayClass += ' active';
        if (dayData && dayData.journalWritten) dayClass += ' journal';
        
        calendarHTML += `<div class="${dayClass}" title="${day}일">${day}</div>`;
    }
    
    calendarHTML += '</div>';
    
    elements.calendarGrid.innerHTML = calendarHTML;
}

function saveDailyJournal() {
    localStorage.setItem('dailyJournal', JSON.stringify(dailyJournal));
}

function saveHabitTracker() {
    localStorage.setItem('habitTracker', JSON.stringify(habitTracker));
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

// === 목표 설정 시스템 ===

// 목표 초기화
function initializeGoals() {
    if (!userGoals.weekly) {
        userGoals.weekly = [];
    }
    if (!userGoals.monthly) {
        userGoals.monthly = [];
    }
    if (!userGoals.completed) {
        userGoals.completed = [];
    }
    
    saveGoals();
    setupGoalTabs();
}

// 목표 탭 설정
function setupGoalTabs() {
    const tabs = document.querySelectorAll('.goals-tab');
    const contents = document.querySelectorAll('.goals-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 모든 탭 비활성화
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // 클릭된 탭 활성화
            tab.classList.add('active');
            const targetTab = tab.dataset.tab;
            document.getElementById(`${targetTab}Tab`).classList.add('active');
            
            // 탭별 데이터 업데이트
            if (targetTab === 'progress') {
                updateProgressDisplay();
            }
        });
    });
}

// 목표 모달 열기
function openGoalsModal() {
    elements.goalsModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    updateGoalsDisplay();
    updateProgressDisplay();
}

// 목표 모달 닫기
function closeGoalsModal() {
    elements.goalsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 주간 목표 추가
function addWeeklyGoal() {
    const text = elements.weeklyGoalText.value.trim();
    const category = elements.weeklyGoalCategory.value;
    
    if (!text) {
        showToast('목표 내용을 입력해주세요', 'warning');
        return;
    }
    
    const goal = {
        id: Date.now(),
        text: text,
        category: category,
        type: 'weekly',
        createdAt: new Date().toISOString(),
        completed: false,
        progress: 0
    };
    
    userGoals.weekly.push(goal);
    saveGoals();
    
    elements.weeklyGoalText.value = '';
    updateGoalsDisplay();
    showToast('주간 목표가 추가되었습니다! 🎯', 'success');
}

// 월간 목표 추가
function addMonthlyGoal() {
    const text = elements.monthlyGoalText.value.trim();
    const category = elements.monthlyGoalCategory.value;
    
    if (!text) {
        showToast('목표 내용을 입력해주세요', 'warning');
        return;
    }
    
    const goal = {
        id: Date.now(),
        text: text,
        category: category,
        type: 'monthly',
        createdAt: new Date().toISOString(),
        completed: false,
        progress: 0
    };
    
    userGoals.monthly.push(goal);
    saveGoals();
    
    elements.monthlyGoalText.value = '';
    updateGoalsDisplay();
    showToast('월간 목표가 추가되었습니다! 🎯', 'success');
}

// 목표 완료 토글
function toggleGoalCompletion(goalId, type) {
    const goals = userGoals[type];
    const goal = goals.find(g => g.id === goalId);
    
    if (goal) {
        goal.completed = !goal.completed;
        goal.completedAt = goal.completed ? new Date().toISOString() : null;
        
        if (goal.completed) {
            // 완료된 목표를 완료 목록에 추가
            userGoals.completed.push({...goal});
            showToast(`목표를 달성했습니다! 🏆`, 'success');
        }
        
        saveGoals();
        updateGoalsDisplay();
        updateProgressDisplay();
    }
}

// 목표 삭제
function deleteGoal(goalId, type) {
    if (confirm('정말로 이 목표를 삭제하시겠습니까?')) {
        userGoals[type] = userGoals[type].filter(g => g.id !== goalId);
        saveGoals();
        updateGoalsDisplay();
        updateProgressDisplay();
        showToast('목표가 삭제되었습니다', 'success');
    }
}

// 목표 진행도 업데이트
function updateGoalProgress(goalId, type, progress) {
    const goals = userGoals[type];
    const goal = goals.find(g => g.id === goalId);
    
    if (goal) {
        goal.progress = Math.min(100, Math.max(0, progress));
        if (goal.progress === 100 && !goal.completed) {
            goal.completed = true;
            goal.completedAt = new Date().toISOString();
            userGoals.completed.push({...goal});
            showToast(`목표를 달성했습니다! 🏆`, 'success');
        }
        saveGoals();
        updateGoalsDisplay();
        updateProgressDisplay();
    }
}

// 목표 표시 업데이트
function updateGoalsDisplay() {
    updateWeeklyGoalsDisplay();
    updateMonthlyGoalsDisplay();
}

// 주간 목표 표시 업데이트
function updateWeeklyGoalsDisplay() {
    const container = elements.weeklyGoalsList;
    
    if (userGoals.weekly.length === 0) {
        container.innerHTML = `
            <div class="goals-empty">
                <p>아직 설정된 주간 목표가 없습니다</p>
                <small>위에서 새로운 목표를 추가해보세요! 🎯</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userGoals.weekly.map(goal => `
        <div class="goal-item ${goal.completed ? 'completed' : ''}">
            <div class="goal-header">
                <div class="goal-category">${getCategoryIcon(goal.category)} ${getCategoryName(goal.category)}</div>
                <div class="goal-actions">
                    <button class="goal-action-btn" onclick="deleteGoal(${goal.id}, 'weekly')" title="삭제">🗑️</button>
                </div>
            </div>
            <div class="goal-content">
                <div class="goal-text">${goal.text}</div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress || 0}%"></div>
                    </div>
                    <div class="progress-controls">
                        <button class="progress-btn" onclick="updateGoalProgress(${goal.id}, 'weekly', ${(goal.progress || 0) - 25})" ${goal.completed ? 'disabled' : ''}>-25%</button>
                        <span class="progress-text">${goal.progress || 0}%</span>
                        <button class="progress-btn" onclick="updateGoalProgress(${goal.id}, 'weekly', ${(goal.progress || 0) + 25})" ${goal.completed ? 'disabled' : ''}>+25%</button>
                    </div>
                </div>
            </div>
            <div class="goal-footer">
                <span class="goal-date">시작: ${formatDate(goal.createdAt)}</span>
                ${goal.completed ? `<span class="goal-completed">✅ 완료</span>` : ''}
            </div>
        </div>
    `).join('');
}

// 월간 목표 표시 업데이트
function updateMonthlyGoalsDisplay() {
    const container = elements.monthlyGoalsList;
    
    if (userGoals.monthly.length === 0) {
        container.innerHTML = `
            <div class="goals-empty">
                <p>아직 설정된 월간 목표가 없습니다</p>
                <small>위에서 새로운 목표를 추가해보세요! 🎯</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userGoals.monthly.map(goal => `
        <div class="goal-item ${goal.completed ? 'completed' : ''}">
            <div class="goal-header">
                <div class="goal-category">${getCategoryIcon(goal.category)} ${getCategoryName(goal.category)}</div>
                <div class="goal-actions">
                    <button class="goal-action-btn" onclick="deleteGoal(${goal.id}, 'monthly')" title="삭제">🗑️</button>
                </div>
            </div>
            <div class="goal-content">
                <div class="goal-text">${goal.text}</div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress || 0}%"></div>
                    </div>
                    <div class="progress-controls">
                        <button class="progress-btn" onclick="updateGoalProgress(${goal.id}, 'monthly', ${(goal.progress || 0) - 10})" ${goal.completed ? 'disabled' : ''}>-10%</button>
                        <span class="progress-text">${goal.progress || 0}%</span>
                        <button class="progress-btn" onclick="updateGoalProgress(${goal.id}, 'monthly', ${(goal.progress || 0) + 10})" ${goal.completed ? 'disabled' : ''}>+10%</button>
                    </div>
                </div>
            </div>
            <div class="goal-footer">
                <span class="goal-date">시작: ${formatDate(goal.createdAt)}</span>
                ${goal.completed ? `<span class="goal-completed">✅ 완료</span>` : ''}
            </div>
        </div>
    `).join('');
}

// 진행 상황 표시 업데이트
function updateProgressDisplay() {
    // 주간 달성률 계산
    const weeklyCompleted = userGoals.weekly.filter(g => g.completed).length;
    const weeklyTotal = userGoals.weekly.length;
    const weeklyProgress = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;
    
    // 월간 달성률 계산
    const monthlyCompleted = userGoals.monthly.filter(g => g.completed).length;
    const monthlyTotal = userGoals.monthly.length;
    const monthlyProgress = monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0;
    
    // 전체 완료된 목표 수
    const totalCompleted = userGoals.completed.length;
    
    elements.weeklyProgress.textContent = `${weeklyProgress}%`;
    elements.monthlyProgress.textContent = `${monthlyProgress}%`;
    elements.completedGoals.textContent = totalCompleted;
    
    // 달성한 목표들 표시
    updateAchievementsDisplay();
    
    // 동기부여 메시지 업데이트
    updateMotivationMessage(weeklyProgress, monthlyProgress, totalCompleted);
}

// 달성한 목표들 표시 업데이트
function updateAchievementsDisplay() {
    const container = elements.achievementsList;
    
    if (userGoals.completed.length === 0) {
        container.innerHTML = `
            <div class="achievements-empty">
                <p>아직 달성한 목표가 없습니다</p>
                <small>목표를 설정하고 달성해보세요! 💪</small>
            </div>
        `;
        return;
    }
    
    // 최근 달성한 목표 순으로 정렬
    const sortedAchievements = [...userGoals.completed].sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
    );
    
    container.innerHTML = sortedAchievements.map(goal => `
        <div class="achievement-item">
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <div class="achievement-text">${goal.text}</div>
                <div class="achievement-meta">
                    <span class="achievement-category">${getCategoryIcon(goal.category)} ${getCategoryName(goal.category)}</span>
                    <span class="achievement-date">완료: ${formatDate(goal.completedAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 동기부여 메시지 업데이트
function updateMotivationMessage(weeklyProgress, monthlyProgress, totalCompleted) {
    let message = '';
    
    if (totalCompleted === 0) {
        message = '목표를 설정하고 달성해보세요! 💪';
    } else if (totalCompleted < 5) {
        message = `${totalCompleted}개의 목표를 달성했습니다! 계속 해보세요! 🌟`;
    } else if (totalCompleted < 10) {
        message = `훌륭합니다! ${totalCompleted}개의 목표를 달성했어요! 🎉`;
    } else {
        message = `놀라워요! ${totalCompleted}개나 달성했네요! 목표 마스터! 👑`;
    }
    
    // 주간/월간 진행률에 따른 추가 메시지
    if (weeklyProgress >= 80 || monthlyProgress >= 80) {
        message += '\n거의 다 왔어요! 조금만 더 힘내세요! 🔥';
    } else if (weeklyProgress >= 50 || monthlyProgress >= 50) {
        message += '\n절반 이상 달성했습니다! 👍';
    }
    
    elements.motivationText.textContent = message;
}

// 카테고리 아이콘 가져오기
function getCategoryIcon(category) {
    const icons = {
        health: '💪',
        study: '📚',
        work: '💼',
        relationship: '👥',
        hobby: '🎨',
        other: '🌟'
    };
    return icons[category] || '🌟';
}

// 카테고리 이름 가져오기
function getCategoryName(category) {
    const names = {
        health: '건강',
        study: '공부',
        work: '업무',
        relationship: '관계',
        hobby: '취미',
        other: '기타'
    };
    return names[category] || '기타';
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
    });
}

// 목표 저장
function saveGoals() {
    localStorage.setItem('userGoals', JSON.stringify(userGoals));
}

// === 계절별 메시지 시스템 ===

// 현재 계절 가져오기
function getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 0-11 => 1-12
    
    if ([3, 4, 5].includes(month)) {
        return 'spring';
    } else if ([6, 7, 8].includes(month)) {
        return 'summer';
    } else if ([9, 10, 11].includes(month)) {
        return 'autumn';
    } else {
        return 'winter';
    }
}

// 특별한 날 메시지 가져오기
function getSpecialDayMessages(filtered) {
    const today = new Date();
    const monthDay = String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
    
    return filtered.filter(message => {
        if (!message.specialDay) return false;
        
        // 메시지 데이터에서 특별한 날 정의를 확인
        const specialDays = {
            'new-year': ['01-01'],
            'christmas': ['12-25'], 
            'children-day': ['05-05']
        };
        
        const dates = specialDays[message.specialDay] || [];
        return dates.includes(monthDay);
    });
}

// 계절 정보 가져오기
function getSeasonInfo() {
    const currentSeason = getCurrentSeason();
    const seasonInfo = {
        spring: { name: '봄', icon: '🌸', description: '새로운 시작의 계절' },
        summer: { name: '여름', icon: '☀️', description: '열정과 활력의 계절' },
        autumn: { name: '가을', icon: '🍂', description: '성찰과 결실의 계절' },
        winter: { name: '겨울', icon: '❄️', description: '평화와 고요의 계절' }
    };
    
    return seasonInfo[currentSeason];
}

// 계절별 메시지 표시 상태 업데이트
function updateSeasonalDisplay() {
    const seasonInfo = getSeasonInfo();
    const seasonalIndicator = document.querySelector('.seasonal-indicator');
    
    if (seasonalIndicator) {
        seasonalIndicator.innerHTML = `${seasonInfo.icon} ${seasonInfo.name}`;
        seasonalIndicator.title = seasonInfo.description;
    }
}

// === 이벤트 콘텐츠 시스템 ===

// 이벤트 메시지 가져오기
function getEventMessages(filtered) {
    const now = new Date();
    const eventMessages = [];
    
    // 요일별 이벤트 확인
    const weeklyEvents = checkWeeklyEvents(now);
    weeklyEvents.forEach(eventTarget => {
        const messages = filtered.filter(msg => 
            msg.eventType === 'weekly' && msg.eventTarget === eventTarget
        );
        eventMessages.push(...messages);
    });
    
    // 시간대별 이벤트 확인
    const hourlyEvents = checkHourlyEvents(now);
    hourlyEvents.forEach(eventTarget => {
        const messages = filtered.filter(msg => 
            msg.eventType === 'hourly' && msg.eventTarget === eventTarget
        );
        eventMessages.push(...messages);
    });
    
    // 월별 이벤트 확인
    const monthlyEvents = checkMonthlyEvents(now);
    monthlyEvents.forEach(eventTarget => {
        const messages = filtered.filter(msg => 
            msg.eventType === 'monthly' && msg.eventTarget === eventTarget
        );
        eventMessages.push(...messages);
    });
    
    return eventMessages;
}

// 요일별 이벤트 확인
function checkWeeklyEvents(date) {
    const dayOfWeek = date.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    const events = [];
    
    if (dayOfWeek === 1) events.push('monday'); // 월요일
    if (dayOfWeek === 5) events.push('friday'); // 금요일
    if (dayOfWeek === 0 || dayOfWeek === 6) events.push('weekend'); // 주말
    
    return events;
}

// 시간대별 이벤트 확인
function checkHourlyEvents(date) {
    const hour = date.getHours();
    const events = [];
    
    if ([4, 5, 6].includes(hour)) events.push('dawn'); // 새벽
    if ([12, 13].includes(hour)) events.push('lunch'); // 점심시간
    if ([15, 16].includes(hour)) events.push('snack-time'); // 간식시간
    
    return events;
}

// 월별 이벤트 확인
function checkMonthlyEvents(date) {
    const month = date.getMonth() + 1; // 0-11 => 1-12
    const dayOfMonth = date.getDate();
    const events = [];
    
    // 특정 월 체크
    if (month === 1) events.push('january');
    if (month === 6) events.push('june');
    if (month === 12) events.push('december');
    
    // 월초/월말 체크
    if ([1, 2, 3].includes(dayOfMonth)) events.push('month-start'); // 월초
    
    // 월말 체크 (해당 월의 마지막 3일)
    const lastDay = new Date(date.getFullYear(), month, 0).getDate();
    if (dayOfMonth >= lastDay - 2) events.push('month-end'); // 월말
    
    return events;
}

// 현재 활성 이벤트 정보 가져오기
function getCurrentEvents() {
    const now = new Date();
    const events = {
        weekly: checkWeeklyEvents(now),
        hourly: checkHourlyEvents(now),
        monthly: checkMonthlyEvents(now)
    };
    
    return events;
}

// 이벤트 표시기 업데이트
function updateEventDisplay() {
    const events = getCurrentEvents();
    const eventIndicator = document.querySelector('.event-indicator');
    
    if (eventIndicator) {
        const activeEvents = [
            ...events.weekly,
            ...events.hourly, 
            ...events.monthly
        ];
        
        if (activeEvents.length > 0) {
            const icons = {
                'monday': '💪',
                'friday': '🎉', 
                'weekend': '☕',
                'dawn': '🌅',
                'lunch': '🍽️',
                'snack-time': '🍪',
                'january': '🎯',
                'june': '🌿',
                'december': '👏',
                'month-start': '🎯',
                'month-end': '📊'
            };
            
            const eventIcon = icons[activeEvents[0]] || '📅';
            eventIndicator.innerHTML = `${eventIcon} 이벤트`;
            eventIndicator.style.display = 'inline-block';
        } else {
            eventIndicator.style.display = 'none';
        }
    }
}

// === 사용자 제출 시스템 ===

// 사용자 제출 시스템 초기화
function initializeUserSubmissions() {
    setupSubmitTabs();
    updateMyMessagesDisplay();
    updateCommunityDisplay();
}

// 제출 탭 설정
function setupSubmitTabs() {
    const tabs = document.querySelectorAll('.submit-tab');
    const contents = document.querySelectorAll('.submit-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 모든 탭 비활성화
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // 클릭된 탭 활성화
            tab.classList.add('active');
            const targetTab = tab.dataset.tab;
            document.getElementById(`${targetTab}Tab`).classList.add('active');
            
            // 탭별 데이터 업데이트
            if (targetTab === 'my-messages') {
                updateMyMessagesDisplay();
            } else if (targetTab === 'community') {
                updateCommunityDisplay();
            }
        });
    });
}

// 사용자 제출 모달 열기
function openSubmitModal() {
    elements.submitModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 사용자 이름이 설정되어 있으면 기본값으로 설정
    if (settings.userName) {
        elements.messageAuthor.value = settings.userName;
    }
    
    updateMyMessagesDisplay();
    updateCommunityDisplay();
}

// 사용자 제출 모달 닫기
function closeSubmitModal() {
    elements.submitModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetMessageForm();
}

// 미리보기 모달 닫기
function closePreviewModal() {
    elements.previewModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 메시지 폼 초기화
function resetMessageForm() {
    elements.messageText.value = '';
    elements.messageAuthor.value = settings.userName || '';
    elements.messageCategory.value = '동기부여';
    elements.messageTimeOfDay.value = '';
    elements.messageSeason.value = 'all';
    updateMessageCharCount();
}

// 메시지 글자 수 업데이트
function updateMessageCharCount() {
    const count = elements.messageText.value.length;
    elements.messageCharCount.textContent = count;
    
    if (count > 180) {
        elements.messageCharCount.style.color = '#ef4444';
    } else if (count > 150) {
        elements.messageCharCount.style.color = '#f59e0b';
    } else {
        elements.messageCharCount.style.color = 'var(--text-secondary)';
    }
}

// 메시지 미리보기
function previewMessage() {
    const text = elements.messageText.value.trim();
    if (!text) {
        showToast('메시지 내용을 입력해주세요', 'warning');
        return;
    }
    
    const author = elements.messageAuthor.value.trim() || '익명';
    const category = elements.messageCategory.value;
    const timeOfDay = elements.messageTimeOfDay.value;
    const season = elements.messageSeason.value;
    
    // 미리보기 모달에 데이터 설정
    elements.previewText.textContent = text;
    elements.previewAuthor.textContent = author;
    elements.previewCategory.textContent = category;
    
    // 시간대와 계절 정보 표시
    const timeText = getTimeOfDayText(timeOfDay);
    const seasonText = getSeasonText(season);
    elements.previewTimeOfDay.textContent = timeText;
    elements.previewSeason.textContent = seasonText;
    
    // 미리보기 모달 열기
    elements.previewModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 시간대 텍스트 가져오기
function getTimeOfDayText(timeOfDay) {
    const timeTexts = {
        'morning': '🌅 아침',
        'afternoon': '☀️ 오후',
        'evening': '🌆 저녁',
        'night': '🌙 밤'
    };
    return timeTexts[timeOfDay] || '⏰ 언제나';
}

// 계절 텍스트 가져오기
function getSeasonText(season) {
    const seasonTexts = {
        'spring': '🌸 봄',
        'summer': '☀️ 여름',
        'autumn': '🍂 가을',
        'winter': '❄️ 겨울'
    };
    return seasonTexts[season] || '🌍 모든 계절';
}

// 미리보기에서 수정하기
function editMessage() {
    closePreviewModal();
    // 제출 모달의 새 메시지 탭으로 돌아감
    const createTab = document.querySelector('[data-tab="create"]');
    createTab.click();
}

// 메시지 제출 (직접)
function submitMessage() {
    const text = elements.messageText.value.trim();
    if (!text) {
        showToast('메시지 내용을 입력해주세요', 'warning');
        return;
    }
    
    if (text.length < 10) {
        showToast('메시지는 최소 10자 이상 입력해주세요', 'warning');
        return;
    }
    
    previewMessage(); // 미리보기를 먼저 보여줌
}

// 메시지 제출 확정
function confirmSubmitMessage() {
    const message = {
        id: Date.now(),
        text: elements.messageText.value.trim(),
        author: elements.messageAuthor.value.trim() || '익명',
        category: elements.messageCategory.value,
        timeOfDay: elements.messageTimeOfDay.value || '',
        season: elements.messageSeason.value || 'all',
        createdAt: new Date().toISOString(),
        userSubmitted: true,
        approved: true, // 자동 승인 (실제 서비스에서는 검토 후 승인)
        likes: 0,
        reports: 0
    };
    
    // 내 메시지에 추가
    userMessages.push(message);
    saveUserMessages();
    
    // 커뮤니티에도 추가 (공유)
    communityMessages.push({...message});
    saveCommunityMessages();
    
    // 성공 메시지
    showToast('메시지가 성공적으로 제출되었습니다! 🎉', 'success');
    
    // 모달 닫기 및 폼 초기화
    closePreviewModal();
    closeSubmitModal();
    resetMessageForm();
    
    // 디스플레이 업데이트
    updateMyMessagesDisplay();
    updateCommunityDisplay();
}

// 내 메시지 표시 업데이트
function updateMyMessagesDisplay() {
    const count = userMessages.length;
    elements.myMessagesCount.textContent = count;
    
    if (count === 0) {
        elements.myMessagesEmpty.style.display = 'block';
        elements.myMessagesList.innerHTML = '';
        return;
    }
    
    elements.myMessagesEmpty.style.display = 'none';
    
    // 최신순으로 정렬
    const sortedMessages = [...userMessages].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    elements.myMessagesList.innerHTML = sortedMessages.map(message => `
        <div class="user-message-item">
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-meta">
                    <span class="message-category">${message.category}</span>
                    <span class="message-date">${formatDate(message.createdAt)}</span>
                </div>
            </div>
            <div class="message-actions">
                <button class="message-action-btn" onclick="editUserMessage(${message.id})" title="수정">✏️</button>
                <button class="message-action-btn" onclick="deleteUserMessage(${message.id})" title="삭제">🗑️</button>
                <button class="message-action-btn" onclick="shareUserMessage(${message.id})" title="공유">📤</button>
            </div>
        </div>
    `).join('');
}

// 커뮤니티 표시 업데이트
function updateCommunityDisplay() {
    const count = communityMessages.length;
    elements.communityCount.textContent = count;
    
    if (count === 0) {
        elements.communityEmpty.style.display = 'block';
        elements.communityList.innerHTML = '';
        return;
    }
    
    elements.communityEmpty.style.display = 'none';
    filterCommunityMessages();
}

// 커뮤니티 메시지 필터링
function filterCommunityMessages() {
    const filter = elements.communityFilter.value;
    let filteredMessages = [...communityMessages];
    
    switch (filter) {
        case 'recent':
            filteredMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'popular':
            filteredMessages.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
        case 'my-category':
            // 사용자가 자주 선택하는 카테고리 우선
            const preferredCategories = getPreferredCategories();
            filteredMessages = filteredMessages.filter(msg => 
                preferredCategories.includes(msg.category)
            );
            break;
    }
    
    elements.communityList.innerHTML = filteredMessages.map(message => `
        <div class="community-message-item">
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-author">— ${message.author}</div>
                <div class="message-meta">
                    <span class="message-category">${message.category}</span>
                    <span class="message-date">${formatDate(message.createdAt)}</span>
                </div>
            </div>
            <div class="message-stats">
                <button class="like-community-btn" onclick="likeCommunityMessage(${message.id})">
                    👍 <span>${message.likes || 0}</span>
                </button>
                <button class="use-message-btn" onclick="useCommunityMessage(${message.id})">
                    사용하기
                </button>
            </div>
        </div>
    `).join('');
}

// 선호 카테고리 가져오기
function getPreferredCategories() {
    // 사용자의 즐겨찾기나 히스토리에서 가장 많이 사용된 카테고리 분석
    const categoryCounts = {};
    
    // 즐겨찾기 카테고리 분석
    favorites.forEach(fav => {
        categoryCounts[fav.category] = (categoryCounts[fav.category] || 0) + 2; // 즐겨찾기는 가중치 2
    });
    
    // 히스토리 카테고리 분석
    messageHistory.forEach(hist => {
        categoryCounts[hist.category] = (categoryCounts[hist.category] || 0) + 1;
    });
    
    // 상위 3개 카테고리 반환
    return Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);
}

// 사용자 메시지 수정
function editUserMessage(messageId) {
    const message = userMessages.find(m => m.id === messageId);
    if (!message) return;
    
    // 폼에 기존 데이터 설정
    elements.messageText.value = message.text;
    elements.messageAuthor.value = message.author;
    elements.messageCategory.value = message.category;
    elements.messageTimeOfDay.value = message.timeOfDay || '';
    elements.messageSeason.value = message.season || 'all';
    updateMessageCharCount();
    
    // 새 메시지 탭으로 이동
    const createTab = document.querySelector('[data-tab="create"]');
    createTab.click();
    
    showToast('메시지를 수정할 수 있습니다', 'info');
}

// 사용자 메시지 삭제
function deleteUserMessage(messageId) {
    if (confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
        userMessages = userMessages.filter(m => m.id !== messageId);
        saveUserMessages();
        
        // 커뮤니티에서도 제거
        communityMessages = communityMessages.filter(m => m.id !== messageId);
        saveCommunityMessages();
        
        updateMyMessagesDisplay();
        updateCommunityDisplay();
        showToast('메시지가 삭제되었습니다', 'success');
    }
}

// 사용자 메시지 공유
function shareUserMessage(messageId) {
    const message = userMessages.find(m => m.id === messageId);
    if (!message) return;
    
    // 공유 텍스트 생성
    const shareText = `"${message.text}"\n\n— ${message.author}\n\n모닝 앱에서 공유됨`;
    
    if (navigator.share) {
        navigator.share({
            title: '모닝 - 내가 작성한 메시지',
            text: shareText,
            url: window.location.href
        });
    } else {
        // 클립보드에 복사
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('메시지가 클립보드에 복사되었습니다! 📋', 'success');
        });
    }
}

// 커뮤니티 메시지 좋아요
function likeCommunityMessage(messageId) {
    const message = communityMessages.find(m => m.id === messageId);
    if (!message) return;
    
    message.likes = (message.likes || 0) + 1;
    saveCommunityMessages();
    updateCommunityDisplay();
    showToast('좋아요! 👍', 'success');
}

// 커뮤니티 메시지 사용하기
function useCommunityMessage(messageId) {
    const message = communityMessages.find(m => m.id === messageId);
    if (!message) return;
    
    // 현재 메시지로 설정
    currentMessage = message;
    showMessage();
    addToHistory();
    
    // 모달 닫기
    closeSubmitModal();
    
    showToast('메시지를 적용했습니다! ✨', 'success');
}

// 데이터 저장 함수들
function saveUserMessages() {
    localStorage.setItem('userMessages', JSON.stringify(userMessages));
}

function saveCommunityMessages() {
    localStorage.setItem('communityMessages', JSON.stringify(communityMessages));
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