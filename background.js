// Gemini API 엔드포인트
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent";

// API 키 가져오기
async function getApiKey() {
  const data = await chrome.storage.sync.get('apiKey');
  return data.apiKey || '';
}

// 세그먼트를 청크로 나누기
function chunkSegments(segments, maxChunkSize = 2000) { // 청크 크기를 2KB로 줄임
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;

  for (const segment of segments) {
    if (currentSize + segment.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push([...currentChunk]);
      currentChunk = [];
      currentSize = 0;
    }
    
    currentChunk.push(segment);
    currentSize += segment.length;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// 번역 프롬프트 생성
function buildPrompt(segments, targetLang) {
  return `Please translate the following text segments from any language to ${targetLang}. 
Return ONLY the translations in a JSON array format, maintaining the exact same order as the input segments.
Do not include any explanations, notes, or additional text outside the JSON array.

Input segments:
${segments.map((s, i) => `[${i}] ${s}`).join('\n\n')}`;
}

// Gemini API 응답 파싱
function parseGeminiResponse(response) {
  try {
    if (!response.candidates || response.candidates.length === 0) {
      console.error('No candidates in Gemini response:', response);
      return [];
    }

    const content = response.candidates[0].content;
    if (!content || !content.parts || content.parts.length === 0) {
      console.error('No content parts in Gemini response:', response);
      return [];
    }

    const text = content.parts[0].text;
    // JSON 배열 추출 (텍스트에서 [] 사이의 내용을 찾음)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // 일반 텍스트 응답인 경우 줄바꿈으로 분리
      return text.split('\n').filter(line => line.trim());
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error, response);
    return [];
  }
}

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE') {
    handleTranslation(message, sender, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
  
  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.sync.set({
      apiKey: message.apiKey,
      sourceLang: message.sourceLang,
      targetLang: message.targetLang,
      selectionTranslateEnabled: message.selectionTranslateEnabled
    });
    sendResponse({ success: true });
  }
  
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(['apiKey', 'sourceLang', 'targetLang', 'selectionTranslateEnabled'], (data) => {
      sendResponse({
        apiKey: data.apiKey || '',
        sourceLang: data.sourceLang || 'auto',
        targetLang: data.targetLang || 'ko',
        selectionTranslateEnabled: data.selectionTranslateEnabled !== false // 기본값 true
      });
    });
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 선택 텍스트 번역 처리
  if (message.type === 'TRANSLATE_SELECTION') {
    handleSelectionTranslation(message, sender, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
});

// 선택 텍스트 번역 함수
async function handleSelectionTranslation(message, sender, sendResponse) {
  try {
    const { text, targetLang = 'en' } = message;
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      sendResponse({ error: 'API 키가 설정되지 않았습니다.' });
      return;
    }
    
    if (!text || text.trim() === '') {
      sendResponse({ error: '번역할 텍스트가 없습니다.' });
      return;
    }
    
    // 번역 프롬프트 생성 (언어 코드를 실제 언어명으로 매핑)
    const languageNames = {
      'en': 'English',
      'ko': 'Korean',
      'ja': 'Japanese', 
      'zh': 'Chinese',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'ru': 'Russian'
    };
    
    const targetLanguageName = languageNames[targetLang] || 'English';
    
    const prompt = `You are a professional translator. Translate the following text from any language to ${targetLanguageName}.

IMPORTANT RULES:
- You MUST translate the text, do not return the original text
- Return ONLY the translated text, no explanations or additional content
- If the text is already in ${targetLanguageName}, translate it to a different language that makes sense
- Maintain the original meaning and tone

Text to translate: "${text}"

Translation:`;
    
    console.log('Selection translation prompt:', prompt);
    
    // Gemini API 호출
    const response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.9,
          topK: 20,
          maxOutputTokens: 1000
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Selection translation API error:', errorText);
      throw new Error(`Gemini API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 응답에서 번역된 텍스트 추출
    let translation = '';
    try {
      if (data && data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate && candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
          const part = candidate.content.parts[0];
          if (part && typeof part.text === 'string') {
            translation = part.text.trim();
          }
        }
      }
      
      if (!translation) {
        console.error('Empty translation result from API:', data);
        throw new Error('번역 결과가 비어있습니다.');
      }
      
      console.log('Selection translation successful:', translation);
      sendResponse({ translation });
    } catch (parseError) {
      console.error('Error parsing API response:', parseError, data);
      throw new Error('API 응답 파싱 오류: ' + parseError.message);
    }
  } catch (error) {
    console.error('Selection translation error:', error);
    sendResponse({ error: error.message });
  }
}

// 번역 처리 함수
async function handleTranslation(message, sender, sendResponse) {
  try {
    const { segments, targetLang = 'ko' } = message;
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      sendResponse({ error: 'API 키가 설정되지 않았습니다.' });
      return;
    }
    
    if (!segments || segments.length === 0) {
      sendResponse({ translations: [] });
      return;
    }
    
    // 변수 초기화
    let completedChunks = 0;
    const chunkedSegments = chunkSegments(segments);
    const totalChunks = chunkedSegments.length;
    
    // 진행상황 처리를 위한 추가 인자
    sendResponse({ 
      status: 'processing', 
      progress: 0,
      totalChunks, 
      totalSegments: segments.length 
    });
    
    // 최대 동시 요청 개수
    const MAX_CONCURRENCY = 3;
    
    // 청크 번역 함수
    async function translateChunk(chunk, chunkIndex) {
      // 시작 인덱스 계산
      const startIndex = chunkedSegments.slice(0, chunkIndex).flat().length;
      
      try {
        const prompt = buildPrompt(chunk, targetLang);
        const response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              topP: 0.8,
              topK: 40
            }
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Chunk ${chunkIndex} API error:`, errorText);
          throw new Error(`Gemini API 오류: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const translations = parseGeminiResponse(data);
        
        // 번역 결과 처리
        let chunkResults = [];
        if (translations.length === chunk.length) {
          chunkResults = translations;
        } else {
          console.warn(`Chunk ${chunkIndex} translation count mismatch:`, chunk.length, translations.length);
          // 부족한 부분은 원본으로 채움
          for (let i = 0; i < chunk.length; i++) {
            chunkResults.push(translations[i] || chunk[i]);
          }
        }
        
        // 진행상황 업데이트
        completedChunks++;
        const progress = Math.round((completedChunks / totalChunks) * 100);
        
        // 번역 결과를 즉시 탭에 전송
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'CHUNK_TRANSLATED',
          chunkIndex,
          startIndex,
          translations: chunkResults,
          progress,
          isLastChunk: completedChunks === totalChunks
        });
        
        return chunkResults;
      } catch (error) {
        console.error(`Error translating chunk ${chunkIndex}:`, error);
        // 오류 발생 시 원본 반환
        return chunk;
      }
    }
    
    // 병렬 번역 실행
    const promises = [];
    const processNextChunks = async (startIdx) => {
      let idx = startIdx;
      
      // 남은 청크가 있는 동안 진행
      while (idx < chunkedSegments.length) {
        const chunkIdx = idx++;
        const promise = translateChunk(chunkedSegments[chunkIdx], chunkIdx);
        promises.push(promise);
        
        // 동시성 제한에 도달했다면 기다림
        if (promises.length >= MAX_CONCURRENCY) {
          await Promise.any(promises.map(p => p.catch(e => e)));
          // 완료된 프로미스 제거
          const resolvedIndex = await Promise.allSettled(promises)
            .then(results => results.findIndex(r => r.status === 'fulfilled'));
          
          if (resolvedIndex !== -1) {
            promises.splice(resolvedIndex, 1);
          }
        }
      }
      
      // 모든 남은 프로미스 완료 대기
      await Promise.allSettled(promises);
    };
    
    // 병렬 처리 시작
    await processNextChunks(0);
    
    // 완료 메시지 전송
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'TRANSLATION_COMPLETE'
    });
  } catch (error) {
    console.error('Translation error:', error);
    try {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'TRANSLATION_ERROR',
        error: error.message
      });
    } catch (e) {
      console.error('Failed to send error message:', e);
    }
  }
}
