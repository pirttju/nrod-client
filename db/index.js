const pgPromise = require("pg-promise");
const monitor = require("pg-monitor");
const dotenv = require("dotenv").config();
const { Movement, TdC, TdS, TSR, VSTP } = require("./repos");

const config = {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const initOptions = {
  extend(obj) {
    obj.mvt = new Movement(obj, pgp);
    obj.tdc = new TdC(obj, pgp);
    obj.tds = new TdS(obj, pgp);
    obj.tsr = new TSR(obj, pgp);
    obj.vstp = new VSTP(obj, pgp);
  },
};

const pgp = pgPromise(initOptions);
const db = pgp(config);

// Activate events monitor
// -development: all events
// -production: errors only
if (process.env.NODE_ENV === "development") {
  monitor.attach(initOptions);
} else {
  monitor.attach(initOptions, ["error"]);
}

module.exports = { db, pgp };
