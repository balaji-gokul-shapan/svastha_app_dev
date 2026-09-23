"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CircleX,
  ClipboardCheck,
  Ear,
  Eye,
  FilePenLine,
  Heart,
  Info,
  RotateCcw,
  SaveAll,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { useAllScreeningReport } from "@/components/healthChecks/getScreeningReport";
import { DataTable } from "@/components/ui/data-table";
import ToothIcon from "@/app/health-checks/dental-screening/asset/toothIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextareaField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/lib/hooks";
import { fetchWithAuth } from "@/lib/auth-utils";
import { updateInitialScreening } from "@/lib/features/registerGeneralScreening";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  formatCampDate,
  getCampDate,
  getCampDoctorIds,
  getCampName,
  getCampPrimaryDoctorId,
} from "@/lib/camp-utils";
import {
  DETAIL_LABEL_OVERRIDES,
  SCREENING_DETAIL_SECTIONS,
  SCREENING_DOMAIN_CLASSES,
} from "../datas/data";
import { updateEntScreening } from "@/lib/features/registerEntScreening";
import { updateHearingScreening } from "@/lib/features/registerHearingScreening";
import { updateDentalScreening } from "@/lib/features/registerDentalScreening";
import { updateVisionScreening } from "@/lib/features/registerVisionScreening";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const getStudentName = (student) => {
  if (!student) return "";

  if (typeof student === "string") {
    return student.trim();
  }

  return String(
    student.student_name ?? student.name ?? student.studentName ?? "",
  ).trim();
};

const getRecordStudentName = (record) => {
  const student = record?.student;

  if (Array.isArray(student)) {
    return student.map(getStudentName).find(Boolean) ?? "";
  }

  return getStudentName(student);
};
const getRecordStudentClass = (record) => {
  const student = record?.student;
  console.log(student, "recordwwwwww");

  if (Array.isArray(student)) {
    return (
      student.map((s) => s.class ?? s.class_name ?? "").find(Boolean) ?? ""
    );
  }

  return student?.class ?? student?.class_name ?? "";
};
const getRecordStudentSection = (record) => {
  const student = record?.student;

  if (Array.isArray(student)) {
    return (
      student
        .map((s) => s.sec ?? s.section ?? s.section_name ?? "")
        .find(Boolean) ?? ""
    );
  }

  return student?.sec ?? student?.section ?? student?.section_name ?? "";
};

const normalizeFilterValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isFilterActive = (value) => {
  const normalized = normalizeFilterValue(value);
  return Boolean(normalized) && normalized !== "all";
};

const matchesStudentFilter = (record, classFilter, sectionFilter) => {
  const classActive = isFilterActive(classFilter);
  const sectionActive = isFilterActive(sectionFilter);

  // Nothing selected — every row passes (no need to read the record).
  if (!classActive && !sectionActive) {
    return true;
  }

  const rawClass = String(getRecordStudentClass(record) ?? "").trim();
  const rawSection = String(getRecordStudentSection(record) ?? "").trim();

  const combinedMatch = !rawSection
    ? /^(.*)-([A-Za-z]\d*)$/.exec(rawClass)
    : null;

  const classValue = normalizeFilterValue(combinedMatch?.[1] ?? rawClass);
  const sectionValue = normalizeFilterValue(combinedMatch?.[2] ?? rawSection);

  const classMatches =
    !classActive || classValue === normalizeFilterValue(classFilter);
  const sectionMatches =
    !sectionActive || sectionValue === normalizeFilterValue(sectionFilter);

  return classMatches && sectionMatches;
};
// const getRecordStudentName = (record) => {
//   const student = record?.student;

//   if (Array.isArray(student)) {
//     return student.map(getStudentName).find(Boolean) ?? "";
//   }

//   return getStudentName(student);
// };

const getRecordStudentId = (record) =>
  [
    record?.student_id,
    record?.studentId,
    record?.student_cus_id,
    record?.cus_id,
    record?.student?.cus_id,
    record?.student?.id,
  ]
    .map((value) => String(value ?? "").trim())
    .find(Boolean) ?? "";

const getScreenedTimeStamp = (record) =>
  record?.created_at ??
  record?.createdAt ??
  record?.report?.created_at ??
  record?.report?.createdAt ??
  "";

