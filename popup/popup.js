// DOM 요소
const apiKeyInput = document.getElementById('apiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');
const translateBtn = document.getElementById('translateBtn');
const toggleBtn = document.getElementById('toggleBtn');
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
  
  // 3초 후 상태 메시지 제거 (에러 메시지는 유지)
  if (type !== 'error') {
    setTimeout(() => {
      statusArea.textContent = '';
      statusArea.className = 'status-area';
    }, 3000);
  }
}

// 설정 로드
async function loadSettings() {
  try {
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    
    if (settings.apiKey) {
      apiKeyInput.value = settings.apiKey;
    }
    
    if (settings.sourceLang) {
      sourceLangSelect.value = settings.sourceLang;
    }
    
    if (settings.targetLang) {
      targetLangSelect.value = settings.targetLang;
    }
  } catch (error) {
    console.error('설정 로드 오류:', error);
    showStatus('설정을 로드하는 중 오류가 발생했습니다.', 'error');
  }
}

// 설정 저장
async function saveSettings() {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      apiKey: apiKeyInput.value.trim(),
      sourceLang: sourceLangSelect.value,
      targetLang: targetLangSelect.value
    });
    
    showStatus('설정이 저장되었습니다.', 'success');
  } catch (error) {
    console.error('설정 저장 오류:', error);
    showStatus('설정을 저장하는 중 오류가 발생했습니다.', 'error');
  }
}

// 현재 탭 가져오기
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// 페이지 번역 요청
async function translatePage() {
  try {
    // API 키 확인
    if (!apiKeyInput.value.trim()) {
      showStatus('Gemini API 키를 입력해주세요.', 'error');
      return;
    }
    
    // 설정 저장
    await saveSettings();
    
    // 현재 탭 가져오기
    const tab = await getCurrentTab();
    
    // 번역 요청
    showStatus('페이지 번역 중...', 'info');
    
    // 번역 요청을 보내고 응답 대기
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'TRANSLATE_PAGE',
      waitForCompletion: true // 실제 번역 완료까지 대기 플래그 추가
    });
    
    // 실제 번역이 완료된 후에만 성공 메시지 표시
    if (response && response.translationComplete) {
      showStatus('페이지 번역이 완료되었습니다.', 'success');
    }
  } catch (error) {
    console.error('번역 요청 오류:', error);
    showStatus('번역 요청 중 오류가 발생했습니다.', 'error');
  }
}

// 번역 토글 요청
async function toggleTranslation() {
  try {
    const tab = await getCurrentTab();
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_TRANSLATION' });
  } catch (error) {
    console.error('번역 토글 오류:', error);
    showStatus('번역 토글 중 오류가 발생했습니다.', 'error');
  }
}

// API 키 표시/숨김 토글
function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleApiKeyBtn.textContent = '🔒';
  } else {
    apiKeyInput.type = 'password';
    toggleApiKeyBtn.textContent = '👁️';
  }
}

// 완료 메시지 수신 처리 리스너 추가
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATION_COMPLETE') {
    showStatus('페이지 번역이 완료되었습니다.', 'success');
  }
});

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', loadSettings);
translateBtn.addEventListener('click', translatePage);
toggleBtn.addEventListener('click', toggleTranslation);
toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);

// 설정 변경 시 자동 저장
apiKeyInput.addEventListener('blur', saveSettings);
sourceLangSelect.addEventListener('change', saveSettings);
targetLangSelect.addEventListener('change', saveSettings);
