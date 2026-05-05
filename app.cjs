const path = require('path');
const fs = require('fs');
const http = require('http');

console.log('--- ORION 2: UNIFIED LAUNCHER ---');
console.log('CWD:', process.cwd());
console.log('ENV PORT:', process.env.PORT);

// 1. Tentar encontrar o .env de qualquer jeito
const findEnv = () => {
    const searchPaths = [
        path.join(__dirname, '.env'),
        path.join(__dirname, '..', '.env'),
        path.join(process.cwd(), '.env'),
        '/home/' + process.env.USER + '/.env'
    ];
    for (const p of searchPaths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
};

const envPath = findEnv();
if (envPath) {
    console.log('✅ Encontrado .env em:', envPath);
    require('dotenv').config({ path: envPath });
} else {
    console.warn('❌ .env não encontrado em nenhum lugar conhecido.');
}

// 2. Carregar TSX e o Servidor em processo único
const tsxPath = path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const serverPath = path.join(__dirname, 'server.ts');

if (!fs.existsSync(tsxPath)) {
    console.error('TSX não instalado.');
    process.exit(1);
}

// Em vez de spawn, vamos usar o loader do TSX para importar o server.ts
// Mas como estamos em CJS, vamos chamar o servidor via linha de comando 
// mas de uma forma que o Passenger entenda que este é o processo pai.

const { spawn } = require('child_process');

// IMPORTANTE: Na Hostinger, se PORT for vazio, não podemos inventar uma porta.
// Temos que reportar isso.
if (!process.env.PORT) {
    console.error('ERRO: Hostinger não forneceu uma PORT/SOCKET.');
}

const child = spawn(process.execPath, [tsxPath, serverPath], {
    stdio: 'inherit',
    env: process.env, // Passa TUDO o que recebeu da Hostinger
    shell: true
});

child.on('exit', (code) => {
    console.log('Servidor finalizado.');
    process.exit(code);
});
