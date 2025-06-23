# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) that provides real-time webpage translation using Google's Gemini API while preserving the original page layout. The extension allows users to translate entire web pages seamlessly, similar to Google Translate or DeepL browser extensions.

## Development Commands

This is a pure JavaScript Chrome extension with no build process. Common development tasks:

- **Load extension**: Open Chrome → chrome://extensions → Enable Developer mode → Load unpacked → Select project directory
- **Reload extension**: Click the refresh button in chrome://extensions after making changes
- **View console logs**: 
  - Service worker: Chrome DevTools → Application → Service Workers → Click "Inspect"
  - Content script: Right-click on page → Inspect → Console tab
  - Popup: Right-click popup → Inspect

## Architecture

### Core Components

1. **Service Worker (`background.js`)**
   - Handles all Gemini API communication
   - Implements chunked translation with 2KB segments
   - Rate limiting: max 3 concurrent requests
   - Stores user settings (API key, language preferences)

2. **Content Script (`content.js`)**
   - Extracts and processes text nodes from DOM
   - Preserves HTML structure during translation
   - MutationObserver for dynamic content (500ms debounce)
   - Manages translation toggle and progress bar

3. **Popup UI (`popup/`)**
   - Settings interface for API configuration
   - Language selection dropdowns
   - Translation trigger and toggle controls

### Key Technical Details

- **API Model**: Gemini 2.5 Flash Preview
- **Supported Languages**: Korean, English, Japanese, Chinese (Simplified/Traditional), French, German, Spanish, Russian
- **Rate Limits**: 60 requests/minute (free tier)
- **Text Processing**: Chunks of 2KB to handle API limits
- **Performance**: Batch DOM updates, progressive translation with visual feedback

### Message Flow

1. User clicks translate → Popup sends message to content script
2. Content script extracts text → Sends chunks to service worker
3. Service worker calls Gemini API → Returns translations
4. Content script updates DOM progressively

## Common Development Tasks

### Adding New Languages
1. Update language lists in `popup/popup.html`
2. Add language code mappings in `content.js` if needed
3. Test translation quality with sample pages

### Debugging API Issues
- Check service worker console for API errors
- Verify API key in popup settings
- Monitor rate limit errors (429 status)

### Testing Dynamic Content
- Test on pages with infinite scroll (Twitter, Facebook)
- Verify MutationObserver catches new content
- Check debouncing works correctly (500ms delay)

## Important Considerations

- **No build process**: Direct file editing, no compilation needed
- **API Key Security**: Stored in chrome.storage.local, never hardcoded
- **Performance**: Always batch DOM updates to avoid reflows
- **Progressive Enhancement**: Show progress bar for better UX during translation