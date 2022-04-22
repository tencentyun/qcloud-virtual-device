const { MqttClient } = require('../dist');

let deviceData;

const device = new MqttClient({
  productId: 'HF8P6QKAPM',
  deviceName: 'NODERED2',
  deviceSecret: 'tjxRXYxlziq+JuH6FXybYw==',
});

device.onControl(({ clientToken, params }) => {
  console.log('property change', params);
  device.reportProperty(clientToken, params);
});

device.onAction('wake_up', ({ clientToken }) => {
  console.log('receive wake_up ', payload);
  device.replyAction({
    actionId: 'wake_up',
    clientToken,
    response: { wakeup_state: 1 }
  })
});

device.onAction('add_user', ({ clientToken, params }) => {
  console.log('receive add_user ', params);
  users.push(params);
  device.reportProperty('234567', {
    users,
  });
  device.replyAction({
    actionId: 'add_user',
    clientToken,
    response: { result: 1 }
  })
});

device.onAction('add_fingerprint', ({ clientToken, params }, reply) => {
  console.log('add_fingerprint params', params);
  const finger = {id: '1234', ...params};
  fingerprints.push(finger);
  device.reportProperty('345678', {
    fingerprints: [{id: '1234', ...params}]
  })
  device.postEvent({
    eventId: 'add_fingerprint_result',
    type: 'info',
    clientToken,
    params: {result: 1, ...finger}
  });
  reply({ result: 1 });
});

device.on('connect', () => {
  console.log('connected');
  device.onReportReply(console.log);
  device.getStatus({
    type: 'report'
  }).then((v) => {
    deviceData = v.data.reported;
    console.log('deviceData', deviceData);
  });
  // device.reportProperty('123456', {
  //   users,
  // });
});

device.connect();
