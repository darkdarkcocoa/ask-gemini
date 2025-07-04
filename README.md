# 🤖 Ask Gemini

> 🚀 AI-powered web assistant that answers questions about selected text using Google's Gemini API. Your intelligent reading companion for the web!

## ✨ Features

- 🎯 **Smart Text Selection**: Select any text on a webpage and get instant AI assistance
- 💬 **Context-Aware Answers**: Get intelligent responses based on the selected content
- 🧠 **Powered by Gemini 2.5 Flash**: Leverages Google's latest AI model for accurate and helpful answers
- ⚡ **Instant Access**: Simply select text and ask - no keyboard shortcuts needed!
- 📖 **Reading Assistant**: Perfect for understanding complex articles, research papers, or any web content
- 🎨 **Beautiful UI**: Clean, modern interface with gradient design and smooth animations
- 🌐 **Multilingual Support**: Full Korean and English interface with auto-detection

## 🚀 Installation

### 👨‍💻 Developer Mode Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `ask-gemini` folder

### 🛒 From Chrome Web Store

*Coming soon*

## 📖 Usage

### Getting Started
1. After installation, click the extension icon in the Chrome toolbar
2. Enter your Gemini API key (Get one from [Google AI Studio](https://makersuite.google.com/app/apikey))
3. Choose your preferred language (Korean/English)
4. The extension is now ready to use!

### Asking Questions About Selected Text
1. **Select any text** on a webpage (5-2000 characters)
2. **Question popup appears automatically** near your selection
3. **Type your question** in the popup that appears
4. **Get instant AI-powered answers** with contextual understanding!

### Additional Features
- **Settings Management**: Click the extension icon to access settings
- **Language Switch**: Toggle between Korean and English interface
- **Extension Toggle**: Quickly enable/disable the extension
- **API Key Security**: Your API key is stored locally and never transmitted

### Example Use Cases
- 📚 **Research**: "Summarize this paragraph in simple terms"
- 🔬 **Technical Content**: "Explain this code snippet"
- 🌍 **Foreign Language**: "Translate this text to Spanish"
- 📊 **Data Analysis**: "What are the key insights from this data?"
- 💡 **Learning**: "Give me 3 key takeaways from this article"

## 🔧 Technical Details

### 🏗️ Architecture

- **Manifest V3**: Built with the latest Chrome extension standards
- **Service Worker**: Handles Gemini API communication with 30-second timeout
- **Content Script**: Manages text selection with 50ms debouncing and smart positioning
- **Modern UI**: Gradient design with backdrop blur effects and viewport-aware positioning
- **Internationalization**: Comprehensive multilingual support system

### 🔄 How It Works

1. Content script detects text selection (5-2000 characters) with debouncing
2. Question popup appears automatically near selected text with smart positioning
3. User's question and selected text are sent to Gemini 2.5 Flash API
4. AI-generated response is displayed in an elegant popup with proper Korean text encoding
5. All interactions preserve text selection and maintain smooth user experience

### ⚡ Performance Features

- **Optimized Selection Detection**: 50ms debouncing for efficient event handling
- **Smart Positioning**: Viewport boundary detection prevents off-screen popups
- **Text Preservation**: Range cloning maintains selection during interaction
- **Secure Storage**: Uses Chrome's sync storage for API key management
- **Lightweight**: Minimal DOM impact with efficient CSS-in-JS styling
- **Fast Response**: Optimized API requests with structured Korean prompts

### 🛡️ Technical Specifications

- **API Model**: Gemini 2.5 Flash (temperature: 0.3, topP: 0.9, maxOutputTokens: 2048)
- **Text Limits**: 5-2000 character range for optimal processing
- **Timeout**: 30-second API request timeout with comprehensive error handling
- **Encoding**: UTF-8 charset for proper Korean text handling
- **Performance**: 50ms debouncing, efficient event handling, minimal DOM impact

## ⚠️ Limitations

- Requires a valid Gemini API key (free tier available)
- API rate limits apply (60 requests/minute for free tier)
- Internet connection required for AI responses
- Some websites may block content scripts
- Text selection must be 5-2000 characters for processing

## 🔒 Privacy & Security

This extension:
- ✅ Only sends selected text to Gemini API when you ask a question
- ✅ Stores API key locally using Chrome's secure sync storage
- ✅ Never collects or transmits personal data
- ✅ No analytics or tracking
- ✅ API key never leaves your device except for API calls
- ✅ Open source for full transparency and security audit

## 💻 Development

### 📁 Project Structure

```
ask-gemini/
├── assets/              # Extension icons (16, 32, 48, 128px)
├── popup/               # Extension popup UI
│   ├── popup.html       # Settings interface
│   ├── popup.css        # Modern gradient styles
│   └── popup.js         # Settings management logic
├── debug/               # Debug and diagnostic tools
│   ├── debug-helper.js  # Enhanced logging system
│   ├── diagnostic.js    # Comprehensive diagnostics
│   ├── debug-content.js # Content script debugging
│   └── translation-fix.js # Translation utilities
├── background.js        # Service worker for Gemini API calls
├── content.js           # Content script for text selection
├── i18n.js             # Multilingual support system
├── manifest.json        # Extension configuration (Manifest V3)
├── CLAUDE.md           # Development documentation
├── TROUBLESHOOTING.md  # User troubleshooting guide
└── README.md           # This file
```

### 🛠️ Key Technologies

- **Chrome Extension Manifest V3**: Latest extension standards
- **Google Gemini 2.5 Flash API**: Advanced AI model with Korean optimization
- **Vanilla JavaScript**: No frameworks, pure JS for performance
- **Modern CSS**: Gradient designs, backdrop blur, CSS-in-JS
- **Chrome Storage API**: Secure settings and API key management
- **Internationalization**: Comprehensive multilingual support system

## 👥 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions
- Add support for more languages (Japanese, Chinese, Spanish, etc.)
- Implement conversation history and context memory
- Add custom prompt templates and AI personas
- Improve UI/UX with additional themes and customization
- Add keyboard shortcuts and hotkey customization
- Implement offline mode with cached responses
- Add support for other AI models (Claude, OpenAI, etc.)
- Create browser compatibility for Firefox and Safari

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Powered by [Google Gemini API](https://ai.google.dev/)
- Inspired by the need for smarter web browsing
- Thanks to all contributors and users!

## 📬 Contact

Project Link: [https://github.com/darkdarkcocoa/ask-gemini](https://github.com/darkdarkcocoa/ask-gemini)

---

Made with ❤️ for a smarter web browsing experience