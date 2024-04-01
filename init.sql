CREATE SCHEMA IF NOT EXISTS nrod;

-- Train Describer Data
-- C Class data
CREATE TABLE IF NOT EXISTS nrod.td_c (
  time        timestamptz,
  area_id     text,
  msg_type    text,
  from_berth  text,
  to_berth    text,
  descr       text
);

CREATE INDEX ON nrod.td_c(area_id);

-- S Class data
CREATE TABLE IF NOT EXISTS nrod.td_s (
  time        timestamptz,
  area_id     text,
  bit         smallint,
  state       boolean
);

CREATE INDEX ON nrod.td_s(area_id);

-- Train Movements: data from Network Rail's TRUST system
-- 0001 Train Activation
CREATE TABLE IF NOT EXISTS nrod.activation(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  creation_timestamp    timestamptz,
  train_call_mode       text,
  train_call_type       text,
  train_service_code    integer,
  toc_id                smallint,
  sched_origin_stanox   integer,
  origin_dep_timestamp  timestamptz,
  tp_origin_stanox      integer,
  schedule_source       text,
  train_uid             text,
  schedule_start_date   date,
  schedule_end_date     date,
  schedule_type         text
);

CREATE INDEX ON nrod.activation(train_id);

-- 0002 Train Cancellation
CREATE TABLE IF NOT EXISTS nrod.cancellation(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  canx_timestamp        timestamptz,
  canx_type             text,
  canx_reason_code      text,
  loc_stanox            integer,
  dep_timestamp         timestamptz,
  orig_loc_stanox       integer,
  orig_loc_timestamp    timestamptz,
  original_data_source  text
);

CREATE INDEX ON nrod.cancellation(train_id);

-- 0003 Train Movement
CREATE TABLE IF NOT EXISTS nrod.movement(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  loc_stanox            integer,
  actual_timestamp      timestamptz,
  event_type            text,
  platform              text,
  planned_timestamp     timestamptz,
  timetable_variation   smallint,
  offroute_ind          boolean,
  original_data_source  text
);

CREATE INDEX ON nrod.movement(train_id);
CREATE INDEX ON nrod.movement(planned_timestamp);

-- 0005 Train Reinstatement
CREATE TABLE IF NOT EXISTS nrod.reinstatement(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  reinstatement_timestamp timestamptz,
  loc_stanox            integer,
  dep_timestamp         timestamptz,
  original_loc_stanox   integer,
  original_loc_timestamp timestamptz,
  original_data_source  text
);

CREATE INDEX ON nrod.reinstatement(train_id);

-- 0006 Change of Origin
CREATE TABLE IF NOT EXISTS nrod.change_origin(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  coo_timestamp         timestamptz,
  reason_code           text,
  loc_stanox            integer,
  dep_timestamp         timestamptz,
  original_loc_stanox   integer,
  original_loc_timestamp timestamptz,
  original_data_source  text
);

CREATE INDEX ON nrod.change_origin(train_id);

-- 0007 Change of Identity
CREATE TABLE IF NOT EXISTS nrod.change_identity(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  revised_train_id      text,
  event_timestamp       timestamptz,
  original_data_source  text
);

CREATE INDEX ON nrod.change_identity(train_id);

-- 0008 Change of Location
CREATE TABLE IF NOT EXISTS nrod.change_location(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  event_timestamp       timestamptz,
  loc_stanox            integer,
  dep_timestamp         timestamptz,
  original_loc_stanox   integer,
  original_loc_timestamp timestamptz,
  original_data_source  text
);

CREATE INDEX ON nrod.change_location(train_id);

-- TSR Feed
-- Headers of the TSR message
CREATE TABLE nrod.tsr_batch_msg(
    id                          integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    route_group                 text,
    route_group_code            text,
    publish_date                timestamptz,
    publish_source              text,
    route_group_coverage        text,
    batch_publish_event         text,
    won_start_date              timestamptz,
    won_end_date                timestamptz
);

-- Temporary Speed Restrictions
CREATE TABLE nrod.tsr(
    tsr_batch_msg_id            int REFERENCES nrod_tsr_batch_msg(id) ON DELETE CASCADE,
    tsrid                       int,
    creation_date               timestamptz,
    publish_date                timestamptz,
    publish_event               text,
    route_group                 text,
    route_code                  text,
    route_order                 smallint,
    tsr_reference               text,
    from_location               text,
    to_location                 text,
    line_name                   text,
    subunit_type                text,
    mileage_from                smallint,
    subunit_from                smallint,
    mileage_to                  smallint,
    subunit_to                  smallint,
    moving_mileage              boolean,
    passenger_speed             smallint,
    freight_speed               smallint,
    valid_from_date             timestamptz,
    valid_to_date               timestamptz,
    reason                      text,
    requestor                   text,
    comments                    text,
    direction                   text,
    PRIMARY KEY (tsr_batch_msg_id, tsrid)
);
