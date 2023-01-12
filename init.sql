BEGIN;

-- Train Describer Data

-- C Class data
CREATE TABLE nrod_td_c (
  time        timestamptz,
  area_id     text,
  msg_type    text,
  from_berth  text,
  to_berth    text,
  descr       text
);

CREATE INDEX ON nrod_td_c(area_id);

-- S Class data
CREATE TABLE nrod_td_s (
  time        timestamptz,
  area_id     text,
  bit         smallint,
  state       boolean
);

CREATE INDEX ON nrod_td_s(area_id);


-- Train Movements: data from Network Rail's TRUST system

-- 0001 Train Activation
CREATE TABLE trust_activation(
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

CREATE INDEX ON trust_activation(train_id);

-- 0002 Train Cancellation
CREATE TABLE trust_cancellation(
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

CREATE INDEX ON trust_cancellation(train_id);

-- 0003 Train Movement
CREATE TABLE trust_movement(
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

CREATE INDEX ON trust_movement(train_id);
CREATE INDEX ON trust_movement(planned_timestamp);

-- 0005 Train Reinstatement
CREATE TABLE trust_reinstatement(
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

CREATE INDEX ON trust_reinstatement(train_id);

-- 0006 Change of Origin
CREATE TABLE trust_change_origin(
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

CREATE INDEX ON trust_change_origin(train_id);

-- 0007 Change of Identity
CREATE TABLE trust_change_identity(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  revised_train_id      text,
  event_timestamp       timestamptz,
  original_data_source  text
);

CREATE INDEX ON trust_change_identity(train_id);

-- 0008 Change of Location
CREATE TABLE trust_change_location(
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

CREATE INDEX ON trust_change_location(train_id);

COMMIT;
