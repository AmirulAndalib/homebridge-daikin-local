'use strict';

const modelInfo = [
  'ret=OK,model=0AB9,type=N,pv=2,cpv=2,cpv_minor=00,mid=NA,humd=1,s_humd=1',
  'acled=0,land=0,elec=0,temp=1,temp_rng=0,m_dtct=1,ac_dst=--,disp_dry=0,dmnd=0',
  'en_scdltmr=1,en_frate=1,en_fdir=1,s_fdir=3,en_rtemp_a=1,en_spmode=0,en_ipw_sep=0,en_mompow=0',
].join(',');

const basicInfo = 'ret=OK,ver=3.4.6,pow=1';

const sensorInfo = 'ret=OK,htemp=24.5,hhum=55,otemp=18.0';

const controlInfo = 'ret=OK,pow=1,mode=3,stemp=22.0,shum=0,dt2=22.0,dh2=0,f_rate=A,f_dir=0,b_f_rate=A,b_f_dir=0,dt3=22.0,dt5=22.0,dt7=22.0,en_economode=0,en_powerful=0';

const faikoutControlInfo = 'ret=OK,pow=1,mode=C,stemp=22.0,f_rate=A,swingh=0,swingv=0,econo=0,powerful=0';

const faikoutStatus = {
  power: true,
  mode: 'C',
  temp: 22,
  fan: 'A',
  swingh: false,
  swingv: false,
  econo: false,
  powerful: false,
};

function createDefaultState() {
  return {
    modelInfo,
    basicInfo,
    sensorInfo,
    controlInfo,
    faikoutControlInfo,
    faikoutStatus: {...faikoutStatus},
  };
}

function parseQuery(path) {
  const queryIndex = path.indexOf('?');
  if (queryIndex === -1) {
    return {};
  }

  const params = {};
  for (const part of path.slice(queryIndex + 1).split('&')) {
    const [key, value] = part.split('=');
    if (key) {
      params[key] = value ?? '';
    }
  }

  return params;
}

function applyControlParams(state, params, system) {
  if (system === 'Faikout') {
    const status = state.faikoutStatus;

    if (params.pow !== undefined) {
      status.power = params.pow === '1';
    }

    if (params.mode !== undefined) {
      const modeMap = {
        1: 'A',
        2: 'D',
        3: 'C',
        4: 'H',
        6: 'F',
      };
      status.mode = modeMap[params.mode] ?? params.mode;
    }

    if (params.stemp !== undefined) {
      status.temp = Number.parseFloat(params.stemp);
    }

    if (params.f_rate !== undefined) {
      status.fan = params.f_rate;
    }

    if (params.swingh !== undefined) {
      status.swingh = params.swingh === '1';
    }

    if (params.swingv !== undefined) {
      status.swingv = params.swingv === '1';
    }

    if (params.en_economode !== undefined) {
      status.econo = params.en_economode === '1';
    }

    if (params.en_powerful !== undefined) {
      status.powerful = params.en_powerful === '1';
    }

    state.faikoutControlInfo = [
      'ret=OK',
      `pow=${status.power ? '1' : '0'}`,
      `mode=${status.mode}`,
      `stemp=${status.temp.toFixed(1)}`,
      `f_rate=${status.fan}`,
      `swingh=${status.swingh ? '1' : '0'}`,
      `swingv=${status.swingv ? '1' : '0'}`,
      `econo=${status.econo ? '1' : '0'}`,
      `powerful=${status.powerful ? '1' : '0'}`,
    ].join(',');

    return;
  }

  let control = state.controlInfo;

  for (const [key, value] of Object.entries(params)) {
    const pattern = new RegExp(`${key}=[^,]*`);
    if (pattern.test(control)) {
      control = control.replace(pattern, `${key}=${value}`);
    } else {
      control += `,${key}=${value}`;
    }
  }

  state.controlInfo = control;
}

function applyFaikoutJsonControl(state, payload) {
  const status = state.faikoutStatus;

  if (payload.power !== undefined) {
    status.power = Boolean(payload.power);
  }

  if (payload.mode !== undefined) {
    status.mode = payload.mode;
  }

  if (payload.temp !== undefined) {
    status.temp = Number(payload.temp);
  }

  if (payload.fan !== undefined) {
    status.fan = payload.fan;
  }

  if (payload.swingh !== undefined) {
    status.swingh = Boolean(payload.swingh);
  }

  if (payload.swingv !== undefined) {
    status.swingv = Boolean(payload.swingv);
  }

  if (payload.econo !== undefined) {
    status.econo = Boolean(payload.econo);
  }

  if (payload.powerful !== undefined) {
    status.powerful = Boolean(payload.powerful);
  }

  applyControlParams(state, {}, 'Faikout');
}

module.exports = {
  createDefaultState,
  parseQuery,
  applyControlParams,
  applyFaikoutJsonControl,
};
