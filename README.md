# qcloud-virtual-device
qcloud-virtual-device 用于模拟一个建立在腾讯云物联网开发平台上的虚拟设备，提供上报属性，事件，响应action等一系列物模型相关的操作。去了解[物模型](https://cloud.tencent.com/document/product/1081/34916)

## 安装

```bash
npm i qcloud-virtual-device # yarn add qcloud-virtual-device
```

## GET STARTED

```js
const { VirtualDevice } = require('qcloud-virtual-device');

// 传入设备三元组信息，实例化一个device
const device = new VirtualDevice({
  productId: 'your_productId',
  deviceName: 'your_device_name',
  deviceSecret: 'your_device_secret',
});

device.on('connect', () => {
  // 获取云端最新的物模型数据
  device.getStatus({
    type: 'report'
  }).then((v) => {
    deviceData = v.data.reported;
    console.log('deviceData', deviceData);
  });
});

// 连接到云端
device.connect();
```
完整例子可以参看[demo](https://github.com/tencentyun/qcloud-virtual-device/blob/main/demo/index.js);

## API

### device.clientToken()

生成一个clientToken， 用于消息上报和消息响应的配对
```ts
clientToken(): string;
```

### device.connect(url?: string, options)

将虚拟设备连接到云端， 默认使用`mqtt://${productId}.iotcloud.tencentdevices.com`作为mqtt URL，
```ts
connect(url?: string, options?: Omit<mqtt.IClientOptions, 'username' | 'password'>): mqtt.MqttClient;
```
在 options中可以传入 keepalive, reconnectPeriod等参数，详细介绍可参考： https://github.com/mqttjs/MQTT.js#client


### device.reportProperty(payload)

设备往云端上报属性，返回一个Promise，可以拿到`report_reply`中的消息来判断是否上报成功
```ts
reportProperty(payload: Record<string, any>): Promise;
```

### device.postEvent(payload)
发送一个物模型事件到云端，可以选`info`, `warn`, `fault`三种事件类型

```ts
  device.postEvent({
    eventId: 'open_door',
    type: 'info',
    params: {result: 1}
  });

```
### device.replyAction(payload)

对小程序的action指令进行回复, 通常和 `onAction` 一起使用

```ts
device.onAction('add_user', ({ clientToken, params }， reply) => {
  // ...一系列添加用户的操作
  device.replyAction({
    actionId: 'add_user',
    clientToken,
    response: { result: 1 }
  });
  // 或者直接使用包装好的 reply 参数，并传入 response
  reply({ result: 1 });
});
```

### device.on('connect', () => {})
设备连接到云端触发`connect`事件

### device.on('error', (error) => {})
设备出现错误触发`error`事件

### device.on('action', ({ actionId, clientToken, timestamp, params}) => {})
设备收到来自控制端的 action 时触发

### device.onAction(actionId, ({params}, reply) => {})

监听一个特定的action, 在回调函数中，可以通过`params`获取 action 传入的参数，可以通过 reply 对 action 进行回复。

### device.onControl({ clientToken: string; params: any }) => {})

当客户端下发控制指令时触发，回调函数中可以通过 params 获取发生变化的物模型参数

### device.client: mqtt.MqttClient | null

设备连接到云端后，可以通过device.client获得 [mqttClient](https://github.com/mqttjs/MQTT.js#client)

