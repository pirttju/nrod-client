const cs = {};

function createColumnsets(pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet([
      'time',
      'area_id',
      'bit',
      'state'
    ], {table: {table: 'nrod_td_s', schema: 'public'}});
  }
}

class TdSRepository {
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

module.exports = TdSRepository;
