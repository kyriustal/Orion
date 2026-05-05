const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('--- ORION 2: INICIANDO LAUNCHER DE PRODUÇÃO ---');
console.log('Data/Hora:', new Date().toLocaleString());
console.log('Node Version:', process.version);
console.log('Current Dir:', __dirname);
console.log('Target Port/Socket:', process.env.PORT || '3001 (default)');

const serverPath = path.join(__dirname, 'server.ts');
const tsxPath = path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');

// 1. Verificar se server.ts existe
if (!fs.existsSync(serverPath)) {
    console.error('❌ ERRO CRÍTICO: server.ts não encontrado em:', serverPath);
    process.exit(1);
}

// 2. Verificar dependências (tsx)
if (!fs.existsSync(tsxPath)) {
    console.log('⚠️ TSX não encontrado. Tentando instalar dependências...');
    try {
        // Usar --no-save para evitar alterar o package.json no servidor
        execSync('npm install tsx --no-save', { stdio: 'inherit' });
        console.log('✅ TSX instalado com sucesso.');
    } catch (e) {
        console.error('❌ Falha ao instalar TSX automaticamente:', e.message);
    }
}

// 3. Preparar argumentos
let args = [tsxPath, serverPath];

console.log('🚀 Executando:', process.execPath, args.join(' '));

// 4. Iniciar processo
const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: Object.assign({}, process.env, { 
        NODE_ENV: 'production',
        PORT: process.env.PORT || '3001'
    }),
    shell: true
});

child.on('error', (err) => {
    console.error('❌ ERRO NO PROCESSO FILHO:', err);
});

child.on('exit', (code, signal) => {
    console.log(`--- Orion finalizado (Código: ${code}, Sinal: ${signal}) ---`);
    if (code !== 0) {
        console.error('Dica: O processo fechou com erro. Verifique se o server.ts tem erros de sintaxe ou imports ausentes.');
    }
});
