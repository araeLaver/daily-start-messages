// 전역 변수
let quotesData = [];
let currentQuote = null;
let quoteCounter = 0;

// DOM 요소
const elements = {
    loading: document.getElementById('loading'),
    quoteContent: document.getElementById('quoteContent'),
    quoteText: document.getElementById('quoteText'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    quoteCategory: document.getElementById('quoteCategory'),
    newQuoteBtn: document.getElementById('newQuoteBtn'),
    shareBtn: document.getElementById('shareBtn'),
    dateDisplay: document.getElementById('dateDisplay'),
    quoteCounterDisplay: document.getElementById('quoteCounter'),
    shareModal: document.getElementById('shareModal'),
    modalClose: document.getElementById('modalClose'),
    sharePreview: document.getElementById('sharePreview'),
    copyBtn: document.getElementById('copyBtn'),
    twitterBtn: document.getElementById('twitterBtn'),
    facebookBtn: document.getElementById('facebookBtn')
};

// 애플리케이션 초기화
async function initApp() {
    try {
        // 명언 데이터 로드
        await loadQuotes();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 날짜 표시
        displayCurrentDate();
        
        // 첫 번째 명언 표시
        displayRandomQuote();
        
        // PWA 설치 프롬프트 설정
        setupPWAInstall();
        
    } catch (error) {
        console.error('앱 초기화 실패:', error);
        showError('앱을 초기화하는 중 오류가 발생했습니다.');
    }
}

// 명언 데이터 로드
async function loadQuotes() {
    try {
        const response = await fetch('quotes.json');
        if (!response.ok) {
            throw new Error('네트워크 응답이 올바르지 않습니다');
        }
        const data = await response.json();
        quotesData = data.quotes;
        
        if (quotesData.length === 0) {
            throw new Error('명언 데이터가 비어있습니다');
        }
    } catch (error) {
        console.error('명언 데이터 로드 실패:', error);
        // 오프라인이거나 파일이 없을 때 대체 데이터 사용
        quotesData = [{
            text: "오늘 할 수 있는 일을 내일로 미루지 마라.",
            author: "벤자민 프랭클린",
            category: "동기부여"
        }];
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 새로운 명언 버튼
    elements.newQuoteBtn.addEventListener('click', displayRandomQuote);
    
    // 공유 버튼
    elements.shareBtn.addEventListener('click', openShareModal);
    
    // 모달 닫기
    elements.modalClose.addEventListener('click', closeShareModal);
    elements.shareModal.addEventListener('click', (e) => {
        if (e.target === elements.shareModal) {
            closeShareModal();
        }
    });
    
    // 공유 버튼들
    elements.copyBtn.addEventListener('click', copyToClipboard);
    elements.twitterBtn.addEventListener('click', shareToTwitter);
    elements.facebookBtn.addEventListener('click', shareToFacebook);
    
    // 키보드 단축키
    document.addEventListener('keydown', handleKeyboard);
    
    // 터치 이벤트 (모바일 스와이프)
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
                // 왼쪽으로 스와이프 - 새로운 명언
                displayRandomQuote();
            }
        }
    }
}

// 키보드 이벤트 처리
function handleKeyboard(e) {
    if (elements.shareModal.style.display === 'block') {
        if (e.key === 'Escape') {
            closeShareModal();
        }
        return;
    }
    
    switch (e.key) {
        case ' ':
        case 'Enter':
            e.preventDefault();
            displayRandomQuote();
            break;
        case 's':
        case 'S':
            if (!e.ctrlKey && !e.metaKey) {
                openShareModal();
            }
            break;
        case 'Escape':
            closeShareModal();
            break;
    }
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

// 랜덤 명언 표시
function displayRandomQuote() {
    // 로딩 상태 표시
    showLoading();
    
    // 애니메이션을 위한 지연
    setTimeout(() => {
        // 랜덤 명언 선택 (연속으로 같은 명언이 나오지 않도록)
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * quotesData.length);
        } while (quotesData.length > 1 && quotesData[randomIndex] === currentQuote);
        
        currentQuote = quotesData[randomIndex];
        quoteCounter++;
        
        // 명언 표시
        showQuote();
        updateQuoteCounter();
        
    }, 800); // 로딩 애니메이션 시간
}

