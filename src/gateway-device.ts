
import { MqttClient } from "mqtt";
import { VirtualDevice, DeviceInfo } from "./virtual-device";
import * as crypto from 'crypto-js';

const random = (min: number, max: number) => {
  return min + Math.floor((max - min) * Math.random());
} 

export class GatewayDevice extends VirtualDevice {
  constructor(params: DeviceInfo) {
    super(params);
    this.on('connect', ({client}: {client: MqttClient}) => {
      client.subscribe(this.gatewayTopic);
    });
    this.on('message', (topic, message) => {
      if (topic === this.gatewayTopic) {
        console.log('gateway payload:', message);
        const {payload, type} = JSON.parse(message);
        switch(type) {
          case 'search_devices':
            this.emit('search_devices', payload);
            break;
          case 'describe_sub_devices':
            this.emit('describe_sub_devices', payload);
        }
      }
    })
  }
  get gatewayTopic() {
    return `$gateway/operation/result/${this.productId}/${this.deviceName}`;
  }
  get gatewayUpTopic() {
    return `$gateway/operation/${this.productId}/${this.deviceName}`;
  }

  // https://cloud.tencent.com/document/product/634/45960
  bindSubDevice(device: DeviceInfo) {
    console.log('start bind sub devivce', device);
    const { deviceName, productId, deviceSecret } = device;
    const time = Math.floor(Date.now() / 1000);
    const rand = random(0, 1000000);
    const message = `${productId}${deviceName};${rand};${time}`;
    const sign = crypto.HmacSHA1(message, deviceSecret);

    console.log(sign.toString(crypto.enc.Base64), message, {
      "product_id": productId,
      "device_name": deviceName,
      "signature": sign.toString(crypto.enc.Base64),
      "random": rand,
      "timestamp": time,
      "signmethod": "hmacsha1",
      "authtype": "psk"
    });
    this.client?.publish(this.gatewayUpTopic, JSON.stringify({
      "type": "bind",
      "payload": {
        "devices": [
          {
            "product_id": productId,
            "device_name": deviceName,
            "signature": sign.toString(crypto.enc.Base64),
            "random": rand,
            "timestamp": time,
            "signmethod": "hmacsha1",
            "authtype": "psk"
          }
        ]
      }
    }))
  }

  getSubDevices(timeout = 3000) {
    this.client?.publish(this.gatewayUpTopic, JSON.stringify({
      "type": "describe_sub_devices"
    }))
    return new Promise((resolve, reject) => {
      this.once('describe_sub_devices', (payload) => {
        resolve(payload);
      })
      setTimeout(reject, timeout);
    })
  }
}