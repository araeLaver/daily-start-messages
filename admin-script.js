// 관리자 대시보드 JavaScript

// 전역 변수
let dataManager = null;
let externalAPIs = null;
let cacheManager = null;
let currentMessages = [];
let filteredMessages = [];
let currentPage = 1;
const messagesPerPage = 10;

// DOM 요소
const elements = {
    // 네비게이션
    navBtns: document.querySelectorAll('.nav-btn'),
    tabs: document.querySelectorAll('.admin-tab'),
    
    // 대시보드 통계
    totalMessagesCount: document.getElementById('totalMessagesCount'),
    newMessagesCount: document.getElementById('newMessagesCount'),
    totalCategoriesCount: document.getElementById('totalCategoriesCount'),
    lastUpdateTime: document.getElementById('lastUpdateTime'),
    updateStatus: document.getElementById('updateStatus'),
    dataSourceCount: document.getElementById('dataSourceCount'),
    activityList: document.getElementById('activityList'),
    
    // 대시보드 액션 버튼
    updateDataBtn: document.getElementById('updateDataBtn'),
    collectExternalBtn: document.getElementById('collectExternalBtn'),
    exportAllBtn: document.getElementById('exportAllBtn'),
    
    // 메시지 관리
    searchInput: document.getElementById('searchInput'),
    categoryFilter: document.getElementById('categoryFilter'),
    sourceFilter: document.getElementById('sourceFilter'),
    addMessageBtn: document.getElementById('addMessageBtn'),
    messagesTableBody: document.getElementById('messagesTableBody'),
    currentPage: document.getElementById('currentPage'),
    totalPages: document.getElementById('totalPages'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    
    // 데이터 가져오기
    sheetsApiKey: document.getElementById('sheetsApiKey'),
    spreadsheetId: document.getElementById('spreadsheetId'),
    connectSheetsBtn: document.getElementById('connectSheetsBtn'),
    sheetsStatus: document.getElementById('sheetsStatus'),
    quotableApi: document.getElementById('quotableApi'),
    zenQuotesApi: document.getElementById('zenQuotesApi'),
    collectApiBtn: document.getElementById('collectApiBtn'),
    apiCollectionStatus: document.getElementById('apiCollectionStatus'),
    fileInput: document.getElementById('fileInput'),
    fileInfo: document.getElementById('fileInfo'),
    uploadFileBtn: document.getElementById('uploadFileBtn'),
    
    // 설정
    autoUpdateToggle: document.getElementById('autoUpdateToggle'),
    updateInterval: document.getElementById('updateInterval'),
    duplicateCheckToggle: document.getElementById('duplicateCheckToggle'),
    maxMessages: document.getElementById('maxMessages'),
    adminNotificationToggle: document.getElementById('adminNotificationToggle'),
    adminEmail: document.getElementById('adminEmail'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    clearAllDataBtn: document.getElementById('clearAllDataBtn'),
    
    // 모달
    messageModal: document.getElementById('messageModal'),
    messageModalClose: document.getElementById('messageModalClose'),
    modalTitle: document.getElementById('modalTitle'),
    messageForm: document.getElementById('messageForm'),
    messageId: document.getElementById('messageId'),
    messageText: document.getElementById('messageText'),
    messageAuthor: document.getElementById('messageAuthor'),
    messageCategory: document.getElementById('messageCategory'),
    messageTimeOfDay: document.getElementById('messageTimeOfDay'),
    cancelMessageBtn: document.getElementById('cancelMessageBtn')
};

// 초기화
document.addEventListener('DOMContentLoaded', initAdmin);

async function initAdmin() {
    try {
        // 데이터 관리 클래스 초기화
        dataManager = new DataManager();
        externalAPIs = new ExternalQuoteAPIs();
        cacheManager = new CacheManager();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 초기 데이터 로드
        await loadInitialData();
        
        // 대시보드 업데이트
        updateDashboard();
        
        addActivity('관리자 대시보드 시작됨');
        
    } catch (error) {
        console.error('관리자 초기화 실패:', error);
        showAlert('관리자 대시보드 초기화에 실패했습니다.', 'error');
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 네비게이션
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.dataset.tab) {
                switchTab(e.target.dataset.tab);
            }
        });
    });
    
    // 대시보드 액션
    elements.updateDataBtn.addEventListener('click', updateData);
    elements.collectExternalBtn.addEventListener('click', collectExternalData);
    elements.exportAllBtn.addEventListener('click', exportAllData);
    
    // 메시지 관리
    elements.searchInput.addEventListener('input', filterMessages);
    elements.categoryFilter.addEventListener('change', filterMessages);
    elements.sourceFilter.addEventListener('change', filterMessages);
    elements.addMessageBtn.addEventListener('click', openAddMessageModal);
    elements.prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
    elements.nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
    
    // 데이터 가져오기
    elements.connectSheetsBtn.addEventListener('click', connectGoogleSheets);
    elements.collectApiBtn.addEventListener('click', collectFromAPIs);
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.uploadFileBtn.addEventListener('click', uploadFile);
    
    // 설정
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    elements.resetSettingsBtn.addEventListener('click', resetSettings);
    elements.clearAllDataBtn.addEventListener('click', clearAllData);
    
    // 모달
    elements.messageModalClose.addEventListener('click', closeMessageModal);
    elements.cancelMessageBtn.addEventListener('click', closeMessageModal);
    elements.messageForm.addEventListener('submit', saveMessage);
    
    // 모달 외부 클릭
    window.addEventListener('click', (e) => {
        if (e.target === elements.messageModal) {
            closeMessageModal();
        }
    });
}

