/**
 * 메시지 관리 모듈
 * 메시지 로딩, 필터링, 표시, 반응 등 메시지 관련 기능 관리
 */

import { Security, DateUtils, Storage, DOM, ErrorHandler, Performance } from './utils.js';
import { uiManager } from './ui-manager.js';

export class MessageManager {
    constructor() {
        this.messages = [];
        this.currentMessage = null;
        this.currentCategory = 'all';
        this.messageHistory = [];
        this.favorites = [];
        this.reactions = {};
        this.isLoading = false;
        
        this.init();
    }

    /**
     * 메시지 매니저 초기화
     */
    async init() {
        try {
            await this.loadMessages();
            this.loadUserData();
            this.bindEvents();
            this.updateUI();
            
            // 첫 메시지 표시
            this.showRandomMessage();
            
            console.log('Message Manager initialized successfully');
        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.init', true);
        }
    }

    /**
     * 메시지 데이터 로딩
     */
    async loadMessages() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        uiManager.toggleLoading(true, '메시지를 불러오는 중...');

        try {
            // 기본 메시지와 명언 모두 로드
            const [messagesResponse, quotesResponse] = await Promise.all([
                fetch('./messages.json'),
                fetch('./quotes.json').catch(() => ({ ok: false })) // quotes.json이 없어도 계속 진행
            ]);

            if (!messagesResponse.ok) {
                throw new Error('메시지를 불러올 수 없습니다.');
            }

            const messagesData = await messagesResponse.json();
            this.messages = messagesData.messages || [];

            // quotes.json이 있다면 추가
            if (quotesResponse.ok) {
                const quotesData = await quotesResponse.json();
                const quotes = quotesData.messages || [];
                
                // quotes를 messages 형식으로 변환
                const convertedQuotes = quotes.map((quote, index) => ({
                    id: `quote_${index}`,
                    text: quote.text,
                    author: quote.author,
                    category: quote.category || '명언',
                    timeOfDay: '',
                    season: 'all',
                    createdAt: new Date().toISOString().split('T')[0]
                }));
                
                this.messages = [...this.messages, ...convertedQuotes];
            }

            // 메시지 검증 및 정화
            this.messages = this.messages
                .filter(msg => msg && msg.text && msg.text.trim())
                .map(msg => ({
                    ...msg,
                    text: Security.sanitizeInput(msg.text, 500),
                    author: Security.sanitizeInput(msg.author || '익명', 50),
                    category: Security.sanitizeInput(msg.category || '기타', 20)
                }));

            console.log(`${this.messages.length}개의 메시지를 로드했습니다.`);

        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.loadMessages');
            
            // 폴백 메시지
            this.messages = this.getFallbackMessages();
            uiManager.showNotification('기본 메시지를 사용합니다.', 'warning');
            
        } finally {
            this.isLoading = false;
            uiManager.toggleLoading(false);
        }
    }

    /**
     * 폴백 메시지 (네트워크 오류 시 사용)
     */
    getFallbackMessages() {
        return [
            {
                id: 'fallback_1',
                text: '새로운 하루가 시작됩니다. 오늘도 당신이 할 수 있는 일들을 믿어보세요.',
                author: '하루의 시작',
                category: '새로운 시작',
                timeOfDay: 'morning',
                season: 'all'
            },
            {
                id: 'fallback_2',
                text: '작은 진전도 여전히 진전입니다. 자신을 격려해주세요.',
                author: '하루의 시작',
                category: '동기부여',
                timeOfDay: '',
                season: 'all'
            },
            {
                id: 'fallback_3',
                text: '오늘 하루도 감사한 마음으로 시작하세요.',
                author: '하루의 시작',
                category: '감사',
                timeOfDay: 'morning',
                season: 'all'
            }
        ];
    }

    /**
     * 사용자 데이터 로딩
     */
    loadUserData() {
        try {
            this.messageHistory = Storage.get('messageHistory', []);
            this.favorites = Storage.get('favorites', []);
            this.reactions = Storage.get('messageStats', {});
            
            // 데이터 검증
            this.messageHistory = this.messageHistory.filter(item => 
                item && item.message && item.viewedAt
            );
            
            this.favorites = this.favorites.filter(item => 
                item && item.message
            );

        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.loadUserData');
            // 기본값으로 초기화
            this.messageHistory = [];
            this.favorites = [];
            this.reactions = {};
        }
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 새 메시지 버튼들
        const newMessageBtns = DOM.$$('#newQuoteBtn, #quickNewBtn');
        newMessageBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.showRandomMessage());
            }
        });

        // 카테고리 필터
        const categoryFilterBtn = DOM.$('#categoryFilterBtn');
        if (categoryFilterBtn) {
            categoryFilterBtn.addEventListener('click', () => {
                uiManager.openModal('categoryModal');
            });
        }

        // 카테고리 버튼들
        const categoryBtns = DOM.$$('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectCategory(btn.dataset.category);
            });
        });

        // 즐겨찾기 버튼
        const favoriteBtn = DOM.$('#favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }

        // 반응 버튼들
        const reactionBtns = DOM.$$('.reaction-btn');
        reactionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.addReaction(btn.dataset.reaction);
            });
        });

        // 공유 버튼들
        const shareBtns = DOM.$$('#shareBtn, #quickShareBtn');
        shareBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.shareMessage());
            }
        });

        // 음성 재생 버튼들
        const speakBtns = DOM.$$('#speakBtn, #quickSpeakBtn');
        speakBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.speakMessage());
            }
        });

        // 스와이프 제스처 (모바일)
        this.initSwipeGestures();
    }

    /**
     * 랜덤 메시지 표시
     */
    showRandomMessage() {
        try {
            const availableMessages = this.getFilteredMessages();
            
            if (availableMessages.length === 0) {
                uiManager.showNotification('표시할 메시지가 없습니다.', 'warning');
                return;
            }

            // 최근에 본 메시지 제외하고 선택
            const recentIds = this.messageHistory
                .slice(-Math.min(5, Math.floor(availableMessages.length / 3)))
                .map(item => item.message.id);
            
            const unviewedMessages = availableMessages.filter(msg => 
                !recentIds.includes(msg.id)
            );
            
            const messagesToChooseFrom = unviewedMessages.length > 0 ? 
                unviewedMessages : availableMessages;
            
            const randomIndex = Math.floor(Math.random() * messagesToChooseFrom.length);
            const message = messagesToChooseFrom[randomIndex];
            
            this.displayMessage(message);
            this.addToHistory(message);

        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.showRandomMessage');
        }
    }

    /**
     * 메시지 표시
     * @param {Object} message - 표시할 메시지
     */
    displayMessage(message) {
        if (!message) return;

        try {
            this.currentMessage = message;

            // 로딩 숨기고 컨텐츠 표시
            const loading = DOM.$('#loading');
            const content = DOM.$('#quoteContent');
            
            if (loading) loading.style.display = 'none';
            if (content) content.style.display = 'block';

            // 메시지 내용 설정
            const textEl = DOM.$('#quoteText');
            const authorEl = DOM.$('#quoteAuthor');
            const categoryEl = DOM.$('#quoteCategory');

            if (textEl) Security.safeSetHTML(textEl, message.text);
            if (authorEl) Security.safeSetHTML(authorEl, message.author || '익명');
            if (categoryEl) Security.safeSetHTML(categoryEl, message.category || '');

            // 즐겨찾기 상태 업데이트
            this.updateFavoriteButton();

            // 반응 상태 업데이트
            this.updateReactionButtons();

            // 메시지 카운터 업데이트
            this.updateMessageCounter();

            // 접근성: 스크린 리더에 알림
            this.announceToScreenReader(`새로운 메시지: ${message.text}`);

        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.displayMessage');
        }
    }

    /**
     * 필터링된 메시지 가져오기
     */
    getFilteredMessages() {
        let filtered = [...this.messages];

        // 카테고리 필터
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(msg => 
                msg.category === this.currentCategory
            );
        }

        // 시간대 필터 (선택적)
        const currentHour = new Date().getHours();
        const timeOfDay = this.getTimeOfDay(currentHour);
        
        // 시간대별 메시지 우선순위 (강제하지 않음)
        const timeSpecificMessages = filtered.filter(msg => 
            msg.timeOfDay === timeOfDay
        );
        
        if (timeSpecificMessages.length > 0 && Math.random() < 0.7) {
            filtered = timeSpecificMessages;
        }

        // 계절 필터 (선택적)
        const currentSeason = DateUtils.getCurrentSeason();
        const seasonSpecificMessages = filtered.filter(msg => 
            msg.season === 'all' || msg.season === currentSeason
        );
        
        if (seasonSpecificMessages.length > 0 && Math.random() < 0.5) {
            filtered = seasonSpecificMessages;
        }

        return filtered;
    }

    /**
     * 시간대 반환
     * @param {number} hour - 시간
     */
    getTimeOfDay(hour) {
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    }

    /**
     * 카테고리 선택
     * @param {string} category - 선택된 카테고리
     */
    selectCategory(category) {
        try {
            this.currentCategory = category;
            
            // 카테고리 버튼 상태 업데이트
            const categoryBtns = DOM.$$('.category-btn');
            categoryBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.category === category);
            });

            // 카테고리 모달 닫기
            uiManager.closeModal('categoryModal');

            // 새 메시지 표시
            this.showRandomMessage();

            // 알림
            const categoryName = category === 'all' ? '모든 카테고리' : category;
            uiManager.showNotification(`${categoryName} 메시지로 변경되었습니다.`, 'success');

        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.selectCategory');
        }
    }

    /**
     * 즐겨찾기 토글
     */
    toggleFavorite() {
        if (!this.currentMessage) return;

        try {
            // 동적으로 featureManager 가져오기
            const featureManager = window.featureManager;
            if (!featureManager) {
                console.warn('FeatureManager not available');
                return;
            }

            const messageId = this.currentMessage.id;
            const isCurrentlyFavorite = featureManager.isFavorite(messageId);

            if (isCurrentlyFavorite) {
                // 즐겨찾기에서 제거
                if (featureManager.removeFromFavorites(messageId)) {
                    uiManager.showNotification('즐겨찾기에서 제거되었습니다.', 'info');
                }
            } else {
                // 즐겨찾기에 추가
                if (featureManager.addToFavorites(this.currentMessage)) {
                    uiManager.showNotification('즐겨찾기에 추가되었습니다.', 'success');
                }
            }

            // UI 업데이트
            this.updateFavoriteButton();

        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.toggleFavorite');
        }
    }

    /**
     * 반응 추가
     * @param {string} reaction - 반응 타입 (like, heart, fire)
     */
    addReaction(reaction) {
        if (!this.currentMessage) return;

        try {
            const messageId = this.currentMessage.id;
            const userReactions = Storage.get('userReactions', {});
            const userReactionKey = `${messageId}_${reaction}`;

            // 이미 반응했는지 확인
            if (userReactions[userReactionKey]) {
                uiManager.showNotification('이미 반응하셨습니다.', 'warning');
                return;
            }

            // 반응 카운트 증가
            if (!this.reactions[messageId]) {
                this.reactions[messageId] = { like: 0, heart: 0, fire: 0 };
            }
            this.reactions[messageId][reaction]++;

            // 사용자 반응 기록
            userReactions[userReactionKey] = Date.now();

            // 저장
            Storage.set('messageStats', this.reactions);
            Storage.set('userReactions', userReactions);

            // UI 업데이트
            this.updateReactionButtons();

            // 알림
            const reactionEmoji = { like: '👍', heart: '❤️', fire: '🔥' };
            uiManager.showNotification(`${reactionEmoji[reaction]} 반응을 추가했습니다!`, 'success');

        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.addReaction');
        }
    }

    /**
     * 메시지 공유
     */
    async shareMessage() {
        if (!this.currentMessage) return;

        try {
            const shareText = `"${this.currentMessage.text}"\n\n- ${this.currentMessage.author}\n\n#모닝앱 #좋은글귀`;

            // Web Share API 지원 확인
            if (navigator.share && navigator.canShare({ text: shareText })) {
                await navigator.share({
                    title: '모닝 - 아침 메시지',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                // 클립보드에 복사
                await navigator.clipboard.writeText(shareText);
                uiManager.showNotification('메시지가 클립보드에 복사되었습니다.', 'success');
            }

        } catch (error) {
            // 폴백: 수동 복사
            try {
                const textArea = document.createElement('textarea');
                textArea.value = shareText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                uiManager.showNotification('메시지가 클립보드에 복사되었습니다.', 'success');
            } catch (copyError) {
                ErrorHandler.handle(copyError, 'MessageManager.shareMessage');
                uiManager.showNotification('공유 기능을 사용할 수 없습니다.', 'error');
            }
        }
    }

    /**
     * 메시지 음성 재생
     */
    speakMessage() {
        if (!this.currentMessage) return;

        try {
            // 기존 음성 재생 중단
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance();
            utterance.text = `${this.currentMessage.text}. ${this.currentMessage.author}`;
            utterance.lang = 'ko-KR';
            utterance.rate = 0.8;
            utterance.pitch = 1;

            // 음성 재생 시작 알림
            uiManager.showNotification('음성 재생을 시작합니다.', 'info', 1000);

            speechSynthesis.speak(utterance);

        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.speakMessage');
            uiManager.showNotification('음성 재생을 지원하지 않습니다.', 'error');
        }
    }

    /**
     * 히스토리에 추가
     * @param {Object} message - 메시지
     */
    addToHistory(message) {
        if (!message) return;

        try {
            // featureManager를 통해 히스토리에 추가
            const featureManager = window.featureManager;
            if (featureManager) {
                featureManager.addToHistory(message);
            } else {
                // 폴백: 직접 저장
                this.messageHistory.push({
                    message: { ...message },
                    viewedAt: new Date().toISOString()
                });
                Storage.set('messageHistory', this.messageHistory);
            }

        } catch (error) {
            ErrorHandler.handle(error, 'MessageManager.addToHistory');
        }
    }

    /**
     * UI 업데이트
     */
    updateUI() {
        // 시간 인사말 업데이트
        const timeGreeting = DOM.$('#timeGreeting');
        if (timeGreeting) {
            Security.safeSetHTML(timeGreeting, DateUtils.getTimeGreeting());
        }

        // 날짜 표시 업데이트
        const dateDisplay = DOM.$('#dateDisplay');
        if (dateDisplay) {
            Security.safeSetHTML(dateDisplay, DateUtils.formatDate());
        }

        // 계절 표시 업데이트
        this.updateSeasonalIndicator();
    }

    /**
     * 즐겨찾기 버튼 업데이트
     */
    updateFavoriteButton() {
        if (!this.currentMessage) return;

        const favoriteBtn = DOM.$('#favoriteBtn');
        const favoriteIcon = DOM.$('.favorite-icon');
        
        if (favoriteBtn && favoriteIcon) {
            // featureManager를 통해 즐겨찾기 상태 확인
            const featureManager = window.featureManager;
            const isFavorite = featureManager ? 
                featureManager.isFavorite(this.currentMessage.id) : 
                false;
            
            favoriteIcon.textContent = isFavorite ? '❤️' : '🤍';
            favoriteBtn.setAttribute('aria-label', 
                isFavorite ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'
            );
        }
    }

    /**
     * 반응 버튼들 업데이트
     */
    updateReactionButtons() {
        if (!this.currentMessage) return;

        const messageId = this.currentMessage.id;
        const reactions = this.reactions[messageId] || { like: 0, heart: 0, fire: 0 };
        const userReactions = Storage.get('userReactions', {});

        ['like', 'heart', 'fire'].forEach(reaction => {
            const btn = DOM.$(`#${reaction}Btn`);
            const countEl = DOM.$(`#${reaction}Count`);
            
            if (btn && countEl) {
                countEl.textContent = reactions[reaction] || 0;
                
                // 사용자가 이미 반응했는지 확인
                const hasReacted = userReactions[`${messageId}_${reaction}`];
                btn.classList.toggle('reacted', hasReacted);
            }
        });
    }

    /**
     * 메시지 카운터 업데이트
     */
    updateMessageCounter() {
        const counterEl = DOM.$('#messageCounter');
        if (counterEl) {
            counterEl.textContent = this.messageHistory.length;
        }
    }

    /**
     * 계절 표시기 업데이트
     */
    updateSeasonalIndicator() {
        const indicator = DOM.$('#seasonalIndicator');
        if (!indicator) return;

        const season = DateUtils.getCurrentSeason();
        const seasonData = {
            spring: { emoji: '🌸', text: '봄' },
            summer: { emoji: '☀️', text: '여름' },
            autumn: { emoji: '🍂', text: '가을' },
            winter: { emoji: '❄️', text: '겨울' }
        };

        const data = seasonData[season];
        if (data) {
            indicator.textContent = `${data.emoji} ${data.text}`;
            indicator.style.display = 'inline-block';
        }
    }

    /**
     * 스와이프 제스처 초기화
     */
    initSwipeGestures() {
        const quoteCard = DOM.$('#quoteCard');
        if (!quoteCard) return;

        let startX = 0;
        let startY = 0;

        const handleTouchStart = (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        };

        const handleTouchEnd = Performance.throttle((e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // 수평 스와이프 감지 (최소 50px, 수직 움직임보다 커야 함)
            if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX < 0) {
                    // 왼쪽 스와이프: 새 메시지
                    this.showRandomMessage();
                }
            }

            startX = 0;
            startY = 0;
        }, 300);

        quoteCard.addEventListener('touchstart', handleTouchStart, { passive: true });
        quoteCard.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    /**
     * 스크린 리더에 메시지 알림
     * @param {string} message - 알림 메시지
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        
        document.body.appendChild(announcement);
        announcement.textContent = message;
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * 데이터 새로고침
     */
    async refresh() {
        await this.loadMessages();
        this.loadUserData();
        this.showRandomMessage();
        uiManager.showNotification('메시지를 새로고침했습니다.', 'success');
    }
}

// 글로벌 메시지 매니저 인스턴스
export const messageManager = new MessageManager();