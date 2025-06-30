// 다국어 지원을 위한 텍스트 데이터
const i18n = {
  en: {
    // Main UI
    title: 'Gemini Page Translator',
    apiKeyLabel: 'Gemini API Key',
    apiKeyPlaceholder: 'Enter your API key',
    toggleApiKeyTitle: 'Show/Hide API Key',
    apiKeyNote: 'API key is stored locally only',
    
    // Language settings
    sourceLangLabel: 'Source Language',
    targetLangLabel: 'Target Language',
    uiLanguageLabel: 'Interface Language',
    
    // Language options
    autoDetect: 'Auto Detect',
    english: 'English',
    korean: '한국어',
    japanese: 'Japanese',
    chinese: 'Chinese',
    french: 'French',
    german: 'German',
    spanish: 'Spanish',
    russian: 'Russian',
    
    // Selection translation
    selectionTranslateLabel: 'Selection Translation (Ctrl+C+C)',
    selectionTranslateNote: 'Select text and press Ctrl+C twice to translate',
    
    // Buttons
    translatePage: 'Translate Page',
    toggleTranslation: 'Toggle Original/Translation',
    
    // Status messages
    translating: 'Translating...',
    translationComplete: 'Translation complete!',
    translationError: 'Translation failed',
    settingsSaved: 'Settings saved',
    apiKeyRequired: 'API key is required',
    
    // Footer
    poweredBy: 'Powered by Gemini API'
  },
  
  ko: {
    // Main UI
    title: 'Gemini Page Translator',
    apiKeyLabel: 'Gemini API Key',
    apiKeyPlaceholder: 'API 키를 입력하세요',
    toggleApiKeyTitle: 'API 키 표시/숨김',
    apiKeyNote: 'API 키는 로컬에만 저장됩니다',
    
    // Language settings
    sourceLangLabel: '원본 언어',
    targetLangLabel: '번역 언어',
    uiLanguageLabel: '인터페이스 언어',
    
    // Language options
    autoDetect: '자동 감지',
    english: '영어',
    korean: '한국어',
    japanese: '일본어',
    chinese: '중국어',
    french: '프랑스어',
    german: '독일어',
    spanish: '스페인어',
    russian: '러시아어',
    
    // Selection translation
    selectionTranslateLabel: '선택 텍스트 번역 (Ctrl+C+C)',
    selectionTranslateNote: '텍스트를 선택하고 Ctrl+C를 두 번 누르면 번역됩니다',
    
    // Buttons
    translatePage: '페이지 번역',
    toggleTranslation: '원문/번역 전환',
    
    // Status messages
    translating: '번역 중...',
    translationComplete: '번역 완료!',
    translationError: '번역 실패',
    settingsSaved: '설정 저장됨',
    apiKeyRequired: 'API 키가 필요합니다',
    
    // Footer
    poweredBy: 'Powered by Gemini API'
  }
};

// 현재 언어 가져오기
function getCurrentUILanguage() {
  return localStorage.getItem('uiLanguage') || 'en';
}

// 언어 설정
function setUILanguage(lang) {
  localStorage.setItem('uiLanguage', lang);
}

// 텍스트 가져오기
function getText(key) {
  const currentLang = getCurrentUILanguage();
  return i18n[currentLang] && i18n[currentLang][key] ? i18n[currentLang][key] : i18n.en[key] || key;
}

// UI 업데이트 함수
function updateUI() {
  // HTML lang 속성 업데이트
  document.documentElement.lang = getCurrentUILanguage();
  
  // 텍스트 요소들 업데이트
  const elements = {
    // Labels
    'label[for="apiKey"]': 'apiKeyLabel',
    'label[for="sourceLang"]': 'sourceLangLabel', 
    'label[for="targetLang"]': 'targetLangLabel',
    'label[for="uiLanguage"]': 'uiLanguageLabel',
    'label[for="selectionTranslate"]': 'selectionTranslateLabel',
    
    // Inputs
    '#apiKey': { attr: 'placeholder', key: 'apiKeyPlaceholder' },
    '#toggleApiKey': { attr: 'title', key: 'toggleApiKeyTitle' },
    
    // Buttons
    '#translateBtn': 'translatePage',
    '#toggleBtn': 'toggleTranslation',
    
    // Options
    'option[value="auto"]': 'autoDetect',
    'option[value="en"]': 'english',
    'option[value="ko"]': 'korean',
    'option[value="ja"]': 'japanese',
    'option[value="zh"]': 'chinese',
    'option[value="fr"]': 'french',
    'option[value="de"]': 'german',
    'option[value="es"]': 'spanish',
    'option[value="ru"]': 'russian',
    
    // Small texts
    '.api-key-note': 'apiKeyNote',
    '.selection-translate-note': 'selectionTranslateNote',
    
    // Footer
    'footer p': 'poweredBy'
  };
  
  // 요소들 업데이트
  Object.entries(elements).forEach(([selector, config]) => {
    const element = document.querySelector(selector);
    if (element) {
      if (typeof config === 'string') {
        element.textContent = getText(config);
      } else if (config.attr) {
        element.setAttribute(config.attr, getText(config.key));
      }
    }
  });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { i18n, getCurrentUILanguage, setUILanguage, getText, updateUI };
}