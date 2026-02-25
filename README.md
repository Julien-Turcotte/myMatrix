# myMatrix

A terminal-style [Matrix](https://matrix.org/) chat client built with React and Vite.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (bundled with Node.js)
- A Matrix account on any homeserver (e.g. [matrix.org](https://matrix.org))

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The app will hot-reload as you edit source files.

### 3. Build for production

```bash
npm run build
```

The compiled output is written to the `dist/` directory.

### 4. Preview the production build

```bash
npm run preview
```

## Usage

1. When the app loads, a boot sequence is displayed.
2. After the boot screen, you are taken to the **Login** page.
3. Enter your homeserver URL (default: `https://matrix.org`), your Matrix user ID (`@user:matrix.org`), and authenticate using either:
   - **Password** – enter your account password.
   - **Access token** – paste an existing access token and, optionally, a device ID.
4. Click **[ connect ]** (or press Enter) to sign in.
5. Once connected, your room list appears on the left. Select a room to open the chat panel.

### Keyboard shortcuts

| Shortcut      | Action           |
| ------------- | ---------------- |
| `Ctrl + K`    | Open room switcher |
| `Ctrl + Enter`| Send message     |
| `Esc`         | Clear input      |

## Testing

### Run tests once

```bash
npm run test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

## Linting

```bash
npm run lint
```
