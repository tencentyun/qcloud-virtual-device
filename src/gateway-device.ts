
import { MqttClient } from "mqtt";
import { VirtualDevice, DeviceInfo } from "./virtual-device";
import * as crypto from 'crypto-js';

const random = (min: number, max: number) => {
  return min + Math.floor((max - min) * Math.random());
} 

type Devices = DeviceInfo | DeviceInfo[];
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
            break;
          
          case 'bind':
            this.emit('subDeviceBind', payload);
            break;

          case 'unbind':
            this.emit('subDeviceUnbind', payload);
            break;

          case 'change':
            this.emit('subDeviceChange', payload);
            break;
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

  gatewayPublish(type: string, devices: Devices) {
    const subDevices = Array.isArray(devices) ? devices : [devices];
    this.client?.publish(this.gatewayUpTopic, JSON.stringify({
      "type": type,
      "payload": {
        "devices": subDevices.map(device => {
          return {
            product_id: device.productId,
            device_name: device.deviceName
          }
        })
      }
    }))
  }

  // https://cloud.tencent.com/document/product/634/45960
  bindSubDevice(device: DeviceInfo, timeout = 3000) {
    const { deviceName, productId, deviceSecret } = device;
    const time = Math.floor(Date.now() / 1000);
    const rand = random(0, 1000000);
    const message = `${productId}${deviceName};${rand};${time}`;
    const sign = crypto.HmacSHA1(message, deviceSecret);
    return new Promise((reslove, reject) => {
      this.once('bind', (payload) => {
        reslove(payload);
      });
      setTimeout(() => reject(new Error('Timeout')), timeout);
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
      }));
    });
  }

  subDeviceOnline(device: Devices) {
    this.gatewayPublish('online', device);
  }

  subDeviceOffline(device: DeviceInfo) {
    this.gatewayPublish('offline', device);
  }

  unbindSubDevice(devices: Devices, timeout = 3000) {
    return new Promise((resolve, reject) => {
      this.once('subDeviceUnbind', (payload) => {
        resolve(payload);
      });
      setTimeout(() => reject(new Error('Timeout')), timeout);
      this.gatewayPublish('unbind', devices);
    });
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

  // 获取一个 subDevice 实例
  getSubDevice(deviceData: DeviceInfo): VirtualDevice {
    if (!this.client) {
      throw new Error('device not connected');
    }
    const subDevice = new VirtualDevice(deviceData);
    // 复用网关的 mqtt client
    subDevice.setMqttClient(this.client);
    return subDevice;
  }
 }
