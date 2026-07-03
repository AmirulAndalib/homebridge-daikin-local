#!/usr/bin/env node
'use strict';

const {spawn} = require('node:child_process');
const path = require('node:path');
const process = require('node:process');

const servers = [
  {system: 'Default', port: 18_765},
  {system: 'Faikout', port: 18_766},
];

const children = servers.map(({system, port}) => {
  const child = spawn(process.execPath, [path.join(__dirname, 'mock-daikin-server.js')], {
    env: {
      ...process.env,
      MOCK_DAIKIN_PORT: String(port),
      MOCK_DAIKIN_SYSTEM: system,
    },
    stdio: 'inherit',
  });

  child.on('exit', code => {
    if (code !== 0) {
      process.exitCode = code ?? 1;
    }
  });

  return child;
});

function shutdown() {
  for (const child of children) {
    child.kill('SIGTERM');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
