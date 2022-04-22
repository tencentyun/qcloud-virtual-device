import * as mqtt from 'mqtt';
import onSign from './utils/onSign';
import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
interface ReplyBody {
  code: number;
  status: string;
  // 行为调用时可能会用到
  response?: any;
}

interface ActionReplyBody {
  code?: number;
  status?: string;
  clientToken: string;
  actionId: string;
  response: any;
  timestamp?: number;
}

interface EventBody {
  type: 'info' | 'fault' | 'warn';
  clientToken?: string;
  eventId: string;
  params: any;
}

interface StatusParams{
  type : string;
  showmeta?: number;
}


// 物模型协议 https://cloud.tencent.com/document/product/1081/34916
export class MqttClient extends EventEmitter {
  productId: string;
  deviceName: string;
  deviceSecret: string;
  client: mqtt.MqttClient | null = null;
  private promisePool: Map<string, any>

  constructor({productId, deviceName, deviceSecret }: {
    productId: string;
    deviceName: string;
    deviceSecret: string;
  }) {
    super();
    this.productId = productId;
    this.deviceName = deviceName;
    this.deviceSecret = deviceSecret;
    this.promisePool = new Map();
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
  get eventUpTopic() {
    return `$thing/up/event/${this.productId}/${this.deviceName}`
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
        const { method, ...others } = JSON.parse(payload.toString());
        switch (method) {
          case 'control':
            this.emit('control', others);
            break;
          case 'action':
            this.emit('action', others);
            break;
          case 'event_reply':
            this.emit('event_reply', others);
            break;
          case 'report_reply':
            this.emit('report_reply', others);
            break;
          case 'get_status_reply':
            this.emit('get_status_reply', others);
            break;
          default:
            console.warn('unknown property method:', method, others);
        }
      })
      client.on('error', (err) => {
        console.error('mqtt client err', err);
        this.emit('error', err);
      })
    })
    this.client = client;
  }

  onAction(actionId: string, callback: (payload: any, reply: (response: any) => void) => {}) {
    this.on('action', ({ actionId: downActionId, clientToken,  ...others}) => {
      const reply = (response: any) => {
        this.replyAction({
          actionId,
          clientToken,
          response,
        })
      }
      if (actionId === downActionId) {
        callback({ clientToken,  ...others }, reply);
      }
    })
  }

  onEvent(eventId: string, callback: () => {}) {
    console.log(eventId, callback);
  }

  onProperty(callback: () => {}) {
    console.log(callback);
    this.on(this.propDownTopic, callback);
  }

  async getStatus(params: StatusParams) {
    const clientToken = uuidv4();
    const promise = new Promise((resolve, reject) => {
      this.promisePool.set(clientToken, [resolve, reject]);
    });
    const handler = (data: any) => {
      console.log('get_status_reply', data);
      if (data.clientToken === clientToken) {
        const [resolve, reject] = this.promisePool.get(clientToken);
        if (data.code === 0) {
          resolve(data);
        } else {
          reject(data);
        }
      }
      this.off('get_status_reply', handler);
    }
    this.on('get_status_reply', handler);
    this.client?.publish(this.propUpTopic, JSON.stringify({
      method: 'get_status',
      clientToken,
      ...params,
    }))
    return promise;
  }

  onControl(callback: (payload: { clientToken: string, params: any }) => {}) {
    console.log(callback);
    this.on('control', callback);
    return () => this.off('control', callback);
  }

  postEvent({ eventId, clientToken, params, type }: EventBody) {
    this.client?.publish(this.eventUpTopic, JSON.stringify({
      method: 'event_post',
      clientToken: clientToken || uuidv4(),
      eventId,
      params,
      type
    }))
  }

  clientToken() {
    return uuidv4();
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
      timestamp: dayjs().unix(),
      params: payload
    }));
  }

  onReportReply(callback: (paramas: any) => void) {
    this.on('report_reply', callback);
  }

  replyAction({actionId, clientToken, response, code = 0, timestamp = Date.now() }: ActionReplyBody ) {
    this.client?.publish(this.actionUpTopic, JSON.stringify({
      method: 'action_reply',
      code,
      actionId,
      timestamp,
      clientToken,
      response,
    }));
  }
}
