import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  const outDir = path.join(__dirname, 'extension 0.1', 'dist');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('🏗️ Building Bridgehead Extension...');

  try {
    // 1. Bundle Background Script
    const bgTask = esbuild.build({
      entryPoints: [path.join(__dirname, 'extension 0.1', 'background.ts')],
      bundle: true,
      outfile: path.join(outDir, 'background.js'),
      platform: 'browser',
      format: 'esm',
      minify: true,
    });

    // 2. Bundle Content Script
    const contentTask = esbuild.build({
      entryPoints: [path.join(__dirname, 'extension 0.1', 'content.ts')],
      bundle: true,
      outfile: path.join(outDir, 'content.js'),
      platform: 'browser',
      format: 'iife',
      minify: true,
    });

    // 3. Bundle Popup Script
    const popupTask = esbuild.build({
      entryPoints: [path.join(__dirname, 'extension 0.1', 'popup.ts')],
      bundle: true,
      outfile: path.join(outDir, 'popup.js'),
      platform: 'browser',
      format: 'iife',
      minify: true,
    });

    // 4. Bundle Side Panel Script
    const sidepanelTask = esbuild.build({
      entryPoints: [path.join(__dirname, 'extension 0.1', 'sidepanel.ts')],
      bundle: true,
      outfile: path.join(outDir, 'sidepanel.js'),
      platform: 'browser',
      format: 'iife',
      minify: true,
    });

    await Promise.all([bgTask, contentTask, popupTask, sidepanelTask]);
    console.log('✅ All scripts bundled.');

    // Copy bundled scripts to extension root for legacy/direct loading support
    fs.copyFileSync(path.join(outDir, 'background.js'), path.join(__dirname, 'extension 0.1', 'background.js'));
    fs.copyFileSync(path.join(outDir, 'content.js'), path.join(__dirname, 'extension 0.1', 'content.js'));
    fs.copyFileSync(path.join(outDir, 'sidepanel.js'), path.join(__dirname, 'extension 0.1', 'sidepanel.js'));
    fs.copyFileSync(path.join(outDir, 'popup.js'), path.join(__dirname, 'extension 0.1', 'popup.js'));
    console.log('✅ Extension root updated.');

    // 5. Copy Manifest and HTML
    fs.copyFileSync(
      path.join(__dirname, 'extension 0.1', 'manifest.json'),
      path.join(outDir, 'manifest.json')
    );
    fs.copyFileSync(
      path.join(__dirname, 'extension 0.1', 'popup.html'),
      path.join(outDir, 'popup.html')
    );
    fs.copyFileSync(
      path.join(__dirname, 'extension 0.1', 'sidepanel.html'),
      path.join(outDir, 'sidepanel.html')
    );
    console.log('✅ Assets copied.');

    console.log('\n🚀 Extension built successfully in extension 0.1/dist/');
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
}

build();
