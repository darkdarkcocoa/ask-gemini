# 🤖 Ask Gemini

> 🚀 AI-powered web assistant that answers questions about selected text using Google's Gemini API. Your intelligent reading companion for the web!

## ✨ Features

- 🎯 **Smart Text Selection**: Select any text on a webpage and ask questions about it
- 💬 **Context-Aware Answers**: Get intelligent responses based on the selected content
- 🧠 **Powered by Gemini**: Leverages Google's advanced AI for accurate and helpful answers
- ⚡ **Quick Access**: Press Ctrl+C twice or use the toolbar button for instant assistance
- 📖 **Reading Assistant**: Perfect for understanding complex articles, research papers, or any web content
- 🎨 **Beautiful UI**: Clean, modern interface with smooth animations and dark mode support

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
3. The extension is now ready to use!

### Asking Questions About Selected Text
1. **Method 1 - Keyboard Shortcut**:
   - Select any text on a webpage
   - Press Ctrl+C twice quickly (within 500ms)
   - Type your question in the popup that appears
   - Get instant AI-powered answers!

2. **Method 2 - Toolbar Button**:
   - Select text on the page
   - Click the extension icon
   - Ask your question directly in the popup

### Example Use Cases
- 📚 **Research**: "Summarize this paragraph in simple terms"
- 🔬 **Technical Content**: "Explain this code snippet"
- 🌍 **Foreign Language**: "Translate this text to Spanish"
- 📊 **Data Analysis**: "What are the key insights from this data?"
- 💡 **Learning**: "Give me 3 key takeaways from this article"

## 🔧 Technical Details

### 🏗️ Architecture

- **Manifest V3**: Built with the latest Chrome extension standards
- **Service Worker**: Handles API communication and background processing
- **Content Script**: Manages text selection and user interactions
- **Modern UI**: Responsive design with CSS Grid and Flexbox

### 🔄 How It Works

1. The content script monitors text selection on web pages
2. When triggered, it captures the selected text and context
3. User's question and selected text are sent to Gemini API
4. AI-generated response is displayed in an elegant popup
5. All interactions are smooth and non-intrusive

### ⚡ Performance Features

- **Efficient API Usage**: Smart request batching to minimize API calls
- **Local Storage**: Caches settings and API key securely
- **Lightweight**: Minimal impact on page performance
- **Fast Response**: Optimized for quick AI responses

## ⚠️ Limitations

- Requires a valid Gemini API key
- API rate limits apply (60 requests/minute for free tier)
- Internet connection required for AI responses
- Some websites may block content scripts

## 🔒 Privacy & Security

This extension:
- ✅ Only sends selected text to Gemini API when you ask a question
- ✅ Stores API key locally using Chrome's secure storage
- ✅ Never collects or transmits personal data
- ✅ No analytics or tracking
- ✅ Open source for full transparency

## 💻 Development

### 📁 Project Structure

```
ask-gemini/
├── assets/              # Icons and images
├── popup/               # Extension popup UI
│   ├── popup.html       # Popup interface
│   ├── popup.css        # Styles with dark mode
│   └── popup.js         # Popup logic
├── background.js        # Service worker for API calls
├── content.js           # Content script for text selection
├── manifest.json        # Extension configuration
├── CLAUDE.md           # Development documentation
└── README.md           # This file
```

### 🛠️ Key Technologies

- Chrome Extension Manifest V3
- Google Gemini API
- Vanilla JavaScript (no frameworks)
- Modern CSS with CSS Variables
- Chrome Storage API

## 👥 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions
- Add support for more languages
- Implement conversation history
- Add custom prompt templates
- Improve UI/UX
- Add keyboard shortcuts customization

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