const toDetailLabel = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDetailValue = (value) => {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

const HANDLED_DETAIL_KEYS = new Set([
  "student",
  "student_id",
  "studentId",
  "student_cus_id",
  "cus_id",
  "id",
  "record_id",
  "created_at",
  "createdAt",
]);

/* -------------------------------------------------------------------------- */
/* Per-screening detail fields                                                */
/* -------------------------------------------------------------------------- */

const SCREENING_DETAIL_FIELDS = Object.fromEntries(
  Object.entries(SCREENING_DETAIL_SECTIONS).map(([type, sections]) => [
    type,
    sections.flatMap((section) => section.fields),
  ]),
);

const SIDE_FIELD_PATTERN =
  /^(whisper_test|ear_exam|speech_recognition|tympanometry|overall_status|hearing_whisper|ear_wax|discharge|perforation|foreign_body|infection|tympanic_membrane|system_examination)_(re|le)$/;

const getDetailLabel = (key) => {
  if (DETAIL_LABEL_OVERRIDES[key]) {
    return DETAIL_LABEL_OVERRIDES[key];
  }

  const sideMatch = SIDE_FIELD_PATTERN.exec(key);

  if (sideMatch) {
    return `${toDetailLabel(sideMatch[1])} (${
      sideMatch[2] === "re" ? "Right" : "Left"
    })`;
  }

  const eyeMatch = /^(od|os|ou)_(distance|near)_(with|without)$/.exec(key);

  if (eyeMatch) {
    const side = { od: "Right Eye", os: "Left Eye", ou: "Both Eyes" }[
      eyeMatch[1]
    ];
    const range = eyeMatch[2] === "distance" ? "Distance" : "Near";
    const lens = eyeMatch[3] === "with" ? "With Glasses" : "Without Glasses";

    return `${side} ${range} (${lens})`;
  }

  const eyeRemarksMatch = /^(od|os|ou)_remarks$/.exec(key);

  if (eyeRemarksMatch) {
    const side = { od: "Right Eye", os: "Left Eye", ou: "Both Eyes" }[
      eyeRemarksMatch[1]
    ];

    return `${side} Remarks`;
  }

  const ptaMatch = /^pta_(\d+)hz_(re|le)$/.exec(key);

  if (ptaMatch) {
    return `PTA ${ptaMatch[1]} Hz (${ptaMatch[2] === "re" ? "Right" : "Left"})`;
  }

  return toDetailLabel(key);
};

const resolveFieldValue = (record, key) =>
  record?.[key] ?? record?.report?.[key] ?? record?.screening?.[key];

const REFERRAL_EDIT_FIELD = {
  general: "remarks",
  vision: "remarks",
  dental: "remarks",
  hearing: "remarks",
  ent: "remarks",
};

/* PUT path per screening type (mirrors the create / report paths used by
 * lib/features/register*Screening.js). General goes through its Redux update
 * thunk; the other four have no update thunk, so they PUT directly. */
const REFERRAL_UPDATE_PATH = {
  vision: "vision-test",
  dental: "dental-test",
  hearing: "hear-test",
  ent: "ent-assessment",
};

/* -------------------------------------------------------------------------- */
/* Table Columns                                                              */
/* -------------------------------------------------------------------------- */

const columns = [
  {
    id: "studentId",
    header: "Student ID",
    accessorFn: getRecordStudentId,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue() || "-"} </span>
    ),
  },
  {
    id: "student",
    header: "Student",
    accessorFn: getRecordStudentName,
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue() || "-"} </span>
    ),
  },

  {
    id: "class",
    header: "Class",
    accessorFn: getRecordStudentClass,
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue() || "-"} </span>
    ),
  },

  {
    id: "section",
    header: "Section",
    accessorFn: getRecordStudentSection,
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue() || "-"} </span>
    ),
  },
  {
    id: "recordId",
    header: "Record ID",
    accessorFn: (row) => String(row?.id ?? row?.record_id ?? "").trim(),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue() || "-"} </span>
    ),
  },

  {
    id: "screenedAt",
    header: "Screened At",
    accessorFn: getScreenedTimeStamp,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">
        {formatCampDate(getValue()) || "-"}{" "}
      </span>
    ),
  },
];

/* -------------------------------------------------------------------------- */
/* Reusable Components                                                        */
/* -------------------------------------------------------------------------- */

function InfoTile({ icon: Icon, label, children }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-3")}>
      {" "}
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}{" "}
      </dt>
      <dd className="mt-1.5 text-sm text-foreground">{children}</dd>
    </div>
  );
}

