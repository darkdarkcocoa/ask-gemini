// Gemini 웹 AI 어시스턴트 - Content Script
console.log('[Gemini Assistant] Content script loaded');

// 전역 상태 관리
let extensionEnabled = true;
let isQuestionUIOpen = false;
let currentSelectedText = '';
let currentSelectionRange = null;
let currentLanguage = 'ko'; // 기본값

// UI 요소 참조
let questionPopup = null;
let responsePopup = null;

// 다국어 지원 텍스트 (간소화된 버전)
const texts = {
  ko: {
    questionPlaceholder: '이 텍스트에 대해 무엇을 알고 싶으신가요?',
    askButton: '질문하기',
    cancelButton: '취소',
    closeButton: '닫기',
    processingButton: '처리 중...',
    extensionReloadRequired: '확장 프로그램을 새로 고침해야 합니다. 페이지를 새로 고침하거나 확장 프로그램을 다시 로드해주세요.',
    genericError: '오류가 발생했습니다',
    noResponse: '응답을 받을 수 없습니다.',
    // 퀵 액션 관련 텍스트
    quickActionWhat: '이것이 무엇인지 알려주세요',
    quickActionTranslate: '이것을 번역해주세요',
    quickActionWhatTooltip: '선택한 텍스트가 무엇인지 설명해달라고 질문합니다',
    quickActionTranslateTooltip: '선택한 텍스트를 번역해달라고 질문합니다'
  },
  en: {
    questionPlaceholder: 'What would you like to know about this text?',
    askButton: 'Ask',
    cancelButton: 'Cancel',
    closeButton: 'Close',
    processingButton: 'Processing...',
    extensionReloadRequired: 'Extension needs to be refreshed. Please reload the page or reload the extension.',
    genericError: 'An error has occurred',
    noResponse: 'Unable to get a response.',
    // 퀵 액션 관련 텍스트
    quickActionWhat: 'What is this?',
    quickActionTranslate: 'Please translate this',
    quickActionWhatTooltip: 'Ask what the selected text is about',
    quickActionTranslateTooltip: 'Ask to translate the selected text'
  }
};

function getLocalizedText(key) {
  return texts[currentLanguage] && texts[currentLanguage][key] ? 
    texts[currentLanguage][key] : 
    (texts.ko[key] || key);
}

function updateLanguage(language) {
  if (texts[language]) {
    currentLanguage = language;
  }
}

// 텍스트 선택 감지 - 지연 처리로 개선
document.addEventListener('mouseup', handleTextSelection);

// 마우스 다운 시 기존 팝업 숨기기 (새로운 선택을 위해)
document.addEventListener('mousedown', (event) => {
  // 팝업 자체를 클릭한 경우는 무시
  if (event.target.closest('#gemini-question-popup, #gemini-response-popup')) {
    return;
  }
  
  // 새로운 선택을 시작할 때 기존 팝업 숨기기
  if (questionPopup && !isQuestionUIOpen) {
    hideQuestionPopup();
  }
});

// 텍스트 선택 처리 함수
function handleTextSelection(event) {
  // 확장 프로그램이 비활성화된 경우 처리하지 않음
  if (!extensionEnabled) return;
  
  // 이미 질문 UI가 열려있으면 처리하지 않음
  if (isQuestionUIOpen) return;
  
  // 팝업 자체를 클릭한 경우 무시
  if (event.target.closest('#gemini-question-popup, #gemini-response-popup')) {
    return;
  }
  
  // 약간의 지연을 두어 선택이 완전히 완료된 후 처리
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    console.log('[Gemini Assistant] Selection check:', {
      hasSelection: !!selectedText,
      selectionLength: selectedText.length,
      rangeCount: selection.rangeCount
    });
    
    // 선택된 텍스트가 없으면 기존 UI 제거
    if (!selectedText) {
      hideQuestionPopup();
      return;
    }
    
    // 너무 짧거나 긴 텍스트는 처리하지 않음
    if (selectedText.length < 5 || selectedText.length > 2000) {
      console.log('[Gemini Assistant] Text length not suitable:', selectedText.length);
      return;
    }
    
    // 선택 범위 저장 및 하이라이트 유지
    if (selection.rangeCount > 0) {
      currentSelectionRange = selection.getRangeAt(0).cloneRange();
      currentSelectedText = selectedText;
      
      console.log('[Gemini Assistant] Text selected successfully:', selectedText.substring(0, 50) + '...');
      
      // 선택된 텍스트의 위치를 기반으로 팝업 표시
      const rect = currentSelectionRange.getBoundingClientRect();
      const x = rect.left + window.scrollX;
      const y = rect.bottom + window.scrollY;
      
      // 선택 상태를 유지하면서 질문 UI 표시
      preserveSelectionAndShowPopup(x, y);
    }
  }, 50); // 50ms 지연
}

