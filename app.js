/**
 * Hostinger Compatibility Wrapper
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('--- Iniciando Orion 2 via TSX Wrapper ---');

// Tenta executar o servidor usando o binário local do tsx
const child = spawn('node', [
    path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    path.join(__dirname, 'server.ts')
], {
    stdio: 'inherit',
    env: process.env
});

child.on('exit', (code) => {
    console.log(`Servidor finalizado com codigo: ${code}`);
});
