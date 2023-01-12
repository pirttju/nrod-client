const io = require("@pm2/io");
const { db } = require("../db");

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

class MovementFeed {
  parse(dataset) {
    if (!Array.isArray(dataset) || dataset.length === 0) return;

    return db.tx("insert-movement", (t) => {
      const queries = [];
      let save = {};

      for (const data of dataset) {
        switch (data.header.msg_type) {
          case "0001":
            save = data.body;
            save.creation_timestamp = parsets(data.body.creation_timestamp);
            save.origin_dep_timestamp = parsets(data.body.origin_dep_timestamp);
            queries.push(t.mvt.insert_0001(save));
            break;
          case "0002":
            save = data.body;
            save.canx_timestamp = parsets(data.body.canx_timestamp);
            save.dep_timestamp = parsets(data.body.dep_timestamp);
            save.orig_loc_timestamp = parsets(data.body.orig_loc_timestamp);
            save.original_data_source = data.header.original_data_source;
            queries.push(t.mvt.insert_0002(save));
            break;
          case "0003":
            save = data.body;
            save.actual_timestamp = parsets(data.body.actual_timestamp);
            save.planned_timestamp = parsets(data.body.planned_timestamp);
            save.original_data_source = data.header.original_data_source;
            queries.push(t.mvt.insert_0003(save));
            break;
          case "0005":
            save = data.body;
            save.reinstatement_timestamp = parsets(
              data.body.reinstatement_timestamp
            );
            save.dep_timestamp = parsets(data.body.dep_timestamp);
            save.original_loc_timestamp = parsets(
              data.body.original_loc_timestamp
            );
            save.original_data_source = data.header.original_data_source;
            queries.push(t.mvt.insert_0005(save));
            break;
          case "0006":
            save = data.body;
            save.coo_timestamp = parsets(data.body.coo_timestamp);
            save.dep_timestamp = parsets(data.body.dep_timestamp);
            save.original_loc_timestamp = parsets(
              data.body.original_loc_timestamp
            );
            save.original_data_source = data.header.original_data_source;
            queries.push(t.mvt.insert_0006(save));
            break;
          case "0007":
            save = data.body;
            save.event_timestamp = parsets(data.body.event_timestamp);
            save.original_data_source = data.header.original_data_source;
            queries.push(t.mvt.insert_0007(save));
            break;
          case "0008":
            save = data.body;
            save.event_timestamp = parsets(data.body.event_timestamp);
            save.dep_timestamp = parsets(data.body.dep_timestamp);
            save.original_loc_timestamp = parsets(
              data.body.original_loc_timestamp
            );
            save.original_data_source = data.header.original_data_source;
            queries.push(t.mvt.insert_0008(save));
            break;
        }
      }

      return t.batch(queries);
    });
  }
}

module.exports = MovementFeed;
