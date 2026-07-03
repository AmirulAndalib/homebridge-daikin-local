#!/usr/bin/env node
'use strict';

const {Buffer} = require('node:buffer');
const http = require('node:http');
const process = require('node:process');
const {WebSocketServer} = require('ws');
const {
  createDefaultState,
  parseQuery,
  applyControlParams,
  applyFaikoutJsonControl,
} = require('./fixtures/daikin-responses.js');

const PORT = Number.parseInt(process.env.MOCK_DAIKIN_PORT ?? String(18_765), 10);
const SYSTEM = process.env.MOCK_DAIKIN_SYSTEM ?? 'Default';

const state = createDefaultState();
const wsClients = new Set();

const routeMap = {
  '/aircon/get_model_info': () => state.modelInfo,
  '/skyfi/aircon/get_model_info': () => state.modelInfo,
  '/aircon/get_sensor_info': () => state.sensorInfo,
  '/skyfi/aircon/get_sensor_info': () => state.sensorInfo,
  '/aircon/get_control_info': () => (SYSTEM === 'Faikout' ? state.faikoutControlInfo : state.controlInfo),
  '/skyfi/aircon/get_control_info': () => state.controlInfo,
  '/common/basic_info': () => state.basicInfo,
  '/skyfi/common/basic_info': () => state.basicInfo,
};

function broadcastFaikoutStatus() {
  const payload = JSON.stringify(state.faikoutStatus);
  for (const client of wsClients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

function handleSetControlInfo(pathname) {
  const params = parseQuery(pathname);
  applyControlParams(state, params, SYSTEM);

  if (SYSTEM === 'Faikout') {
    broadcastFaikoutStatus();
  }

  return 'ret=OK';
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on('data', chunk => {
      chunks.push(chunk);
    });

    request.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname;

  if (request.method === 'GET' && routeMap[pathname]) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(routeMap[pathname]());
    return;
  }

  if (request.method === 'GET' && (pathname === '/aircon/set_control_info' || pathname === '/skyfi/aircon/set_control_info')) {
    const body = handleSetControlInfo(request.url);
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(body);
    return;
  }

  if (request.method === 'POST' && pathname === '/control') {
    try {
      const payload = await readJsonBody(request);
      applyFaikoutJsonControl(state, payload);
      broadcastFaikoutStatus();
      response.writeHead(200, {'Content-Type': 'application/json'});
      response.end(JSON.stringify({ok: true, state: state.faikoutStatus}));
    } catch (error) {
      response.writeHead(400, {'Content-Type': 'application/json'});
      response.end(JSON.stringify({ok: false, error: error.message}));
    }

    return;
  }

  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.end('ret=PARAM NG,msg=404 Not Found');
});

const wss = new WebSocketServer({server, path: '/status'});

wss.on('connection', socket => {
  wsClients.add(socket);
  socket.send(JSON.stringify(state.faikoutStatus));

  socket.on('message', data => {
    const text = data.toString();

    if (text === '') {
      socket.send(JSON.stringify(state.faikoutStatus));
      return;
    }

    try {
      const payload = JSON.parse(text);
      applyFaikoutJsonControl(state, payload);
      broadcastFaikoutStatus();
    } catch (error) {
      socket.send(JSON.stringify({error: error.message}));
    }
  });

  socket.on('close', () => {
    wsClients.delete(socket);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock Daikin server listening on http://127.0.0.1:${PORT} (system: ${SYSTEM})`);
  console.log('Endpoints: /aircon/get_model_info, /aircon/get_control_info, /aircon/get_sensor_info');
  console.log('             /aircon/set_control_info, /common/basic_info, /control (POST), /status (WebSocket)');
});
