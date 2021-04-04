const {db} = require('../db');

function parseTdCMessage(data) {
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

function insertTdC(data) {
  return db.tx('insert-tdc', t => {
    const queries = [];

    if (data && data.length > 0) {
      queries.push(t.tdc.insert(data));
    }

    return t.batch(queries);
  });
}

function insertTdS(data) {
  return db.tx('insert-tds', t => {
    const queries = [];

    if (data && data.length > 0) {
      queries.push(t.tds.insert(data));
    }

    return t.batch(queries);
  });
}

module.exports = {parseTdCMessage, insertTdC, insertTdS};
