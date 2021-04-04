const io = require('@pm2/io');
const {db} = require('../db');

function insertCClassData(data) {
  return db.tx('insert-td-c-class', t => {
    const queries = [];

    if (data && data.length > 0) {
      queries.push(t.tdc.insert(data));
    }

    return t.batch(queries);
  });
}

function insertSClassData(data) {
  return db.tx('insert-td-s-class', t => {
    const queries = [];

    if (data && data.length > 0) {
      queries.push(t.tds.insert(data));
    }

    return t.batch(queries);
  });
}

// Calculates message latency
function calculateLatency(dt) {
  const now = new Date();
  const d = (now-dt);

  return d;
}

class TdFeed {
  constructor() {
    this.sig = {}; // S Class signalling elements

    // Latency meter
    this.latency = io.histogram({
      name: 'TD Feed Latency',
      measurement: 'mean'
    });
  }

  parseCClassMessage(data) {
    // Parse Date
    const datetime = new Date(parseInt(data.time));

    // Update metrics
    const latency = calculateLatency(datetime);
    this.latency.update(latency);

    const out = {
      time: datetime,
      area_id: data.area_id,
      msg_type: data.msg_type,
      from_berth: data.from ? data.from : null,
      to_berth: data.to ? data.to : null,
      descr: data.descr
    }

    return out;
  }

  parseSClassMessage(data) {
    // Parse Date
    const datetime = new Date(parseInt(data.time));

    // Update metrics
    const latency = calculateLatency(datetime);
    this.latency.update(latency);
  }

  parseSClassRefresh(data) {
    // Parse Date
    const datetime = new Date(parseInt(data.time));

    // Update metrics
    const latency = calculateLatency(datetime);
    this.latency.update(latency);
  }

  parse(data) {
    if (!Array.isArray(data) || data.length === 0) return;

    const cData = []; // C Class data

    for (let i = 0; i < data.length; i++) {
      // Process C Class messages
      if (data[i].CA_MSG) {
        cData.push(this.parseCClassMessage(data[i].CA_MSG));
      }
      else if (data[i].CB_MSG) {
        cData.push(this.parseCClassMessage(data[i].CB_MSG));
      }
      else if (data[i].CC_MSG) {
        cData.push(this.parseCClassMessage(data[i].CC_MSG));
      }
      /*
      else if (data[i].CT_MSG) {
        cData.push(this.parseCClassMessage(data[i].CT_MSG));
      }
      */

      // Process S Class messages
      else if (data[i].SF_MSG) {
        this.parseSClassMessage(data[i].SF_MSG);
      }
      else if (data[i].SG_MSG) {
        this.parseSClassRefresh(data[i].SG_MSG);
      }
      else if (data[i].SH_MSG) {
        this.parseSClassRefresh(data[i].SH_MSG);
      }
    }

    // Save C Class data to the DB
    if (cData.length > 0) {
      insertCClassData(cData);
    }
  }
}

module.exports = TdFeed;
