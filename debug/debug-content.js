// 디버깅을 위한 추가 코드
// content.js 시작 부분에 추가

// 디버깅 모드 활성화
const DEBUG_MODE = true;

// 디버그 로그 함수
function debugLog(message, data = null) {
  if (DEBUG_MODE) {
    const timestamp = new Date().toISOString();
    const logPrefix = `[Gemini Translator Debug ${timestamp}]`;
    
    if (data) {
      console.log(logPrefix, message, data);
    } else {
      console.log(logPrefix, message);
    }
    
    // 디버그 정보를 localStorage에 저장 (나중에 분석용)
    try {
      const debugLogs = JSON.parse(localStorage.getItem('gemini_translator_debug') || '[]');
      debugLogs.push({
        timestamp,
        message,
        data,
        url: window.location.href
      });
      
      // 최근 100개만 유지
      if (debugLogs.length > 100) {
        debugLogs.splice(0, debugLogs.length - 100);
      }
      
      localStorage.setItem('gemini_translator_debug', JSON.stringify(debugLogs));
    } catch (e) {
      // localStorage 에러 무시
    }
  }
}

// API 응답 시간 추적
let apiCallTimings = [];

// 번역 상태 추적 개선
const enhancedTranslationState = {
  startTime: null,
  endTime: null,
  totalSegments: 0,
  translatedSegments: 0,
  failedChunks: [],
  successfulChunks: [],
  apiErrors: []
};

// 페이지에 디버그 패널 추가
function createDebugPanel() {
  if (!DEBUG_MODE) return;
  
  const panel = document.createElement('div');
  panel.id = 'gemini-translator-debug-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 300px;
    max-height: 400px;
    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 999999;
    overflow-y: auto;
    display: none;
  `;
  
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Debug Info';
  toggleBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #333;
    color: #fff;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    z-index: 999998;
  `;
  
  toggleBtn.onclick = () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    updateDebugPanel();
  };
  
  document.body.appendChild(panel);
  document.body.appendChild(toggleBtn);
}

// 디버그 패널 업데이트
function updateDebugPanel() {
  const panel = document.getElementById('gemini-translator-debug-panel');
  if (!panel) return;
  
  const avgApiTime = apiCallTimings.length > 0 
    ? (apiCallTimings.reduce((a, b) => a + b, 0) / apiCallTimings.length).toFixed(0)
    : 'N/A';
  
  const duration = enhancedTranslationState.startTime && enhancedTranslationState.endTime
    ? ((enhancedTranslationState.endTime - enhancedTranslationState.startTime) / 1000).toFixed(1)
    : 'In Progress';
  
  panel.innerHTML = `
    <h3 style="margin: 0 0 10px 0;">Gemini Translator Debug</h3>
    <div>Status: ${translationState.inProgress ? 'Running' : 'Idle'}</div>
    <div>Duration: ${duration}s</div>
    <div>Total Segments: ${enhancedTranslationState.totalSegments}</div>
    <div>Translated: ${enhancedTranslationState.translatedSegments}</div>
    <div>Success Chunks: ${enhancedTranslationState.successfulChunks.length}</div>
    <div>Failed Chunks: ${enhancedTranslationState.failedChunks.length}</div>
    <div>API Calls: ${apiCallTimings.length}</div>
    <div>Avg API Time: ${avgApiTime}ms</div>
    <div>API Errors: ${enhancedTranslationState.apiErrors.length}</div>
    <hr style="margin: 10px 0;">
    <button onclick="window.exportGeminiTranslatorDebugLogs()" style="
      background: #007bff;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
    ">Export Debug Logs</button>
  `;
}

// 로그 내보내기 함수
window.exportGeminiTranslatorDebugLogs = function() {
  const logs = localStorage.getItem('gemini_translator_debug');
  const blob = new Blob([logs || '[]'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gemini-translator-debug-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// DOM 준비 후 디버그 패널 생성
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createDebugPanel);
} else {
  createDebugPanel();
}

debugLog('Debug mode initialized');
