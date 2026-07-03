'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isIpAddress,
  resolveControllerHost,
  replaceHostInUrl,
  buildWebSocketStatusUrl,
  clearDnsCache,
} = require('../src/utils.js');

test('isIpAddress detects IPv4 literals', () => {
  assert.equal(isIpAddress('192.168.1.10'), true);
  assert.equal(isIpAddress('daikin.local'), false);
});

test('resolveControllerHost returns IP literals unchanged', async () => {
  clearDnsCache();
  const address = await resolveControllerHost('192.168.71.136');
  assert.equal(address, '192.168.71.136');
});

test('replaceHostInUrl swaps hostname and preserves port and path', () => {
  const url = replaceHostInUrl('http://daikin.local:8080/aircon/get_control_info', '192.168.1.20');
  assert.equal(url, 'http://192.168.1.20:8080/aircon/get_control_info');
});

test('buildWebSocketStatusUrl preserves custom HTTPS port', () => {
  const url = buildWebSocketStatusUrl('https://daikin.local:8443', '192.168.1.20');
  assert.equal(url, 'wss://192.168.1.20:8443/status');
});

test('buildWebSocketStatusUrl builds ws URL for HTTP apiroute', () => {
  const url = buildWebSocketStatusUrl('http://daikin.local', '192.168.1.20');
  assert.equal(url, 'ws://192.168.1.20/status');
});