// 선택 상태를 유지하면서 팝업 표시
function preserveSelectionAndShowPopup(x, y) {
  // 현재 선택 상태 백업
  const selection = window.getSelection();
  const backupRange = currentSelectionRange;
  
  // 팝업 표시
  showQuestionPopup(x, y);
  
  // 선택 상태 복원 (팝업 생성 후)
  setTimeout(() => {
    try {
      if (backupRange && selection) {
        selection.removeAllRanges();
        selection.addRange(backupRange);
        console.log('[Gemini Assistant] Selection restored after popup creation');
      }
    } catch (error) {
      console.warn('[Gemini Assistant] Could not restore selection:', error);
    }
  }, 10);
}

// 질문 입력 팝업 표시
function showQuestionPopup(x, y) {
  // 기존 팝업 제거
  hideQuestionPopup();
  hideResponsePopup();
  
  // 팝업 컨테이너 생성
  questionPopup = document.createElement('div');
  questionPopup.id = 'gemini-question-popup';
  questionPopup.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y + 10}px;
    z-index: 999999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    max-width: 400px;
    min-width: 300px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    user-select: none;
    pointer-events: auto;
  `;
  
  // 선택된 텍스트 미리보기
  const selectedTextPreview = document.createElement('div');
  selectedTextPreview.style.cssText = `
    background: rgba(255,255,255,0.1);
    padding: 8px 12px;
    border-radius: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: rgba(255,255,255,0.9);
    max-height: 60px;
    overflow-y: auto;
    word-break: break-word;
  `;
  selectedTextPreview.textContent = `"${currentSelectedText.substring(0, 150)}${currentSelectedText.length > 150 ? '...' : ''}"`
  
  // 퀵 액션 아이콘 컨테이너
  const quickActionContainer = document.createElement('div');
  quickActionContainer.style.cssText = `
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    justify-content: center;
  `;
  
  // 퀵 액션 함수
  const executeQuickAction = (question) => {
    questionInput.value = question;
    handleQuestion();
  };
  
  // "무엇인지 알려달라" 아이콘
  const whatIcon = document.createElement('button');
  whatIcon.innerHTML = '❓';
  whatIcon.title = getLocalizedText('quickActionWhatTooltip');
  whatIcon.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  whatIcon.addEventListener('mouseenter', () => {
    whatIcon.style.background = 'rgba(255,255,255,0.3)';
    whatIcon.style.transform = 'scale(1.1)';
  });
  whatIcon.addEventListener('mouseleave', () => {
    whatIcon.style.background = 'rgba(255,255,255,0.2)';
    whatIcon.style.transform = 'scale(1)';
  });
  whatIcon.addEventListener('click', () => {
    executeQuickAction(getLocalizedText('quickActionWhat'));
  });
  
  // "번역해달라" 아이콘
  const translateIcon = document.createElement('button');
  translateIcon.innerHTML = '🌐';
  translateIcon.title = getLocalizedText('quickActionTranslateTooltip');
  translateIcon.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  translateIcon.addEventListener('mouseenter', () => {
    translateIcon.style.background = 'rgba(255,255,255,0.3)';
    translateIcon.style.transform = 'scale(1.1)';
  });
  translateIcon.addEventListener('mouseleave', () => {
    translateIcon.style.background = 'rgba(255,255,255,0.2)';
    translateIcon.style.transform = 'scale(1)';
  });
  translateIcon.addEventListener('click', () => {
    executeQuickAction(getLocalizedText('quickActionTranslate'));
  });
  
  // 퀵 액션 컨테이너에 아이콘들 추가
  quickActionContainer.appendChild(whatIcon);
  quickActionContainer.appendChild(translateIcon);
  
  // 질문 입력 영역
  const questionInput = document.createElement('textarea');
  questionInput.placeholder = getLocalizedText('questionPlaceholder');
  questionInput.style.cssText = `
    width: 100%;
    height: 80px;
    padding: 10px;
    border: none;
    border-radius: 8px;
    background: rgba(255,255,255,0.9);
    color: #333;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    outline: none;
    margin-bottom: 12px;
    box-sizing: border-box;
    user-select: auto;
  `;
  
  // 버튼 컨테이너
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;
  
  // 취소 버튼
  const cancelButton = document.createElement('button');
  cancelButton.textContent = getLocalizedText('cancelButton');
  cancelButton.style.cssText = `
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: rgba(255,255,255,0.2);
    color: white;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
  `;
  cancelButton.addEventListener('click', hideQuestionPopup);
  
  // 질문하기 버튼
  const askButton = document.createElement('button');
  askButton.textContent = getLocalizedText('askButton');
  askButton.style.cssText = `
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: rgba(255,255,255,0.9);
    color: #333;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  `;
  
  // 질문 처리
  const handleQuestion = async () => {
    const question = questionInput.value.trim();
    if (!question) {
      questionInput.focus();
      return;
    }
    
    // 로딩 상태로 변경
    askButton.textContent = getLocalizedText('processingButton');
    askButton.disabled = true;
    questionInput.disabled = true;
    
    try {
      // Extension context 유효성 확인
      if (!chrome.runtime?.id) {
        throw new Error('Extension context is invalid. Please reload the page.');
      }
      
      // Gemini API 호출
      const response = await chrome.runtime.sendMessage({
        type: 'ASK_QUESTION',
        selectedText: currentSelectedText,
        question: question
      });
      
      // 응답 처리
      if (response && response.error) {
        showErrorMessage(response.error);
      } else if (response && response.answer) {
        hideQuestionPopup();
        showResponsePopup(response.answer);
      } else {
        showErrorMessage(getLocalizedText('noResponse'));
      }
    } catch (error) {
      console.error('[Gemini Assistant] Error:', error);
      
      // Extension context 오류 처리
      if (error.message.includes('Extension context invalid') || 
          error.message.includes('message port closed') ||
          !chrome.runtime?.id) {
        showErrorMessage(getLocalizedText('extensionReloadRequired'));
      } else {
        showErrorMessage(getLocalizedText('genericError') + ': ' + error.message);
      }
    } finally {
      askButton.textContent = getLocalizedText('askButton');
      askButton.disabled = false;
      questionInput.disabled = false;
    }
  };
  
  askButton.addEventListener('click', handleQuestion);
  
  // Enter 키 처리 (Shift+Enter는 줄바꿈)
  questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuestion();
    }
  });
  
  // 팝업 조립
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(askButton);
  
  questionPopup.appendChild(selectedTextPreview);
  questionPopup.appendChild(quickActionContainer);
  questionPopup.appendChild(questionInput);
  questionPopup.appendChild(buttonContainer);
  
  // 화면에 추가
  document.body.appendChild(questionPopup);
  
  // 화면 경계 조정
  adjustPopupPosition(questionPopup);
  
  // 포커스
  questionInput.focus();
  
  isQuestionUIOpen = true;
}

