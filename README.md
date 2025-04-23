# 🌐 Gemini Page Translator

> 🚀 Real-time webpage translation powered by Gemini API, preserving the original layout just like Google Translate or DeepL.

## ✨ Features

- 🔄 **One-Click Page Translation**: Translate the current page's text with a single click
- 🎨 **Layout Preservation**: Maintains HTML structure and CSS styles while only translating text content
- 🔄 **Original/Translation Toggle**: Switch between translated text and original content
- 📱 **Dynamic Content Support**: Automatically detects and translates content loaded via SPA frameworks or AJAX
- 📊 **Progressive Translation**: Displays a progress bar and translates content in chunks for better UX
- ⚙️ **User Settings**: Configure source language, target language, and your Gemini API key

## 🚀 Installation

### 👨‍💻 Developer Mode Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `gemini-page-translator` folder

### 🛒 From Chrome Web Store

*Coming soon*

## 📖 Usage

1. After installation, click the extension icon in the Chrome toolbar
2. Enter your Gemini API key (You can get one from [Google AI Studio](https://makersuite.google.com/app/apikey))
3. Select source language and target language (Default: Auto-detect → English)
4. Click "Translate Page" to translate the current page's text
5. Use "Toggle Original/Translation" to switch between original and translated content

## 🔧 Technical Details

### 🏗️ Architecture

- **Manifest V3**: Uses the latest Chrome extension manifest version
- **Service Worker**: Handles background tasks and API communication
- **Content Script**: Manipulates DOM to extract text and apply translations
- **MutationObserver**: Detects dynamically loaded content for translation

### 🔄 Translation Process

1. The content script extracts all meaningful text nodes from the page
2. Text is divided into manageable chunks to avoid API limits
3. Each chunk is sent to the Gemini API via the service worker
4. The API response is processed and applied back to the page
5. Original text is stored for toggling between versions

### ⚡ Performance Optimizations

- **Chunked Processing**: Processes text in smaller chunks for better performance
- **Batch DOM Updates**: Groups updates to minimize page reflows
- **Debounced Dynamic Content Detection**: Prevents excessive API calls for rapidly changing content
- **Parallel API Requests**: Handles multiple translation chunks concurrently (with rate limiting)

## ⚠️ Limitations

- Gemini API has request limits (60 req/min for free tier as of April 2025)
- Translation of very large pages may take time
- Some dynamically generated content may require manual refresh
- API key is stored locally and is never transmitted except to Google's API

## 🔒 Privacy

This extension:
- Only sends text content to the Gemini API for translation
- Stores your API key locally in Chrome's synchronized storage
- Does not collect any user data or analytics
- Does not communicate with any servers except the Gemini API

## 💻 Development

### 📁 Project Structure

```
gemini-page-translator/
├── assets/            # Icons and images
├── popup/             # Popup UI files
│   ├── popup.html     # Popup interface
│   ├── popup.css      # Popup styles
│   └── popup.js       # Popup functionality
├── background.js      # Service worker for API communication
├── content.js         # Content script for page manipulation
├── manifest.json      # Extension configuration
└── README.md          # This documentation
```

### 🔨 Building From Source

No build step is required. The extension can be loaded directly in Chrome in developer mode.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with the [Gemini API](https://ai.google.dev/)
- Inspired by similar translation extensions like Google Translate and DeepL

## 📬 Contact

Project Link: [https://github.com/darkdarkcocoa/gemini-page-translator](https://github.com/darkdarkcocoa/gemini-page-translator)