// 개선된 번역 처리를 위한 패치
// 이 파일을 background.js에 적용해야 합니다

// 1. API 타임아웃을 60초로 증가
// 2. 재시도 로직 추가 (최대 3회)
// 3. 더 나은 에러 처리
// 4. 청크 크기 동적 조정

// translateChunk 함수의 개선된 버전
async function translateChunkWithRetry(chunk, chunkIndex, tabId, totalChunks, targetLang, apiKey, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2초
  
  try {
    return await translateChunkCore(chunk, chunkIndex, tabId, totalChunks, targetLang, apiKey);
  } catch (error) {
    console.error(`[Background] Chunk ${chunkIndex + 1} failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);
    
    if (retryCount < MAX_RETRIES - 1) {
      // 재시도 전 대기
      console.log(`[Background] Retrying chunk ${chunkIndex + 1} in ${RETRY_DELAY}ms...`);
      
      // 재시도 상태 전송
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'CHUNK_RETRY',
          chunkIndex,
          totalChunks,
          retryCount: retryCount + 1,
          maxRetries: MAX_RETRIES
        });
      } catch (e) {
        console.log('Failed to send retry message:', e);
      }
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return await translateChunkWithRetry(chunk, chunkIndex, tabId, totalChunks, targetLang, apiKey, retryCount + 1);
    } else {
      // 최대 재시도 횟수 초과
      console.error(`[Background] Chunk ${chunkIndex + 1} failed after ${MAX_RETRIES} attempts`);
      
      // 실패한 청크는 원본 텍스트로 반환
      const fallbackResults = chunk.map((segment, idx) => ({
        index: chunkIndex * chunk.length + idx,
        original: segment,
        translation: segment, // 원본 텍스트 유지
        failed: true
      }));
      
      return fallbackResults;
    }
  }
}
