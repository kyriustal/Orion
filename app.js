/**
 * Orion 2 - Hostinger Launcher (Production)
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Orion 2: Iniciando Processo na Hostinger ---');

// Comando: node --loader ts-node/esm server.ts
const nodeBinary = process.execPath;
const loaderPath = join(__dirname, 'node_modules', 'ts-node', 'esm.mjs');
const serverPath = join(__dirname, 'server.ts');

const child = spawn(nodeBinary, [
    '--loader', 
    'ts-node/esm', 
    serverPath
], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
});

child.on('error', (err) => {
    console.error('ERRO AO INICIAR SERVIDOR:', err);
});

child.on('exit', (code) => {
    console.log(`Processo finalizado (Codigo: ${code})`);
});
