const { HttpProxyAgent } = require('hpagent');

const httpAgent = new HttpProxyAgent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  maxFreeSockets: 256,
  proxy: process.env.QUOTAGUARDSTATIC_URL,
});

module.exports = httpAgent;
