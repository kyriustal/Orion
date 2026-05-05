const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const serverPath = path.join(__dirname, 'server.ts');
const tsxPath = path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');

console.log('🚀 Orion Launcher: Iniciando...');

// Tentar instalar se estiver faltando
if (!fs.existsSync(tsxPath)) {
    console.log('📦 node_modules incompleto. Tentando instalar...');
    try {
        execSync('npm install --production', { stdio: 'inherit', cwd: __dirname });
    } catch (e) {
        console.error('Falha no install:', e.message);
    }
}

// O servidor Orion DEVE fazer listen(Number(process.env.PORT) || 3000, '0.0.0.0')
const child = spawn(process.execPath, [tsxPath, serverPath], {
    stdio: 'inherit',
    env: Object.assign({}, process.env, { NODE_ENV: 'production' }),
    shell: true
});

child.on('exit', (code) => {
    console.log('Finalizado com código:', code);
    process.exit(code || 0);
});