/*
 * Identity tiles shared by the flat and sectioned modal layouts — Student,
 * IDs and screening timestamp, formatted like the table columns.
 */
function getIdentityRows(record) {
  if (!record) {
    return [];
  }

  const rows = [];

  const pushRow = (label, value) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    rows.push({ label, value: formatDetailValue(value) });
  };

  pushRow("Student", getRecordStudentName(record));
  pushRow("Student ID", getRecordStudentId(record));
  pushRow("Admission No.", record?.admission_number);
  pushRow("Registration No.", record?.school_registration_number);
  pushRow("Record ID", record?.id ?? record?.record_id);
  pushRow(
    "Screened At",
    formatCampDate(getScreenedTimeStamp(record)) ||
      getScreenedTimeStamp(record),
  );

  return rows;
}

const UPDATE_THUNKS = {
  general: updateInitialScreening,
  vision: updateVisionScreening,
  dental: updateDentalScreening,
  ent: updateEntScreening,
  hearing: updateHearingScreening,
  // hearing has no update thunk yet - will fall back to fetch
};

function ScreeningReferralField({ record, screeningKey, onSaved, onClose }) {
  const dispatch = useAppDispatch();

  const fieldKey = REFERRAL_EDIT_FIELD[screeningKey];
  const recordId =
    record?.id ??
    record?.record_id ??
    record?.screening_id ??
    record?.screeningId ??
    record?.report?.id ??
    record?.report?.record_id ??
    record?.screening?.id ??
    null;

  const savedValue = String(
    (fieldKey ? resolveFieldValue(record, fieldKey) : "") ?? "",
  );

  const [draft, setDraft] = useState(savedValue);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  const canPersist = Boolean(fieldKey && recordId);
  const hasChanges = draft !== savedValue;

  const hasDraftValue = String(draft ?? "").trim().length > 0;
  const canSave =
    canPersist && !isSaving && (hasChanges || hasDraftValue || hasInteracted);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    setShowConfirmation(true);
    setPendingSave(true);
  };

  const handleConfirmSave = async () => {
    // 1. Close the confirm dialog the moment Confirm Save is clicked.
    setShowConfirmation(false);

    // Guard against double-submit while a request is already running.
    if (!pendingSave || isSaving) {
      return;
    }

    setPendingSave(false);
    setIsSaving(true);
    setSaveError("");

    // 2. Close the record-details popup as well — both popups are dismissed
    //    up front and the save below continues in the background. Sonner
    //    toasts render in their own portal, so feedback still shows.
    onClose?.();

    // Extract student_id from multiple possible locations (same as getRecordStudentId)
    const studentId =
      record?.student_id ??
      record?.studentId ??
      record?.student_cus_id ??
      record?.cus_id ??
      record?.student?.cus_id ??
      record?.student?.id ??
      "";

    try {
      const thunk = UPDATE_THUNKS[screeningKey];
      if (thunk) {
        await dispatch(
          thunk({
            id: recordId,
            student_id: studentId,
            [fieldKey]: draft,
          }),
        ).unwrap();
      } else {
        // Fallback to manual fetch if no update thunk is available for this screening type.
        const base = REFERRAL_UPDATE_PATH[screeningKey];

        if (!base) {
          throw new Error("Referral editing is not wired for this type yet.");
        }

        const { response } = await fetchWithAuth(
          `/api/${base}/${encodeURIComponent(String(recordId))}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [fieldKey]: draft }),
          },
          dispatch,
        );

        if (!response.ok) {
          const text = await response.text();
          let detail = text;

          try {
            const parsed = text ? JSON.parse(text) : null;
            detail = parsed?.message ?? parsed?.error ?? parsed?.detail ?? text;
          } catch {
            // keep raw text
          }

          throw new Error(detail || "Unable to save referral.");
        }
      }

      toast.success("Referral saved successfully.");
      onSaved?.({ ...record, [fieldKey]: draft });
    } catch (error) {
      const message = error?.message || "Unable to save referral.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!fieldKey) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <TextareaField
        label="Referral remarks (optional)"
        value={draft}
        placeholder="Enter referral details…"
        rows={3}
        onChange={(event) => {
          setDraft(event.target.value);
          setSaveError("");
          setHasInteracted(true);
        }}
        onFocus={() => setHasInteracted(true)}
        disabled={isSaving}
        textareaClassName="resize-none bg-background text-sm"
      />

      {saveError ? (
        <p className="mt-1.5 text-xs text-destructive">{saveError}</p>
      ) : null}

      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!canSave}
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck />
            {isSaving ? "Saving…" : "Save Referral"}
          </div>
        </Button>

        {!canPersist ? (
          <p className="text-xs text-muted-foreground">
            Referral can be saved once the record has an id.
          </p>
        ) : null}

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="w-full max-w-full sm:max-w-2/3">
            <DialogHeader>
              <DialogTitle>
                <ClipboardCheck size={18} className="inline-block mr-1" />
                Confirm Save Referral
                <span className="group relative inline-flex items-center align-middle ml-4">
                  <Info size={14} className="text-warning cursor-help" />
                  <span className="pointer-events-none absolute bottom-full  mb-2 w-max max-w-96 rounded-md border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    Once you save, the referral details will be recorded in
                    Report.
                  </span>
                </span>
                {/* <FilePenLine size={18} /> */}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to save these referral details?
                {draft.trim() === "" && (
                  <span className="block mt-2 text-warning">
                    Warning: You are about to save empty remarks.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setPendingSave(false);
                }}
              >
                <RotateCcw />
                Continue Editing
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setPendingSave(false);
                }}
              >
                <CircleX />
                Cancel
              </Button>
              <Button onClick={handleConfirmSave} disabled={isSaving}>
                <SaveAll /> {isSaving ? "Saving..." : "Confirm Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function ScreeningNotesField({ record, screeningKey, type }) {
  const dispatch = useAppDispatch();
  const recordId = record?.id ?? record?.record_id;
  const savedNotes = resolveFieldValue(record, "general_notes") ?? "";
  const [notesDraft, setNotesDraft] = useState(savedNotes);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const canPersistNotes = screeningKey === "general" && Boolean(recordId);
  const hasChanges = notesDraft !== savedNotes;
  const handleSaveNotes = async () => {
    if (!canPersistNotes) {
      return;
    }
    setIsSavingNotes(true);
    try {
      await dispatch(
        updateInitialScreening({
          id: recordId,
          payload: { general_notes: notesDraft },
        }),
      ).unwrap();

      toast.success("Notes saved successfully.");
    } catch (error) {
      toast.error(error?.message || "Unable to save notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <TextareaField
        label="General Notes"
        value={notesDraft}
        placeholder="Add notes for this screening record…"
        onChange={(event) => setNotesDraft(event.target.value)}
        disabled={isSavingNotes}
        textareaClassName="resize-none bg-background text-sm"
      />

      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSaveNotes}
          disabled={!hasChanges || isSavingNotes || !canPersistNotes}
        >
          {isSavingNotes ? "Saving…" : "Save Notes"}
        </Button>

        {!canPersistNotes ? (
          <p className="text-xs text-muted-foreground">
            {`Notes saving is wired for ${type} screening only for now.`}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ScreeningDetailModal({
  record,
  type,
  campEvent,
  onClose,
  activeTab,
  onRecordUpdated,
}) {
  const isOpen = Boolean(record);
  const campName = getCampName(campEvent);
  const studentName = record ? getRecordStudentName(record) : "";
  const screeningKey = String(type ?? activeTab ?? "").toLowerCase();

  const referralFieldKey = REFERRAL_EDIT_FIELD[screeningKey];
  const domainClasses = SCREENING_DOMAIN_CLASSES[screeningKey];
  const detailRows = useMemo(() => {
    if (!record) {
      return [];
    }

    const rows = [];
    const seenLabels = new Set();

    const pushRow = (label, value) => {
      if (value === null || value === undefined || value === "") {
        return;
      }

      if (typeof value === "function") {
        return;
      }

      if (typeof value === "object") {
        // Arrays of scalar values (e.g. advice suggestions) render as a
        // readable list; other objects are skipped.
        if (!Array.isArray(value)) {
          return;
        }

        const scalarItems = value.filter(
          (item) =>
            item !== null &&
            item !== undefined &&
            typeof item !== "object" &&
            typeof item !== "function",
        );

        if (scalarItems.length !== value.length) {
          return;
        }

        value = scalarItems.join(", ");
      }

      const dedupeKey = label.toLowerCase();

      if (seenLabels.has(dedupeKey)) {
        return;
      }

      seenLabels.add(dedupeKey);
      rows.push({ label, value: formatDetailValue(value) });
    };

    // Identity fields, using the same formatting as the table columns.
    rows.push(...getIdentityRows(record));

    const flattenObject = (obj, prefix = "") => {
      Object.entries(obj ?? {}).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          return;
        }

        // The `student` object is already covered by the identity helpers.
        if (prefix === "" && HANDLED_DETAIL_KEYS.has(key)) {
          return;
        }

        const label = prefix
          ? `${prefix} ${getDetailLabel(key)}`
          : getDetailLabel(key);

        if (typeof value === "object" && !Array.isArray(value)) {
          flattenObject(value, label);
          return;
        }

        pushRow(label, value);
      });
    };

    const sections = SCREENING_DETAIL_SECTIONS[screeningKey];
    const fieldKeys = SCREENING_DETAIL_FIELDS[screeningKey];

    if (Array.isArray(sections)) {
      // Sectioned type — the JSX renders sections straight from the record,
      // so the flat grid only keeps the identity rows here.
    } else if (Array.isArray(fieldKeys)) {
      console.log(fieldKeys, "fieldKeys");

      // Flat per-type view (types without a sections config).
      fieldKeys.forEach((key) =>
        pushRow(getDetailLabel(key), resolveFieldValue(record, key)),
      );
    } else {
      // Type without a config (e.g. "other") — fall back to every field.
      flattenObject(record);
    }

    if (!referralFieldKey) {
      return rows;
    }

    // The referral value is edited in its own textarea, so drop its read-only
    // copy from the grid.
    const referralLabel = getDetailLabel(referralFieldKey).toLowerCase();

    return rows.filter((row) => row.label.toLowerCase() !== referralLabel);
  }, [record, screeningKey, referralFieldKey]);

  // Identity tiles, shown above the sectioned layout.
  const identityRows = useMemo(() => getIdentityRows(record), [record]);

  const sections = SCREENING_DETAIL_SECTIONS[screeningKey];
  const hasSections = Array.isArray(sections);

  /*
   * Resolve every section's fields against the record once — empty values
   * drop out, empty sections are skipped, and duplicate labels (e.g. the
   * blood_pressure/bp alias pair) are deduped across the whole modal.
   */
  const sectionsWithRows = useMemo(() => {
    if (!record || !Array.isArray(sections)) {
      return [];
    }

    const seenLabels = new Set();

    return sections
      .map((section) => {
        const rows = section.fields
          .map((key) => {
            // The referral field is rendered as the editable textarea below the
            // sections — keep it out of the read-only grid.
            if (key === referralFieldKey) {
              return null;
            }

            const value = resolveFieldValue(record, key);

            if (
              value === null ||
              value === undefined ||
              value === "" ||
              typeof value === "object" ||
              typeof value === "function"
            ) {
              return null;
            }

            const label = getDetailLabel(key);
            const dedupeKey = label.toLowerCase();

            if (seenLabels.has(dedupeKey)) {
              return null;
            }

            seenLabels.add(dedupeKey);

            return { key, label, value: formatDetailValue(value) };
          })
          .filter(Boolean);

        return { title: section.title, rows };
      })
      .filter((section) => section.rows.length > 0);
  }, [record, sections, referralFieldKey]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
    >
      <DialogContent className="w-full max-w-full sm:max-w-2/3">
        {/* Domain accent strip */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-1 rounded-t-lg",
            domainClasses?.solid,
          )}
        />

        <DialogHeader>
          <DialogTitle>{type} Screening Details</DialogTitle>

          <DialogDescription>
            {studentName || "Screening record"}
            {campName ? ` - ${campName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {hasSections && sectionsWithRows.length > 0 ? (
          <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {/* Identity band */}
            {identityRows.length > 0 ? (
              <dl
                className={cn(
                  "sticky top-0 z-10 grid grid-cols-1 gap-2 rounded-lg p-2 sm:grid-cols-2 lg:grid-cols-4",
                  domainClasses?.soft,
                )}
              >
                {identityRows.map((row) => (
                  <div
                    key={row.label}
                    className={cn(
                      "rounded-lg border p-3 bg-card",
                      domainClasses?.border,
                    )}
                  >
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </dt>

                    <dd className="mt-1 break-words text-sm font-medium text-foreground">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {/* One structured card per screening section */}
            {sectionsWithRows.map((section) => (
              <section
                key={section.title}
                className={cn(
                  "rounded-xl border p-3",
                  domainClasses?.border,
                  domainClasses?.soft,
                )}
              >
                <h4
                  className={cn("text-sm font-semibold", domainClasses?.text)}
                >
                  {section.title}
                </h4>

                <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {section.rows.map((row) => (
                    <div
                      key={row.key}
                      className={cn(
                        "rounded-lg border bg-card p-3",
                        domainClasses?.chip,
                        domainClasses?.border,
                      )}
                    >
                      <dt
                        className={cn(
                          "text-xs font-medium uppercase tracking-wide",
                          domainClasses?.text ?? "text-muted-foreground",
                        )}
                      >
                        {row.label}
                      </dt>

                      <dd className="mt-1 break-words text-sm text-foreground">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        ) : detailRows.length > 0 ? (
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg border border-border p-3"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </dt>

                  <dd className="mt-1 break-words text-sm text-foreground">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No additional details available for this record.
          </p>
        )}

        {/* Referral-only editing for the primary doctor. */}
        {record ? (
          <ScreeningReferralField
            key={`referral-${String(record?.id ?? record?.record_id ?? "record")}`}
            record={record}
            screeningKey={screeningKey}
            onSaved={(updated) => {
              onRecordUpdated?.(updated);
              onClose?.();
            }}
            onClose={onClose}
          />
        ) : null}

        {/* {record ? (
          <ScreeningNotesField
            key={String(record?.id ?? record?.record_id ?? "record")}
            record={record}
            type={type}
            screeningKey={screeningKey}
          />
        ) : null} */}
      </DialogContent>
    </Dialog>
  );
}

function ScreeningTable({
  data,
  campEvent,
  type,
  pagination,
  isLoading,
  pageSize,
  onPageChange,
  onPageSizeChange,
  activeTab,
  filterActive = false,
  activeFilterLabel = "",
}) {
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleRecordUpdated = (updatedRecord) => {
    setSelectedRecord((prev) => {
      if (!prev) return prev;

      const prevId = prev?.id ?? prev?.record_id;
      const nextId = updatedRecord?.id ?? updatedRecord?.record_id;

      if (prevId !== nextId) return prev;

      return { ...prev, ...updatedRecord };
    });
  };

  const campId = campEvent?.id ?? campEvent?.campId ?? "all-camps";
  const screeningName = type.toLowerCase();
  const domainClasses = SCREENING_DOMAIN_CLASSES[activeTab];
  const pageSizeChoices = Array.from(
    new Set(
      [10, 30, 50, 100, Number(pagination?.pageSize)].filter(
        (size) => Number(size) > 0,
      ),
    ),
  ).sort((a, b) => a - b);

  return (
    <div
      className={cn(
        "mt-3 w-full min-w-0 overflow-hidden border-t-2 pt-3",
        domainClasses?.border,
      )}
    >
      <DataTable
        key={`${campId}-${type}`}
        columns={columns}
        data={data}
        enableSorting
        pageSizeOptions={pageSizeChoices}
        serverPagination={{
          page: pagination?.page ?? 1,
          pageSize: pagination?.pageSize || pageSize,
          totalRows: pagination?.totalRows || data.length,
          totalPages: pagination?.totalPages || 1,
          isLoading,
          onPageChange,
          onPageSizeChange,
        }}
        emptyMessage={
          filterActive
            ? `No ${screeningName} screening records match ${activeFilterLabel || "the selected filters"} at this camp.`
            : campEvent
              ? `No ${screeningName} screening records for this camp yet.`
              : "Select a camp to load its screening records."
        }
        onRowClick={(record) => setSelectedRecord(record)}
        className="w-full min-w-0"
        // Phones keep readable column widths and scroll the table itself
        // (inside the card); from `md` up the table fits the card again.
        tableClassName="min-w-[640px] md:min-w-0"
      />
      <ScreeningDetailModal
        record={selectedRecord}
        type={type}
        campEvent={campEvent}
        onClose={() => setSelectedRecord(null)}
        activeTab={activeTab}
        onRecordUpdated={handleRecordUpdated}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function PrimaryDoctorTab({
  event,
  camp,
  classFilter = "all",
  sectionFilter = "all",
}) {
  const [screeningTab, setScreeningTab] = useState("general");
  const campEvent = event ?? camp ?? null;
  const campId =
    String(campEvent?.id ?? campEvent?.campId ?? "").slice(0, -1) ??
    campEvent?.campId ??
    "";
  console.log(campId, "campIdssssss");

  const {
    campScreeningRecords = [],
    campVisionScreeningRecords = [],
    campDentalScreeningRecords = [],
    campHearingScreeningRecords = [],
    campEntScreeningRecords = [],

    isLoading: generalLoading,
    visionLoading,
    dentalLoading,
    hearingLoading,
    entLoading,

    screeningPagination,
    screeningPageSize,
    goToScreeningPage,
    setScreeningPageSize,
  } = useAllScreeningReport({
    campId,

    classFilter,
    sectionFilter,
  });

  console.log(campDentalScreeningRecords, "campDentalScreeningRecords");

  /* ------------------------------------------------------------------------ */
  /* Camp Information                                                         */
  /* ------------------------------------------------------------------------ */

  const primaryDoctorId = getCampPrimaryDoctorId(campEvent);

  const doctorIds = getCampDoctorIds(campEvent);

  const campName = getCampName(campEvent) || "No camp selected";

  const campDateLabel = formatCampDate(getCampDate(campEvent));
  console.log(screeningTab, "setScreeningTab");

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  const isLoading =
    generalLoading ||
    visionLoading ||
    dentalLoading ||
    hearingLoading ||
    entLoading;

  const filterActive =
    isFilterActive(classFilter) || isFilterActive(sectionFilter);

  const screenings = useMemo(() => {
    const applyStudentFilter = (rows) => {
      const list = Array.isArray(rows) ? rows : [];
      if (!filterActive) {
        return list;
      }

      return list.filter((record) =>
        matchesStudentFilter(record, classFilter, sectionFilter),
      );
    };

    const filteredPagination = (pagination, visibleCount) => {
      if (!filterActive) {
        return pagination;
      }

      const pageSize = Number(pagination?.pageSize) || screeningPageSize;

      return {
        ...pagination,
        totalRows: visibleCount,
        totalPages: Math.max(1, Math.ceil(visibleCount / pageSize)),
      };
    };

    const filteredGeneral = applyStudentFilter(campScreeningRecords);
    const filteredVision = applyStudentFilter(campVisionScreeningRecords);
    const filteredDental = applyStudentFilter(campDentalScreeningRecords);
    const filteredHearing = applyStudentFilter(campHearingScreeningRecords);
    const filteredEnt = applyStudentFilter(campEntScreeningRecords);

    console.log(filteredGeneral, "filteredGeneral");
    console.log(campScreeningRecords, "campScreeningRecords");

    return [
      {
        value: "general",
        label: "General Screening",
        type: "General",
        icon: Activity,
        data: filteredGeneral,
        pagination: filteredPagination(
          screeningPagination?.general,
          filteredGeneral.length,
        ),
        loading: generalLoading,
      },
      {
        value: "vision",
        label: "Vision Screening",
        type: "Vision",
        icon: Eye,
        data: filteredVision,
        pagination: filteredPagination(
          screeningPagination?.vision,
          filteredVision.length,
        ),
        loading: visionLoading,
      },
      {
        value: "dental",
        label: "Dental Screening",
        type: "Dental",
        icon: ToothIcon,
        data: filteredDental,
        pagination: filteredPagination(
          screeningPagination?.dental,
          filteredDental.length,
        ),
        loading: dentalLoading,
      },
      {
        value: "hearing",
        label: "Hearing Screening",
        type: "Hearing",
        icon: Ear,
        data: filteredHearing,
        pagination: filteredPagination(
          screeningPagination?.hearing,
          filteredHearing.length,
        ),
        loading: hearingLoading,
      },
      {
        value: "ent",
        label: "ENT Screening",
        type: "ENT",
        icon: Heart,
        data: filteredEnt,
        pagination: filteredPagination(
          screeningPagination?.ent,
          filteredEnt.length,
        ),
        loading: entLoading,
      },
    ];
  }, [
    campScreeningRecords,
    campVisionScreeningRecords,
    campDentalScreeningRecords,
    campHearingScreeningRecords,
    campEntScreeningRecords,
    screeningPagination,
    screeningPageSize,
    generalLoading,
    visionLoading,
    dentalLoading,
    hearingLoading,
    entLoading,
    filterActive,
    classFilter,
    sectionFilter,
  ]);

  console.log(screenings, "screenings");

  /* ------------------------------------------------------------------------ */
  /* Filter summary (shown next to the section heading)                        */
  /* ------------------------------------------------------------------------ */

  const loadedRecordCount =
    (campScreeningRecords?.length ?? 0) +
    (campVisionScreeningRecords?.length ?? 0) +
    (campDentalScreeningRecords?.length ?? 0) +
    (campHearingScreeningRecords?.length ?? 0) +
    (campEntScreeningRecords?.length ?? 0);

  const visibleRecordCount = screenings.reduce(
    (total, item) => total + (item.data?.length ?? 0),
    0,
  );

  const activeFilterLabel = [
    isFilterActive(classFilter) ? `Class ${classFilter}` : null,
    isFilterActive(sectionFilter) ? `Section ${sectionFilter}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Primary Doctor */}
      <section className="w-full min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4 md:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-10">
            <Stethoscope className="size-4 sm:size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Primary Doctor
            </h2>

            <p className="mt-0.5 break-words text-xs text-muted-foreground sm:text-sm">
              {campName}
              {campDateLabel && ` - ${campDateLabel}`}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid w-full grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2">
          <InfoTile icon={UserRound} label="Primary Doctor ID">
            {primaryDoctorId ?? (
              <span className="text-muted-foreground">Not assigned</span>
            )}
          </InfoTile>

          <InfoTile icon={CalendarDays} label="Assigned Doctors">
            {doctorIds.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {doctorIds.map((id) => (
                  <span
                    key={id}
                    className="max-w-full break-all rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-primary"
                  >
                    {id}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">Not assigned</span>
            )}
          </InfoTile>
        </dl>
      </section>

      {/* Screening Records */}
      <section className="w-full min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4 md:p-5">
        {/* Header */}
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="min-w-0 text-sm font-semibold text-foreground">
            Screening Records at This Camp
          </h3>

          {filterActive ? (
            <p className="break-words text-xs text-muted-foreground sm:text-right">
              {activeFilterLabel} — showing {visibleRecordCount} of{" "}
              {loadedRecordCount} loaded
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Loading screening records…
          </p>
        ) : (
          <Tabs
            value={screeningTab}
            onValueChange={setScreeningTab}
            className="mt-3 w-full min-w-0"
          >
            {/* Tabs */}
            {/* No scroll container here: overflow used to render the global
                styled scrollbar as a stray bar under the tabs. The tabs now
                share the available width instead of overflowing. */}
            <div className="w-full min-w-0">
              <TabsList
                className="
            flex h-auto w-full gap-1 p-1
            sm:grid sm:grid-cols-3
            lg:grid-cols-5
          "
              >
                {screenings.map(({ value, label, icon: Icon, data }) => {
                  const tabDomainClasses = SCREENING_DOMAIN_CLASSES[value];

                  return (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className={cn(
                        `flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden px-1.5 py-2 text-xs sm:gap-2 sm:px-3 sm:text-sm`,
                        screeningTab === value && tabDomainClasses?.soft,
                        screeningTab === value && tabDomainClasses?.text,
                      )}
                    >
                      <Icon className="size-3.5 shrink-0 sm:size-4" />
                      <span className="min-w-0 truncate hidden md:inline">
                        {label}
                      </span>
                      <span
                        className={cn(
                          `shrink-0 rounded-full px-1 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-xs`,
                          tabDomainClasses?.chip ?? "bg-muted text-primary",
                        )}
                      >
                        {data.length}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tab Content */}
            {screenings.map(({ value, type, data, pagination, loading }) => (
              <TabsContent
                key={value}
                value={value}
                className="mt-3 w-full min-w-0 max-w-full overflow-hidden"
              >
                {/*
                 * Only needs to stop the ancestors from growing; the
                 * horizontal scrolling happens inside the DataTable card.
                 */}
                <div className="w-full min-w-0 max-w-full">
                  <ScreeningTable
                    data={data}
                    campEvent={campEvent}
                    type={type}
                    pagination={pagination}
                    isLoading={loading}
                    pageSize={screeningPageSize}
                    onPageSizeChange={setScreeningPageSize}
                    onPageChange={(page) => goToScreeningPage(value, page)}
                    activeTab={screeningTab}
                    filterActive={filterActive}
                    activeFilterLabel={activeFilterLabel}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </section>
    </div>
  );
}
