const { spawn } = require('child_process');
const path = require('path');

// Usando ts-node (mais compatível com Hostinger)
const tsNodePath = path.join(__dirname, 'node_modules', 'ts-node', 'dist', 'bin.js');
const serverPath = path.join(__dirname, 'server-dist.js');

console.log('🚀 Orion Launcher: Iniciando servidor compilado...');

const child = spawn(process.execPath, [serverPath], {
    stdio: 'inherit',
    env: Object.assign({}, process.env, { NODE_ENV: 'production' }),
    shell: true
});

child.on('exit', (code) => {
    console.log('Finalizado com código:', code);
    process.exit(code || 0);
});
