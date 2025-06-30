// 텍스트 노드 상수
const TEXT_NODE = Node.TEXT_NODE;

// 확장 프로그램 로드 확인용 로그
console.log('[Gemini Translator] Content script loaded successfully');
console.log('[Gemini Translator] Document ready state:', document.readyState);
console.log('[Gemini Translator] URL:', window.location.href);

// 번역 진행표시줄 추가 함수
function addTranslationProgressBar() {
  // 기존 프로그레스 바가 있는지 확인
  if (document.getElementById('translation-progress-container')) {
    return document.getElementById('translation-progress-bar');
  }
  
  // 프로그레스 바 컨테이너 생성
  const container = document.createElement('div');
  container.id = 'translation-progress-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: #f1f1f1;
    z-index: 9999;
    pointer-events: none;
  `;
  
  // 프로그레스 바 생성
  const progressBar = document.createElement('div');
  progressBar.id = 'translation-progress-bar';
  progressBar.style.cssText = `
    height: 100%;
    width: 0%;
    background-color: #1a73e8;
    transition: width 0.3s ease;
  `;
  
  // 화면에 추가
  container.appendChild(progressBar);
  document.body.appendChild(container);
  
  // 참조 저장
  window._translationProgressBar = progressBar;
  
  return progressBar;
}

// 청크 번역 결과 적용 함수
function applyChunkTranslation(startIndex, translations, progress) {
  if (!window._translationNodes || !translations) {
    console.error('번역 결과 적용 오류: 노드 혹은 번역 결과가 없습니다.');
    return;
  }

  // DOM 업데이트를 위한 변경 사항 수집
  const updateBatch = [];
  
  // 시작 인덱스부터 번역 적용
  for (let i = 0; i < translations.length; i++) {
    const nodeIndex = startIndex + i;
    if (nodeIndex < window._translationNodes.length) {
      const node = window._translationNodes[nodeIndex];
      if (node && translations[i]) {
        // 원본 텍스트가 저장되지 않은 경우 저장 (추가 보호막)
        if (!originalMap.has(node)) {
          originalMap.set(node, node.nodeValue);
        }
        
        // 노드와 새 값을 보관
        updateBatch.push({
          node,
          newValue: translations[i]
        });
      }
    }
  }
  
  // 화면 강제 리플로우를 위한 비동기 작업
  // requestAnimationFrame을 사용하여 최적화
  requestAnimationFrame(() => {
    // 모든 DOM 업데이트를 한 번에 처리
    updateBatch.forEach(update => {
      update.node.nodeValue = update.newValue;
      
      // 가시적인 변화 효과를 위한 스타일 추가 (선택사항)
      try {
        const parent = update.node.parentElement;
        if (parent && !parent.hasAttribute('data-translated')) {
          parent.setAttribute('data-translated', 'true');
          parent.style.transition = 'opacity 0.3s';
          parent.style.opacity = '0.4';
          setTimeout(() => {
            parent.style.opacity = '1';
          }, 50);
        }
      } catch (e) {
        // 스타일 그리기 오류는 무시
      }
    });
    
    // 번역 진행 상황 표시 (경우에 따라 선택사항)
    if (window._translationProgressBar && progress) {
      window._translationProgressBar.style.width = `${Math.min(100, progress)}%`;
    }
  });
}

// 원본 텍스트 저장용 맵
let originalMap = new Map();
let isTranslated = false;

// 번역 상태 저장
let translationState = {
  inProgress: false,
  completed: false
};

// 페이지 번역 함수
async function translatePage() {
  // 이미 번역 중이면 중복 실행 방지
  if (translationState.inProgress) {
    return { success: true };
  }
  
  // 이미 번역된 상태면 토글
  if (translationState.completed) {
    toggleTranslation();
    return { success: true, translationComplete: true };
  }
  
  translationState.inProgress = true;
  
  try {
    // 설정 가져오기
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    
    // 텍스트 노드 수집
    const textInfo = collectTextNodes(document.body);
    const texts = textInfo.texts;
    const nodes = textInfo.nodes;
    
    // 지역 변수로 이동하여 청크별 번역을 위해 접근 가능하게 함
    window._translationNodes = nodes;
    
    if (texts.length === 0) {
      console.log('번역할 텍스트가 없습니다.');
      translationState.inProgress = false;
      return { success: true, translationComplete: true };
    }
    
    // 번역 시작 시 프로그레스 바 추가
    addTranslationProgressBar();
    
    // 번역 요청
    await chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      segments: texts,
      targetLang: settings.targetLang || 'ko'
    });
    
    // 번역 요청이 보내진 후 바로 달성함 - 번역 결과는 청크별로 도착
    
    // 동적 콘텐츠 감시 시작
    startObserving();
    
    // 플래그만 설정하고 방해하지 않음
    translationState.completed = true;
    isTranslated = true;
    
    return { success: true };
  } catch (error) {
    console.error('번역 처리 오류:', error);
    alert(`번역 처리 오류: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    // 실제 청크가 모두 처리된 후 translateState.inProgress = false가 됨
    // 최종 청크가 처리되면 CHUNK_TRANSLATED 이벤트에서 이 플래그를 변경함
  }
}

