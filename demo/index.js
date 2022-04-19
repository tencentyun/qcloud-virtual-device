const { MqttClient } =  require('../dist');

const client = new MqttClient({
  productId: 'HF8P6QKAPM',
  deviceName: 'NODERED2',
  deviceSecret: 'tjxRXYxlziq+JuH6FXybYw==',
});

client.onControl(({clientToken, params}) => {
  console.log('property change', params);
  client.reportProperty(clientToken, params);
});

client.connect();
