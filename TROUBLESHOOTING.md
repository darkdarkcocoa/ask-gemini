# Gemini Page Translator 문제 해결 가이드

## 적용된 개선사항

1. **API 타임아웃 증가**: 30초 → 60초
2. **재시도 로직 추가**: 실패 시 최대 3회 재시도 (지수 백오프)
3. **청크 크기 최적화**: 
   - maxTokens: 8000 → 4000
   - 최소 세그먼트: 50 → 25
4. **새로운 메시지 타입 추가**:
   - CHUNK_RETRY: 재시도 상태 표시
   - CHUNK_FAILED: 실패한 청크 처리
5. **디버깅 도구 추가**: debug-helper.js, debug-content.js

## 확장 프로그램 재설치 방법

1. Chrome에서 `chrome://extensions/` 열기
2. 개발자 모드 활성화
3. 기존 Gemini Page Translator 제거
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. `C:\ClaudeFileSystem\gemini-page-translator` 폴더 선택

## 테스트 단계

### 1. 기본 테스트
```javascript
// 콘솔에서 실행
console.log('[Test] Checking extension status...');
chrome.runtime.sendMessage({type: 'GET_SETTINGS'}, (response) => {
  console.log('Settings:', response);
});
```

### 2. API 키 확인
- 팝업에서 API 키가 올바르게 설정되었는지 확인
- Gemini API 키는 https://makersuite.google.com/app/apikey 에서 발급

### 3. 디버그 모드 활성화
```javascript
// content.js 상단에 추가 (이미 debug-content.js에 포함됨)
const DEBUG_MODE = true;
```

### 4. 네트워크 모니터링
1. 개발자 도구 → Network 탭
2. "generativelanguage.googleapis.com" 필터링
3. 요청/응답 확인

## 일반적인 문제 및 해결방법

### 문제 1: "번역중..." 상태에서 멈춤
**원인**: API 타임아웃 또는 네트워크 오류
**해결**: 
- 인터넷 연결 확인
- API 키 유효성 확인
- 페이지 새로고침 후 재시도

### 문제 2: API 오류 403
**원인**: 잘못된 API 키
**해결**: 
- API 키 재발급
- 팝업에서 API 키 다시 입력

### 문제 3: API 오류 429
**원인**: API 요청 한도 초과
**해결**: 
- 잠시 후 재시도 (1-2분)
- 필요시 청크 크기 더 줄이기

### 문제 4: 번역 결과가 원본과 동일
**원인**: 번역 실패 시 폴백
**해결**: 
- 콘솔에서 에러 메시지 확인
- 디버그 패널에서 상세 정보 확인

## 고급 디버깅

### 1. 백그라운드 스크립트 로그 확인
```
1. chrome://extensions/ 에서 "서비스 워커" 클릭
2. Console 탭에서 로그 확인
```

### 2. 로그 내보내기
```javascript
// 콘솔에서 실행
window.exportGeminiTranslatorDebugLogs();
```

### 3. 특정 청크 재번역
```javascript
// 실패한 청크만 재번역
chrome.runtime.sendMessage({
  type: 'TRANSLATE',
  segments: ['텍스트1', '텍스트2'],
  targetLang: 'ko'
});
```

## 성능 최적화 팁

1. **청크 크기 조정**
   - 짧은 페이지: maxTokens = 2000
   - 긴 페이지: maxTokens = 4000-6000

2. **동시 처리 수 조정**
   - background.js에서 `maxConcurrent` 값 조정 (기본: 3)

3. **캐싱 활용**
   - 동일한 텍스트는 재번역하지 않도록 캐시 구현 고려

## 추가 개선 제안

1. **오프라인 번역 캐시**: IndexedDB 활용
2. **부분 번역**: 보이는 영역만 우선 번역
3. **번역 품질 설정**: temperature 값 조정 가능하게
4. **다중 언어 감지**: 페이지 내 여러 언어 자동 감지

## 문의 및 지원

문제가 지속되면 다음 정보와 함께 보고:
- Chrome 버전
- 에러 메시지 (콘솔)
- 디버그 로그 (JSON 파일)
- 문제 발생 URL
