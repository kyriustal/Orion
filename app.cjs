const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = process.env.PORT || 3001;
let startupError = '';
let isStarting = true;

console.log('--- DEBUG LAUNCHER ACTIVE ---');

const serverPath = path.join(__dirname, 'server.ts');
const tsxPath = path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');

// Função para mostrar erro no navegador caso o Orion falhe
function serveError(errorMsg) {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <div style="font-family: sans-serif; padding: 20px; border: 5px solid red; border-radius: 10px;">
                <h1 style="color: red;">❌ Falha ao Iniciar Orion 2</h1>
                <p>O processo Node.js encontrou um erro durante a inicialização:</p>
                <pre style="background: #eee; padding: 15px; border-radius: 5px; overflow-x: auto;">${errorMsg}</pre>
                <hr>
                <p><b>Dica:</b> Geralmente isso é causado por falta de módulos. Tente rodar <code>npm install</code> no terminal SSH ou no painel da Hostinger.</p>
                <button onclick="location.reload()">Tentar Novamente</button>
            </div>
        `);
    });
    
    const isSocket = isNaN(Number(PORT));
    if (isSocket) {
        server.listen(PORT);
    } else {
        server.listen(Number(PORT), '0.0.0.0');
    }
    console.error('Servidor de Erro iniciado na porta/socket:', PORT);
}

// 1. Verificar TSX
if (!fs.existsSync(tsxPath)) {
    startupError = 'O executável TSX não foi encontrado em node_modules/tsx. Por favor, instale as dependências na Hostinger.';
    serveError(startupError);
} else {
    // CORREÇÃO PARA EACCES: Tentar dar permissão ao esbuild
    try {
        const esbuildPath = path.join(__dirname, 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild');
        if (fs.existsSync(esbuildPath)) {
            execSync(`chmod +x "${esbuildPath}"`);
            console.log('Permissão concedida ao esbuild.');
        }
    } catch (e) {
        console.warn('Falha ao tentar dar permissão ao esbuild (isso pode ser normal):', e.message);
    }

    // 2. Tentar rodar o Orion
    console.log('Tentando spawnar Orion...');
    const child = spawn(process.execPath, [tsxPath, serverPath], {
        env: Object.assign({}, process.env, { NODE_ENV: 'production', PORT: PORT }),
        shell: true
    });

    let output = '';

    child.stdout.on('data', (data) => {
        const msg = data.toString();
        console.log('[Orion]:', msg);
        output += msg;
    });

    child.stderr.on('data', (data) => {
        const msg = data.toString();
        console.error('[Orion Error]:', msg);
        output += msg;
        startupError += msg;
    });

    child.on('error', (err) => {
        serveError('Erro ao spawnar processo: ' + err.message);
    });

    child.on('exit', (code) => {
        console.log('Orion saiu com código:', code);
        if (code !== 0 && code !== null) {
            serveError(`O servidor Orion fechou inesperadamente (Código ${code}).\n\nLog de Saída:\n${output}`);
        }
    });

    // Timeout de segurança: Se em 15 segundos ele não "morrer", assumimos que deu certo e paramos de monitorar aqui
    setTimeout(() => {
        isStarting = false;
        console.log('Janela de inicialização concluída. Orion deve estar rodando.');
    }, 15000);
}
