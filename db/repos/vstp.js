const cs = {};

function createColumnsets(pgp) {
  if (!cs.nrod_schedule) {
    cs.nrod_schedule = new pgp.helpers.ColumnSet(
      [
        { name: "is_vstp", def: true },
        { name: "train_uid" },
        { name: "schedule_start_date" },
        { name: "schedule_end_date", def: null },
        { name: "schedule_days_runs", def: null, cast: "bit(7)" },
        { name: "train_status", def: null },
        { name: "train_category", def: null },
        { name: "signalling_id", def: null },
        { name: "train_service_code", def: null },
        { name: "power_type", def: null },
        { name: "timing_load", def: null },
        { name: "speed", def: null },
        { name: "operating_characteristics", def: null },
        { name: "train_class", def: null },
        { name: "sleepers", def: null },
        { name: "reservations", def: null },
        { name: "catering_code", def: null },
        { name: "service_branding", def: null },
        { name: "stp_indicator" },
        { name: "uic_code", def: null },
        { name: "atoc_code", def: null },
        { name: "applicable_timetable", def: null },
        { name: "last_modified" },
      ],
      { table: { table: "nrod_schedule", schema: "public" } }
    );
  }
  if (!cs.nrod_schedule_location) {
    cs.nrod_schedule_location = new pgp.helpers.ColumnSet(
      [
        { name: "schedule_id" },
        { name: "position" },
        { name: "tiploc_code" },
        { name: "tiploc_instance", def: null },
        { name: "arrival_day", def: null },
        { name: "departure_day", def: null },
        { name: "arrival", def: null },
        { name: "departure", def: null },
        { name: "public_arrival", def: null },
        { name: "public_departure", def: null },
        { name: "platform", def: null },
        { name: "line", def: null },
        { name: "path", def: null },
        { name: "activity", def: null },
        { name: "engineering_allowance", def: null },
        { name: "pathing_allowance", def: null },
        { name: "performance_allowance", def: null },
      ],
      { table: { table: "nrod_schedule_location", schema: "public" } }
    );
  }
}

class VSTPRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
    createColumnsets(pgp);
  }

  async delete(data) {
    const query =
      "DELETE FROM nrod_schedule " +
      "WHERE is_vstp AND train_uid = $1 AND schedule_start_date = $2 AND stp_indicator = $3";
    return this.db.result(
      query,
      [data.train_uid, data.schedule_start_date, data.stp_indicator],
      (a) => a.rowCount
    );
  }

  async insert(data) {
    const query =
      this.pgp.helpers.insert(data, cs.nrod_schedule) + " RETURNING id";
    return this.db.many(query);
  }

  async insert_locations(data) {
    const query = this.pgp.helpers.insert(data, cs.nrod_schedule_location);
    return this.db.none(query);
  }
}

module.exports = VSTPRepository;
