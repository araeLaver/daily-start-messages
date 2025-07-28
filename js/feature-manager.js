/**
 * 기능 관리 모듈
 * 즐겨찾기, 히스토리, 일기, 목표 등 고급 기능들 관리
 */

import { Security, DateUtils, Storage, DOM, ErrorHandler } from './utils.js';
import { uiManager } from './ui-manager.js';

export class FeatureManager {
    constructor() {
        this.favorites = [];
        this.messageHistory = [];
        this.dailyJournal = {};
        this.userGoals = {
            weekly: [],
            monthly: []
        };
        this.habitTracker = {};
        this.userMessages = [];
        
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        try {
            this.loadData();
            this.bindEvents();
            console.log('Feature Manager initialized successfully');
        } catch (error) {
            ErrorHandler.handle(error, 'FeatureManager.init', true);
        }
    }

    /**
     * 데이터 로드
     */
    loadData() {
        this.favorites = Storage.get('favorites', []);
        this.messageHistory = Storage.get('messageHistory', []);
        this.dailyJournal = Storage.get('dailyJournal', {});
        this.userGoals = Storage.get('userGoals', { weekly: [], monthly: [] });
        this.habitTracker = Storage.get('habitTracker', {});
        this.userMessages = Storage.get('userMessages', []);
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 즐겨찾기 모달 이벤트
        const favoritesBtn = DOM.$('#favoritesBtn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => this.showFavorites());
        }

        // 히스토리 모달 이벤트
        const historyBtn = DOM.$('#historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.showHistory());
        }

        // 일기 모달 이벤트
        const journalBtn = DOM.$('#journalBtn');
        if (journalBtn) {
            journalBtn.addEventListener('click', () => this.showJournal());
        }

        // 목표 모달 이벤트
        const goalsBtn = DOM.$('#goalsBtn');
        if (goalsBtn) {
            goalsBtn.addEventListener('click', () => this.showGoals());
        }

        // 제출 모달 이벤트
        const submitBtn = DOM.$('#submitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.showSubmit());
        }
    }

    /**
     * 즐겨찾기 표시
     */
    showFavorites() {
        uiManager.openModal('favoritesModal', {
            onOpen: (modal) => this.renderFavorites(modal)
        });
        uiManager.closeSidebar();
    }

    /**
     * 즐겨찾기 렌더링
     */
    renderFavorites(modal) {
        const favoritesList = modal.querySelector('#favoritesList');
        const favoritesEmpty = modal.querySelector('#favoritesEmpty');

        if (!favoritesList) return;

        if (this.favorites.length === 0) {
            if (favoritesEmpty) favoritesEmpty.style.display = 'block';
            favoritesList.innerHTML = '';
            return;
        }

        if (favoritesEmpty) favoritesEmpty.style.display = 'none';

        favoritesList.innerHTML = this.favorites.map((fav, index) => `
            <div class="favorite-item">
                <div class="favorite-content">
                    <div class="favorite-text">"${Security.escapeHtml(fav.message.text)}"</div>
                    <cite class="favorite-author">- ${Security.escapeHtml(fav.message.author || '익명')}</cite>
                    <div class="favorite-meta">
                        <span class="favorite-category">${Security.escapeHtml(fav.message.category || '')}</span>
                        <span class="favorite-date">${DateUtils.formatDate(new Date(fav.addedAt))}</span>
                    </div>
                </div>
                <div class="favorite-actions">
                    <button class="favorite-action-btn" onclick="featureManager.removeFavorite(${index})" 
                            title="즐겨찾기에서 제거">❌</button>
                    <button class="favorite-action-btn" onclick="featureManager.shareFavorite(${index})" 
                            title="공유하기">📤</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 즐겨찾기 제거
     */
    removeFavorite(index) {
        if (index >= 0 && index < this.favorites.length) {
            this.favorites.splice(index, 1);
            Storage.set('favorites', this.favorites);
            
            // UI 업데이트
            const modal = DOM.$('#favoritesModal');
            if (modal && modal.style.display !== 'none') {
                this.renderFavorites(modal);
            }
            
            uiManager.showNotification('즐겨찾기에서 제거되었습니다.', 'info');
        }
    }

    /**
     * 즐겨찾기 공유
     */
    async shareFavorite(index) {
        if (index >= 0 && index < this.favorites.length) {
            const fav = this.favorites[index];
            const shareText = `"${fav.message.text}"\n\n- ${fav.message.author}\n\n#모닝앱 #좋은글귀`;
            
            try {
                if (navigator.share) {
                    await navigator.share({ text: shareText });
                } else {
                    await navigator.clipboard.writeText(shareText);
                    uiManager.showNotification('클립보드에 복사되었습니다.', 'success');
                }
            } catch (error) {
                ErrorHandler.handle(error, 'FeatureManager.shareFavorite');
            }
        }
    }

    /**
     * 히스토리 표시
     */
    showHistory() {
        uiManager.openModal('historyModal', {
            onOpen: (modal) => this.renderHistory(modal)
        });
        uiManager.closeSidebar();
    }

