// Gemini Page Translator 빠른 테스트 스크립트
// 이 스크립트를 브라우저 콘솔에서 실행하여 문제를 진단할 수 있습니다

console.log('=== Gemini Page Translator 진단 시작 ===');

// 1. 확장 프로그램 상태 확인
console.log('\n1. 확장 프로그램 상태 확인...');
chrome.runtime.sendMessage({type: 'GET_SETTINGS'}, (response) => {
  if (chrome.runtime.lastError) {
    console.error('❌ 확장 프로그램과 통신 실패:', chrome.runtime.lastError);
    return;
  }
  
  console.log('✅ 설정 로드 성공:');
  console.log('- API 키 설정:', response.apiKey ? '있음' : '❌ 없음');
  console.log('- 소스 언어:', response.sourceLang);
  console.log('- 타겟 언어:', response.targetLang);
  console.log('- 선택 번역:', response.selectionTranslateEnabled ? '활성' : '비활성');
  console.log('- 확장 프로그램:', response.extensionEnabled ? '활성' : '비활성');
  
  if (!response.apiKey) {
    console.error('⚠️ API 키가 설정되지 않았습니다. 팝업에서 API 키를 입력하세요.');
  }
});

// 2. 간단한 번역 테스트
console.log('\n2. 간단한 번역 테스트...');
const testText = ['Hello, world!', 'This is a test.'];
chrome.runtime.sendMessage({
  type: 'TRANSLATE',
  segments: testText,
  targetLang: 'ko'
}, (response) => {
  if (chrome.runtime.lastError) {
    console.error('❌ 번역 요청 실패:', chrome.runtime.lastError);
    return;
  }
  
  if (response.error) {
    console.error('❌ 번역 오류:', response.error);
  } else if (response.status === 'processing') {
    console.log('✅ 번역 시작됨');
    console.log('- 총 청크:', response.totalChunks);
    console.log('- 총 세그먼트:', response.totalSegments);
  }
});

// 3. 페이지 텍스트 추출 테스트
console.log('\n3. 현재 페이지 텍스트 노드 확인...');
const textNodes = [];
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  {
    acceptNode: (node) => {
      const text = node.textContent.trim();
      if (text.length > 10 && text.length < 1000) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    }
  }
);

let node;
while (node = walker.nextNode()) {
  textNodes.push(node);
}

console.log(`✅ 번역 가능한 텍스트 노드: ${textNodes.length}개`);
console.log('- 샘플 텍스트:', textNodes.slice(0, 3).map(n => n.textContent.trim().substring(0, 50) + '...'));

// 4. 네트워크 상태 확인
console.log('\n4. 네트워크 연결 확인...');
fetch('https://generativelanguage.googleapis.com/v1beta/models', {
  method: 'GET'
}).then(response => {
  console.log('✅ Google API 서버 연결 가능');
  console.log('- 응답 상태:', response.status);
}).catch(error => {
  console.error('❌ Google API 서버 연결 실패:', error);
});

// 5. 메모리 사용량 확인
console.log('\n5. 메모리 상태 확인...');
if (performance.memory) {
  const mb = 1024 * 1024;
  console.log(`- 사용 중: ${Math.round(performance.memory.usedJSHeapSize / mb)}MB`);
  console.log(`- 전체: ${Math.round(performance.memory.totalJSHeapSize / mb)}MB`);
  console.log(`- 한계: ${Math.round(performance.memory.jsHeapSizeLimit / mb)}MB`);
}

// 6. 디버그 로그 확인
console.log('\n6. 저장된 디버그 로그 확인...');
const debugLogs = localStorage.getItem('gemini_translator_debug');
if (debugLogs) {
  const logs = JSON.parse(debugLogs);
  console.log(`✅ 디버그 로그: ${logs.length}개`);
  console.log('- 최근 로그:', logs.slice(-5));
} else {
  console.log('ℹ️ 저장된 디버그 로그가 없습니다.');
}

console.log('\n=== 진단 완료 ===');
console.log('문제가 지속되면 다음을 확인하세요:');
console.log('1. API 키가 올바른지 확인');
console.log('2. 네트워크 연결 상태 확인');
console.log('3. chrome://extensions 에서 확장 프로그램 오류 확인');
console.log('4. 개발자 도구 Network 탭에서 API 요청 확인');