// 초기 데이터 로드
async function loadInitialData() {
    try {
        // 로컬 메시지 로드
        const localMessages = await loadLocalMessages();
        
        // 캐시된 데이터 확인
        const cachedMessages = await cacheManager.getCache('all_messages');
        
        if (cachedMessages && cachedMessages.length > 0) {
            currentMessages = cachedMessages;
        } else {
            currentMessages = localMessages;
        }
        
        filteredMessages = [...currentMessages];
        
        // 카테고리 필터 설정
        setupCategoryFilter();
        
        // 메시지 테이블 렌더링
        renderMessagesTable();
        
    } catch (error) {
        console.error('초기 데이터 로드 실패:', error);
        currentMessages = [];
        filteredMessages = [];
    }
}

// 로컬 메시지 로드 (기존 messages.json)
async function loadLocalMessages() {
    try {
        const response = await fetch('../messages.json');
        const data = await response.json();
        return data.messages.map(msg => ({
            ...msg,
            source: 'local',
            status: 'active'
        }));
    } catch (error) {
        console.error('로컬 메시지 로드 실패:', error);
        return [];
    }
}

// 탭 전환
function switchTab(tabName) {
    // 네비게이션 버튼 업데이트
    elements.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // 탭 콘텐츠 표시/숨김
    elements.tabs.forEach(tab => {
        tab.style.display = tab.id === `${tabName}Tab` ? 'block' : 'none';
    });
    
    // 특정 탭 로드 시 추가 작업
    switch (tabName) {
        case 'messages':
            renderMessagesTable();
            break;
        case 'import':
            updateConnectionStatus();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// 대시보드 업데이트
function updateDashboard() {
    // 총 메시지 수
    elements.totalMessagesCount.textContent = currentMessages.length;
    
    // 신규 메시지 수 (7일 이내)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newMessages = currentMessages.filter(msg => 
        new Date(msg.createdAt) > weekAgo
    );
    elements.newMessagesCount.textContent = newMessages.length;
    
    // 카테고리 수
    const categories = new Set(currentMessages.map(msg => msg.category));
    elements.totalCategoriesCount.textContent = categories.size;
    
    // 마지막 업데이트 시간
    const lastUpdate = localStorage.getItem('lastUpdate');
    if (lastUpdate) {
        const date = new Date(parseInt(lastUpdate));
        elements.lastUpdateTime.textContent = date.toLocaleString('ko-KR');
        elements.updateStatus.textContent = '동기화됨';
    } else {
        elements.lastUpdateTime.textContent = '없음';
        elements.updateStatus.textContent = '대기 중';
    }
}

// 데이터 업데이트
async function updateData() {
    try {
        elements.updateDataBtn.disabled = true;
        elements.updateDataBtn.textContent = '업데이트 중...';
        
        // 데이터 매니저를 통한 업데이트
        const updatedMessages = await dataManager.updateData();
        
        if (updatedMessages && updatedMessages.length > 0) {
            currentMessages = updatedMessages.map(msg => ({
                ...msg,
                source: msg.source || 'sheets',
                status: 'active'
            }));
            
            // 캐시 저장
            await cacheManager.setCache('all_messages', currentMessages);
            
            // 필터링된 메시지 업데이트
            filterMessages();
            
            // 대시보드 업데이트
            updateDashboard();
            
            showAlert(`${updatedMessages.length}개의 메시지가 업데이트되었습니다.`, 'success');
            addActivity(`데이터 업데이트 완료 (${updatedMessages.length}개 메시지)`);
        } else {
            showAlert('새로운 업데이트가 없습니다.', 'info');
        }
        
    } catch (error) {
        console.error('데이터 업데이트 실패:', error);
        showAlert('데이터 업데이트에 실패했습니다.', 'error');
    } finally {
        elements.updateDataBtn.disabled = false;
        elements.updateDataBtn.textContent = '🔄 데이터 업데이트';
    }
}

// 외부 API 수집
async function collectExternalData() {
    try {
        elements.collectExternalBtn.disabled = true;
        elements.collectExternalBtn.textContent = '수집 중...';
        
        const selectedAPIs = [];
        if (elements.quotableApi.checked) selectedAPIs.push('quotable');
        if (elements.zenQuotesApi.checked) selectedAPIs.push('zenquotes');
        
        if (selectedAPIs.length === 0) {
            showAlert('수집할 API를 선택해주세요.', 'warning');
            return;
        }
        
        // 외부 API에서 데이터 수집
        const newQuotes = await externalAPIs.collectFromAllAPIs();
        
        if (newQuotes.length > 0) {
            // 중복 제거
            const existingIds = currentMessages.map(msg => msg.id);
            const uniqueQuotes = newQuotes.filter(quote => 
                !existingIds.includes(quote.id)
            );
            
            if (uniqueQuotes.length > 0) {
                currentMessages.push(...uniqueQuotes);
                
                // 캐시 업데이트
                await cacheManager.setCache('all_messages', currentMessages);
                
                // UI 업데이트
                filterMessages();
                updateDashboard();
                
                showAlert(`${uniqueQuotes.length}개의 새로운 명언을 수집했습니다.`, 'success');
                addActivity(`외부 API 수집 완료 (${uniqueQuotes.length}개 새 명언)`);
            } else {
                showAlert('새로운 명언이 없습니다.', 'info');
            }
        } else {
            showAlert('외부 API 수집에 실패했습니다.', 'error');
        }
        
    } catch (error) {
        console.error('외부 API 수집 실패:', error);
        showAlert('외부 API 수집 중 오류가 발생했습니다.', 'error');
    } finally {
        elements.collectExternalBtn.disabled = false;
        elements.collectExternalBtn.textContent = '🌐 외부 API 수집';
    }
}

// 전체 데이터 내보내기
function exportAllData() {
    try {
        const exportData = {
            messages: currentMessages,
            categories: [...new Set(currentMessages.map(msg => msg.category))],
            stats: {
                totalMessages: currentMessages.length,
                totalCategories: new Set(currentMessages.map(msg => msg.category)).size,
                exportDate: new Date().toISOString(),
                sources: [...new Set(currentMessages.map(msg => msg.source))]
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `모닝앱_전체데이터_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showAlert('전체 데이터가 내보내기되었습니다.', 'success');
        addActivity('전체 데이터 내보내기 완료');
        
    } catch (error) {
        console.error('데이터 내보내기 실패:', error);
        showAlert('데이터 내보내기에 실패했습니다.', 'error');
    }
}

// 메시지 필터링
function filterMessages() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const categoryFilter = elements.categoryFilter.value;
    const sourceFilter = elements.sourceFilter.value;
    
    filteredMessages = currentMessages.filter(message => {
        const matchesSearch = !searchTerm || 
            message.text.toLowerCase().includes(searchTerm) ||
            message.author.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || message.category === categoryFilter;
        const matchesSource = !sourceFilter || message.source === sourceFilter;
        
        return matchesSearch && matchesCategory && matchesSource;
    });
    
    currentPage = 1;
    renderMessagesTable();
}

// 카테고리 필터 설정
function setupCategoryFilter() {
    const categories = [...new Set(currentMessages.map(msg => msg.category))].sort();
    
    elements.categoryFilter.innerHTML = '<option value="">모든 카테고리</option>';
    elements.messageCategory.innerHTML = '<option value="">카테고리 선택</option>';
    
    categories.forEach(category => {
        const option1 = document.createElement('option');
        option1.value = category;
        option1.textContent = category;
        elements.categoryFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = category;
        option2.textContent = category;
        elements.messageCategory.appendChild(option2);
    });
}

// 메시지 테이블 렌더링
function renderMessagesTable() {
    const startIndex = (currentPage - 1) * messagesPerPage;
    const endIndex = startIndex + messagesPerPage;
    const pageMessages = filteredMessages.slice(startIndex, endIndex);
    
    elements.messagesTableBody.innerHTML = '';
    
    pageMessages.forEach(message => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${message.id}</td>
            <td class="message-text-cell">${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}</td>
            <td>${message.author}</td>
            <td><span class="category-pill">${message.category}</span></td>
            <td><span class="time-badge">${getTimeDisplayName(message.timeOfDay)}</span></td>
            <td>${message.createdAt}</td>
            <td><span class="status-badge status-${message.status || 'active'}">${message.status || 'active'}</span></td>
            <td class="actions-cell">
                <button class="btn-small btn-edit" onclick="editMessage('${message.id}')">편집</button>
                <button class="btn-small btn-delete" onclick="deleteMessage('${message.id}')">삭제</button>
            </td>
        `;
        elements.messagesTableBody.appendChild(row);
    });
    
    // 페이지네이션 업데이트
    const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
    elements.currentPage.textContent = currentPage;
    elements.totalPages.textContent = totalPages;
    elements.prevPageBtn.disabled = currentPage <= 1;
    elements.nextPageBtn.disabled = currentPage >= totalPages;
}

// 시간대 표시명 변환
function getTimeDisplayName(timeOfDay) {
    const timeMap = {
        'morning': '아침',
        'afternoon': '오후',
        'evening': '저녁',
        'night': '새벽',
        '': '전체'
    };
    return timeMap[timeOfDay] || timeOfDay;
}

// 페이지 변경
function changePage(newPage) {
    const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderMessagesTable();
    }
}

// 메시지 추가 모달 열기
function openAddMessageModal() {
    elements.modalTitle.textContent = '메시지 추가';
    elements.messageForm.reset();
    elements.messageId.value = '';
    elements.messageModal.style.display = 'block';
}

// 메시지 편집
function editMessage(messageId) {
    const message = currentMessages.find(msg => msg.id == messageId);
    if (!message) return;
    
    elements.modalTitle.textContent = '메시지 편집';
    elements.messageId.value = message.id;
    elements.messageText.value = message.text;
    elements.messageAuthor.value = message.author;
    elements.messageCategory.value = message.category;
    elements.messageTimeOfDay.value = message.timeOfDay || '';
    elements.messageModal.style.display = 'block';
}

// 메시지 삭제
function deleteMessage(messageId) {
    if (confirm('이 메시지를 정말 삭제하시겠습니까?')) {
        currentMessages = currentMessages.filter(msg => msg.id != messageId);
        filterMessages();
        updateDashboard();
        showAlert('메시지가 삭제되었습니다.', 'success');
        addActivity(`메시지 삭제: ID ${messageId}`);
    }
}

// 메시지 저장
async function saveMessage(e) {
    e.preventDefault();
    
    try {
        const messageId = elements.messageId.value;
        const messageData = {
            id: messageId || `admin_${Date.now()}`,
            text: elements.messageText.value.trim(),
            author: elements.messageAuthor.value.trim() || '익명',
            category: elements.messageCategory.value,
            timeOfDay: elements.messageTimeOfDay.value,
            createdAt: new Date().toISOString().split('T')[0],
            source: 'admin',
            status: 'active'
        };
        
        if (!messageData.text || !messageData.category) {
            showAlert('메시지 내용과 카테고리는 필수입니다.', 'warning');
            return;
        }
        
        if (messageId) {
            // 편집
            const index = currentMessages.findIndex(msg => msg.id == messageId);
            if (index !== -1) {
                currentMessages[index] = messageData;
                showAlert('메시지가 수정되었습니다.', 'success');
                addActivity(`메시지 수정: ${messageData.text.substring(0, 30)}...`);
            }
        } else {
            // 추가
            currentMessages.push(messageData);
            showAlert('새 메시지가 추가되었습니다.', 'success');
            addActivity(`메시지 추가: ${messageData.text.substring(0, 30)}...`);
        }
        
        // 캐시 업데이트
        await cacheManager.setCache('all_messages', currentMessages);
        
        // UI 업데이트
        setupCategoryFilter();
        filterMessages();
        updateDashboard();
        closeMessageModal();
        
    } catch (error) {
        console.error('메시지 저장 실패:', error);
        showAlert('메시지 저장에 실패했습니다.', 'error');
    }
}

// 메시지 모달 닫기
function closeMessageModal() {
    elements.messageModal.style.display = 'none';
}

// Google Sheets 연결
async function connectGoogleSheets() {
    try {
        const apiKey = elements.sheetsApiKey.value.trim();
        const spreadsheetId = elements.spreadsheetId.value.trim();
        
        if (!apiKey || !spreadsheetId) {
            showAlert('API 키와 스프레드시트 ID를 입력해주세요.', 'warning');
            return;
        }
        
        // 데이터 매니저 설정 업데이트
        dataManager.sheetsApiKey = apiKey;
        dataManager.spreadsheetId = spreadsheetId;
        
        // 연결 테스트
        const testData = await dataManager.fetchFromSheets();
        
        if (testData && testData.length > 0) {
            updateConnectionStatus('connected');
            showAlert('Google Sheets 연결이 성공했습니다.', 'success');
            addActivity('Google Sheets 연결 성공');
            
            // 설정 저장
            localStorage.setItem('sheets_api_key', apiKey);
            localStorage.setItem('spreadsheet_id', spreadsheetId);
        } else {
            updateConnectionStatus('error');
            showAlert('Google Sheets 연결에 실패했습니다.', 'error');
        }
        
    } catch (error) {
        console.error('Google Sheets 연결 실패:', error);
        updateConnectionStatus('error');
        showAlert('Google Sheets 연결 중 오류가 발생했습니다.', 'error');
    }
}

// API 수집
async function collectFromAPIs() {
    elements.apiCollectionStatus.innerHTML = '<div class="collection-progress">수집 중...</div>';
    
    try {
        const newQuotes = await externalAPIs.collectFromAllAPIs();
        
        if (newQuotes.length > 0) {
            elements.apiCollectionStatus.innerHTML = `
                <div class="collection-success">
                    ✅ ${newQuotes.length}개의 명언을 수집했습니다.
                </div>
            `;
        } else {
            elements.apiCollectionStatus.innerHTML = `
                <div class="collection-warning">
                    ⚠️ 수집된 명언이 없습니다.
                </div>
            `;
        }
    } catch (error) {
        elements.apiCollectionStatus.innerHTML = `
            <div class="collection-error">
                ❌ 수집 중 오류가 발생했습니다.
            </div>
        `;
    }
}

// 연결 상태 업데이트
function updateConnectionStatus(status = 'offline') {
    const statusElement = elements.sheetsStatus;
    const indicator = statusElement.querySelector('.status-indicator');
    
    indicator.className = `status-indicator ${status}`;
    
    switch (status) {
        case 'connected':
            statusElement.innerHTML = '<span class="status-indicator connected"></span> 연결됨';
            break;
        case 'error':
            statusElement.innerHTML = '<span class="status-indicator error"></span> 연결 실패';
            break;
        default:
            statusElement.innerHTML = '<span class="status-indicator offline"></span> 연결 안됨';
    }
}

// 파일 선택 처리
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        elements.fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
        elements.uploadFileBtn.disabled = false;
    } else {
        elements.fileInfo.textContent = '';
        elements.uploadFileBtn.disabled = true;
    }
}

