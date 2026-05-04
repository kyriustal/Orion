const http = require('http');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <h1>🚀 Orion 2 - Teste de Diagnóstico</h1>
        <p>Se você está vendo esta mensagem, o Node.js está funcionando corretamente na Hostinger!</p>
        <ul>
            <li><b>Versão do Node:</b> ${process.version}</li>
            <li><b>Porta/Socket:</b> ${PORT}</li>
            <li><b>Data/Hora:</b> ${new Date().toLocaleString()}</li>
        </ul>
        <p><a href="/api/debug-env">Tentar acessar API original</a></p>
    `);
});

const isSocket = isNaN(Number(PORT));

if (isSocket) {
    server.listen(PORT, () => {
        console.log('Servidor de teste rodando no socket: ' + PORT);
    });
} else {
    server.listen(Number(PORT), '0.0.0.0', () => {
        console.log('Servidor de teste rodando na porta: ' + PORT);
    });
}
