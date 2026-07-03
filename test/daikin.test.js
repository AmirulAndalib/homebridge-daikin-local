'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {parseResponse} = require('../src/utils.js');
const {createDaikin, readCurrentTemperature, readFanSpeed} = require('./helpers/mock-homebridge.js');

test('Daikin uses parseResponse for API payloads', () => {
  const daikin = createDaikin();
  const body = 'ret=OK,htemp=21.5,otemp=12.0';

  assert.deepEqual(daikin.parseResponse(body), parseResponse(body));
});

test('getCurrentTemperature applies the configured inside offset', async () => {
  const daikin = createDaikin({temperatureOffsetInside: 1.5});
  daikin.sendGetRequest = (_path, callback) => {
    callback('ret=OK,htemp=22.0,otemp=10.0');
  };

  const temperature = await readCurrentTemperature(daikin);

  assert.equal(temperature, 23.5);
});

test('getFanSpeed maps Daikin fan rates to HomeKit percentages', async () => {
  const daikin = createDaikin();
  daikin.sendGetRequest = (_path, callback) => {
    callback('ret=OK,pow=1,mode=3,f_rate=5');
  };

  const fanSpeed = await readFanSpeed(daikin);

  assert.equal(fanSpeed, 50);
});

test('Default system builds standard Daikin API routes', () => {
  const daikin = createDaikin({apiroute: 'https://192.168.1.77'});

  assert.equal(daikin.get_sensor_info, 'https://192.168.1.77/aircon/get_sensor_info');
  assert.equal(daikin.get_control_info, 'https://192.168.1.77/aircon/get_control_info');
  assert.equal(daikin.basic_info, 'https://192.168.1.77/common/basic_info');
});

test('Skyfi system builds skyfi API routes', () => {
  const daikin = createDaikin({
    apiroute: 'https://192.168.1.77',
    system: 'Skyfi',
  });

  assert.equal(daikin.get_sensor_info, 'https://192.168.1.77/skyfi/aircon/get_sensor_info');
  assert.equal(daikin.get_control_info, 'https://192.168.1.77/skyfi/aircon/get_control_info');
  assert.equal(daikin.basic_info, 'https://192.168.1.77/skyfi/common/basic_info');
});

test('Faikout system enables Faikout mode and control endpoint', () => {
  const daikin = createDaikin({
    apiroute: 'http://192.168.1.88',
    system: 'Faikout',
  });

  assert.equal(daikin.isFaikin, true);
  assert.equal(daikin.faikin_control, 'http://192.168.1.88/control');
  assert.equal(daikin.get_control_info, 'http://192.168.1.88/aircon/get_control_info');
});
