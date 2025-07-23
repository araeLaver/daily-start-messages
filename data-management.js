// Google Sheets API를 통한 데이터 관리 시스템

class DataManager {
    constructor() {
        this.sheetsApiKey = 'YOUR_GOOGLE_SHEETS_API_KEY';
        this.spreadsheetId = 'YOUR_SPREADSHEET_ID';
        this.range = 'Sheet1!A:F'; // ID, 텍스트, 작성자, 카테고리, 시간대, 생성일
        this.localVersion = localStorage.getItem('dataVersion') || '0';
        this.lastUpdate = localStorage.getItem('lastUpdate') || '0';
        this.localMessages = JSON.parse(localStorage.getItem('localMessages')) || [];
    }

    // Google Sheets에서 데이터 가져오기
    async fetchFromSheets() {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.range}?key=${this.sheetsApiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Google Sheets API 요청 실패');
            }
            
            const data = await response.json();
            return this.parseSheetData(data.values);
        } catch (error) {
            console.error('Google Sheets 데이터 가져오기 실패:', error);
            return null;
        }
    }

    // 시트 데이터 파싱
    parseSheetData(values) {
        if (!values || values.length < 2) return [];
        
        const headers = values[0];
        const messages = [];
        
        for (let i = 1; i < values.length; i++) {
            const row = values[i];
            if (row.length >= 6) {
                messages.push({
                    id: parseInt(row[0]) || i,
                    text: row[1] || '',
                    author: row[2] || '익명',
                    category: row[3] || '기타',
                    timeOfDay: row[4] || '',
                    createdAt: row[5] || new Date().toISOString().split('T')[0],
                    isNew: this.isNewMessage(row[5])
                });
            }
        }
        
        return messages;
    }

    // 신규 메시지 확인 (7일 이내)
    isNewMessage(createdAt) {
        const messageDate = new Date(createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return messageDate > weekAgo;
    }

    // 데이터 업데이트 확인 및 가져오기
    async updateData() {
        try {
            // 온라인 상태 확인
            if (!navigator.onLine) {
                console.log('오프라인 상태: 로컬 데이터 사용');
                return this.localMessages;
            }

            // 마지막 업데이트로부터 1시간이 지났는지 확인
            const now = Date.now();
            const lastUpdate = parseInt(this.lastUpdate);
            const oneHour = 60 * 60 * 1000;

            if (now - lastUpdate < oneHour) {
                console.log('최근 업데이트됨: 로컬 데이터 사용');
                return this.localMessages;
            }

            // Google Sheets에서 새 데이터 가져오기
            const newMessages = await this.fetchFromSheets();
            
            if (newMessages && newMessages.length > 0) {
                // 신규 메시지 확인
                const newCount = this.compareAndUpdate(newMessages);
                
                // 로컬 저장
                this.localMessages = newMessages;
                localStorage.setItem('localMessages', JSON.stringify(newMessages));
                localStorage.setItem('lastUpdate', now.toString());
                
                if (newCount > 0) {
                    this.notifyNewMessages(newCount);
                }
                
                return newMessages;
            } else {
                return this.localMessages;
            }
        } catch (error) {
            console.error('데이터 업데이트 실패:', error);
            return this.localMessages;
        }
    }

    // 새 메시지와 기존 메시지 비교
    compareAndUpdate(newMessages) {
        const existingIds = this.localMessages.map(msg => msg.id);
        const newMessagesList = newMessages.filter(msg => !existingIds.includes(msg.id));
        return newMessagesList.length;
    }

    // 신규 메시지 알림
    notifyNewMessages(count) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`새로운 메시지 ${count}개가 추가되었습니다! 🎉`, {
                body: '모닝 앱에서 새로운 명언들을 확인해보세요.',
                icon: '/icons/icon-192x192.png',
                tag: 'new-messages'
            });
        }
        
        // 앱 내 알림
        this.showInAppNotification(count);
    }

    // 앱 내 알림 표시
    showInAppNotification(count) {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🎉</span>
                <div class="notification-text">
                    <strong>새로운 메시지 ${count}개!</strong>
                    <p>따끈따끈한 새 명언들이 추가되었습니다.</p>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // 스타일 적용
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#22c55e',
            color: 'white',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(34, 197, 94, 0.3)',
            zIndex: '3000',
            maxWidth: '300px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        document.body.appendChild(notification);

        // 애니메이션
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 닫기 버튼
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        });

        // 자동 제거 (10초 후)
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 10000);
    }

    // 수동 새로고침
    async forceUpdate() {
        localStorage.removeItem('lastUpdate');
        return await this.updateData();
    }

    // 오프라인 모드 데이터 제공
    getOfflineData() {
        return this.localMessages.length > 0 ? this.localMessages : this.getFallbackData();
    }

    // 기본 데이터 (인터넷 연결 실패 시)
    getFallbackData() {
        return [
            {
                id: 1,
                text: "새로운 아침이 시작됩니다. 오늘도 좋은 하루 되세요!",
                author: "모닝",
                category: "새로운 시작",
                timeOfDay: "morning",
                createdAt: new Date().toISOString().split('T')[0],
                isNew: false
            }
        ];
    }
}

// 외부 명언 API 연동 시스템
class ExternalQuoteAPIs {
    constructor() {
        this.quotableBaseUrl = 'https://api.quotable.io';
        this.zenQuotesUrl = 'https://zenquotes.io/api';
        this.quotGardenUrl = 'https://quotegarden.herokuapp.com/api/v3';
    }

