// Camp helper checks — label/date normalisation used by the Camp dropdown.
//
// lib/camp-utils.js is dependency-free ESM, but package.json has no
// "type": "module" — so this harness loads its SOURCE through a data: URL
// instead of importing the .js file directly (which Node would treat as CJS).
//
// Run with:  node tests/camp-utils.check.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../lib/camp-utils.js", import.meta.url),
  "utf8",
);

const mod = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

const {
  getCampDate,
  getCampDisplayLabel,
  getCampDoctorIds,
  getCampPrimaryDoctorId,
  formatCampDate,
} = mod;

// The real /api/v1/medical-event/assigned record (camp id 14).
const apiCamp = {
  id: 14,
  name: "svasta dev",
  camp_date: "2026-09-15T00:00:00.000000Z",
  created_at: "2026-09-15T11:43:17.000000Z",
  doctor_ids: [88, 100],
  primary_doctor: 0,
  primary_doctor_id: 88,
};

// ---- getCampDate ----------------------------------------------------------
assert.equal(getCampDate(apiCamp), "2026-09-15T00:00:00.000000Z");
assert.equal(getCampDate({ campDate: "2026-01-02" }), "2026-01-02");
assert.equal(getCampDate({ date: "2026-01-03" }), "2026-01-03");
assert.equal(getCampDate({ name: "no date" }), "");
assert.equal(getCampDate(null), "");
assert.equal(getCampDate(undefined), "");

// ---- formatCampDate -------------------------------------------------------
assert.equal(formatCampDate(null), null);
assert.equal(formatCampDate(""), null);
assert.equal(formatCampDate("not-a-date"), "not-a-date", "unparseable -> raw");
const formatted = formatCampDate(apiCamp.camp_date);
assert.match(formatted, /^15 Sep 2026$|^15 Sept? 2026$/, `got: ${formatted}`);

// ---- getCampDisplayLabel --------------------------------------------------
assert.equal(
  getCampDisplayLabel(apiCamp),
  `svasta dev — ${formatted}`,
  "name + date",
);
assert.equal(getCampDisplayLabel({ id: 1, name: "No date camp" }), "No date camp");
// A camp with a date but no name renders just the date (no dangling " — ").
assert.equal(
  getCampDisplayLabel({ id: 2, camp_date: "2026-09-15" }),
  formatCampDate("2026-09-15"),
);
assert.equal(getCampDisplayLabel(null), "");

// Two camps sharing a name must now be distinguishable.
const a = getCampDisplayLabel({ id: 14, name: "svasta dev", camp_date: "2026-09-15" });
const b = getCampDisplayLabel({ id: 15, name: "svasta dev", camp_date: "2026-10-20" });
assert.notEqual(a, b, "same name, different dates must differ");

// ---- doctors --------------------------------------------------------------
// `primary_doctor` is a FLAG on this backend (0 while primary_doctor_id is 88).
assert.equal(getCampPrimaryDoctorId(apiCamp), "88");
assert.deepEqual(getCampDoctorIds(apiCamp), ["88", "100"]);
assert.equal(
  getCampPrimaryDoctorId({ doctor_ids: [7], primary_doctor: 0 }),
  null,
  "flag 0 must not be read as a doctor id",
);
assert.equal(
  getCampPrimaryDoctorId({ primary_doctor: { id: 5 } }),
  "5",
  "inlined doctor object",
);
assert.equal(getCampPrimaryDoctorId({ primary_doctor: 9 }), "9", "plain id");
assert.equal(getCampPrimaryDoctorId(null), null);
assert.deepEqual(getCampDoctorIds({ doctor_ids: [{ id: 3 }, { doctor_id: 4 }] }), ["3", "4"]);
assert.deepEqual(getCampDoctorIds({ doctors: 6 }), ["6"]);
assert.deepEqual(getCampDoctorIds({}), []);

console.log("camp-utils checks passed");