// 로딩 상태 표시
function showLoading() {
    elements.loading.style.display = 'flex';
    elements.quoteContent.style.display = 'none';
}

// 명언 표시
function showQuote() {
    if (!currentQuote) return;
    
    elements.quoteText.textContent = currentQuote.text;
    elements.quoteAuthor.textContent = currentQuote.author;
    elements.quoteCategory.textContent = currentQuote.category;
    
    elements.loading.style.display = 'none';
    elements.quoteContent.style.display = 'block';
    
    // 접근성을 위한 포커스
    elements.quoteContent.focus();
}

// 명언 카운터 업데이트
function updateQuoteCounter() {
    elements.quoteCounterDisplay.textContent = quoteCounter;
}

// 공유 모달 열기
function openShareModal() {
    if (!currentQuote) return;
    
    const shareText = `"${currentQuote.text}"\n\n— ${currentQuote.author}`;
    elements.sharePreview.textContent = shareText;
    elements.shareModal.style.display = 'block';
    
    // 접근성을 위한 포커스
    elements.modalClose.focus();
}

// 공유 모달 닫기
function closeShareModal() {
    elements.shareModal.style.display = 'none';
}

// 클립보드에 복사
async function copyToClipboard() {
    if (!currentQuote) return;
    
    const shareText = `"${currentQuote.text}"\n\n— ${currentQuote.author}`;
    
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareText);
        } else {
            // 대체 방법 (구형 브라우저)
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            return new Promise((resolve, reject) => {
                document.execCommand('copy') ? resolve() : reject();
                textArea.remove();
            });
        }
        
        showToast('명언이 클립보드에 복사되었습니다! 📋');
        closeShareModal();
        
    } catch (error) {
        console.error('복사 실패:', error);
        showToast('복사에 실패했습니다. 다시 시도해주세요.', 'error');
    }
}

// 트위터 공유
function shareToTwitter() {
    if (!currentQuote) return;
    
    const shareText = `"${currentQuote.text}" — ${currentQuote.author}`;
    const hashtags = '오늘의명언,명언,영감';
    const url = encodeURIComponent(window.location.href);
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=${hashtags}&url=${url}`;
    
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    closeShareModal();
}

// 페이스북 공유
function shareToFacebook() {
    if (!currentQuote) return;
    
    const url = encodeURIComponent(window.location.href);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    closeShareModal();
}

// 토스트 메시지 표시
function showToast(message, type = 'success') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // 토스트 스타일
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: type === 'error' ? '#ef4444' : '#22c55e',
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
    
    // 애니메이션
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

// PWA 설치 설정
function setupPWAInstall() {
    let deferredPrompt;
    
    // PWA 설치 가능할 때
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // 설치 버튼 표시 (선택사항)
        showInstallPrompt();
    });
    
    // PWA가 설치되었을 때
    window.addEventListener('appinstalled', () => {
        console.log('PWA 설치 완료');
        showToast('앱이 성공적으로 설치되었습니다! 🎉');
    });
    
    function showInstallPrompt() {
        // 간단한 설치 안내 (한 번만 표시)
        if (localStorage.getItem('installPromptShown')) return;
        
        setTimeout(() => {
            const shouldShow = confirm('이 앱을 홈 화면에 설치하시겠습니까?\n더 빠르고 편리하게 이용할 수 있습니다.');
            
            if (shouldShow && deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    console.log('설치 선택:', choiceResult.outcome);
                    deferredPrompt = null;
                });
            }
            
            localStorage.setItem('installPromptShown', 'true');
        }, 5000); // 5초 후 표시
    }
}

// 오프라인 지원
window.addEventListener('online', () => {
    showToast('인터넷에 연결되었습니다! 🌐');
});

window.addEventListener('offline', () => {
    showToast('오프라인 모드입니다. 📱', 'error');
});

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