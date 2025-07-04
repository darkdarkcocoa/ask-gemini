// Debug helper for Gemini Page Translator
// This script adds enhanced logging to help diagnose translation issues

// Enhanced logging function
window.GeminiTranslatorDebug = {
  logs: [],
  maxLogs: 1000,
  
  log: function(level, component, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      component,
      message,
      data
    };
    
    this.logs.push(logEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Console output with styling
    const style = {
      'DEBUG': 'color: gray',
      'INFO': 'color: blue',
      'WARN': 'color: orange',
      'ERROR': 'color: red'
    }[level] || '';
    
    console.log(
      `%c[${timestamp}] [${component}] ${message}`,
      style,
      data || ''
    );
  },
  
  exportLogs: function() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-translator-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  clearLogs: function() {
    this.logs = [];
    console.clear();
  }
};

// Override console methods for better tracking
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  if (message.includes('[Gemini Translator]') || message.includes('[Background]')) {
    GeminiTranslatorDebug.log('INFO', 'Console', message, args.length > 1 ? args : null);
  }
  originalLog.apply(console, args);
};

console.error = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  GeminiTranslatorDebug.log('ERROR', 'Console', message, args.length > 1 ? args : null);
  originalError.apply(console, args);
};

console.warn = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  GeminiTranslatorDebug.log('WARN', 'Console', message, args.length > 1 ? args : null);
  originalWarn.apply(console, args);
};

console.log('[Debug Script] Gemini Translator debug logging enabled');
