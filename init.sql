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

COMMIT;
