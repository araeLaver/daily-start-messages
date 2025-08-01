/**
 * API 클라이언트 모듈
 * PostgreSQL 백엔드와 통신하는 API 클라이언트
 */

import { ErrorHandler } from './utils.js';

class ApiClient {
    constructor() {
        // API 서버 URL 설정
        this.baseURL = this.getApiBaseUrl();
        this.timeout = 10000; // 10초 타임아웃
        this.retryCount = 3;
        
        console.log(`API Client initialized with base URL: ${this.baseURL}`);
    }
    
    /**
     * 환경에 따른 API 서버 URL 결정
     */
    getApiBaseUrl() {
        const hostname = window.location.hostname;
        
        // 로컬 개발 환경
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000';
        }
        
        // 프로덕션 환경 - Koyeb 서버
        return 'https://daily-messages-api.koyeb.app';
    }
    
    /**
     * HTTP 요청 헬퍼
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: this.timeout
        };
        
        const config = { ...defaultOptions, ...options };
        
        // 재시도 로직
        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                return data;
                
            } catch (error) {
                console.warn(`API request attempt ${attempt} failed:`, error.message);
                
                if (attempt === this.retryCount) {
                    throw error;
                }
                
                // 재시도 대기 (지수 백오프)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    
    /**
     * 데이터베이스 연결 상태 확인
     */
    async checkConnection() {
        try {
            const response = await this.request('/health');
            return response.status === 'healthy';
        } catch (error) {
            console.error('Database connection check failed:', error);
            return false;
        }
    }
    
    /**
     * 랜덤 메시지 조회
     */
    async getRandomMessage(category = null, timeOfDay = null) {
        try {
            const params = new URLSearchParams();
            if (category && category !== 'all') params.append('category', category);
            if (timeOfDay && timeOfDay !== 'all') params.append('time_of_day', timeOfDay);
            
            const queryString = params.toString();
            const endpoint = `/api/messages/random${queryString ? '?' + queryString : ''}`;
            
            const response = await this.request(endpoint);
            return response;
            
        } catch (error) {
            ErrorHandler.handle(error, 'ApiClient.getRandomMessage');
            throw error;
        }
    }
    
    /**
     * 메시지 목록 조회
     */
    async getMessages(options = {}) {
        try {
            const params = new URLSearchParams();
            
            if (options.category && options.category !== 'all') {
                params.append('category', options.category);
            }
            if (options.timeOfDay && options.timeOfDay !== 'all') {
                params.append('time_of_day', options.timeOfDay);
            }
            if (options.limit) {
                params.append('limit', options.limit);
            }
            if (options.randomOrder !== undefined) {
                params.append('random_order', options.randomOrder);
            }
            
            const queryString = params.toString();
            const endpoint = `/api/messages${queryString ? '?' + queryString : ''}`;
            
            const response = await this.request(endpoint);
            return response;
            
        } catch (error) {
            ErrorHandler.handle(error, 'ApiClient.getMessages');
            throw error;
        }
    }
    
    /**
     * 카테고리 목록 조회
     */
    async getCategories() {
        try {
            const response = await this.request('/api/categories');
            return response.categories || [];
        } catch (error) {
            ErrorHandler.handle(error, 'ApiClient.getCategories');
            throw error;
        }
    }
    
    /**
     * 메시지에 반응 추가
     */
    async addReaction(messageId, reaction) {
        try {
            const response = await this.request(`/api/messages/${messageId}/reaction`, {
                method: 'POST',
                body: JSON.stringify({ reaction })
            });
            return response;
        } catch (error) {
            ErrorHandler.handle(error, 'ApiClient.addReaction');
            throw error;
        }
    }
    
    /**
     * 통계 정보 조회
     */
    async getStats() {
        try {
            const response = await this.request('/api/stats');
            return response;
        } catch (error) {
            ErrorHandler.handle(error, 'ApiClient.getStats');
            throw error;
        }
    }
}

/**
 * Fallback 메시지 (데이터베이스 연결 실패 시 사용)
 */
class FallbackMessageProvider {
    constructor() {
        this.fallbackMessages = [
            {
                id: 'fallback_1',
                text: '새로운 하루가 시작됩니다. 오늘도 최선을 다해보세요!',
                author: '하루의 시작',
                category: '동기부여',
                timeOfDay: '',
                createdAt: new Date().toISOString()
            },
            {
                id: 'fallback_2', 
                text: '당신은 생각보다 훨씬 강하고 능력이 뛰어납니다.',
                author: '긍정의 메시지',
                category: '자신감',
                timeOfDay: '',
                createdAt: new Date().toISOString()
            },
            {
                id: 'fallback_3',
                text: '오늘 하루도 감사한 마음으로 시작하세요.',
                author: '일상의 지혜',
                category: '감사',
                timeOfDay: 'morning',
                createdAt: new Date().toISOString()
            }
        ];
    }
    
