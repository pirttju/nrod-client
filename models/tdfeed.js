const { db } = require("../db");

function insertCClassData(data) {
  return db.tx("insert-td-c-class", (t) => {
    const queries = [];

    if (data && data.length > 0) {
      queries.push(t.tdc.insert(data));
    }

    return t.batch(queries);
  });
}

function insertSClassData(data) {
  return db.tx("insert-td-s-class", (t) => {
    const queries = [];

    if (data && data.length > 0) {
      queries.push(t.tds.insert(data));
    }

    return t.batch(queries);
  });
}

class TdFeed {
  constructor() {
    this.bits = {}; // S Class bits
  }

  setBit(areaId, bit, data) {
    if (this.bits.hasOwnProperty(`${areaId}:${bit}`)) {
      if (this.bits[`${areaId}:${bit}`] !== data) {
        this.bits[`${areaId}:${bit}`] = data;
        return true; // modified
      }
    } else {
      this.bits[`${areaId}:${bit}`] = data;
      return null; // did not exist
    }
    return false; // not modified
  }

  getBit(areaId, bit) {
    if (this.bits.hasOwnProperty(`${areaId}:${bit}`)) {
      return this.bits[`${areaId}:${bit}`];
    } else {
      return null; // does not exist
    }
  }

  parseCClassMessage(data) {
    // Parse Date
    const datetime = new Date(parseInt(data.time));

    const out = {
      time: datetime,
      area_id: data.area_id,
      msg_type: data.msg_type,
      from_berth: data.from ? data.from : null,
      to_berth: data.to ? data.to : null,
      descr: data.descr,
    };

    return out;
  }

  parseSClassMessage(data) {
    // Parse Date
    const datetime = new Date(parseInt(data.time));

    // Parse bits
    const out = [];
    const values = parseInt(data.data, 16);
    const addr = parseInt(data.address, 16);
    let bit = 0;

    for (let b = 0; b < 8; b++) {
      bit = addr * 8 + b;
      if (this.setBit(data.area_id, bit, (values & (1 << b)) > 0)) {
        out.push({
          time: datetime,
          area_id: data.area_id,
          bit: bit,
          state: (values & (1 << b)) > 0,
        });
      }
    }

    return out;
  }

  parseSClassRefresh(data) {
    // TODO: handle
    return;
  }

  parse(data) {
    if (!Array.isArray(data) || data.length === 0) return;

    const cData = []; // C Class data
    const sData = []; // S Class updates

    for (let i = 0; i < data.length; i++) {
      // Process C Class messages
      if (data[i].CA_MSG) {
        cData.push(this.parseCClassMessage(data[i].CA_MSG));
      } else if (data[i].CB_MSG) {
        cData.push(this.parseCClassMessage(data[i].CB_MSG));
      } else if (data[i].CC_MSG) {
        cData.push(this.parseCClassMessage(data[i].CC_MSG));
      }
      /*
      else if (data[i].CT_MSG) {
        cData.push(this.parseCClassMessage(data[i].CT_MSG));
      }
      */

      // Process S Class messages
      else if (data[i].SF_MSG) {
        const res = this.parseSClassMessage(data[i].SF_MSG);
        sData.push(...res);
      }
      /*
      else if (data[i].SG_MSG) {
        this.parseSClassRefresh(data[i].SG_MSG);
      }
      else if (data[i].SH_MSG) {
        this.parseSClassRefresh(data[i].SH_MSG);
      }
      */
    }

    // Save C Class data to the DB
    if (cData.length > 0) {
      insertCClassData(cData);
    }

    // Save S Class updates to the DB
    if (sData.length > 0) {
      insertSClassData(sData);
    }
  }
}

module.exports = TdFeed;
