# Z.AI Chat Desktop App

A beautiful, cross-platform desktop application for interacting with Z.AI's GLM-4 model. Built with Tauri, React, and TypeScript.

## Features

- 🚀 **Fast & Lightweight** - Built with Tauri for a tiny footprint (~3MB vs 100MB+ for Electron)
- 🔒 **Secure API Key Storage** - Encrypted storage using platform secure storage (Keychain/Credential Manager)
- 💬 **Beautiful Chat Interface** - Modern, Perplexity-inspired dark UI with markdown rendering
- 📝 **Conversation History** - Save and manage your conversations locally
- ⚙️ **Customizable** - Adjust model, temperature, and system prompts
- ⌨️ **Keyboard Shortcuts** - Power-user friendly (Cmd+N for new chat, etc.)
- 🌓 **Dark/Light Mode** - Easy theme switching
- 📱 **Responsive Design** - Works on different screen sizes

## Prerequisites

- **Node.js** 18+ and npm
- **Rust** (for building the desktop app)

### Installing Rust

**Mac:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows:**
Download and install from [rustup.rs](https://rustup.rs/)

## Development

1. **Install dependencies:**
```bash
npm install
```

2. **Run in development mode:**
```bash
npm run tauri:dev
```

This will:
- Start the Vite dev server (http://localhost:1420)
- Launch the Tauri app window
- Enable hot reloading for both frontend and backend

## Building

### Build for your current platform

```bash
npm run tauri:build
```

### Build for specific platforms

**Mac (Intel):**
```bash
npm run tauri:build -- --target x86_64-apple-darwin
```

**Mac (Apple Silicon):**
```bash
npm run tauri:build -- --target aarch64-apple-darwin
```

**Mac (Universal - both Intel and Apple Silicon):**
```bash
npm run tauri:build -- --target universal-apple-darwin
```

**Windows (x64):**
```bash
npm run tauri:build -- --target x86_64-pc-windows-msvc
```

## Build Output

After building, you'll find the installers in:

- **Mac:** `src-tauri/target/release/bundle/dmg/` and `src-tauri/target/release/bundle/macos/`
- **Windows:** `src-tauri/target/release/bundle/msi/` and `src-tauri/target/release/bundle/nsis/`

## Getting Your Z.AI API Key

1. Visit [z.ai](https://z.ai)
2. Sign up or log in to your account
3. Navigate to your account settings
4. Generate a new API key
5. Paste it into the app when prompted

## Keyboard Shortcuts

- `Cmd/Ctrl + N` - New conversation
- `Cmd/Ctrl + ,` - Open settings
- `Cmd/Ctrl + Enter` - Send message
- `Escape` - Close modals

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + Custom components
- **State Management:** Zustand
- **Markdown:** react-markdown + remark-gfm + rehype-highlight
- **Desktop Framework:** Tauri 2.x (Rust backend)
- **API Integration:** Fetch API with Z.AI GLM endpoints

## Security

- API keys are encrypted using AES-256-GCM before storage
- Platform secure storage (Keychain on Mac, Credential Manager on Windows)
- All API calls are over HTTPS
- Content Security Policy prevents XSS attacks
- No data is sent to third-party services

## Project Structure

```
ai-gui-app/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── Chat.tsx       # Main chat interface
│   │   ├── ChatMessage.tsx # Message bubble with markdown
│   │   ├── Sidebar.tsx    # Conversation history
│   │   ├── ApiKeyModal.tsx # API key input
│   │   └── Settings.tsx   # Settings panel
│   ├── lib/
│   │   ├── api.ts         # Z.AI API client
│   │   ├── store.ts       # Zustand state management
│   │   ├── types.ts       # TypeScript types
│   │   └── utils.ts       # Utilities
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands.rs    # Tauri commands (API key, storage)
│   │   ├── crypto.rs      # Encryption utilities
│   │   ├── lib.rs         # Library exports
│   │   └── main.rs        # Entry point
│   ├── Cargo.toml
│   └── tauri.conf.json    # App configuration
└── package.json
```

## Troubleshooting

### "Rust not found"
Install Rust using the instructions in the Prerequisites section.

### Build fails on Mac
Make sure you have Xcode command line tools:
```bash
xcode-select --install
```

### Build fails on Windows
Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### API key errors
- Verify your API key is correct
- Check that you have sufficient credits/quota on Z.AI
- Ensure your internet connection is stable

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on the GitHub repository.
