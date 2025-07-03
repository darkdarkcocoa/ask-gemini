// DOM 요소
const apiKeyInput = document.getElementById('apiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const extensionEnabledCheckbox = document.getElementById('extensionEnabled');
const statusArea = document.getElementById('statusArea');

// 상태 표시 함수
function showStatus(message, type = 'info') {
  statusArea.textContent = message;
  statusArea.className = 'status-area';
  
  if (type === 'success') {
    statusArea.classList.add('status-success');
  } else if (type === 'error') {
    statusArea.classList.add('status-error');
  } else {
    statusArea.classList.add('status-info');
  }
  
  // 3초 후 상태 메시지 제거 (에러 메시지는 5초)
  const timeout = type === 'error' ? 5000 : 3000;
  setTimeout(() => {
    statusArea.textContent = '';
    statusArea.className = 'status-area';
  }, timeout);
}

// 설정 로드
async function loadSettings() {
  try {
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    
    if (settings.apiKey) {
      apiKeyInput.value = settings.apiKey;
    }
    
    extensionEnabledCheckbox.checked = settings.extensionEnabled !== false;
    
    // API 키가 없으면 안내 메시지 표시
    if (!settings.apiKey) {
      showStatus('API 키를 입력해주세요', 'info');
    }
  } catch (error) {
    console.error('Settings load error:', error);
    showStatus('설정을 불러올 수 없습니다', 'error');
  }
}

// 설정 저장
async function saveSettings() {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      apiKey: apiKeyInput.value.trim(),
      extensionEnabled: extensionEnabledCheckbox.checked
    });
    
    // API 키가 저장되면 성공 메시지 표시
    if (apiKeyInput.value.trim()) {
      showStatus('설정이 저장되었습니다', 'success');
    }
  } catch (error) {
    console.error('Settings save error:', error);
    showStatus('설정 저장에 실패했습니다', 'error');
  }
}

// 현재 탭 가져오기
async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  } catch (error) {
    console.error('Get current tab error:', error);
    return null;
  }
}

// API 키 표시/숨김 토글
function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleApiKeyBtn.textContent = '🔒';
    toggleApiKeyBtn.title = 'API 키 숨기기';
  } else {
    apiKeyInput.type = 'password';
    toggleApiKeyBtn.textContent = '👁️';
    toggleApiKeyBtn.title = 'API 키 보기';
  }
}

// API 키 유효성 간단 검증
function validateApiKey(apiKey) {
  // Gemini API 키는 보통 39자 길이의 문자열
  return apiKey && apiKey.length >= 30 && apiKey.startsWith('AI');
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', loadSettings);
toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);

// 설정 변경 시 자동 저장
apiKeyInput.addEventListener('input', () => {
  const apiKey = apiKeyInput.value.trim();
  
  // API 키 형식 간단 검증
  if (apiKey && !validateApiKey(apiKey)) {
    showStatus('API 키 형식이 올바르지 않습니다 (AI로 시작하는 39자)', 'error');
  } else if (apiKey) {
    showStatus('API 키가 유효한 형식입니다', 'success');
  }
});

apiKeyInput.addEventListener('blur', saveSettings);

extensionEnabledCheckbox.addEventListener('change', async () => {
  await saveSettings();
  
  // 현재 탭의 content script에 확장 프로그램 활성화 상태 알림
  try {
    const tab = await getCurrentTab();
    if (tab && tab.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTENSION_ENABLED_TOGGLE',
        enabled: extensionEnabledCheckbox.checked
      });
      
      if (extensionEnabledCheckbox.checked) {
        showStatus('AI 어시스턴트가 활성화되었습니다', 'success');
      } else {
        showStatus('AI 어시스턴트가 비활성화되었습니다', 'info');
      }
    }
  } catch (error) {
    console.error('Extension toggle error:', error);
    // 탭 메시지 전송 실패는 무시 (content script가 없을 수 있음)
  }
});

// Enter 키로 설정 저장
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    apiKeyInput.blur(); // blur 이벤트로 저장 트리거
  }
});

// 팝업이 열릴 때마다 설정 다시 로드
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadSettings();
  }
});