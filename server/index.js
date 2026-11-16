import http from 'node:http';
import worker from '../worker/index.js';

const port = Number(process.env.PORT || 10000);
const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const request = new Request(url, { method: req.method, headers: req.headers, body: body && body.length ? body : undefined });
    const response = await worker.fetch(request, {});
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: error.message }));
  }
});
server.listen(port, '0.0.0.0', () => console.log(`510K server listening on ${port}`));

