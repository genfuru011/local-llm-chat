# 🤖 Local LLM Chat

**Private & Secure Local AI Chat Application**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> English README | 📖 [日本語 README](./README.md)

## 🌟 Overview

Local LLM Chat is an AI chat application that runs entirely in your local environment. Enjoy private and secure AI conversations without internet connectivity.

### ✨ Key Features

- 🔒 **Privacy-First** - All data stored locally
- 🚀 **Easy Installation** - One-click auto-installation of Ollama and Node.js
- 🎨 **Modern UI** - Beautiful and intuitive user interface
- ⚡ **Fast Response** - Real-time conversations with local processing
- 🔄 **Model Management** - Easy AI model download and switching
- 🌐 **Cross-Platform** - macOS and Windows support

## 📦 Installation

### macOS (Recommended)

1. Download [Local-LLM-Chat-Installer.dmg](./dist/Local-LLM-Chat-Installer.dmg)
2. Open the DMG file and drag to Applications folder
3. Launch the application (auto-setup on first run)

### Windows

1. Download [Local-LLM-Chat-Windows-Portable.zip](./dist/Local-LLM-Chat-Windows-Portable.zip)
2. Extract to your preferred location
3. Run `Local LLM Chat.exe`
4. See [Windows Setup Guide](./dist/WINDOWS-SETUP-GUIDE.md) for detailed instructions

## 🚀 Usage

### First Launch

1. Launch the application and it will automatically open your browser
2. Required dependencies (Ollama & Node.js) will be auto-installed
3. Select and download an AI model from the settings panel
4. Start chatting!

### AI Model Management

- **Model Selection**: Choose from available models in the dropdown menu
- **Custom Models**: Use "Custom Model" option to enter model names
- **Download**: Monitor download progress with the progress bar
- **Delete**: Easily remove unused models

### Supported Models

- **Gemma2**: High-performance models by Google
- **Llama3**: Latest models by Meta
- **Mistral**: Lightweight and fast models
- **CodeLlama**: Programming-specialized models
- Other Ollama-compatible models

## 🛠️ For Developers

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Ollama

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd local-llm-chat

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Production build
npm run build

# Create macOS installer
./create-installer.sh

# Create Windows portable version
./create-windows-installer.sh
```

### Project Structure

```
📦 local-llm-chat/
├── app/                    # Next.js application
│   ├── api/               # API endpoints
│   ├── page.tsx           # Main chat UI
│   └── layout.tsx         # App layout
├── components/            # UI components
├── lib/                   # Utility functions
├── dist/                  # Distribution files
└── build/                 # Build artifacts
```

## 🔧 Tech Stack

- **Frontend**: Next.js 15.0.0, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Desktop**: Electron
- **AI**: Ollama, Vercel AI SDK
- **Build**: electron-builder

## 📚 Documentation

- [Installation Guide](./INSTALLATION_GUIDE.md) (Japanese)
- [Auto-Installation Guide](./AUTO_INSTALL_GUIDE.md) (Japanese)
- [Windows Setup Guide](./dist/WINDOWS-SETUP-GUIDE.md)
- [Installer Status](./INSTALLER_STATUS.md) (Japanese)
- [Project Cleanup Report](./CLEANUP_REPORT.md) (Japanese)

## 🆘 Troubleshooting

### Common Issues

**Q: Application won't start**
- Verify Node.js 18+ is installed
- Check if Ollama service is running (`ollama serve`)

**Q: Model download fails**
- Check internet connection
- Verify disk space (models require several GB)

**Q: Chat doesn't respond**
- Confirm Ollama service is running
- Verify selected model is properly downloaded

### Support

If issues persist, please create an Issue with the following information:
- OS & version
- Error messages
- Steps to reproduce

## 🤝 Contributing

Pull requests and issue reports are welcome!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👥 Development Team

**Local LLM Chat Team**

---

⭐ If this project helped you, please consider giving it a star!
