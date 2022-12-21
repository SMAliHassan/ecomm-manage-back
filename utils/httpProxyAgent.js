const { HttpProxyAgent, HttpsProxyAgent } = require('hpagent');

exports.httpAgent = new HttpProxyAgent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  maxFreeSockets: 256,
  proxy: process.env.QUOTAGUARDSTATIC_URL,
});

exports.httpsAgent = new HttpsProxyAgent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  maxFreeSockets: 256,
  proxy: process.env.QUOTAGUARDSTATIC_URL,
});
