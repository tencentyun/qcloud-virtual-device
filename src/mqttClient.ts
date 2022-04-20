import * as mqtt from 'mqtt';
import onSign from './utils/onSign';
import EventEmitter from 'events';

interface ReplyBody {
  code: number;
  status: string;
  // 行为调用时可能会用到
  response?: any;
}


// 物模型协议 https://cloud.tencent.com/document/product/1081/34916
export class MqttClient extends EventEmitter {
  productId: string;
  deviceName: string;
  deviceSecret: string;
  client: mqtt.MqttClient | null = null;

  constructor({productId, deviceName, deviceSecret }: {
    productId: string;
    deviceName: string;
    deviceSecret: string;
  }) {
    super();
    this.productId = productId;
    this.deviceName = deviceName;
    this.deviceSecret = deviceSecret;
  }

  get propDownTopic() {
    return `$thing/down/property/${this.productId}/${this.deviceName}`
  }
  get propUpTopic() {
    return `$thing/up/property/${this.productId}/${this.deviceName}`
  }
  get eventDownTopic() {
    return `$thing/down/event/${this.productId}/${this.deviceName}`
  }
  get actionDownTopic() {
    return `$thing/down/action/${this.productId}/${this.deviceName}`
  }
  get actionUpTopic() {
    return `$thing/up/action/${this.productId}/${this.deviceName}`
  }

  connect() {
    const mqttUrl = `mqtt://${this.productId}.iotcloud.tencentdevices.com`;
    const { username, password } = onSign(this.productId, this.deviceName, this.deviceSecret);
    const client = mqtt.connect(mqttUrl, {
        username,
        password,
        reconnectPeriod: 10000
    });
    client.on('connect', (params) => {
      client.subscribe(this.propDownTopic);
      client.subscribe(this.eventDownTopic);
      client.subscribe(this.actionDownTopic);
      this.emit('connect', params);
      client.on('message', (topic, payload) => {
        console.log('message coming:', topic, payload.toString());
        const { method, clientToken, params, ...others } = JSON.parse(payload.toString());
        switch (method) {
          case 'control':
            this.emit('control', {clientToken, params});
            break;
          case 'action':
            this.emit('action', { clientToken, params });
            break;
          case 'event_reply':
            this.emit('event_reply', { clientToken, params });
            break;
          default:
            console.warn('unknown property method:', method, params, others);
        }
      })
    })
    this.client = client;
  }

  onAction(actionId: string, callback: () => {}) {
    console.log(actionId, callback);
    this.on(this.actionDownTopic, () => {

    })
  }

  onEvent(eventId: string, callback: () => {}) {
    console.log(eventId, callback);
  }

  onProperty(callback: () => {}) {
    console.log(callback);
    this.on(this.propDownTopic, callback);
  }

  onControl(callback: (payload: { clientToken: string, params: any }) => {}) {
    console.log(callback);
    this.on('control', callback);
    return () => this.off('control', callback);
  }

  publishEvent() {

  }

  replyControl(clientToken: string, payload: ReplyBody) {
    this.client?.publish(this.propUpTopic, JSON.stringify({
      method: 'control_reply',
      clientToken,
      ...payload
    }));
  } 

  reportProperty(clientToken: string, payload: Record<string, any>) {
    this.client?.publish(this.propUpTopic, JSON.stringify({
      method: 'report',
      clientToken,
      params: payload
    }));
  }

  replyAction() {
    this.client?.publish(this.actionUpTopic, JSON.stringify({
      code: 0,

    }))
  }
}
