# qcloud-virtual-device
qcloud-virtual-device用于模拟一个建立在腾讯云物联网开发平台上的虚拟设备，提供上报属性，事件，响应action等一系列物模型相关的操作。

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
完整例子可以参看[demo](./demo/index.js);

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
发送一个事件到云端
### device.replyAction(payload)

对小程序的action指令进行回复, 通常和 `onAction` 一起使用

```ts
device.onAction('add_user', ({ clientToken, params }) => {
  device.replyAction({
    actionId: 'add_user',
    clientToken,
    response: { result: 1 }
  })
});
```
