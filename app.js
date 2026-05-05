import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'server.ts');
const tsxPath = join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs');

console.log('🚀 Orion Launcher: Verificando ambiente...');

// Auto-install se o tsx não existir
if (!existsSync(tsxPath)) {
    console.log('📦 node_modules incompleto. Iniciando npm install...');
    try {
        execSync('npm install --production', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        console.log('✅ npm install concluído com sucesso.');
    } catch (e) {
        console.error('❌ Falha no npm install automático:', e.message);
        // Se falhar o production, tenta o normal
        try {
            console.log('Tentando npm install completo...');
            execSync('npm install', { stdio: 'inherit', cwd: __dirname });
        } catch (e2) {
            console.error('❌ Falha total na instalação.');
        }
    }
}

console.log('🚀 Iniciando server.ts com TSX...');

const child = spawn(process.execPath, [tsxPath, serverPath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
    shell: true
});

child.on('exit', (code) => {
    console.log(`Processo finalizado com código: ${code}`);
    process.exit(code || 0);
});