    /**
     * 히스토리 렌더링
     */
    renderHistory(modal) {
        const historyList = modal.querySelector('#historyList');
        const historyEmpty = modal.querySelector('#historyEmpty');
        const historyCount = modal.querySelector('#historyCount');
        const clearHistoryBtn = modal.querySelector('#clearHistoryBtn');

        if (!historyList) return;

        // 히스토리 카운트 업데이트
        if (historyCount) {
            historyCount.textContent = this.messageHistory.length;
        }

        if (this.messageHistory.length === 0) {
            if (historyEmpty) historyEmpty.style.display = 'block';
            historyList.innerHTML = '';
            if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
            return;
        }

        if (historyEmpty) historyEmpty.style.display = 'none';
        if (clearHistoryBtn) {
            clearHistoryBtn.style.display = 'block';
            clearHistoryBtn.onclick = () => this.clearHistory();
        }

        // 날짜별로 그룹화
        const groupedHistory = this.groupHistoryByDate();
        
        historyList.innerHTML = Object.entries(groupedHistory).map(([date, items]) => `
            <div class="history-group">
                <div class="history-date-header">${date}</div>
                <div class="history-group-items">
                    ${items.map((item, index) => `
                        <div class="history-item">
                            <div class="history-content">
                                <div class="history-text">"${Security.escapeHtml(item.message.text)}"</div>
                                <div class="history-meta">
                                    <span class="history-author">- ${Security.escapeHtml(item.message.author || '익명')}</span>
                                    <span class="history-category">${Security.escapeHtml(item.message.category || '')}</span>
                                    <span class="history-time">${new Date(item.viewedAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}</span>
                                </div>
                            </div>
                            <div class="history-actions">
                                <button class="history-action-btn" onclick="featureManager.shareHistoryItem('${item.message.id}')" 
                                        title="공유하기">📤</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * 히스토리를 날짜별로 그룹화
     */
    groupHistoryByDate() {
        const grouped = {};
        
        this.messageHistory.slice().reverse().forEach(item => {
            const date = new Date(item.viewedAt).toLocaleDateString('ko-KR');
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(item);
        });
        
        return grouped;
    }

    /**
     * 히스토리 삭제
     */
    clearHistory() {
        if (confirm('모든 히스토리를 삭제하시겠습니까?')) {
            this.messageHistory = [];
            Storage.set('messageHistory', this.messageHistory);
            
            const modal = DOM.$('#historyModal');
            if (modal && modal.style.display !== 'none') {
                this.renderHistory(modal);
            }
            
            uiManager.showNotification('히스토리가 삭제되었습니다.', 'info');
        }
    }

    /**
     * 히스토리 항목 공유
     */
    async shareHistoryItem(messageId) {
        const historyItem = this.messageHistory.find(item => item.message.id === messageId);
        if (historyItem) {
            const shareText = `"${historyItem.message.text}"\n\n- ${historyItem.message.author}\n\n#모닝앱 #좋은글귀`;
            
            try {
                if (navigator.share) {
                    await navigator.share({ text: shareText });
                } else {
                    await navigator.clipboard.writeText(shareText);
                    uiManager.showNotification('클립보드에 복사되었습니다.', 'success');
                }
            } catch (error) {
                ErrorHandler.handle(error, 'FeatureManager.shareHistoryItem');
            }
        }
    }

    /**
     * 일기 표시
     */
    showJournal() {
        uiManager.openModal('journalModal', {
            onOpen: (modal) => this.renderJournal(modal)
        });
        uiManager.closeSidebar();
    }

    /**
     * 일기 렌더링
     */
    renderJournal(modal) {
        const journalDate = modal.querySelector('#journalDate');
        const journalText = modal.querySelector('#journalText');
        const charCount = modal.querySelector('#charCount');
        const saveJournalBtn = modal.querySelector('#saveJournalBtn');
        const cancelJournalBtn = modal.querySelector('#cancelJournalBtn');
        const journalList = modal.querySelector('#journalList');
        const moodBtns = modal.querySelectorAll('.mood-btn');

        if (!modal) return;

        // 오늘 날짜 설정
        const today = new Date().toLocaleDateString('ko-KR');
        if (journalDate) journalDate.textContent = today;

        // 오늘의 일기가 있다면 로드
        const todayKey = new Date().toISOString().split('T')[0];
        const todayJournal = this.dailyJournal[todayKey];

        if (todayJournal) {
            if (journalText) journalText.value = todayJournal.text || '';
            this.setSelectedMood(modal, todayJournal.mood);
        } else {
            if (journalText) journalText.value = '';
            this.setSelectedMood(modal, null);
        }

        // 글자 수 카운터
        if (journalText && charCount) {
            charCount.textContent = journalText.value.length;
            journalText.addEventListener('input', () => {
                charCount.textContent = journalText.value.length;
            });
        }

        // 기분 선택 이벤트
        moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                moodBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // 저장 버튼
        if (saveJournalBtn) {
            saveJournalBtn.onclick = () => this.saveJournal(modal);
        }

        // 취소 버튼
        if (cancelJournalBtn) {
            cancelJournalBtn.onclick = () => uiManager.closeModal('journalModal');
        }

        // 지난 일기들 렌더링
        this.renderJournalHistory(modal);
    }

    /**
     * 기분 설정
     */
    setSelectedMood(modal, mood) {
        const moodBtns = modal.querySelectorAll('.mood-btn');
        moodBtns.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.mood === mood);
        });
    }

