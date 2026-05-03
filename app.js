/**
 * Orion 2 - Hostinger Launcher (JS)
 * Este arquivo resolve a exigencia da Hostinger de ter um arquivo .js no inicio.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Orion 2: Iniciando via Lançador JS ---');

// Usamos process.execPath para garantir que o Node seja encontrado na Hostinger
const nodePath = process.execPath;
const tsxPath = join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const serverPath = join(__dirname, 'server.ts');

const child = spawn(nodePath, [tsxPath, serverPath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
});

child.on('error', (err) => {
    console.error('Falha critica ao iniciar o processo do servidor:', err);
});

child.on('exit', (code) => {
    if (code !== 0) console.error(`O servidor parou com o codigo de erro: ${code}`);
});
