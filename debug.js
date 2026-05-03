import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('✅ SERVIDOR ORION ONLINE NA HOSTINGER!\n\nSe voce esta vendo esta mensagem, significa que o Node.js esta funcionando corretamente.');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});
