'use strict';

/** @returns {object} Minimal Homebridge logger mock. */
function createMockLog() {
  const methods = ['debug', 'info', 'warn', 'error'];
  const log = {};

  for (const method of methods) {
    log[method] = () => {};
  }

  return log;
}

class MockCharacteristic {
  constructor(name) {
    this.name = name;
  }

  setProps() {
    return this;
  }

  on() {
    return this;
  }

  updateValue() {
    return this;
  }

  updateCharacteristic() {
    return this;
  }
}

class MockService {
  constructor(name) {
    this.name = name;
    this.characteristics = {};
  }

  getCharacteristic(name) {
    this.characteristics[name] ||= new MockCharacteristic(name);
    return this.characteristics[name];
  }

  setCharacteristic(name, value) {
    this.characteristics[name] = value;
    return this;
  }
}

const Characteristic = {
  TemperatureDisplayUnits: {CELSIUS: 0, FAHRENHEIT: 1},
  Active: {ACTIVE: 1, INACTIVE: 0},
  SwingMode: {SWING_ENABLED: 1, SWING_DISABLED: 0},
  CurrentHeaterCoolerState: {IDLE: 0, HEATING: 1, COOLING: 2},
  TargetHeaterCoolerState: {AUTO: 0, HEAT: 1, COOL: 2},
  ConfiguredName: 'ConfiguredName',
  Manufacturer: 'Manufacturer',
  Model: 'Model',
  FirmwareRevision: 'FirmwareRevision',
  SerialNumber: 'SerialNumber',
  On: 'On',
  RotationSpeed: 'RotationSpeed',
  CurrentTemperature: 'CurrentTemperature',
  CoolingThresholdTemperature: 'CoolingThresholdTemperature',
  HeatingThresholdTemperature: 'HeatingThresholdTemperature',
  CurrentRelativeHumidity: 'CurrentRelativeHumidity',
};

/**
 * Create a Daikin-Local accessory instance with a minimal Homebridge mock.
 *
 * @param {object} [config={}] Accessory config overrides.
 * @returns {object} Configured Daikin accessory instance.
 */
function createDaikin(config = {}) {
  let Accessory;

  const homebridge = {
    hap: {
      Service: {
        Fan: MockService,
        HeaterCooler: MockService,
        TemperatureSensor: MockService,
        HumiditySensor: MockService,
        Switch: MockService,
        AccessoryInformation: MockService,
      },
      Characteristic,
    },
    registerAccessory(_plugin, _name, Constructor) {
      Accessory = Constructor;
    },
  };

  require('../../src/index.js')(homebridge);

  return new Accessory(createMockLog(), {
    name: 'Test AC',
    apiroute: 'http://192.168.1.50',
    temperature_unit: 'C',
    swingMode: '3',
    defaultMode: '3',
    fanMode: 'FAN',
    system: 'Default',
    ...config,
  });
}

/**
 * @param {object} daikin Daikin accessory instance.
 * @returns {Promise<number>} Current indoor temperature in degrees Celsius.
 */
function readCurrentTemperature(daikin) {
  return new Promise((resolve, reject) => {
    daikin.getCurrentTemperature((error, value) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(value);
    });
  });
}

/**
 * @param {object} daikin Daikin accessory instance.
 * @returns {Promise<number>} Fan speed percentage reported to HomeKit.
 */
function readFanSpeed(daikin) {
  return new Promise((resolve, reject) => {
    daikin.getFanSpeed((error, value) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(value);
    });
  });
}

module.exports = {
  createDaikin,
  readCurrentTemperature,
  readFanSpeed,
};
