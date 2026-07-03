'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  mapDaikinModeToCurrentHeaterCoolerState,
  mapDaikinModeToTargetHeaterCoolerState,
  getCoolingThresholdFromControl,
  getHeatingThresholdFromControl,
  shouldRouteCoolingSetToHeating,
  shouldRouteHeatingSetToCooling,
  isDaikinAutoMode,
} = require('../src/utils.js');

const CurrentHeaterCoolerState = {
  INACTIVE: 0,
  IDLE: 1,
  HEATING: 2,
  COOLING: 3,
};

const TargetHeaterCoolerState = {
  AUTO: 0,
  HEAT: 1,
  COOL: 2,
};

test('isDaikinAutoMode accepts mode 0 and 1', () => {
  assert.equal(isDaikinAutoMode('0'), true);
  assert.equal(isDaikinAutoMode('1'), true);
  assert.equal(isDaikinAutoMode('3'), false);
});

test('mapDaikinModeToCurrentHeaterCoolerState maps active modes', () => {
  assert.equal(
    mapDaikinModeToCurrentHeaterCoolerState('3', '1', CurrentHeaterCoolerState),
    CurrentHeaterCoolerState.COOLING
  );
  assert.equal(
    mapDaikinModeToCurrentHeaterCoolerState('4', '1', CurrentHeaterCoolerState),
    CurrentHeaterCoolerState.HEATING
  );
  assert.equal(
    mapDaikinModeToCurrentHeaterCoolerState('1', '1', CurrentHeaterCoolerState),
    CurrentHeaterCoolerState.IDLE
  );
  assert.equal(
    mapDaikinModeToCurrentHeaterCoolerState('0', '1', CurrentHeaterCoolerState),
    CurrentHeaterCoolerState.IDLE
  );
  assert.equal(
    mapDaikinModeToCurrentHeaterCoolerState('4', '0', CurrentHeaterCoolerState),
    CurrentHeaterCoolerState.INACTIVE
  );
});

test('mapDaikinModeToTargetHeaterCoolerState maps target modes', () => {
  assert.equal(
    mapDaikinModeToTargetHeaterCoolerState('3', '1', TargetHeaterCoolerState),
    TargetHeaterCoolerState.COOL
  );
  assert.equal(
    mapDaikinModeToTargetHeaterCoolerState('4', '1', TargetHeaterCoolerState),
    TargetHeaterCoolerState.HEAT
  );
  assert.equal(
    mapDaikinModeToTargetHeaterCoolerState('0', '1', TargetHeaterCoolerState),
    TargetHeaterCoolerState.AUTO
  );
  assert.equal(
    mapDaikinModeToTargetHeaterCoolerState('1', '1', TargetHeaterCoolerState),
    TargetHeaterCoolerState.AUTO
  );
});

test('getCoolingThresholdFromControl uses stemp in cool mode and dt7 in heat mode', () => {
  assert.equal(
    getCoolingThresholdFromControl({mode: '3', stemp: '22.0', dt3: '22.0', dt7: '25.0'}),
    22
  );
  assert.equal(
    getCoolingThresholdFromControl({mode: '4', stemp: '20.0', dt3: '20.0', dt7: '23.0'}),
    23
  );
  assert.equal(
    getCoolingThresholdFromControl({mode: '4', stemp: '20.0', dt3: '20.0', dt7: '16.0'}),
    18
  );
});

test('getHeatingThresholdFromControl uses stemp in heat mode and dt5 in cool mode', () => {
  assert.equal(
    getHeatingThresholdFromControl({mode: '4', stemp: '20.0', dt3: '20.0', dt5: '18.0'}),
    20
  );
  assert.equal(
    getHeatingThresholdFromControl({mode: '3', stemp: '23.0', dt3: '23.0', dt5: '20.0'}),
    20
  );
});

test('temperature setters route based on active mode', () => {
  assert.equal(shouldRouteCoolingSetToHeating('4'), true);
  assert.equal(shouldRouteCoolingSetToHeating('3'), false);
  assert.equal(shouldRouteHeatingSetToCooling('3'), true);
  assert.equal(shouldRouteHeatingSetToCooling('4'), false);
});