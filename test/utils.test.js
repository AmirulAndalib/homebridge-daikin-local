'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseTemperatureDisplayUnits,
  daikinSpeedToRaw,
  rawToDaikinSpeed,
} = require('../src/utils.js');

const TemperatureDisplayUnits = {
  CELSIUS: 0,
  FAHRENHEIT: 1,
};

test('parseTemperatureDisplayUnits defaults to Celsius', () => {
  assert.equal(parseTemperatureDisplayUnits('C', TemperatureDisplayUnits), TemperatureDisplayUnits.CELSIUS);
  assert.equal(parseTemperatureDisplayUnits(undefined, TemperatureDisplayUnits), TemperatureDisplayUnits.CELSIUS);
});

test('parseTemperatureDisplayUnits accepts Fahrenheit aliases', () => {
  assert.equal(parseTemperatureDisplayUnits('F', TemperatureDisplayUnits), TemperatureDisplayUnits.FAHRENHEIT);
  assert.equal(parseTemperatureDisplayUnits('1', TemperatureDisplayUnits), TemperatureDisplayUnits.FAHRENHEIT);
  assert.equal(parseTemperatureDisplayUnits(1, TemperatureDisplayUnits), TemperatureDisplayUnits.FAHRENHEIT);
});

test('daikinSpeedToRaw maps known fan rates', () => {
  assert.equal(daikinSpeedToRaw('A'), 15);
  assert.equal(daikinSpeedToRaw('B'), 5);
  assert.equal(daikinSpeedToRaw('7'), 100);
});

test('rawToDaikinSpeed maps HomeKit percentages back to Daikin rates', () => {
  assert.equal(rawToDaikinSpeed(5), 'B');
  assert.equal(rawToDaikinSpeed(15), 'A');
  assert.equal(rawToDaikinSpeed(25), '3');
  assert.equal(rawToDaikinSpeed(90), '7');
});
