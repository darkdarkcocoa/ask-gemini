// 다국어 지원 시스템
class I18n {
  constructor() {
    this.currentLanguage = this.detectBrowserLanguage();
    this.messages = {
      ko: {
        // Content Script UI
        questionPlaceholder: '이 텍스트에 대해 무엇을 알고 싶으신가요?',
        askButton: '질문하기',
        cancelButton: '취소',
        closeButton: '닫기',
        processingButton: '처리 중...',
        
        // Error Messages
        extensionReloadRequired: '확장 프로그램을 새로 고침해야 합니다. 페이지를 새로 고침하거나 확장 프로그램을 다시 로드해주세요.',
        genericError: '오류가 발생했습니다',
        noResponse: '응답을 받을 수 없습니다.',
        apiKeyNotSet: 'API 키가 설정되지 않았습니다. 확장 프로그램 설정에서 API 키를 입력해주세요.',
        inputRequired: '선택된 텍스트와 질문이 필요합니다.',
        textTooLong: '선택된 텍스트가 너무 깁니다. (최대 3000자)',
        textLengthNotSuitable: '텍스트 길이가 적절하지 않습니다',
        apiError: 'API 오류',
        apiRequestFormatError: 'API 요청 형식 오류. API 키를 확인해주세요.',
        apiKeyInvalid: 'API 키가 유효하지 않거나 권한이 없습니다.',
        apiRateLimit: 'API 요청 한도 초과. 잠시 후 다시 시도해주세요.',
        responseProcessError: '응답을 처리할 수 없습니다.',
        requestTimeout: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        
        // Popup UI
        title: 'Gemini 웹 AI 어시스턴트',
        apiKeyLabel: 'Gemini API 키:',
        apiKeyPlaceholder: 'API 키를 입력하세요',
        enabledLabel: '확장 프로그램 활성화',
        languageLabel: '언어 설정:',
        saveButton: '저장',
        howToGetApiKey: 'API 키 받는 방법',
        usage: '사용법',
        usageStep1: '1. 웹페이지에서 <strong>텍스트를 드래그</strong>하여 선택하세요',
        usageStep2: '2. 질문 입력창이 나타나면 <strong>궁금한 점을 질문</strong>하세요',
        usageStep3: '3. Enter를 누르거나 <strong>질문하기</strong> 버튼을 클릭하세요',
        usageStep4: '4. AI가 선택한 텍스트를 기반으로 <strong>답변</strong>해드립니다',
        settingsSaved: '설정이 저장되었습니다!',
        
        // Languages
        korean: '한국어',
        english: 'English'
      },
      
      en: {
        // Content Script UI
        questionPlaceholder: 'What would you like to know about this text?',
        askButton: 'Ask',
        cancelButton: 'Cancel',
        closeButton: 'Close',
        processingButton: 'Processing...',
        
        // Error Messages
        extensionReloadRequired: 'Extension needs to be refreshed. Please reload the page or reload the extension.',
        genericError: 'An error has occurred',
        noResponse: 'Unable to get a response.',
        apiKeyNotSet: 'API key is not set. Please enter your API key in the extension settings.',
        inputRequired: 'Selected text and question are required.',
        textTooLong: 'Selected text is too long. (Maximum 3000 characters)',
        textLengthNotSuitable: 'Text length is not suitable',
        apiError: 'API Error',
        apiRequestFormatError: 'API request format error. Please check your API key.',
        apiKeyInvalid: 'API key is invalid or you do not have permission.',
        apiRateLimit: 'API request limit exceeded. Please try again later.',
        responseProcessError: 'Unable to process the response.',
        requestTimeout: 'Request timed out. Please try again.',
        
        // Popup UI
        title: 'Gemini Web AI Assistant',
        apiKeyLabel: 'Gemini API Key:',
        apiKeyPlaceholder: 'Enter your API key',
        enabledLabel: 'Enable Extension',
        languageLabel: 'Language:',
        saveButton: 'Save',
        howToGetApiKey: 'How to get API Key',
        usage: 'How to Use',
        usageStep1: '1. <strong>Drag to select text</strong> on a webpage',
        usageStep2: '2. <strong>Ask your question</strong> in the popup that appears',
        usageStep3: '3. Press Enter or click the <strong>Ask</strong> button',
        usageStep4: '4. AI will <strong>answer</strong> based on the selected text',
        settingsSaved: 'Settings saved!',
        
        // Languages
        korean: '한국어',
        english: 'English'
      }
    };
  }
  
  // 브라우저 언어 감지
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('ko')) {
      return 'ko';
    } else {
      return 'en';
    }
  }
  
  // 언어 설정
  setLanguage(lang) {
    if (this.messages[lang]) {
      this.currentLanguage = lang;
    }
  }
  
  // 현재 언어 반환
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  // 지원하는 언어 목록 반환
  getSupportedLanguages() {
    return [
      { code: 'ko', name: this.messages.ko.korean },
      { code: 'en', name: this.messages.en.english }
    ];
  }
  
  // 메시지 가져오기
  getMessage(key, defaultValue = '') {
    const messages = this.messages[this.currentLanguage];
    return messages && messages[key] ? messages[key] : defaultValue;
  }
  
  // 약칭 메서드
  t(key, defaultValue = '') {
    return this.getMessage(key, defaultValue);
  }
}

// 전역 인스턴스 생성
const i18n = new I18n();

// 모듈로 내보내기 (다른 스크립트에서 사용할 수 있도록)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { I18n, i18n };
} else if (typeof window !== 'undefined') {
  window.i18n = i18n;
}