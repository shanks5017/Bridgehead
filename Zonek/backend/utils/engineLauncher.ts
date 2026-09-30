import { spawn } from 'child_process';
import path from 'path';

/**
 * AUTO-LAUNCHER FOR ZONEK INTELLIGENCE ENGINES
 * This ensures that when the main backend starts, the research 
 * orchestrator and rental scraper are also launched.
 */
export const launchEngines = () => {
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  
  const rootDir = path.resolve(process.cwd(), '../../'); // d:\my projects\my projects\Zonek_Main
  
  const orchestratorDir = path.join(rootDir, 'zonek-orchestrator');
  const scraperDir      = path.join(rootDir, 'india_rental_scraper');

  console.log('\n--- 🚀 ZONEK ENGINE LAUNCHER ---');

  const spawnEngine = (name: string, command: string, args: string[], cwd: string, envOverrides: object = {}) => {
    console.log(`[Launcher] 🛠️  Setup: ${name} | Command: ${command} ${args.join(' ')} | Dir: ${cwd}`);
    
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, ...envOverrides },
    });

    proc.on('error', (err) => {
      console.error(`[Launcher] ❌ Error spawning ${name}: ${err.message}`);
    });

    proc.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[Launcher] ⚠️  ${name} exited with code ${code}`);
      }
    });

    return proc;
  };

  // 1. Start Orchestrator (Force port 8002 to avoid parent collision)
  const orchestrator = spawnEngine('Orchestrator', 'node', ['src/index.js'], orchestratorDir, { PORT: '8002' });

  // 2. Start Rental Scraper
  const scraper = spawnEngine('RentalScraper', 'python', ['-m', 'uvicorn', 'api:app', '--port', '8001'], scraperDir, { PORT: '8001' });

  // Cleanup on exit
  const cleanup = () => {
    console.log('\n[Launcher] Stopping engines...');
    orchestrator.kill();
    scraper.kill();
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log('--- 🚀 ENGINE LAUNCHER INITIALIZED ---\n');
};
