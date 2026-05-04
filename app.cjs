const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('--- Orion 2: Iniciando Launcher CJS ---');
console.log('Node Version:', process.version);
console.log('Dir:', __dirname);

const serverPath = path.join(__dirname, 'server.ts');
const tsxPath = path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');

// Verifica dependencias
if (!fs.existsSync(tsxPath)) {
    console.log('TSX não encontrado. Tentando npm install...');
    try {
        execSync('npm install --production', { stdio: 'inherit' });
    } catch (e) {
        console.error('Falha no npm install automático:', e.message);
    }
}

let args = [tsxPath, serverPath];

console.log('Iniciando processo filho com TSX...');

const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: Object.assign({}, process.env, { NODE_ENV: 'production' }),
    shell: true
});

child.on('error', (err) => {
    console.error('Erro no processo filho:', err);
});

child.on('exit', (code) => {
    console.log('Processo finalizado com código:', code);
});
