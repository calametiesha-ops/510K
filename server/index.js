import http from 'node:http';
import worker from '../worker/index.js';

const port = Number(process.env.PORT || 3000);
const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    let data = '';
    for await (const chunk of req) data += chunk;
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers[key] = value;
    const init = { method: req.method, headers };
    if (data) { init.body = data; init.duplex = 'half'; }
    const response = await worker.fetch(new Request(url, init), {});
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});
server.listen(port, '0.0.0.0', () => console.log(`510K server listening on ${port}`));