// 응답 팝업 표시
function showResponsePopup(answer) {
  hideResponsePopup();
  
  if (!currentSelectionRange) return;
  
  // 선택 범위의 위치 계산
  const rect = currentSelectionRange.getBoundingClientRect();
  const x = rect.left + window.scrollX;
  const y = rect.bottom + window.scrollY + 10;
  
  responsePopup = document.createElement('div');
  responsePopup.id = 'gemini-response-popup';
  responsePopup.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    z-index: 999999;
    background: white;
    color: #333;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    max-width: 500px;
    min-width: 300px;
    border: 1px solid rgba(0,0,0,0.1);
    line-height: 1.6;
  `;
  
  // 응답 내용
  const responseContent = document.createElement('div');
  responseContent.style.cssText = `
    font-size: 14px;
    margin-bottom: 16px;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 300px;
    overflow-y: auto;
  `;
  responseContent.textContent = answer;
  
  // 닫기 버튼
  const closeButton = document.createElement('button');
  closeButton.textContent = getLocalizedText('closeButton');
  closeButton.style.cssText = `
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: #667eea;
    color: white;
    font-size: 13px;
    cursor: pointer;
    float: right;
    transition: background 0.2s;
  `;
  closeButton.addEventListener('click', hideResponsePopup);
  
  responsePopup.appendChild(responseContent);
  responsePopup.appendChild(closeButton);
  
  document.body.appendChild(responsePopup);
  
  // 화면 경계 조정
  adjustPopupPosition(responsePopup);
}

// 팝업 위치 조정 (화면 경계 처리)
function adjustPopupPosition(popup) {
  const rect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 오른쪽 경계 처리
  if (rect.right > viewportWidth - 20) {
    popup.style.left = `${viewportWidth - rect.width - 20}px`;
  }
  
  // 왼쪽 경계 처리
  if (rect.left < 20) {
    popup.style.left = '20px';
  }
  
  // 아래쪽 경계 처리
  if (rect.bottom > viewportHeight - 20) {
    popup.style.top = `${viewportHeight - rect.height - 20}px`;
  }
  
  // 위쪽 경계 처리
  if (rect.top < 20) {
    popup.style.top = '20px';
  }
}

// 질문 팝업 숨기기
function hideQuestionPopup() {
  if (questionPopup) {
    questionPopup.remove();
    questionPopup = null;
    isQuestionUIOpen = false;
  }
}

// 응답 팝업 숨기기
function hideResponsePopup() {
  if (responsePopup) {
    responsePopup.remove();
    responsePopup = null;
  }
}

// 에러 메시지 표시
function showErrorMessage(message) {
  // 간단한 에러 알림
  const errorPopup = document.createElement('div');
  errorPopup.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000000;
    background: #ff4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    word-break: break-word;
  `;
  errorPopup.textContent = message;
  
  document.body.appendChild(errorPopup);
  
  // 3초 후 자동 제거
  setTimeout(() => {
    errorPopup.remove();
  }, 3000);
}

