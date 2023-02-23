const { db } = require("../db");

function parsevalue(input) {
  const str = input || "";
  out = str.trim();

  if (out === "") return null;

  return out;
}

function parsetime(input) {
  if (/^\d{6}$/.test(input) === false) return null;

  const hh = input.slice(0, 2);
  const mm = input.slice(2, 4);
  const ss = input.slice(4, 6);

  return `${hh}:${mm}:${ss}`;
}

function parsets(ts) {
  if (ts) {
    let date;
    try {
      date = new Date(parseInt(ts));
    } catch {
      date = null;
    }
    return date;
  } else {
    return null;
  }
}

function parsespeed(CIF_speed) {
  const speed = +CIF_speed;
  switch (speed) {
    case 22:
      return 10;
    case 34:
      return 15;
    case 56:
      return 20;
    case 67:
      return 30;
    case 78:
      return 35;
    case 89:
      return 40;
    case 101:
      return 45;
    case 112:
      return 50;
    case 123:
      return 55;
    case 134:
      return 60;
    case 157:
      return 70;
    case 168:
      return 75;
    case 179:
      return 80;
    case 190:
      return 85;
    case 195:
      return 87;
    case 201:
      return 90;
    case 213:
      return 95;
    case 224:
      return 100;
    case 246:
      return 110;
    case 280:
      return 125;
    case 313:
      return 140;
    case 416:
      return 186;
    default:
      return speed;
  }
}

class VSTPFeed {
  parse(data) {
    if (!data.VSTPCIFMsgV1) return;
    if (!data.VSTPCIFMsgV1.schedule) return;
    if (!data.VSTPCIFMsgV1.schedule.schedule_segment) return;
    if (!Array.isArray(data.VSTPCIFMsgV1.schedule.schedule_segment)) return;

    const save = [];

    // iterate and parse schedule segments
    data.VSTPCIFMsgV1.schedule.schedule_segment.forEach((v) => {
      const schedule = {
        is_vstp: true,
        train_uid: parsevalue(data.VSTPCIFMsgV1.schedule.CIF_train_uid),
        schedule_start_date: parsevalue(
          data.VSTPCIFMsgV1.schedule.schedule_start_date
        ),
        schedule_end_date: parsevalue(
          data.VSTPCIFMsgV1.schedule.schedule_end_date
        ),
        schedule_days_runs: parsevalue(
          data.VSTPCIFMsgV1.schedule.schedule_days_runs
        ),
        train_status: parsevalue(data.VSTPCIFMsgV1.schedule.train_status),
        train_category: parsevalue(v.CIF_train_category),
        signalling_id: parsevalue(v.signalling_id),
        train_service_code: parsevalue(v.CIF_train_service_code),
        power_type: parsevalue(v.CIF_power_type),
        timing_load: parsevalue(v.CIF_timing_load),
        speed: parsespeed(v.CIF_speed),
        operating_characteristics: parsevalue(v.CIF_operating_characteristics),
        train_class: parsevalue(v.CIF_train_class),
        sleepers: parsevalue(v.CIF_sleepers),
        reservations: parsevalue(v.CIF_reservations),
        catering_code: parsevalue(v.CIF_catering_code),
        service_branding: parsevalue(v.CIF_service_branding),
        stp_indicator: parsevalue(data.VSTPCIFMsgV1.schedule.CIF_stp_indicator),
        uic_code: parsevalue(v.uic_code),
        atoc_code: parsevalue(v.atoc_code),
        applicable_timetable:
          data.VSTPCIFMsgV1.schedule.applicable_timetable === "Y",
        last_modified: parsets(data.VSTPCIFMsgV1.timestamp),
        locations: [],
      };

      if (Array.isArray(v.schedule_location)) {
        let prev = false;
        // iterate and parse schedule locations
        v.schedule_location.forEach((w, j) => {
          const l = {
            position: j,
            tiploc_code: parsevalue(w.location.tiploc.tiploc_id),
            tiploc_instance: null,
            arrival_day: prev !== false ? prev.arrival_day : 0,
            departure_day: prev !== false ? prev.departure_day : 0,
            arrival: parsetime(w.scheduled_arrival_time),
            departure:
              parsetime(w.scheduled_departure_time) ??
              parsetime(w.scheduled_pass_time),
            public_arrival: parsetime(w.public_arrival_time),
            public_departure: parsetime(w.public_departure_time),
            platform: parsevalue(w.CIF_platform),
            line: parsevalue(w.CIF_line),
            path: parsevalue(w.CIF_path),
            activity: parsevalue(w.CIF_activity),
            engineering_allowance: parsevalue(w.CIF_engineering_allowance),
            pathing_allowance: parsevalue(w.CIF_pathing_allowance),
            performance_allowance: parsevalue(w.CIF_performance_allowance),
          };

          if (prev !== false) {
            if (l.arrival !== null && l.arrival < prev.departure) {
              l.arrival_day++;
            }
            if (l.departure < prev.departure) {
              l.departure_day++;
              if (l.arrival === null) {
                l.arrival_day++;
              }
            }
          }

          prev = l;

          schedule.locations.push(l);
        });
      }
      save.push(schedule);
    });

    return db.tx("vstp-transaction", async (t) => {
      const train = {
        train_uid: parsevalue(data.VSTPCIFMsgV1.schedule.CIF_train_uid),
        schedule_start_date: parsevalue(
          data.VSTPCIFMsgV1.schedule.schedule_start_date
        ),
        stp_indicator: parsevalue(data.VSTPCIFMsgV1.schedule.CIF_stp_indicator),
      };

      // both update and create initiate delete and inserts
      // delete removes the schedule
      switch (data.VSTPCIFMsgV1.schedule.transaction_type) {
        case "Update":
        case "Create":
          // delete old (if any)
          const oldrows = await t.vstp.delete(train);
          if (oldrows > 0) {
            console.log("VSTP Deleted", oldrows, "row(s)");
          }
          // insert new
          const ids = await t.vstp.insert(save);
          const queries = [];
          ids.forEach((v, i) => {
            const save_locations = save[i].locations.map((w) => ({
              ...w,
              schedule_id: v.id,
            }));
            queries.push(t.vstp.insert_locations(save_locations));
          });
          console.log(
            "VSTP",
            data.VSTPCIFMsgV1.schedule.transaction_type,
            train.train_uid,
            train.schedule_start_date,
            train.stp_indicator,
            ids
          );
          return t.batch(queries);
        // delete
        case "Delete":
          const delrows = await t.vstp.delete(train);
          console.log(
            "VSTP",
            data.VSTPCIFMsgV1.schedule.transaction_type,
            train.train_uid,
            train.schedule_start_date,
            train.stp_indicator,
            delrows
          );
          return;
        default:
          console.log(
            `VSTP unknown transaction type ${data.VSTPCIFMsgV1.schedule.transaction_type} ${train.train_uid} ${train.schedule_start_date} ${train.stp_indicator}`
          );
          return;
      }
    });
  }
}

module.exports = VSTPFeed;
