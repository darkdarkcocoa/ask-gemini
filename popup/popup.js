// DOM 요소
const apiKeyInput = document.getElementById('apiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');
const uiLanguageSelect = document.getElementById('uiLanguage');
const translateBtn = document.getElementById('translateBtn');
const toggleBtn = document.getElementById('toggleBtn');
const statusArea = document.getElementById('statusArea');
const selectionTranslateCheckbox = document.getElementById('selectionTranslate');
const extensionEnabledCheckbox = document.getElementById('extensionEnabled');

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

// UI 언어 변경 처리
function handleUILanguageChange() {
  const selectedLang = uiLanguageSelect.value;
  setUILanguage(selectedLang);
  updateUI();
}

// 설정 로드
async function loadSettings() {
  try {
    // UI 언어 먼저 로드하고 적용
    const uiLang = getCurrentUILanguage();
    uiLanguageSelect.value = uiLang;
    updateUI();
    
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
    
    if (settings.selectionTranslateEnabled !== undefined) {
      selectionTranslateCheckbox.checked = settings.selectionTranslateEnabled;
    }
    
    if (settings.extensionEnabled !== undefined) {
      extensionEnabledCheckbox.checked = settings.extensionEnabled;
    } else {
      extensionEnabledCheckbox.checked = true; // 기본값은 활성화
    }
  } catch (error) {
    console.error('Settings load error:', error);
    showStatus(getText('translationError'), 'error');
  }
}

// 설정 저장
async function saveSettings() {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      apiKey: apiKeyInput.value.trim(),
      sourceLang: sourceLangSelect.value,
      targetLang: targetLangSelect.value,
      selectionTranslateEnabled: selectionTranslateCheckbox.checked,
      extensionEnabled: extensionEnabledCheckbox.checked
    });
    
    showStatus(getText('settingsSaved'), 'success');
  } catch (error) {
    console.error('Settings save error:', error);
    showStatus(getText('translationError'), 'error');
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
    // 확장 프로그램 활성화 상태 확인
    if (!extensionEnabledCheckbox.checked) {
      showStatus('Translation extension is disabled', 'error');
      return;
    }
    
    // API 키 확인
    if (!apiKeyInput.value.trim()) {
      showStatus(getText('apiKeyRequired'), 'error');
      return;
    }
    
    // 설정 저장
    await saveSettings();
    
    // 현재 탭 가져오기
    const tab = await getCurrentTab();
    
    // 번역 요청
    showStatus(getText('translating'), 'info');
    
    // 번역 요청을 보내고 응답 대기
    const response = await chrome.tabs.sendMessage(tab.id, { 
      type: 'TRANSLATE_PAGE',
      waitForCompletion: true // 실제 번역 완료까지 대기 플래그 추가
    });
    
    // 실제 번역이 완료된 후에만 성공 메시지 표시
    if (response && response.translationComplete) {
      showStatus(getText('translationComplete'), 'success');
    }
  } catch (error) {
    console.error('Translation request error:', error);
    showStatus(getText('translationError'), 'error');
  }
}

// 번역 토글 요청
async function toggleTranslation() {
  try {
    const tab = await getCurrentTab();
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_TRANSLATION' });
  } catch (error) {
    console.error('Translation toggle error:', error);
    showStatus(getText('translationError'), 'error');
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
    showStatus(getText('translationComplete'), 'success');
  }
});

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', loadSettings);
translateBtn.addEventListener('click', translatePage);
toggleBtn.addEventListener('click', toggleTranslation);
toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
uiLanguageSelect.addEventListener('change', handleUILanguageChange);

// 설정 변경 시 자동 저장
apiKeyInput.addEventListener('blur', saveSettings);
sourceLangSelect.addEventListener('change', saveSettings);
targetLangSelect.addEventListener('change', saveSettings);
selectionTranslateCheckbox.addEventListener('change', async () => {
  await saveSettings();
  // 현재 탭의 content script에 설정 변경 알림
  try {
    const tab = await getCurrentTab();
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SELECTION_TRANSLATE_TOGGLE',
        enabled: selectionTranslateCheckbox.checked
      });
    }
  } catch (error) {
    console.error('Settings transfer error:', error);
  }
});

extensionEnabledCheckbox.addEventListener('change', async () => {
  await saveSettings();
  // 현재 탭의 content script에 확장 프로그램 활성화 상태 알림
  try {
    const tab = await getCurrentTab();
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'EXTENSION_ENABLED_TOGGLE',
        enabled: extensionEnabledCheckbox.checked
      });
    }
  } catch (error) {
    console.error('Settings transfer error:', error);
  }
});
