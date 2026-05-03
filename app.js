/**
 * Orion 2 - Hostinger Launcher (DEBUG MODE)
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Orion 2: Diagnostico de Inicializacao ---');
console.log('CWD:', process.cwd());
console.log('Node Version:', process.version);
console.log('Server.ts exists:', existsSync(join(__dirname, 'server.ts')));
console.log('Node_modules exists:', existsSync(join(__dirname, 'node_modules')));

const nodeBinary = process.execPath;
const tsxPath = join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const serverPath = join(__dirname, 'server.ts');

const child = spawn(nodeBinary, [tsxPath, serverPath], {
    stdio: 'pipe', // Vamos capturar a saida manualmente
    env: { ...process.env, NODE_ENV: 'production' }
});

child.stdout.on('data', (data) => {
    console.log(`[STDOUT]: ${data}`);
});

child.stderr.on('data', (data) => {
    console.error(`[STDERR - ERRO REAL]: ${data}`);
});

child.on('error', (err) => {
    console.error('FALHA AO INICIAR PROCESSO:', err);
});

child.on('exit', (code) => {
    console.log(`--- Processo Finalizado (Codigo: ${code}) ---`);
});
