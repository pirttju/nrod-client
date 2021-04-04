const dotenv = require('dotenv').config();
const stompit = require('stompit');
const Listener = require('./listener');
const td = require('./models/td');

// Configure connection management
const servers = [{
  'host': process.env.NROD_HOST,
  'port': process.env.NROD_PORT,
  'connectHeaders': {
    'host': process.env.NROD_HOST,
    'heart-beat': '15000,15000',
    'client-id': `${process.env.NROD_USER}-${process.env.NROD_CLIENT_ID}`,
    'login': process.env.NROD_USER,
    'passcode': process.env.NROD_PASSWORD
  }
}];

const reconnectOptions = {
  'useExponentialBackOff': true,
  'initialReconnectDelay': 1000,
  'maxReconnectDelay': 60000,
  'maxReconnects': 30,
  'randomize': false
};

const connections = new stompit.ConnectFailover(servers, reconnectOptions);

// Log connection events
connections.on('connecting', (connector) => {
  const address = connector.serverProperties.remoteAddress.transportPath;

  console.log(`Connecting to ${address}`);
});

connections.on('error', (error) => {
  const connectArgs = error.connectArgs;
  const address = `${connectArgs.host}:${connectArgs.port}`;

  console.log(`Connection error to ${address}: ${error.message}`);
});

// Connect, subscribe to queues
connections.connect((error, client, reconnect) => {
  if (error) {
    console.log('Terminal error, gave up reconnecting');
  }

  // Movement Data
  const mvtListener = new Listener(client, 'TRAIN_MVT_ALL_TOC');
  mvtListener.subscribe((data) => {
    //console.log(data);
  });

  // Train Describer Data
  const tdListener = new Listener(client, 'TD_ALL_SIG_AREA');
  tdListener.subscribe((data) => {
    if (!Array.isArray(data) || data.length === 0) return;

    const cData = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i].CA_MSG) {
        cData.push(td.parseTdCMessage(data[i].CA_MSG));
      }
      else if (data[i].CB_MSG) {
        cData.push(td.parseTdCMessage(data[i].CB_MSG));
      }
      else if (data[i].CC_MSG) {
        cData.push(td.parseTdCMessage(data[i].CC_MSG));
      }
    }

    td.insertTdC(cData);
  });

  // Very Short Term Plan Schedules
  const vstpListener = new Listener(client, 'VSTP_ALL');
  vstpListener.subscribe((data) => {

  });

  // Temporary Speed Restrictions
  const tsrListener = new Listener(client, 'TSR_ALL_ROUTE');
  tsrListener.subscribe((data) => {

  });
});
