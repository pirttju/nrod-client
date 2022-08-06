const io = require('@pm2/io');
const {db} = require('../db');

function insertMovement(data) {
  return db.tx('insert-movement', t => {
    const queries = [];

    if (data && data.length > 0) {
      queries.push(t.mvt.insert(data));
    }

    return t.batch(queries);
  });
}

class MovementFeed {
  // 0001 - Train Activation
  message0001(data) {
    const datetime = new Date(parseInt(data.time));

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

  // 0002 - Train Cancellation
  message0002(data) {
    const datetime = new Date(parseInt(data.time));

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

  // 0003 - Train Movement
  message0003(data) {
    const datetime = new Date(parseInt(data.time));

    const out = {
      time: datetime
    }

    return out;
  }

  // 0004 - Train Movement
  message0004(data) {
    const datetime = new Date(parseInt(data.time));

    const out = {
      time: datetime
    }

    return out;
  }

  // 0005 - Train Reinstatement
  message0005(data) {
    const datetime = new Date(parseInt(data.time));

    const out = {
      time: datetime
    }

    return out;
  }

  // 0006 - Change of Origin
  message0006(data) {
    const datetime = new Date(parseInt(data.time));

    const out = {
      time: datetime
    }

    return out;
  }

  // 0007 - Change of Identity
  message0007(data) {
    const datetime = new Date(parseInt(data.time));

    const out = {
      time: datetime
    }

    return out;
  }

  // 0008 -  Change of Location
  message0008(data) {
    const datetime = new Date(parseInt(data.time));

    const out = {
      time: datetime
    }

    return out;
  }

  parse(data) {
    if (!Array.isArray(data) || data.length === 0) return;

    const messages = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i].header) {
        switch (data[i].header.msg_type) {
          case '0001':
            messages.push(this.message0001(data[i]));
            break;
          case '0002':
            messages.push(this.message0002(data[i]));
            break;
          case '0003':
            messages.push(this.message0003(data[i]));
            break;
          case '0005':
            messages.push(this.message0005(data[i]));
            break;
          case '0006':
            messages.push(this.message0006(data[i]));
            break;
          case '0007':
            messages.push(this.message0007(data[i]));
            break;
          case '0008':
            messages.push(this.message0008(data[i]));
            break;
          default:
            break;
        }
      }
    }

    // Save messages to DB
    if (messages.length > 0) {
      insertMovement(messages);
    }
  }
}

module.exports = MovementFeed;
