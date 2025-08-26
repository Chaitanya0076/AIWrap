## AIWrap — Gemini Wrapper Chat UI

AIWrap is a lightweight, modern chat interface that wraps Google Gemini models. It provides a polished UX for chatting with Gemini, with markdown rendering, syntax-highlighted code blocks, copy-to-clipboard for code, avatars, and smooth autoscroll.

> Note: This is a fun-coded website and a work-in-progress. It still needs significant improvements in both UI and functionality. Contributions and suggestions are welcome!

### Features
- Clean chat UI with user/AI avatars and vibrant theme
- Markdown rendering with tables, lists, links (remark-gfm)
- Syntax-highlighted code blocks with copy button (rehype-highlight + highlight.js)
- Auto-detects unfenced code and renders it as proper code blocks
- Smooth autoscroll to latest message

### Tech Stack
- React + TypeScript + Vite
- UI components (buttons/cards)
- react-markdown, remark-gfm, rehype-highlight, highlight.js
- framer-motion (message entrance animation)

---

## Getting Started

### 1) Prerequisites
- Node.js 18+ and npm

### 2) Install dependencies
```bash
npm install
```

### 3) Create a Gemini API key
1. Go to Google AI Studio: `https://aistudio.google.com`
2. Sign in and open the API keys section.
3. Create a new API key for the Generative Language API.
4. Copy the key.

If you are new to Gemini API, see: `https://ai.google.dev/gemini-api/docs`.

### 4) Configure environment variables
Create a `.env` file in the project root with your key:
```bash
# .env
VITE_GEMINI_API_KEY=your_api_key_here
```

Vite exposes variables that start with `VITE_` to the client. Restart the dev server if it’s already running.

### 5) Run the app
```bash
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`).

---

## Usage
- Click "+ New Chat" to reset the thread.
- Type a prompt and press Enter or click Send.
- AI responses render as markdown with syntax-highlighted code blocks.
- For code blocks, use the inline "Copy" button to copy to clipboard.

Tips for best code formatting:
- If the model forgets fences, AIWrap tries to auto-detect and format code. You can also ask the model to return answers using fenced code blocks, e.g. ```cpp, ```python, ```bash, etc.

---

## Project Structure (key parts)
```text
src/
  pages/
    ChatApp.tsx   # Main chat UI and Gemini call
```

The Gemini request is posted to:
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=VITE_GEMINI_API_KEY`

---

## Customization
- Theme: tweak gradients and colors in `ChatApp.tsx` header/background/button classes.
- Code theme: swap the imported highlight.js CSS (e.g., `github.css`, `atom-one-dark.css`).
- Markdown: extend `react-markdown` components to customize rendering for links, headings, lists, etc.

---

## Security Notes
- The API key is exposed to the browser because requests go directly from the client. For production, proxy requests through your backend and keep secrets on the server.
- Sanitize and validate any additional user-generated content you introduce.

---

## Troubleshooting
- Empty responses or 4xx/5xx from the API: verify `VITE_GEMINI_API_KEY` and model availability.
- Env variable not picked up: ensure the key starts with `VITE_` and restart `npm run dev`.
- Styling not applied: ensure dependencies are installed and the dev server was restarted after installs.

---

## License
MIT — do what you like, attribution appreciated.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
