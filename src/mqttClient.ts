const mqtt = require('mqtt');
const { onSign } = require('./utils/onSign');

export class MqttClient {
  productId: string;
  deviceName: string;
  deviceSecret: string;

  constructor({productId, deviceName,deviceSecret }: {
    productId: string;
    deviceName: string;
    deviceSecret: string;
  }) {
    this.productId = productId;
    this.deviceName = productId;
    this.deviceSecret = productId;
  }

  connect() {
    const mqttUrl = `mqtt://${this.productId}.iotcloud.tencentdevices.com`;
    const { username, password } = onSign(this.productId, this.deviceName, this.deviceSecret);
    const client = mqtt.connect(mqttUrl, {
        username,
        password,
        reconnectPeriod: 10000
    });
  }
}