    /**
     * 일기 저장
     */
    saveJournal(modal) {
        const journalText = modal.querySelector('#journalText');
        const selectedMoodBtn = modal.querySelector('.mood-btn.selected');
        
        if (!journalText) return;

        const text = journalText.value.trim();
        const mood = selectedMoodBtn ? selectedMoodBtn.dataset.mood : null;

        if (!text && !mood) {
            uiManager.showNotification('일기 내용이나 기분을 입력해주세요.', 'warning');
            return;
        }

        const todayKey = new Date().toISOString().split('T')[0];
        
        this.dailyJournal[todayKey] = {
            text: Security.sanitizeInput(text, 1000),
            mood,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        Storage.set('dailyJournal', this.dailyJournal);
        
        uiManager.showNotification('일기가 저장되었습니다.', 'success');
        uiManager.closeModal('journalModal');
    }

    /**
     * 일기 히스토리 렌더링
     */
    renderJournalHistory(modal) {
        const journalList = modal.querySelector('#journalList');
        if (!journalList) return;

        const entries = Object.entries(this.dailyJournal)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .slice(0, 10); // 최근 10개만

        if (entries.length === 0) {
            journalList.innerHTML = '<p class="journal-empty">작성된 일기가 없습니다.</p>';
            return;
        }

        const moodEmojis = {
            great: '😄',
            good: '😊',
            okay: '😐',
            bad: '😔',
            terrible: '😢'
        };

        journalList.innerHTML = entries.map(([date, entry]) => `
            <div class="journal-history-item">
                <div class="journal-history-header">
                    <span class="journal-history-date">${new Date(date).toLocaleDateString('ko-KR')}</span>
                    <span class="journal-history-mood">${moodEmojis[entry.mood] || ''}</span>
                </div>
                <div class="journal-history-text">${Security.escapeHtml(entry.text || '').substring(0, 100)}${entry.text && entry.text.length > 100 ? '...' : ''}</div>
            </div>
        `).join('');
    }

    /**
     * 목표 표시
     */
    showGoals() {
        uiManager.openModal('goalsModal', {
            onOpen: (modal) => this.renderGoals(modal)
        });
        uiManager.closeSidebar();
    }

    /**
     * 목표 렌더링
     */
    renderGoals(modal) {
        // 기본적인 목표 UI 렌더링
        uiManager.showNotification('목표 기능은 준비 중입니다.', 'info');
    }

    /**
     * 제출 표시
     */
    showSubmit() {
        uiManager.openModal('submitModal', {
            onOpen: (modal) => this.renderSubmit(modal)
        });
        uiManager.closeSidebar();
    }

    /**
     * 제출 렌더링
     */
    renderSubmit(modal) {
        // 기본적인 제출 UI 렌더링
        uiManager.showNotification('메시지 제출 기능은 준비 중입니다.', 'info');
    }

    /**
     * 즐겨찾기에 메시지 추가
     */
    addToFavorites(message) {
        const isAlreadyFavorite = this.favorites.some(fav => fav.message.id === message.id);
        
        if (isAlreadyFavorite) {
            return false; // 이미 즐겨찾기에 있음
        }

        this.favorites.push({
            message: { ...message },
            addedAt: new Date().toISOString()
        });

        Storage.set('favorites', this.favorites);
        return true; // 추가됨
    }

    /**
     * 즐겨찾기에서 메시지 제거
     */
    removeFromFavorites(messageId) {
        const originalLength = this.favorites.length;
        this.favorites = this.favorites.filter(fav => fav.message.id !== messageId);
        
        if (this.favorites.length < originalLength) {
            Storage.set('favorites', this.favorites);
            return true; // 제거됨
        }
        
        return false; // 제거할 항목이 없었음
    }

    /**
     * 히스토리에 메시지 추가
     */
    addToHistory(message) {
        // 중복 제거 (같은 메시지를 연속으로 본 경우)
        const lastHistoryItem = this.messageHistory[this.messageHistory.length - 1];
        if (lastHistoryItem && lastHistoryItem.message.id === message.id) {
            return;
        }

        this.messageHistory.push({
            message: { ...message },
            viewedAt: new Date().toISOString()
        });

        // 히스토리 크기 제한 (최대 100개)
        if (this.messageHistory.length > 100) {
            this.messageHistory = this.messageHistory.slice(-100);
        }

        Storage.set('messageHistory', this.messageHistory);
    }

    /**
     * 메시지가 즐겨찾기에 있는지 확인
     */
    isFavorite(messageId) {
        return this.favorites.some(fav => fav.message.id === messageId);
    }
}

// 글로벌 인스턴스
export const featureManager = new FeatureManager();

// 전역 접근을 위해 window에 추가
window.featureManager = featureManager;