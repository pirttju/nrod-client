const cs = {};

function createColumnsets(pgp) {
  if (!cs.insert_0001) {
    cs.insert_0001 = new pgp.helpers.ColumnSet(
      [
        { name: "train_id" },
        { name: "creation_timestamp" },
        { name: "train_call_mode", def: null },
        { name: "train_call_type", def: null },
        { name: "train_service_code", def: null },
        { name: "toc_id", def: null },
        { name: "sched_origin_stanox", def: null },
        { name: "origin_dep_timestamp", def: null },
        { name: "tp_origin_stanox", def: null },
        { name: "schedule_source", def: null },
        { name: "train_uid", def: null },
        { name: "schedule_start_date", def: null },
        { name: "schedule_end_date", def: null },
        { name: "schedule_type", def: null },
      ],
      { table: { table: "activation", schema: "nrod" } }
    );
  }
  if (!cs.insert_0002) {
    cs.insert_0002 = new pgp.helpers.ColumnSet(
      [
        { name: "train_id" },
        { name: "canx_timestamp" },
        { name: "canx_type", def: null },
        { name: "canx_reason_code", def: null },
        { name: "loc_stanox", def: null },
        { name: "dep_timestamp", def: null },
        { name: "orig_loc_stanox", def: null },
        { name: "orig_loc_timestamp", def: null },
        { name: "original_data_source", def: null },
      ],
      { table: { table: "cancellation", schema: "nrod" } }
    );
  }
  if (!cs.insert_0003) {
    cs.insert_0003 = new pgp.helpers.ColumnSet(
      [
        { name: "train_id" },
        { name: "current_train_id", def: null },
        { name: "loc_stanox" },
        { name: "actual_timestamp" },
        { name: "event_type", def: null },
        { name: "platform", def: null },
        { name: "planned_timestamp", def: null },
        { name: "timetable_variation", def: null },
        { name: "offroute_ind", def: null },
        { name: "original_data_source", def: null },
      ],
      { table: { table: "movement", schema: "nrod" } }
    );
  }
  if (!cs.insert_0005) {
    cs.insert_0005 = new pgp.helpers.ColumnSet(
      [
        { name: "train_id" },
        { name: "current_train_id", def: null },
        { name: "reinstatement_timestamp" },
        { name: "loc_stanox" },
        { name: "dep_timestamp", def: null },
        { name: "original_loc_stanox", def: null },
        { name: "original_loc_timestamp", def: null },
        { name: "original_data_source", def: null },
      ],
      { table: { table: "reinstatement", schema: "nrod" } }
    );
  }
  if (!cs.insert_0006) {
    cs.insert_0006 = new pgp.helpers.ColumnSet(
      [
        { name: "train_id" },
        { name: "current_train_id", def: null },
        { name: "coo_timestamp" },
        { name: "reason_code", def: null },
        { name: "loc_stanox" },
        { name: "dep_timestamp", def: null },
        { name: "original_loc_stanox", def: null },
        { name: "original_loc_timestamp", def: null },
        { name: "original_data_source", def: null },
      ],
      { table: { table: "change_origin", schema: "nrod" } }
    );
  }
  if (!cs.insert_0007) {
    cs.insert_0007 = new pgp.helpers.ColumnSet(
      [
        { name: "train_id" },
        { name: "current_train_id", def: null },
        { name: "revised_train_id", def: null },
        { name: "event_timestamp" },
        { name: "original_data_source", def: null },
      ],
      { table: { table: "change_identity", schema: "nrod" } }
    );
  }
  if (!cs.insert_0008) {
    cs.insert_0008 = new pgp.helpers.ColumnSet(
      [
        { name: "train_id" },
        { name: "current_train_id", def: null },
        { name: "event_timestamp" },
        { name: "loc_stanox" },
        { name: "dep_timestamp", def: null },
        { name: "original_loc_stanox", def: null },
        { name: "original_loc_timestamp", def: null },
        { name: "original_data_source", def: null },
      ],
      { table: { table: "change_location", schema: "nrod" } }
    );
  }
}

class MovementRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
    createColumnsets(pgp);
  }

  async insert_0001(data) {
    const query = this.pgp.helpers.insert(data, cs.insert_0001);
    return this.db.none(query);
  }

  async insert_0002(data) {
    const query = this.pgp.helpers.insert(data, cs.insert_0002);
    return this.db.none(query);
  }

  async insert_0003(data) {
    const query = this.pgp.helpers.insert(data, cs.insert_0003);
    return this.db.none(query);
  }

  async insert_0005(data) {
    const query = this.pgp.helpers.insert(data, cs.insert_0005);
    return this.db.none(query);
  }

  async insert_0006(data) {
    const query = this.pgp.helpers.insert(data, cs.insert_0006);
    return this.db.none(query);
  }

  async insert_0007(data) {
    const query = this.pgp.helpers.insert(data, cs.insert_0007);
    return this.db.none(query);
  }

  async insert_0008(data) {
    const query = this.pgp.helpers.insert(data, cs.insert_0008);
    return this.db.none(query);
  }
}

module.exports = MovementRepository;
