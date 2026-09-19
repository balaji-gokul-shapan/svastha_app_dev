/**
 * Camp (assigned event) field normalisation shared by the camp dropdown, the
 * selected-camp resolver and the roster queries.
 *
 * Assigned events can arrive as snake_case or PascalCase, so every id / name /
 * school lookup goes through these helpers instead of reading fields inline.
 * Camp ids are always returned as trimmed strings so dropdown values, query
 * keys and API params all use the same representation.
 */

export const getCampId = (camp) => String(camp?.id ?? camp?.Id ?? "").trim();

export const getCampName = (camp) =>
  String(camp?.name ?? camp?.Name ?? camp?.camp_name ?? "").trim();

export const getCampSchoolName = (camp) =>
  String(
    camp?.school?.school_name ??
      camp?.school?.name ??
      camp?.school_name ??
      camp?.schoolName ??
      "",
  ).trim();




export const getCampDate = (camp) =>
  String(camp?.camp_date ?? camp?.campDate ?? camp?.date ?? "").trim();

export function formatCampDate(value) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


export const getCampDisplayLabel = (camp) => {
  const name = getCampName(camp);
  const date = formatCampDate(getCampDate(camp) || camp?.date);

  if (!name) return date ?? "";
  return date ? `${name} — ${date}` : name;
};


export const getCampDoctorIds = (camp) => {
  const raw = camp?.doctor_ids ?? camp?.doctorIds ?? camp?.doctors ?? [];
  const list = Array.isArray(raw) ? raw : [raw];

  return list
    .map((entry) =>
      entry && typeof entry === "object"
        ? (entry.id ?? entry.doctor_id ?? entry.doctorId ?? "")
        : entry,
    )
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);
};

export const getCampPrimaryDoctorId = (camp) => {
  if (!camp) return null;

  const explicit = camp?.primary_doctor_id ?? camp?.primaryDoctorId ?? "";
  if (String(explicit).trim() && String(explicit).trim() !== "0") {
    return String(explicit).trim();
  }

  const inlined = camp?.primary_doctor ?? camp?.primaryDoctor;

  if (inlined && typeof inlined === "object") {
    const id = inlined.id ?? inlined.doctor_id ?? inlined.doctorId ?? "";
    return String(id).trim() || null;
  }

  // A plain positive number is a real id; 0 is the flag, not an id.
  if (typeof inlined === "number" && inlined > 0) {
    return String(inlined);
  }

  return null;
};

/**
 * True when a camp belongs to the school currently applied by the school
 * filter. Camps without a school only match the "all" filter.
 */
export const campMatchesSchool = (camp, schoolName) => {
  const campSchool = getCampSchoolName(camp);
  const filter = String(schoolName ?? "").trim();

  if (!campSchool) {
    return filter === "all";
  }

  return campSchool === filter;
};