    // Quotable API에서 명언 가져오기
    async fetchFromQuotable(limit = 10) {
        try {
            const response = await fetch(`${this.quotableBaseUrl}/quotes?limit=${limit}&tags=inspirational,motivational`);
            const data = await response.json();
            
            return data.results.map((quote, index) => ({
                id: `quotable_${Date.now()}_${index}`,
                text: quote.content,
                author: quote.author,
                category: this.mapQuotableTags(quote.tags),
                timeOfDay: this.suggestTimeOfDay(quote.content),
                createdAt: new Date().toISOString().split('T')[0],
                isNew: true,
                source: 'Quotable API'
            }));
        } catch (error) {
            console.error('Quotable API 오류:', error);
            return [];
        }
    }

    // ZenQuotes API에서 명언 가져오기
    async fetchFromZenQuotes() {
        try {
            const response = await fetch(`${this.zenQuotesUrl}/quotes`);
            const data = await response.json();
            
            return data.slice(0, 10).map((quote, index) => ({
                id: `zen_${Date.now()}_${index}`,
                text: quote.q,
                author: quote.a,
                category: "영감",
                timeOfDay: this.suggestTimeOfDay(quote.q),
                createdAt: new Date().toISOString().split('T')[0],
                isNew: true,
                source: 'ZenQuotes API'
            }));
        } catch (error) {
            console.error('ZenQuotes API 오류:', error);
            return [];
        }
    }

    // 태그를 카테고리로 매핑
    mapQuotableTags(tags) {
        const tagMap = {
            'inspirational': '영감',
            'motivational': '동기부여',
            'success': '성공',
            'wisdom': '지혜',
            'happiness': '행복',
            'life': '인생',
            'love': '사랑',
            'courage': '용기'
        };

        return tags.map(tag => tagMap[tag] || tag).join(', ') || '명언';
    }

    // 텍스트 내용을 기반으로 시간대 추천
    suggestTimeOfDay(text) {
        const morningKeywords = ['아침', '시작', '새로운', 'morning', 'start', 'begin', 'dawn'];
        const eveningKeywords = ['저녁', '마무리', '끝', 'evening', 'end', 'reflect', 'sunset'];
        
        const lowerText = text.toLowerCase();
        
        if (morningKeywords.some(keyword => lowerText.includes(keyword))) {
            return 'morning';
        } else if (eveningKeywords.some(keyword => lowerText.includes(keyword))) {
            return 'evening';
        }
        
        return '';
    }

    // 모든 API에서 명언 수집
    async collectFromAllAPIs() {
        const promises = [
            this.fetchFromQuotable(5),
            this.fetchFromZenQuotes()
        ];

        try {
            const results = await Promise.allSettled(promises);
            const allQuotes = [];

            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    allQuotes.push(...result.value);
                }
            });

            return allQuotes;
        } catch (error) {
            console.error('외부 API 수집 오류:', error);
            return [];
        }
    }
}

// 데이터 캐싱 시스템
class CacheManager {
    constructor() {
        this.cacheName = 'morning-quotes-cache-v1';
        this.maxCacheSize = 1000; // 최대 1000개 메시지
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24시간
    }

    // 캐시에 데이터 저장
    async setCache(key, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now(),
                expiry: Date.now() + this.cacheExpiry
            };

            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
            
            // IndexedDB 사용 (대용량 데이터용)
            if ('indexedDB' in window) {
                await this.setIndexedDBCache(key, cacheData);
            }
        } catch (error) {
            console.error('캐시 저장 실패:', error);
        }
    }

    // 캐시에서 데이터 가져오기
    async getCache(key) {
        try {
            // localStorage에서 먼저 확인
            const localData = localStorage.getItem(`cache_${key}`);
            if (localData) {
                const parsed = JSON.parse(localData);
                if (parsed.expiry > Date.now()) {
                    return parsed.data;
                }
            }

            // IndexedDB에서 확인
            if ('indexedDB' in window) {
                return await this.getIndexedDBCache(key);
            }

            return null;
        } catch (error) {
            console.error('캐시 읽기 실패:', error);
            return null;
        }
    }

    // IndexedDB 캐시 설정
    async setIndexedDBCache(key, data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MorningQuotesDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['quotes'], 'readwrite');
                const store = transaction.objectStore('quotes');
                
                store.put({ key, ...data });
                transaction.oncomplete = () => resolve();
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('quotes')) {
                    db.createObjectStore('quotes', { keyPath: 'key' });
                }
            };
        });
    }

    // IndexedDB 캐시 가져오기
    async getIndexedDBCache(key) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MorningQuotesDB', 1);
            
            request.onerror = () => resolve(null);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['quotes'], 'readonly');
                const store = transaction.objectStore('quotes');
                const getRequest = store.get(key);
                
                getRequest.onsuccess = () => {
                    const result = getRequest.result;
                    if (result && result.expiry > Date.now()) {
                        resolve(result.data);
                    } else {
                        resolve(null);
                    }
                };
            };
        });
    }

    // 캐시 정리
    async clearExpiredCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.expiry < Date.now()) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            }
        });
    }
}

// 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataManager, ExternalQuoteAPIs, CacheManager };
}