    getRandomMessage() {
        const randomIndex = Math.floor(Math.random() * this.fallbackMessages.length);
        return {
            message: this.fallbackMessages[randomIndex],
            metadata: {
                source: 'fallback',
                selectedFrom: this.fallbackMessages.length
            }
        };
    }
    
    getMessages() {
        return {
            messages: this.fallbackMessages,
            total: this.fallbackMessages.length,
            source: 'fallback'
        };
    }
}

/**
 * 하이브리드 메시지 매니저
 * API와 로컬 JSON 모두 지원
 */
export class HybridMessageManager {
    constructor() {
        this.apiClient = new ApiClient();
        this.fallbackProvider = new FallbackMessageProvider();
        this.useDatabase = false;
        this.connectionChecked = false;
        
        this.init();
    }
    
    async init() {
        // 데이터베이스 연결 확인
        try {
            this.useDatabase = await this.apiClient.checkConnection();
            console.log(`Database connection: ${this.useDatabase ? 'SUCCESS' : 'FAILED'}`);
        } catch (error) {
            console.warn('Database connection check failed, using fallback');
            this.useDatabase = false;
        }
        
        this.connectionChecked = true;
    }
    
    async waitForInit() {
        while (!this.connectionChecked) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    async getRandomMessage(category = null, timeOfDay = null) {
        await this.waitForInit();
        
        if (this.useDatabase) {
            try {
                return await this.apiClient.getRandomMessage(category, timeOfDay);
            } catch (error) {
                console.warn('Database request failed, using fallback:', error.message);
                this.useDatabase = false; // 향후 요청은 fallback 사용
            }
        }
        
        // Fallback 또는 로컬 JSON 사용
        return await this.getFallbackMessage(category, timeOfDay);
    }
    
    async getMessages(options = {}) {
        await this.waitForInit();
        
        if (this.useDatabase) {
            try {
                return await this.apiClient.getMessages(options);
            } catch (error) {
                console.warn('Database request failed, using fallback:', error.message);
                this.useDatabase = false;
            }
        }
        
        return this.fallbackProvider.getMessages();
    }
    
    async getCategories() {
        await this.waitForInit();
        
        if (this.useDatabase) {
            try {
                return await this.apiClient.getCategories();
            } catch (error) {
                console.warn('Database request failed, using fallback categories');
            }
        }
        
        // 기본 카테고리 반환
        return [
            { name: '동기부여', count: 10 },
            { name: '자신감', count: 8 },
            { name: '성공', count: 12 },
            { name: '감사', count: 6 }
        ];
    }
    
    async addReaction(messageId, reaction) {
        if (this.useDatabase) {
            try {
                return await this.apiClient.addReaction(messageId, reaction);
            } catch (error) {
                console.warn('Reaction submission failed:', error.message);
            }
        }
        
        // 로컬에서는 반응을 localStorage에 저장
        const reactions = JSON.parse(localStorage.getItem('message_reactions') || '{}');
        if (!reactions[messageId]) reactions[messageId] = [];
        reactions[messageId].push({
            reaction,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('message_reactions', JSON.stringify(reactions));
        
        return { message: '반응이 기록되었습니다', reaction };
    }
    
    /**
     * Fallback 메시지 제공 (로컬 JSON 파일 로드 시도)
     */
    async getFallbackMessage(category, timeOfDay) {
        try {
            // 기존 로컬 JSON 파일 로드 시도
            const response = await fetch('./messages.json');
            if (response.ok) {
                const data = await response.json();
                const messages = data.messages || [];
                
                // 필터링 로직
                let filteredMessages = messages.filter(msg => msg && msg.text);
                
                if (category && category !== 'all') {
                    filteredMessages = filteredMessages.filter(msg => msg.category === category);
                }
                
                if (timeOfDay && timeOfDay !== 'all') {
                    filteredMessages = filteredMessages.filter(msg => 
                        !msg.timeOfDay || msg.timeOfDay === '' || msg.timeOfDay === timeOfDay
                    );
                }
                
                if (filteredMessages.length > 0) {
                    const randomMessage = filteredMessages[Math.floor(Math.random() * filteredMessages.length)];
                    return {
                        message: randomMessage,
                        metadata: {
                            source: 'local_json',
                            selectedFrom: filteredMessages.length
                        }
                    };
                }
            }
        } catch (error) {
            console.warn('Local JSON load failed:', error.message);
        }
        
        // 최종 fallback
        return this.fallbackProvider.getRandomMessage();
    }
    
    isUsingDatabase() {
        return this.useDatabase;
    }
}

// 전역 인스턴스 생성
export const messageManager = new HybridMessageManager();