// 파일 업로드
async function uploadFile() {
    const file = elements.fileInput.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        let importData = [];
        
        if (file.name.endsWith('.json')) {
            const jsonData = JSON.parse(text);
            importData = Array.isArray(jsonData) ? jsonData : jsonData.messages || [];
        } else if (file.name.endsWith('.csv')) {
            // CSV 파싱 (간단한 구현)
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length >= 3) {
                    importData.push({
                        id: `import_${Date.now()}_${i}`,
                        text: values[0],
                        author: values[1],
                        category: values[2],
                        timeOfDay: values[3] || '',
                        createdAt: new Date().toISOString().split('T')[0],
                        source: 'file',
                        status: 'active'
                    });
                }
            }
        }
        
        if (importData.length > 0) {
            currentMessages.push(...importData);
            await cacheManager.setCache('all_messages', currentMessages);
            
            setupCategoryFilter();
            filterMessages();
            updateDashboard();
            
            showAlert(`${importData.length}개의 메시지를 가져왔습니다.`, 'success');
            addActivity(`파일 가져오기 완료: ${importData.length}개 메시지`);
        } else {
            showAlert('가져올 수 있는 메시지가 없습니다.', 'warning');
        }
        
    } catch (error) {
        console.error('파일 업로드 실패:', error);
        showAlert('파일 업로드에 실패했습니다.', 'error');
    }
}

