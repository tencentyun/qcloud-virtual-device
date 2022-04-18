const cryptojs = require("crypto-js");

function randomString(len: number) {
    let charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < len; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}

function onSign(productId: string, deviceName: string, deviceSecret: string) {
    // 1. 生成 connid 为一个随机字符串，方便后台定位问题
    const connid = randomString(5);
    // 2. 生成过期时间，表示签名的过期时间,从纪元1970年1月1日 00:00:00 UTC 时间至今秒数的 UTF8 字符串
    const expiry = Math.round(new Date().getTime() / 1000) + 3600 * 24;
    // 3. 生成 MQTT 的 clientId 部分, 格式为 ${productId}${deviceName}
    const clientId = productId + deviceName;
    // 4. 生成 MQTT 的 username 部分, 格式为 ${clientid};${sdkappid};${connid};${expiry}
    const username = `${clientId};21010406;${connid};${expiry}`;
    // 5. 对 username 进行签名，生成token、根据物联网通信平台规则生成 password 字段
    const rawKey = cryptojs.enc.Base64.parse(deviceSecret);
    const token = cryptojs.HmacSHA256(username, rawKey);
    const password = token.toString(cryptojs.enc.Hex) + ';hmacsha256';
    return {
        username,
        password,
    };
}
