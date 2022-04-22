const { VirtualDevice } = require('../dist');

let deviceData;

const device = new VirtualDevice({
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
  deviceData.users.push(params);
  device.reportProperty('234567', {
    users: deviceData.users,
  });
  device.replyAction({
    actionId: 'add_user',
    clientToken,
    response: { result: 1 }
  })
});

device.onAction('edit_user', ({ clientToken, params }, reply) => {
  console.log('receive edit_user ', params);
  const index = deviceData.users.findIndex(user => user.userid = params.userid);
  deviceData.users = [...deviceData.users.slice(0, index), params, ...deviceData.users.slice(index + 1)];
  device.reportProperty('234567', {
    users: deviceData.users,
  });
  reply({ result: 1 });
});

device.onAction('unlock_remote', ({ clientToken, params }, reply) => {
  device.reportProperty('234567', {
    lock_motor_state: 0,
  });
  reply({ result: 1 });
});

device.onAction('add_fingerprint', ({ clientToken, params }, reply) => {
  console.log('add_fingerprint params', params);
  const finger = {id: device.clientToken(), ...params};
  deviceData.fingerprints.push(finger);
  device.reportProperty('345678', {
    fingerprints: [...deviceData.fingerprints]
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
