// DOM 요소
const apiKeyInput = document.getElementById('apiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const extensionEnabledCheckbox = document.getElementById('extensionEnabled');
const languageSelect = document.getElementById('language');
const statusArea = document.getElementById('statusArea');

// 다국어 지원
let currentLanguage = 'ko';

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
    
    // 언어 설정 로드 (기본값: 브라우저 언어에 따라)
    currentLanguage = settings.language || i18n.detectBrowserLanguage();
    languageSelect.value = currentLanguage;
    i18n.setLanguage(currentLanguage);
    updateUI();
    
    // API 키가 없으면 안내 메시지 표시
    if (!settings.apiKey) {
      showStatus(i18n.t('apiKeyNotSet'), 'info');
    }
  } catch (error) {
    console.error('Settings load error:', error);
    showStatus(i18n.t('genericError'), 'error');
  }
}

// 설정 저장
async function saveSettings() {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      apiKey: apiKeyInput.value.trim(),
      extensionEnabled: extensionEnabledCheckbox.checked,
      language: currentLanguage
    });
    
    // API 키가 저장되면 성공 메시지 표시
    if (apiKeyInput.value.trim()) {
      showStatus(i18n.t('settingsSaved'), 'success');
    }
  } catch (error) {
    console.error('Settings save error:', error);
    showStatus(i18n.t('genericError'), 'error');
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

// UI 업데이트
function updateUI() {
  // 제목과 텍스트 업데이트
  document.getElementById('title').textContent = `🧠 ${i18n.t('title')}`;
  document.getElementById('subtitle').textContent = 
    currentLanguage === 'ko' ? '웹페이지 텍스트에 대해 AI에게 질문하세요' : 'Ask AI about webpage text';
  
  document.getElementById('apiKeyLabel').textContent = i18n.t('apiKeyLabel');
  document.getElementById('languageLabel').textContent = i18n.t('languageLabel');
  document.getElementById('enabledLabel').textContent = i18n.t('enabledLabel');
  
  document.getElementById('usageTitle').textContent = `📖 ${i18n.t('usage')}`;
  document.getElementById('usageStep1').innerHTML = i18n.t('usageStep1');
  document.getElementById('usageStep2').innerHTML = currentLanguage === 'ko' ? 
    '질문 입력창이 나타나면 <strong>궁금한 점을 질문</strong>하세요' : 
    'Enter your <strong>question</strong> in the popup that appears';
  document.getElementById('usageStep3').innerHTML = currentLanguage === 'ko' ? 
    'Enter를 누르거나 <strong>질문하기</strong> 버튼을 클릭하세요' : 
    'Press Enter or click the <strong>Ask</strong> button';
  document.getElementById('usageStep4').innerHTML = currentLanguage === 'ko' ? 
    'AI가 선택한 텍스트를 기반으로 <strong>답변</strong>해드립니다' : 
    'AI will <strong>answer</strong> based on the selected text';
  
  document.getElementById('howToGetApiKey').textContent = i18n.t('howToGetApiKey');
  
  // placeholder 업데이트
  apiKeyInput.placeholder = i18n.t('apiKeyPlaceholder');
  
  // notes 업데이트
  document.getElementById('apiKeyNote').textContent = 
    currentLanguage === 'ko' ? 'API 키는 로컬에만 저장됩니다' : 'API key is stored locally only';
  document.getElementById('extensionNote').textContent = 
    currentLanguage === 'ko' ? '비활성화하면 모든 AI 어시스턴트 기능이 꺼집니다' : 'All AI assistant features will be disabled when turned off';
  
  // 언어 선택 옵션 업데이트
  const options = languageSelect.querySelectorAll('option');
  options[0].textContent = i18n.t('korean');
  options[1].textContent = i18n.t('english');
}

// API 키 표시/숨김 토글
function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleApiKeyBtn.textContent = '🔒';
    toggleApiKeyBtn.title = currentLanguage === 'ko' ? 'API 키 숨기기' : 'Hide API key';
  } else {
    apiKeyInput.type = 'password';
    toggleApiKeyBtn.textContent = '👁️';
    toggleApiKeyBtn.title = currentLanguage === 'ko' ? 'API 키 보기' : 'Show API key';
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

// 언어 변경 이벤트
languageSelect.addEventListener('change', async () => {
  currentLanguage = languageSelect.value;
  i18n.setLanguage(currentLanguage);
  updateUI();
  await saveSettings();
  
  // 현재 탭의 content script에 언어 변경 알림
  try {
    const tab = await getCurrentTab();
    if (tab && tab.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'LANGUAGE_CHANGED',
        language: currentLanguage
      });
    }
  } catch (error) {
    console.error('Language change notification error:', error);
  }
});

// 설정 변경 시 자동 저장
apiKeyInput.addEventListener('input', () => {
  const apiKey = apiKeyInput.value.trim();
  
  // API 키 형식 간단 검증
  if (apiKey && !validateApiKey(apiKey)) {
    const errorMsg = currentLanguage === 'ko' ? 
      'API 키 형식이 올바르지 않습니다 (AI로 시작하는 39자)' : 
      'Invalid API key format (should start with AI and be 39 characters)';
    showStatus(errorMsg, 'error');
  } else if (apiKey) {
    const successMsg = currentLanguage === 'ko' ? 
      'API 키가 유효한 형식입니다' : 
      'API key format is valid';
    showStatus(successMsg, 'success');
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
        const successMsg = currentLanguage === 'ko' ? 
          'AI 어시스턴트가 활성화되었습니다' : 
          'AI assistant has been enabled';
        showStatus(successMsg, 'success');
      } else {
        const infoMsg = currentLanguage === 'ko' ? 
          'AI 어시스턴트가 비활성화되었습니다' : 
          'AI assistant has been disabled';
        showStatus(infoMsg, 'info');
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