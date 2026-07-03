/* eslint quotes: ["error", "single", { "avoidEscape": true }] */
/* eslint quote-props: ["error", "consistent-as-needed"] */

function parseResponse(response) {
  const vals = {};
  if (!response) {
    return vals;
  }

  for (const item of response.split(',')) {
    const separator = item.indexOf('=');
    if (separator === -1) {
      continue;
    }

    vals[item.slice(0, separator)] = item.slice(separator + 1);
  }

  return vals;
}

function daikinSpeedToRaw(daikinSpeed) {
  let raw;
  switch (daikinSpeed) {
    case 'A':
      {raw = 15;
      break;}

    case 'B':
      {raw = 5;
      break;}

    case '3':
      {raw = 25;
      break;}

    case '4':
      {raw = 35;
      break;}

    case '5':
      {raw = 50;
      break;}

    case '6':
      {raw = 70;
      break;}

    case '7':
      {raw = 100;
      break;}

    default:
      {raw = 5;}
  }

  return raw;
}

function parseTemperatureDisplayUnits(value, units) {
  if (value === units.FAHRENHEIT || value === 1 || value === '1' || value === 'F' || value === 'f') {
    return units.FAHRENHEIT;
  }

  return units.CELSIUS;
}

function parseThresholdField(responseValues, field) {
  const value = Number.parseFloat(responseValues[field]);
  return Number.isNaN(value) ? undefined : value;
}

/**
 * Some firmware reports auto as mode=0; mode=1 is also auto on other units.
 *
 * @param {string|undefined} mode Daikin mode code.
 * @returns {boolean}
 */
function isDaikinAutoMode(mode) {
  return mode === '0' || mode === '1';
}

/**
 * @param {string|undefined} mode Daikin mode code.
 * @param {string|undefined} pow Power state (0/1).
 * @param {object} states HomeKit CurrentHeaterCoolerState enum.
 * @returns {number}
 */
function mapDaikinModeToCurrentHeaterCoolerState(mode, pow, states) {
  if (pow !== '1') {
    return states.INACTIVE;
  }

  switch (mode) {
    case '3':
      return states.COOLING;
    case '4':
      return states.HEATING;
    case '0':
    case '1':
    case '2':
    case '6':
    default:
      return states.IDLE;
  }
}

/**
 * @param {string|undefined} mode Daikin mode code.
 * @param {string|undefined} pow Power state (0/1).
 * @param {object} states HomeKit TargetHeaterCoolerState enum.
 * @returns {number}
 */
function mapDaikinModeToTargetHeaterCoolerState(mode, pow, states) {
  if (pow !== '1') {
    return states.AUTO;
  }

  switch (mode) {
    case '3':
      return states.COOL;
    case '4':
      return states.HEAT;
    default:
      return states.AUTO;
  }
}

/**
 * Cooling threshold for HomeKit. Uses active setpoint in cool mode, stored dt7 otherwise.
 *
 * @param {object} responseValues Parsed get_control_info response.
 * @returns {number}
 */
function getCoolingThresholdFromControl(responseValues) {
  const mode = responseValues.mode;
  let coolingThresholdTemperature;

  if (mode === '3') {
    const stemp = Number.parseFloat(responseValues.stemp);
    const dt3 = Number.parseFloat(responseValues.dt3);
    if (Number.isNaN(stemp) || responseValues.stemp === 'M') {
      coolingThresholdTemperature = dt3;
    } else {
      coolingThresholdTemperature = stemp;
    }
  } else {
    coolingThresholdTemperature = parseThresholdField(responseValues, 'dt7')
      ?? parseThresholdField(responseValues, 'stemp')
      ?? 18;
  }

  if (coolingThresholdTemperature < 18) {
    coolingThresholdTemperature = 18;
  }

  return coolingThresholdTemperature;
}

/**
 * Heating threshold for HomeKit. Uses active setpoint in heat mode, stored dt5 otherwise.
 *
 * @param {object} responseValues Parsed get_control_info response.
 * @returns {number}
 */
function getHeatingThresholdFromControl(responseValues) {
  const mode = responseValues.mode;

  if (mode === '4') {
    const stemp = Number.parseFloat(responseValues.stemp);
    const dt3 = Number.parseFloat(responseValues.dt3);
    if (Number.isNaN(stemp) || responseValues.stemp === 'M') {
      return dt3;
    }

    return stemp;
  }

  return parseThresholdField(responseValues, 'dt5')
    ?? parseThresholdField(responseValues, 'stemp')
    ?? 18;
}

/**
 * Siri may invoke the cooling threshold setter while the unit is heating.
 *
 * @param {string|undefined} mode Daikin mode code.
 * @returns {boolean}
 */
function shouldRouteCoolingSetToHeating(mode) {
  return mode === '4';
}

/**
 * @param {string|undefined} mode Daikin mode code.
 * @returns {boolean}
 */
function shouldRouteHeatingSetToCooling(mode) {
  return mode === '3';
}

function rawToDaikinSpeed(rawFanSpeed) {
  let f_rate = 'A';
  rawFanSpeed = Number(rawFanSpeed);
  const speedRanges = [
    {min: 1, max: 9, value: 'B'},
    {min: 9, max: 20, value: 'A'},
    {min: 20, max: 30, value: '3'},
    {min: 30, max: 40, value: '4'},
    {min: 40, max: 60, value: '5'},
    {min: 60, max: 80, value: '6'},
    {min: 80, max: 100, value: '7'},
  ];

  for (const range of speedRanges) {
    if (rawFanSpeed >= range.min && rawFanSpeed < range.max) {
      f_rate = range.value;
      break;
    }
  }

  return f_rate;
}

module.exports = {
  parseResponse,
  parseTemperatureDisplayUnits,
  daikinSpeedToRaw,
  rawToDaikinSpeed,
  isDaikinAutoMode,
  mapDaikinModeToCurrentHeaterCoolerState,
  mapDaikinModeToTargetHeaterCoolerState,
  getCoolingThresholdFromControl,
  getHeatingThresholdFromControl,
  shouldRouteCoolingSetToHeating,
  shouldRouteHeatingSetToCooling,
};