// 설정 관련 함수들
function loadSettings() {
    // 로컬 저장소에서 설정 로드
    const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    
    elements.autoUpdateToggle.checked = settings.autoUpdate || false;
    elements.updateInterval.value = settings.updateInterval || 1;
    elements.duplicateCheckToggle.checked = settings.duplicateCheck !== false;
    elements.maxMessages.value = settings.maxMessages || 1000;
    elements.adminNotificationToggle.checked = settings.adminNotification || false;
    elements.adminEmail.value = settings.adminEmail || '';
}

function saveSettings() {
    const settings = {
        autoUpdate: elements.autoUpdateToggle.checked,
        updateInterval: elements.updateInterval.value,
        duplicateCheck: elements.duplicateCheckToggle.checked,
        maxMessages: elements.maxMessages.value,
        adminNotification: elements.adminNotificationToggle.checked,
        adminEmail: elements.adminEmail.value
    };
    
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    showAlert('설정이 저장되었습니다.', 'success');
    addActivity('설정 저장 완료');
}

function resetSettings() {
    if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
        localStorage.removeItem('admin_settings');
        loadSettings();
        showAlert('설정이 초기화되었습니다.', 'info');
        addActivity('설정 초기화 완료');
    }
}

function clearAllData() {
    if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        if (confirm('정말로 모든 데이터를 삭제하시겠습니까?')) {
            currentMessages = [];
            filteredMessages = [];
            localStorage.clear();
            
            filterMessages();
            updateDashboard();
            
            showAlert('모든 데이터가 삭제되었습니다.', 'warning');
            addActivity('전체 데이터 삭제 완료');
        }
    }
}

// 활동 로그 추가
function addActivity(message) {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR');
    
    activityItem.innerHTML = `
        <span class="activity-time">${timeString}</span>
        <span class="activity-text">${message}</span>
    `;
    
    elements.activityList.insertBefore(activityItem, elements.activityList.firstChild);
    
    // 최대 10개까지만 유지
    while (elements.activityList.children.length > 10) {
        elements.activityList.removeChild(elements.activityList.lastChild);
    }
}

// 알림 표시
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `admin-alert alert-${type}`;
    alertDiv.textContent = message;
    
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    Object.assign(alertDiv.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: colors[type],
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        zIndex: '9999',
        maxWidth: '300px',
        fontSize: '0.9rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    });
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// 전역 함수로 노출 (HTML에서 사용)
window.editMessage = editMessage;
window.deleteMessage = deleteMessage;