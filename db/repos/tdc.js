const cs = {};

function createColumnsets(pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet([
      'time',
      'area_id',
      'msg_type',
      'from_berth',
      'to_berth',
      'descr'
    ], {table: {table: 'td_c', schema: 'nrod'}});
  }
}

class TdCRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
    createColumnsets(pgp);
  }

  async insert(data) {
    const query = this.pgp.helpers.insert(data, cs.insert);
    return this.db.none(query);
  }
}

module.exports = TdCRepository;
