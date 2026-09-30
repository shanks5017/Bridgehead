# 🚀 Bridgehead - Intelligent Web Data Extraction Platform

Bridgehead is an enterprise-grade platform for extracting structured data from any website. It combines a powerful Chrome Extension with a real-time dashboard for seamless data management.

## 📦 Project Structure

- `/src`: React Dashboard source code.
- `/server.ts`: Express.js + Socket.IO backend.
- `/extension`: Chrome Extension source code (TypeScript).
- `/extension/dist`: Bundled extension (ready to load in Chrome).

## 🛠️ How to Use the Extension

1. **Build the Extension**:
   The extension is already pre-bundled in the `/extension` directory. If you make changes to the extension source code, run the build script.

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (top right).
   - Click **Load unpacked**.
   - Select the `/extension` folder from this project.

3. **Open the Side Panel**:
   - Click the Bridgehead icon in your toolbar.
   - The **Bridgehead Side Panel** will open on the right side of your browser.

4. **Extract Data & Monitor Terminal**:
   - Click **Start Extraction** or **Auto-Scroll & Extract**.
   - Watch the **Terminal** in the side panel for real-time logs of the scraping process.
   - Data will also stream in real-time to your Bridgehead Dashboard!

## 📊 Dashboard Features

- **Live Stream**: View extractions as they happen via WebSockets.
- **Intelligent Analysis**: Uses Gemini AI to suggest extraction schemas for complex pages.
- **Data Quality Scoring**: Automatically scores data based on completeness and accuracy.
- **Export**: Download your data in JSON or CSV formats.

## 🔒 Security & Privacy

- **Local-First**: Extraction logic runs entirely in your browser.
- **Secure Sync**: Data is transmitted via encrypted WebSockets to your private dashboard.
- **No Third-Party Tracking**: Your data stays yours.

---
Built with ❤️ by Bridgehead Team.