// 클릭 시 팝업 닫기 (팝업 외부 클릭) - 개선된 버전
document.addEventListener('click', (event) => {
  // 팝업 내부 클릭은 무시
  if (event.target.closest('#gemini-question-popup, #gemini-response-popup')) {
    return;
  }
  
  // 외부 클릭 시 팝업 닫기
  if (questionPopup) {
    hideQuestionPopup();
    // 선택도 해제
    try {
      window.getSelection().removeAllRanges();
    } catch (error) {
      console.warn('[Gemini Assistant] Could not clear selection:', error);
    }
  }
  
  if (responsePopup) {
    hideResponsePopup();
  }
}, true); // capture 단계에서 처리

// ESC 키로 팝업 닫기
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideQuestionPopup();
    hideResponsePopup();
  }
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTENSION_ENABLED_TOGGLE') {
    extensionEnabled = message.enabled;
    if (!extensionEnabled) {
      hideQuestionPopup();
      hideResponsePopup();
    }
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'LANGUAGE_CHANGED') {
    updateLanguage(message.language);
    sendResponse({ success: true });
    return true;
  }
});

// 확장 프로그램 초기화
async function initializeExtension() {
  try {
    // Extension context 유효성 확인
    if (!chrome.runtime?.id) {
      console.warn('[Gemini Assistant] Extension context is invalid during initialization');
      return;
    }
    
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    extensionEnabled = settings.extensionEnabled !== false;
    
    // 언어 설정 초기화
    const browserLanguage = (navigator.language || navigator.userLanguage).startsWith('ko') ? 'ko' : 'en';
    currentLanguage = settings.language || browserLanguage;
    
    console.log('[Gemini Assistant] Extension initialized:', { extensionEnabled, currentLanguage });
  } catch (error) {
    console.error('[Gemini Assistant] Initialization error:', error);
    
    // Extension context 오류 시 재시도 로직
    if (error.message.includes('Extension context invalid') || 
        error.message.includes('message port closed') ||
        !chrome.runtime?.id) {
      console.warn('[Gemini Assistant] Extension context invalid during initialization. Extension may need to be reloaded.');
    }
  }
}

// 초기화 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}