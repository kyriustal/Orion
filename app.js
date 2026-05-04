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
console.log('Node Version:', process.version);
console.log('Current Dir:', __dirname);
console.log('Port:', process.env.PORT || '3001 (default)');

const nodeBinary = process.execPath;
const serverPath = join(__dirname, 'server.ts');

// Caminhos dos loaders possiveis
const tsxPath = join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const tsNodePath = join(__dirname, 'node_modules', 'ts-node', 'esm.mjs');

let args = [];

if (existsSync(tsxPath)) {
    console.log('Utilizando loader: TSX (' + tsxPath + ')');
    args = [tsxPath, serverPath];
} else if (existsSync(tsNodePath)) {
    console.log('Utilizando loader: TS-NODE (' + tsNodePath + ')');
    args = ['--loader', 'ts-node/esm', serverPath];
} else {
    console.log('--- ATENÇÃO: Dependências não encontradas! ---');
    console.log('Tentando executar "npm install" automaticamente...');
    try {
        const { execSync } = await import('child_process');
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ npm install concluído. Verificando novamente...');
        
        if (existsSync(tsxPath)) {
            args = [tsxPath, serverPath];
        } else if (existsSync(tsNodePath)) {
            args = ['--loader', 'ts-node/esm', serverPath];
        } else {
            throw new Error('Loader não encontrado após instalação.');
        }
    } catch (err) {
        console.error('❌ FALHA ao instalar dependências automaticamente:', err.message);
        console.error('DICA: Você deve rodar "npm install" manualmente via SSH ou Terminal.');
        process.exit(1);
    }
}

const child = spawn(nodeBinary, args, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
    shell: true // Adicionado para melhor compatibilidade em alguns ambientes
});

child.on('error', (err) => {
    console.error('FALHA FATAL ao iniciar processo filho:', err);
});

child.on('exit', (code, signal) => {
    console.log(`Servidor Orion finalizado (Codigo: ${code}, Sinal: ${signal})`);
    if (code !== 0) {
        console.error('Dica: O processo fechou com erro. Verifique logs do servidor Hostinger.');
    }
});
