/**
 * Orion 2 - SUPER LAUNCHER (HOSTINGER SPECIAL)
 * Este arquivo tenta varios metodos para garantir que o Node.js suba.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Orion 2: Iniciando Super Launcher ---');

const nodeBinary = process.execPath;
const serverPath = join(__dirname, 'server.ts');

// Caminhos dos loaders possiveis
const tsxPath = join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const tsNodePath = join(__dirname, 'node_modules', 'ts-node', 'esm.mjs');

let args = [];

if (existsSync(tsxPath)) {
    console.log('Utilizando loader: TSX');
    args = [tsxPath, serverPath];
} else if (existsSync(tsNodePath)) {
    console.log('Utilizando loader: TS-NODE');
    args = ['--loader', 'ts-node/esm', serverPath];
} else {
    console.error('Nenhum loader (tsx ou ts-node) encontrado em node_modules!');
    process.exit(1);
}

const child = spawn(nodeBinary, args, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
});

child.on('error', (err) => {
    console.error('Falha fatal ao iniciar processo filho:', err);
});

child.on('exit', (code) => {
    console.log(`Servidor Orion finalizado (Codigo: ${code})`);
    if (code !== 0) console.log('Dica: Verifique se as dependencias foram instaladas via npm install.');
});
