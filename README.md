# 🌀 QRLoop | Custom Local & Privacy-First QR Code Generator

QRLoop is a state-of-the-art, fully client-side QR code generator that prioritizing user privacy and customizability. Unlike standard generators that send your sensitive data to backend servers, QRLoop generates vector QR codes 100% locally on your machine, sandbox-restricted from accessing the network.

Deploying live at **[qrloop.timmatheis.com](https://qrloop.timmatheis.com)**, with **[qr.timmatheis.com](https://qr.timmatheis.com)** automatically performing an edge-level 308 permanent redirect.

---

## ✨ Features

*   **🔒 Strict Offline Sandboxing**: Features global monkeypatching and interception of all `fetch` and `XMLHttpRequest` calls. Any outbound network requests are immediately blocked and logged in the on-screen console to guarantee absolute local privacy.
*   **🎨 Advanced Customization**:
    *   **Shapes**: Custom dot rendering (square, rounded, dots, stars, hearts).
    *   **Eyes**: Customizable corner finder patterns (frames and ball shapes, including heart eyes).
    *   **Colors & Gradients**: Linear and radial gradients with adjustable angles and multiple color stops.
    *   **Logos & Icons**: Central logo branding support.
*   **💾 High-Quality Vector Exports**: Download instantly as **SVG** (scalable vector format), **PNG**, **JPEG**, or **WebP** formats.
*   **✨ Premium Aesthetics**: Designed with glassmorphism UI, a modern dark mode, and smooth micro-animations.

---

## 🌐 Hosting & Domain Setup

This application is optimized for hosting on **Vercel** with the following domain routing scheme:

*   **Primary Domain**: `qrloop.timmatheis.com`
*   **Redirect Domain**: `qr.timmatheis.com` ➔ 308 Permanent Redirect to `qrloop.timmatheis.com`


---

## 🛠️ Technology Stack

*   **Frontend Library**: [React 19](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite 8](https://vite.dev/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **QR Core Engine**: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)

---

## 🚀 Local Development

To run the application locally, follow these steps:

### 1. Prerequisites

Ensure you have [Bun](https://bun.sh/) (recommended) or Node.js installed on your system.

### 2. Installation

Install project dependencies using Bun:

```bash
bun install
```

*(Alternatively, use `npm install`)*

### 3. Start Development Server

Run the local development server:

```bash
bun run dev
```

*(Alternatively, use `npm run dev`)*

The application will be running at [http://localhost:5173](http://localhost:5173).

### 4. Build for Production

Compile and bundle the project for production deployment:

```bash
bun run build
```

This outputs production assets to the `/dist` folder.

---

## 📦 Deployment to Vercel

To deploy this project to Vercel using the Vercel CLI:

```bash
# Install Vercel CLI globally (if not installed)
npm install -g vercel

# Deploy to Vercel
vercel
```
