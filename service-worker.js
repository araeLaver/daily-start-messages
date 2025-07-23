// 서비스 워커 버전 및 캐시 이름
const CACHE_NAME = 'morning-app-v2';
const RUNTIME_CACHE = 'runtime-cache-v2';

// 캐시할 파일 목록
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/messages.json',
    '/manifest.json',
    '/data-management.js',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap'
];

// 서비스 워커 설치 이벤트
self.addEventListener('install', event => {
    console.log('[서비스 워커] 설치 중...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[서비스 워커] 파일 캐싱 중...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('[서비스 워커] 모든 파일이 캐시되었습니다');
                // 새 서비스 워커가 즉시 활성화되도록 함
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[서비스 워커] 캐싱 실패:', error);
            })
    );
});

// 서비스 워커 활성화 이벤트
self.addEventListener('activate', event => {
    console.log('[서비스 워커] 활성화 중...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('[서비스 워커] 오래된 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[서비스 워커] 활성화 완료');
            // 즉시 모든 클라이언트에 적용
            return self.clients.claim();
        })
    );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // HTML 요청에 대한 처리
    if (request.destination === 'document') {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            // 성공적인 응답만 캐시
                            if (response.status === 200) {
                                const responseToCache = response.clone();
                                caches.open(RUNTIME_CACHE)
                                    .then(cache => cache.put(request, responseToCache));
                            }
                            return response;
                        })
                        .catch(() => {
                            // 오프라인일 때 기본 페이지 반환
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }
    
    // 정적 파일에 대한 처리 (CSS, JS, JSON 등)
    if (STATIC_FILES.some(file => request.url.includes(file))) {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            if (response.status === 200) {
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(request, responseToCache));
                            }
                            return response;
                        });
                })
        );
        return;
    }
    
    // Google Fonts 및 기타 외부 리소스 처리
    if (url.origin === 'https://fonts.googleapis.com' || 
        url.origin === 'https://fonts.gstatic.com') {
        
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    return cachedResponse || fetch(request)
                        .then(response => {
                            if (response.status === 200) {
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(request, responseToCache));
                            }
                            return response;
                        })
                        .catch(() => {
                            // 폰트를 불러올 수 없을 때는 기본 폰트 사용
                            return new Response('', { status: 404 });
                        });
                })
        );
        return;
    }
    
    // 기타 네트워크 요청은 기본 처리
    event.respondWith(
        fetch(request)
            .catch(() => {
                // 네트워크 오류 시 캐시에서 찾기
                return caches.match(request);
            })
    );
});

// 백그라운드 동기화 (향후 확장 기능)
self.addEventListener('sync', event => {
    console.log('[서비스 워커] 백그라운드 동기화:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // 백그라운드에서 실행할 작업
            Promise.resolve()
        );
    }
});

// 푸시 알림 (향후 확장 기능)
self.addEventListener('push', event => {
    console.log('[서비스 워커] 푸시 메시지 수신:', event);
    
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey || 'default'
            },
            actions: [
                {
                    action: 'explore',
                    title: '확인하기',
                    icon: '/icons/icon-192x192.png'
                },
                {
                    action: 'close',
                    title: '닫기',
                    icon: '/icons/icon-192x192.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || '오늘의 명언', options)
        );
    }
});

// 알림 클릭 처리 (향후 확장 기능)
self.addEventListener('notificationclick', event => {
    console.log('[서비스 워커] 알림 클릭:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// 메시지 처리 (앱과의 통신)
self.addEventListener('message', event => {
    console.log('[서비스 워커] 메시지 수신:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            case 'GET_VERSION':
                event.ports[0].postMessage({ version: CACHE_NAME });
                break;
            default:
                break;
        }
    }
});

// 오류 처리
self.addEventListener('error', event => {
    console.error('[서비스 워커] 오류 발생:', event.error);
});

// 처리되지 않은 Promise 거부 처리
self.addEventListener('unhandledrejection', event => {
    console.error('[서비스 워커] 처리되지 않은 Promise 거부:', event.reason);
    event.preventDefault();
});