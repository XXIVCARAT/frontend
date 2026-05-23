import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;
const dataRoot = process.env.DATA_DIR || path.join(__dirname, 'data');
const uploadsDir = path.join(dataRoot, 'uploads');
const storePath = path.join(dataRoot, 'birthday-store.json');
const publicDir = path.join(__dirname, 'dist');
const maxUploadSize = 8 * 1024 * 1024;

const mimeTypes = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

async function ensureStore() {
  await fs.mkdir(uploadsDir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify({ wishes: [], media: [] }, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(storePath, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  return {
    wishes: Array.isArray(parsed.wishes) ? parsed.wishes : [],
    media: Array.isArray(parsed.media) ? parsed.media : []
  };
}

async function writeStore(store) {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function safeId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function safeJoin(root, requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split('?')[0]);
  const target = path.normalize(path.join(root, decodedPath));
  return target.startsWith(root) ? target : null;
}

async function readBody(request, limit = 128 * 1024) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) {
      throw new Error('Request is too large.');
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) return null;

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const start = buffer.indexOf(boundary);
  if (start === -1) return null;

  const headerStart = start + boundary.length + 2;
  const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), headerStart);
  if (headerEnd === -1) return null;

  const headers = buffer.slice(headerStart, headerEnd).toString('utf8');
  const filenameMatch = headers.match(/filename="([^"]+)"/i);
  const typeMatch = headers.match(/content-type:\s*([^\r\n]+)/i);
  const nextBoundary = buffer.indexOf(boundary, headerEnd + 4);
  if (!filenameMatch || nextBoundary === -1) return null;

  const fileStart = headerEnd + 4;
  const fileEnd = Math.max(fileStart, nextBoundary - 2);

  return {
    filename: path.basename(filenameMatch[1]).replace(/[^a-zA-Z0-9._-]/g, '_'),
    type: cleanText(typeMatch?.[1], 80),
    content: buffer.slice(fileStart, fileEnd)
  };
}

async function serveStatic(response, requestPath) {
  const uploadPrefix = '/uploads/';
  const root = requestPath.startsWith(uploadPrefix) ? uploadsDir : publicDir;
  const relativePath = requestPath.startsWith(uploadPrefix)
    ? requestPath.slice(uploadPrefix.length)
    : (requestPath === '/' ? 'index.html' : requestPath.slice(1));
  const filePath = safeJoin(root, relativePath);

  if (!filePath) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    response.end(data);
  } catch {
    const indexPath = path.join(publicDir, 'index.html');
    const data = await fs.readFile(indexPath);
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(data);
  }
}

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/birthday') {
    sendJson(response, 200, await readStore());
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/wishes') {
    const body = JSON.parse((await readBody(request)).toString('utf8') || '{}');
    const username = cleanText(body.username, 24);
    const wish = cleanText(body.wish, 160);

    if (!username || !wish) {
      sendJson(response, 400, { error: 'Username and wish are required.' });
      return;
    }

    const store = await readStore();
    const item = {
      id: `wish-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      username,
      wish,
      likes: 0,
      createdAt: new Date().toISOString()
    };
    store.wishes.unshift(item);
    await writeStore(store);
    sendJson(response, 201, item);
    return;
  }

  const likeMatch = url.pathname.match(/^\/api\/wishes\/([^/]+)\/like$/);
  if (request.method === 'POST' && likeMatch) {
    const store = await readStore();
    const wish = store.wishes.find((item) => item.id === safeId(likeMatch[1]));

    if (!wish) {
      sendJson(response, 404, { error: 'Wish not found.' });
      return;
    }

    wish.likes = (Number(wish.likes) || 0) + 1;
    await writeStore(store);
    sendJson(response, 200, { id: wish.id, likes: wish.likes });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/media') {
    const body = await readBody(request, maxUploadSize + 1024 * 1024);
    const file = parseMultipart(body, request.headers['content-type'] || '');

    if (!file || !file.type.startsWith('image/')) {
      sendJson(response, 400, { error: 'Upload a photo or GIF.' });
      return;
    }

    if (file.content.length > maxUploadSize) {
      sendJson(response, 413, { error: 'Keep it under 8 MB.' });
      return;
    }

    const extension = path.extname(file.filename).toLowerCase() || '.jpg';
    const savedName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    await fs.writeFile(path.join(uploadsDir, savedName), file.content);

    const store = await readStore();
    const item = {
      id: `media-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      name: cleanText(file.filename, 80) || savedName,
      type: file.type,
      src: `/uploads/${savedName}`,
      createdAt: new Date().toISOString()
    };
    store.media.unshift(item);
    await writeStore(store);
    sendJson(response, 201, item);
    return;
  }

  const deleteMatch = url.pathname.match(/^\/api\/media\/([^/]+)$/);
  if (request.method === 'DELETE' && deleteMatch) {
    const id = safeId(deleteMatch[1]);
    const store = await readStore();
    const item = store.media.find((entry) => entry.id === id);

    if (!item) {
      sendJson(response, 404, { error: 'Upload not found.' });
      return;
    }

    store.media = store.media.filter((entry) => entry.id !== id);
    await writeStore(store);
    await fs.rm(path.join(uploadsDir, path.basename(item.src || '')), { force: true });
    sendJson(response, 200, { id });
    return;
  }

  sendJson(response, 404, { error: 'Not found.' });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url);
      return;
    }

    await serveStatic(response, url.pathname);
  } catch (error) {
    sendJson(response, error.message === 'Request is too large.' ? 413 : 500, {
      error: error.message || 'Server error.'
    });
  }
});

ensureStore().then(() => {
  server.listen(port, () => {
    console.log(`Birthday app listening on ${port}`);
  });
});
