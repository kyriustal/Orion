/**
 * Orion 2 - Hostinger Launcher (Stable Deploy Version)
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Orion 2: Iniciando via Lancador Estavel ---');

const nodePath = process.execPath;
const tsxPath = join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const serverPath = join(__dirname, 'server.ts');

const child = spawn(nodePath, [tsxPath, serverPath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
});

child.on('error', (err) => {
    console.error('Falha ao iniciar servidor:', err);
});