// 텍스트 노드 수집 함수
function collectTextNodes(root) {
  const texts = [];
  const nodes = [];
  
  // 텍스트 노드 순회
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // 의미 있는 텍스트만 수집 (공백, 스크립트, 스타일 제외)
        if (node.nodeValue.trim() && 
            !isInvisibleNode(node) &&
            !isInScriptOrStyle(node)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue.trim();
    if (text) {
      texts.push(text);
      nodes.push(node);
      // 원본 텍스트 저장
      originalMap.set(node, node.nodeValue);
    }
  }
  
  return { texts, nodes };
}

// 번역 결과 적용 함수
function applyTranslations(nodes, translations) {
  if (!nodes || !translations || nodes.length !== translations.length) {
    console.error('노드와 번역 결과 수가 일치하지 않습니다:', nodes?.length, translations?.length);
    return;
  }
  
  // 번역 적용 시 부분적으로 화면 업데이트 위해 지연 추가
  const batchSize = 50; // 한 번에 처리할 노드 수
  
  // 노드를 나누어 일괄 처리
  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize);
    const batchTranslations = translations.slice(i, i + batchSize);
    
    // 비동기로 다음 배치 처리
    setTimeout(() => {
      batch.forEach((node, idx) => {
        if (batchTranslations[idx]) {
          node.nodeValue = batchTranslations[idx];
        }
      });
    }, 0);
  }
}

// 번역 토글 함수
function toggleTranslation() {
  if (!translationState.completed) {
    return;
  }
  
  for (const [node, stored] of originalMap.entries()) {
    if (node.nodeType === TEXT_NODE) {
      const current = node.nodeValue;  // 현재 화면에 보이는 텍스트
      node.nodeValue = stored;         // 저장된 텍스트로 교체
      originalMap.set(node, current);  // 현재 텍스트를 저장
    }
  }
  
  isTranslated = !isTranslated;  // 상태는 마지막에 변경
}

// 보이지 않는 노드인지 확인
function isInvisibleNode(node) {
  const element = node.parentElement;
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return style.display === 'none' || 
         style.visibility === 'hidden' || 
         style.opacity === '0';
}

// 스크립트나 스타일 태그 내부인지 확인
function isInScriptOrStyle(node) {
  let parent = node.parentNode;
  while (parent) {
    if (parent.nodeName === 'SCRIPT' || 
        parent.nodeName === 'STYLE' || 
        parent.nodeName === 'NOSCRIPT') {
      return true;
    }
    parent = parent.parentNode;
  }
  return false;
}

