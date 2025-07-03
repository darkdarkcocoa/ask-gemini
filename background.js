// Gemini 웹 AI 어시스턴트 - Background Script
console.log('[Gemini Assistant] Background script loaded');

// Gemini API 엔드포인트
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// API 키 가져오기
async function getApiKey() {
  const data = await chrome.storage.sync.get('apiKey');
  return data.apiKey || '';
}

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Gemini Assistant] Message received:', message.type);
  
  // 질문 처리
  if (message.type === 'ASK_QUESTION') {
    handleQuestion(message, sender, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 설정 저장
  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.sync.set({
      apiKey: message.apiKey,
      extensionEnabled: message.extensionEnabled
    });
    sendResponse({ success: true });
  }
  
  // 설정 가져오기
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(['apiKey', 'extensionEnabled'], (data) => {
      sendResponse({
        apiKey: data.apiKey || '',
        extensionEnabled: data.extensionEnabled !== false // 기본값 true
      });
    });
    return true; // 비동기 응답을 위해 true 반환
  }
});

// 질문 처리 함수
async function handleQuestion(message, sender, sendResponse) {
  try {
    console.log('[Gemini Assistant] Processing question:', message.question);
    
    const { selectedText, question } = message;
    const apiKey = await getApiKey();
    
    // API 키 검증
    if (!apiKey) {
      console.error('[Gemini Assistant] No API key found');
      sendResponse({ error: 'API 키가 설정되지 않았습니다. 확장 프로그램 설정에서 API 키를 입력해주세요.' });
      return;
    }
    
    // 입력 검증
    if (!selectedText || !question) {
      sendResponse({ error: '선택된 텍스트와 질문이 필요합니다.' });
      return;
    }
    
    // 너무 긴 텍스트 검증
    if (selectedText.length > 3000) {
      sendResponse({ error: '선택된 텍스트가 너무 깁니다. (최대 3000자)' });
      return;
    }
    
    // 프롬프트 생성
    const prompt = buildQuestionPrompt(selectedText, question);
    
    console.log('[Gemini Assistant] Making API request...');
    
    // API 요청
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000); // 30초 타임아웃
    
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          topK: 20,
          maxOutputTokens: 2048
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // 응답 검증
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini Assistant] API error:', response.status, errorText);
      
      let errorMessage = `API 오류: ${response.status}`;
      if (response.status === 400) {
        errorMessage = 'API 요청 형식 오류. API 키를 확인해주세요.';
      } else if (response.status === 403) {
        errorMessage = 'API 키가 유효하지 않거나 권한이 없습니다.';
      } else if (response.status === 429) {
        errorMessage = 'API 요청 한도 초과. 잠시 후 다시 시도해주세요.';
      }
      
      sendResponse({ error: errorMessage });
      return;
    }
    
    // 응답 파싱
    const data = await response.json();
    console.log('[Gemini Assistant] API response received');
    
    const answer = extractAnswer(data);
    
    if (!answer) {
      console.error('[Gemini Assistant] No answer extracted from response');
      sendResponse({ error: '응답을 처리할 수 없습니다.' });
      return;
    }
    
    console.log('[Gemini Assistant] Question processed successfully');
    sendResponse({ answer });
    
  } catch (error) {
    console.error('[Gemini Assistant] Error processing question:', error);
    
    let errorMessage = '오류가 발생했습니다.';
    if (error.name === 'AbortError') {
      errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    sendResponse({ error: errorMessage });
  }
}

// 질문 프롬프트 생성
function buildQuestionPrompt(selectedText, question) {
  return `당신은 도움이 되는 AI 어시스턴트입니다. 사용자가 웹페이지에서 선택한 텍스트에 대해 질문하고 있습니다.

선택된 텍스트:
"""
${selectedText}
"""

사용자의 질문:
"""
${question}
"""

위의 선택된 텍스트를 참고하여 사용자의 질문에 정확하고 도움이 되는 답변을 해주세요. 

답변 규칙:
- 선택된 텍스트의 내용을 기반으로 답변하세요
- 명확하고 이해하기 쉽게 설명해주세요
- 한국어로 답변해주세요
- 너무 길지 않게 핵심만 간결하게 답변해주세요
- 만약 선택된 텍스트만으로는 충분한 답변을 할 수 없다면, 그 점을 명시하고 가능한 범위에서 답변해주세요

답변:`;
}

// 응답에서 답변 추출
function extractAnswer(data) {
  try {
    if (!data.candidates || data.candidates.length === 0) {
      console.error('[Gemini Assistant] No candidates in response');
      return null;
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('[Gemini Assistant] No content parts in response');
      return null;
    }
    
    const text = candidate.content.parts[0].text;
    if (!text || !text.trim()) {
      console.error('[Gemini Assistant] Empty response text');
      return null;
    }
    
    return text.trim();
  } catch (error) {
    console.error('[Gemini Assistant] Error extracting answer:', error);
    return null;
  }
}