const cs = {};

function createColumnsets(pgp) {
  if (!cs.nrod_tsr_batch_msg) {
    cs.nrod_tsr_batch_msg = new pgp.helpers.ColumnSet(
      [
        "route_group",
        "route_group_code",
        "publish_date",
        "publish_source",
        "route_group_coverage",
        "batch_publish_event",
        "won_start_date",
        "won_end_date",
      ],
      { table: { table: "tsr_batch_msg", schema: "nrod" } }
    );
  }
  if (!cs.nrod_tsr) {
    cs.nrod_tsr = new pgp.helpers.ColumnSet(
      [
        "tsr_batch_msg_id",
        "tsrid",
        "creation_date",
        "publish_date",
        "publish_event",
        "route_group",
        "route_code",
        "route_order",
        "tsr_reference",
        "from_location",
        "to_location",
        "line_name",
        "subunit_type",
        "mileage_from",
        "subunit_from",
        "mileage_to",
        "subunit_to",
        "moving_mileage",
        "passenger_speed",
        "freight_speed",
        "valid_from_date",
        "valid_to_date",
        "reason",
        "requestor",
        "comments",
        "direction",
      ],
      { table: { table: "tsr", schema: "nrod" } }
    );
  }
}

class TSRRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
    createColumnsets(pgp);
  }

  async insert(data) {
    const query =
      this.pgp.helpers.insert(data, cs.nrod_tsr_batch_msg) + " RETURNING id";
    return this.db.one(query);
  }

  async insert_tsr(data) {
    const query = this.pgp.helpers.insert(data, cs.nrod_tsr);
    return this.db.none(query);
  }
}

module.exports = TSRRepository;