// 동적 콘텐츠 감시 시작
function startObserving() {
  // 이미 MutationObserver가 설정되어 있으면 중복 설정 방지
  if (window._translationObserver) {
    return;
  }
  
  // 디바운스 타이머
  let debounceTimer = null;
  
  // MutationObserver 설정
  const observer = new MutationObserver((mutations) => {
    // 의미 있는 변경이 있는지 확인
    const hasRelevantChanges = mutations.some(mutation => 
      mutation.type === 'childList' && mutation.addedNodes.length > 0
    );
    
    if (!hasRelevantChanges || !isTranslated) {
      return;
    }
    
    // 디바운스 처리 (500ms)
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        // 새로 추가된 노드 수집
        const addedNodes = [];
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                addedNodes.push(node);
              }
            });
          }
        });
        
        if (addedNodes.length === 0) {
          return;
        }
        
        // 설정 가져오기
        const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
        
        // 각 추가된 노드에 대해 번역 처리
        for (const node of addedNodes) {
          const textInfo = collectTextNodes(node);
          
          if (textInfo.texts.length === 0) {
            continue;
          }
          
          // 번역 요청
          const response = await chrome.runtime.sendMessage({
            type: 'TRANSLATE',
            segments: textInfo.texts,
            targetLang: settings.targetLang || 'ko'
          });
          
          if (response.error) {
            console.error('동적 콘텐츠 번역 오류:', response.error);
            continue;
          }
          
          // 번역 결과 적용
          applyTranslations(textInfo.nodes, response.translations);
        }
      } catch (error) {
        console.error('동적 콘텐츠 번역 처리 오류:', error);
      }
    }, 500);
  });
  
  // 문서 전체 감시 설정
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // 참조 저장
  window._translationObserver = observer;
}

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE_PAGE') {
    // 비동기 처리를 위해 프로미스 처리
    translatePage().then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // 비동기 응답을 위해 true 반환
  }
  
  if (message.type === 'TOGGLE_TRANSLATION') {
    toggleTranslation();
    sendResponse({ success: true });
  }
  
  // 청크별 번역 결과 처리
  if (message.type === 'CHUNK_TRANSLATED') {
    // 청크가 처음이면 프로그레스 바 추가
    if (message.chunkIndex === 0) {
      addTranslationProgressBar();
    }
    
    // 청크 번역 결과 적용
    applyChunkTranslation(message.startIndex, message.translations, message.progress);
    
    // 진행상황 로그 (개발용)
    console.log(`번역 진행상황: ${message.progress}% (청크 ${message.chunkIndex + 1})`);
    
    // 프로그레스 바 업데이트
    if (window._translationProgressBar) {
      window._translationProgressBar.style.width = `${message.progress}%`;
    }
    
    // 마지막 청크인 경우 번역 완료 처리
    if (message.isLastChunk) {
      translationState.inProgress = false;
      console.log('번역이 완료되었습니다.');
      
      // 프로그레스 바 완료 표시
      if (window._translationProgressBar) {
        window._translationProgressBar.style.width = '100%';
        setTimeout(() => {
          const container = document.getElementById('translation-progress-container');
          if (container) {
            container.style.opacity = '0';
            container.style.transition = 'opacity 0.3s ease';
            setTimeout(() => container.remove(), 300);
          }
        }, 500);
      }
      
      // 최종 완료 메시지를 팝업에 전송 (팝업이 열려 있는 경우)
      chrome.runtime.sendMessage({
        type: 'TRANSLATION_COMPLETE',
        tabId: chrome.runtime.id
      });
    }
    
    // 응답 완료
    sendResponse({ success: true });
    return true;
  }
  
  // 번역 오류 처리
  if (message.type === 'TRANSLATION_ERROR') {
    translationState.inProgress = false;
    console.error('번역 오류:', message.error);
    
    // 프로그레스 바 제거
    const container = document.getElementById('translation-progress-container');
    if (container) {
      container.remove();
    }
    
    // 오류 표시
    alert(`번역 오류: ${message.error}`);
    
    sendResponse({ success: false });
    return true;
  }
  
  // 선택 번역 토글 처리
  if (message.type === 'SELECTION_TRANSLATE_TOGGLE') {
    selectionTranslateEnabled = message.enabled;
    sendResponse({ success: true });
    return true;
  }
});

// 선택 텍스트 번역 기능을 위한 변수
let lastCtrlCTime = 0;
let selectionTranslateEnabled = true;
let translationTooltip = null;
let isTranslating = false; // 번역 중복 방지 플래그

console.log('[Gemini Translator] Selection translation variables initialized:', {
  lastCtrlCTime,
  selectionTranslateEnabled,
  translationTooltip,
  isTranslating
});

