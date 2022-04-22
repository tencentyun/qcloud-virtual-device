# qcloud-virtual-device
qcloud-virtual-device用于模拟一个建立在腾讯云物联网开发平台上的虚拟设备，提供上报属性，事件，响应action等一系列物模型相关的操作。

## 安装

```bash
npm i qcloud-virtual-device # yarn add qcloud-virtual-device
```

## GET STARTED

```js
const { VirtualDevice } = require('qcloud-virtual-device');

// 传入设备三元组信息，自动连接物联网平台

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
```

## API

### reportProperty
