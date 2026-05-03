/**
 * Orion 2 - Hostinger Entry Point
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Orion 2: Iniciando Servidor na Hostinger ---');

// Comando para rodar o servidor usando o tsx local
const tsxPath = join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const serverPath = join(__dirname, 'server.ts');

const child = spawn('node', [tsxPath, serverPath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
});

child.on('error', (err) => {
    console.error('Erro ao iniciar o processo filho:', err);
});
