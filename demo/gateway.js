const { GatewayDevice } = require('../dist');

let deviceData;

const device = new GatewayDevice({
  productId: '6PP83YCLHB',
  deviceName: 'netgate',
  deviceSecret: 'RJKnHLuoGhpVV999mzvTxQ==',
});

device.onControl(async ({ clientToken, params }) => {
  console.log('property change', params);
  try {
    const res = await device.reportProperty(params);
    console.log('report success', res);
  } catch (err) {
    console.error ('report failed', err);
  }
});

device.on('connect', async () => {
  console.log('connected');
  const subDevices = await device.getSubDevices();
  console.log(subDevices);
  device.getStatus({
    type: 'report'
  }).then((v) => {
    deviceData = v.data.reported;
    console.log('deviceData', deviceData);
  });
});

device.on('error', console.log);

device.on('search_devices', () => {
  device.bindSubDevice({
    deviceName: 'subdev1',
    productId: 'NZLZ29TMSB'
  });
})



device.connect();
