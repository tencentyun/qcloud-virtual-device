const { MqttClient } = require('../dist');

const users = [
  {
    cards: JSON.stringify([{ name: '指纹1' }]),
    effectiveTime: JSON.stringify({
      beginDate: '2022/04/13',
      beginTime: '00:00',
      endDate: '2022/04/13',
      endTime: '23:59',
      type: 1,
      week: [0, 1, 2, 5, 6],
    }),
    faces: JSON.stringify([{ name: '指纹1' }, { name: '指纹1' }]),
    fingerPrints: JSON.stringify([{ name: '指纹1' }, { name: '指纹1' }]),
    id: '4DPPzCAbr',
    name: 'bob2',
    passwords: JSON.stringify([{ name: '指纹1' }, { name: '指纹1' }, { name: '指纹1' }]),
  },
  { id: 'cK4fxfrp8', name: 'eric' },
  { id: 'MgYWAkGeY', name: 'will' },
];

const device = new MqttClient({
  productId: 'HF8P6QKAPM',
  deviceName: 'NODERED2',
  deviceSecret: 'tjxRXYxlziq+JuH6FXybYw==',
});

device.onControl(({ deviceToken, params }) => {
  console.log('property change', params);
  device.reportProperty(deviceToken, params);
});

device.onAction('wake_up', ({ clientToken }) => {
  console.log('receive wake_up ', payload);
  device.replyAction({
    actionId: 'wake_up',
    clientToken,
    response: { wakeup_state: 1 }
  })
});

device.on('connect', () => {
  console.log('connected');
  device.reportProperty('123456', {
    users,
  });
});

device.connect();