// 번역 툴팁 생성 함수
function createTranslationTooltip() {
  const tooltip = document.createElement('div');
  tooltip.id = 'gemini-translation-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    z-index: 999999;
    background-color: #1a73e8;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    max-width: 300px;
    word-wrap: break-word;
  `;
  document.body.appendChild(tooltip);
  return tooltip;
}

// 툴팁 위치 업데이트 함수
function updateTooltipPosition(tooltip, selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
  
  // 화면 밖으로 나가는 경우 위치 조정
  const tooltipRect = tooltip.getBoundingClientRect();
  if (tooltipRect.right > window.innerWidth) {
    tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
  }
  if (tooltipRect.bottom > window.innerHeight) {
    tooltip.style.top = `${rect.top + window.scrollY - tooltipRect.height - 5}px`;
  }
}

// 선택 텍스트 번역 함수
async function translateSelection() {
  console.log('[Gemini Translator] ========== translateSelection() STARTED ==========');
  
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  console.log('[Gemini Translator] Selected text:', selectedText);
  
  if (!selectedText) {
    console.log('[Gemini Translator] No text selected');
    return;
  }
  
  // 활성 요소 확인 (input 또는 textarea인지)
  const activeElement = document.activeElement;
  const isInputField = activeElement && 
    (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true');
  
  console.log('[Gemini Translator] Is input field:', isInputField);
  
  try {
    // 설정 가져오기
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    
    // 번역 요청
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_SELECTION',
      text: selectedText,
      targetLang: settings.targetLang || 'en'
    });
    
    console.log('[Gemini Translator] API response:', response);
    
    // API 응답이 null이거나 undefined인 경우 처리
    if (!response) {
      console.error('[Gemini Translator] No response from API');
      showTranslationError('API 응답이 없습니다', isInputField);
      return;
    }
    
    if (response.error) {
      console.log('[Gemini Translator] Translation error:', response.error);
      showTranslationError(response.error, isInputField);
    } else if (response.translation) {
      const translatedText = response.translation.trim();
      console.log('[Gemini Translator] Translated text:', translatedText);
      
      if (!translatedText) {
        console.warn('[Gemini Translator] Empty translation received');
        showTranslationError('빈 번역 결과', isInputField);
        return;
      }
      
      if (isInputField) {
        // 입력 필드에서는 텍스트를 직접 교체
        console.log('[Gemini Translator] Replacing text in input field...');
        replaceSelectedText(activeElement, translatedText);
      } else {
        // 일반 텍스트에서는 툴팁으로 표시
        showTranslationTooltip(translatedText, selection);
      }
    } else {
      console.error('[Gemini Translator] Invalid response format:', response);
      showTranslationError('잘못된 API 응답 형식', isInputField);
    }
  } catch (error) {
    console.error('[Gemini Translator] Translation error:', error);
    
    // Extension context invalidated 에러 처리
    if (error.message && (error.message.includes('Extension context invalidated') || 
                         error.message.includes('Could not establish connection'))) {
      console.warn('[Gemini Translator] Extension needs reload');
      if (!isInputField) {
        // selection이 여전히 유효한지 확인
        try {
          if (selection && selection.rangeCount > 0) {
            showTranslationTooltip('확장 프로그램을 새로고침해주세요', selection, '#ff9800');
          }
        } catch (e) {
          console.error('[Gemini Translator] Cannot show tooltip:', e);
        }
      }
    } else {
      const errorMsg = error.message || '알 수 없는 오류';
      showTranslationError(errorMsg, isInputField);
    }
  }
}

// 입력 필드에서 선택된 텍스트 교체
function replaceSelectedText(element, newText) {
  console.log('[Gemini Translator] replaceSelectedText called with:', {
    element: element.tagName,
    newText: newText,
    selectionStart: element.selectionStart,
    selectionEnd: element.selectionEnd,
    currentValue: element.value
  });
  
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    
    console.log('[Gemini Translator] Before replacement:', {
      start, end, value,
      selectedText: value.substring(start, end)
    });
    
    // 텍스트 교체
    const newValue = value.substring(0, start) + newText + value.substring(end);
    element.value = newValue;
    
    // 커서를 번역된 텍스트 끝으로 이동
    const newCursorPos = start + newText.length;
    element.selectionStart = element.selectionEnd = newCursorPos;
    
    console.log('[Gemini Translator] After replacement:', {
      newValue: element.value,
      newCursorPos: newCursorPos
    });
    
    // change 이벤트 발생 (React 등의 프레임워크 호환성)
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('[Gemini Translator] Text replaced in input field - COMPLETED');
  } else if (element.contentEditable === 'true') {
    // contentEditable 요소 처리
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      console.log('[Gemini Translator] ContentEditable - selected text:', range.toString());
      
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
      
      // 커서를 번역된 텍스트 끝으로 이동
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    console.log('[Gemini Translator] Text replaced in contentEditable element - COMPLETED');
  }
}

// 툴팁으로 번역 결과 표시
function showTranslationTooltip(text, selection, bgColor = '#1a73e8') {
  // 기존 툴팁 제거
  if (translationTooltip) {
    translationTooltip.remove();
  }
  
  // 새 툴팁 생성
  translationTooltip = createTranslationTooltip();
  translationTooltip.textContent = text;
  translationTooltip.style.backgroundColor = bgColor;
  translationTooltip.style.opacity = '1';
  updateTooltipPosition(translationTooltip, selection);
  
  // 3초 후 툴팁 제거
  setTimeout(() => {
    if (translationTooltip) {
      translationTooltip.style.opacity = '0';
      setTimeout(() => {
        translationTooltip?.remove();
        translationTooltip = null;
      }, 200);
    }
  }, 3000);
}

// 번역 오류 표시
function showTranslationError(error, isInputField) {
  if (!isInputField) {
    const selection = window.getSelection();
    showTranslationTooltip('번역 오류', selection, '#d33');
  } else {
    // 입력 필드에서는 콘솔에만 오류 표시
    console.error('[Gemini Translator] Translation failed:', error);
  }
}

// Ctrl+C+C 감지를 위한 키보드 이벤트 리스너 (capture 단계에서 실행하여 구글의 이벤트 핸들러보다 우선)
// 다중 레벨에서 이벤트 캡처하여 더 확실하게 처리
const handleKeydown = async (e) => {
  // Ctrl+C 감지 (대소문자 모두 처리) - 다른 키는 무시
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
    // 텍스트가 선택되어 있는지 먼저 확인
    const selectedText = window.getSelection().toString().trim();
    
    console.log('[Gemini Translator] Ctrl+C pressed, enabled:', selectionTranslateEnabled);
    console.log('[Gemini Translator] Selected text:', selectedText ? `"${selectedText}"` : 'none');
    
    if (!selectionTranslateEnabled) return;
    
    // 선택된 텍스트가 없으면 처리하지 않음
    if (!selectedText) {
      console.log('[Gemini Translator] No text selected, ignoring Ctrl+C');
      return;
    }
    
    const currentTime = Date.now();
    
    // 이전 Ctrl+C와의 시간 차이가 500ms 이내면 번역 실행
    if (currentTime - lastCtrlCTime < 500) {
      // 이미 번역 중이면 무시
      if (isTranslating) {
        console.log('[Gemini Translator] Translation already in progress, ignoring...');
        return;
      }
      
      console.log('[Gemini Translator] Double Ctrl+C detected, translating...');
      e.preventDefault(); // 복사 동작 방지
      e.stopPropagation(); // 이벤트 전파 차단
      e.stopImmediatePropagation(); // 다른 핸들러 실행 차단
      
      isTranslating = true; // 번역 시작 플래그 설정
      
      try {
        await translateSelection();
        console.log('[Gemini Translator] Translation completed');
      } catch (error) {
        console.error('[Gemini Translator] Translation failed:', error);
      } finally {
        isTranslating = false; // 번역 완료 후 플래그 해제
      }
      
      lastCtrlCTime = 0; // 리셋
    } else {
      console.log('[Gemini Translator] First Ctrl+C detected');
      lastCtrlCTime = currentTime;
    }
  }
};

// 여러 레벨에서 이벤트 캡처
console.log('[Gemini Translator] Registering event listeners...');

// 기본 이벤트 리스너들 (capture 단계가 우선)
document.addEventListener('keydown', handleKeydown, true);
window.addEventListener('keydown', handleKeydown, true);

console.log('[Gemini Translator] Event listeners registered successfully');

// 클릭 시 툴팁 제거
document.addEventListener('click', () => {
  if (translationTooltip) {
    translationTooltip.style.opacity = '0';
    setTimeout(() => {
      translationTooltip?.remove();
      translationTooltip = null;
    }, 200);
  }
});

// 페이지 로드 완료 시 준비 완료 메시지 전송 및 설정 로드
let isInitialized = false; // 중복 초기화 방지

const initializeExtension = async () => {
  if (isInitialized) {
    console.log('[Gemini Translator] Already initialized, skipping...');
    return;
  }
  
  isInitialized = true;
  console.log('[Gemini Translator] Initializing extension...');
  
  chrome.runtime.sendMessage({ type: 'CONTENT_READY' });
  
  // 선택 번역 설정 로드
  try {
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (settings.selectionTranslateEnabled !== undefined) {
      selectionTranslateEnabled = settings.selectionTranslateEnabled;
    }
    console.log('[Gemini Translator] Settings loaded:', settings);
  } catch (error) {
    console.error('설정 로드 오류:', error);
    isInitialized = false; // 오류 시 재시도 허용
  }
};

// 여러 시점에서 초기화 시도
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}
window.addEventListener('load', initializeExtension);
