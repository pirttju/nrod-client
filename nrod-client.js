const fs = require("fs");
require("log-timestamp");
require("dotenv").config();
const stompit = require("stompit");
const Listener = require("./listener");
const TdFeed = require("./models/tdfeed");
const MovementFeed = require("./models/movement");
const VSTPFeed = require("./models/vstp");
const TSRFeed = require("./models/tsr");

// Parsers
const movement = new MovementFeed();
const td = new TdFeed();
const vstp = new VSTPFeed();
const tsr = new TSRFeed();

// Command line overrides
const args = process.argv;
if (args.length > 2) {
  const path = args[3];
  let data = "";
  try {
    if (fs.existsSync(path)) {
      console.log("Reading data from", path);
      data = fs.readFileSync(path, { encoding: "utf8", flag: "r" });
    } else if (path === undefined) {
      console.error("File not specified");
      process.exit(1);
    } else {
      console.error("File", path, "not found");
      process.exit(1);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  // import file
  switch (args[2]) {
    case "--movement":
      movement.parse(data);
      break;
    case "--td":
      td.parse(data);
      break;
    case "--vstp":
      vstp.parse(data);
      break;
    case "--tsr":
      tsr.parse(data);
      break;
  }
} else {
  // Connection details
  const nrodServer = {
    host: process.env.NROD_HOST,
    port: process.env.NROD_PORT,
    connectHeaders: {
      host: process.env.NROD_HOST,
      "heart-beat": "15000,15000",
      "client-id": `${process.env.NROD_USER}-${process.env.NROD_CLIENT_ID}`,
      login: process.env.NROD_USER,
      passcode: process.env.NROD_PASSWORD,
    },
  };

  const servers = [nrodServer];

  const reconnectOptions = {
    useExponentialBackOff: true,
    initialReconnectDelay: 15000,
    maxReconnects: 30,
    randomize: false,
  };

  // Create connection manager
  const connectionManager = new stompit.ConnectFailover(
    servers,
    reconnectOptions
  );

  // Log connection events
  connectionManager.on("connecting", (connector) => {
    const address = connector.serverProperties.remoteAddress.transportPath;

    console.log(`Connecting to ${address}`);
  });

  connectionManager.on("connect", (connector) => {
    const address = connector.serverProperties.remoteAddress.transportPath;
    console.log(`Connection established to ${address}`);
  });

  connectionManager.on("error", (error) => {
    const connectArgs = error.connectArgs;
    const address = `${connectArgs.host}:${connectArgs.port}`;

    console.log(`Connection error to ${address}: ${error.message}`);
  });

  const channelFactory = new stompit.ChannelFactory(connectionManager);

  channelFactory.channel((error, channel) => {
    if (error) {
      console.log(`Channel factory error: ${error.message}`);
      return;
    }

    // Train Movement data
    const mvtListener = new Listener(channel, "TRAIN_MVT_ALL_TOC");
    mvtListener.subscribe((data) => {
      movement.parse(data);
    });

    // Train Describer Data
    const tdListener = new Listener(channel, "TD_ALL_SIG_AREA");
    tdListener.subscribe((data) => {
      td.parse(data);
    });

    // Very Short Term Plan Schedules
    const vstpListener = new Listener(channel, "VSTP_ALL");
    vstpListener.subscribe((data) => {
      vstp.parse(data);
    });

    // Temporary Speed Restrictions
    const tsrListener = new Listener(channel, "TSR_ALL_ROUTE");
    tsrListener.subscribe((data) => {
      tsr.parse(data);
    });
  });
}
