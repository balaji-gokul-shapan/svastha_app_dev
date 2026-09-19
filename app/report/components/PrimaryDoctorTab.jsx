"use client";

import { CalendarDays, Stethoscope, UserRound } from "lucide-react";

import { useAllScreeningReport } from "@/components/healthChecks/getScreeningReport";
import {
  formatCampDate,
  getCampDate,
  getCampDoctorIds,
  getCampName,
  getCampPrimaryDoctorId,
} from "@/lib/camp-utils";

// Field normalisation for the camp screening table rows.
const getRecordStudentName = (record) =>
  String(
    record?.student_name ??
      record?.student?.name ??
      record?.name ??
      record?.full_name ??
      "",
  ).trim();

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

function InfoTile({ icon: Icon, label, children }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export default function PrimaryDoctorTab({ event, camp }) {
  // ConsolidateReport passes the raw assigned event (doctor fields live on it)
  // plus the resolved camp.
  const campEvent = event ?? camp ?? null;
  // (`= []` guards against a stale/hot-reloaded hook that omits the field —
  // otherwise `.length` throws the way it just did.)
  const { campScreeningRecords = [], isLoading: screeningLoading } =
    useAllScreeningReport({
      campId: campEvent?.id ?? campEvent?.campId ?? "",
    });

  const primaryDoctorId = getCampPrimaryDoctorId(campEvent);
  const doctorIds = getCampDoctorIds(campEvent);
  const campName = getCampName(campEvent) || "No camp selected";
  const campDateLabel = formatCampDate(getCampDate(campEvent));

  return (
    <div className="space-y-4">
      {/* ---------------- PRIMARY DOCTOR ---------------- */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Stethoscope className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Primary Doctor
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {campName}
              {campDateLabel ? ` — ${campDateLabel}` : ""}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoTile icon={UserRound} label="Primary doctor id">
            {primaryDoctorId ?? (
              <span className="text-muted-foreground">Not assigned</span>
            )}
          </InfoTile>

          <InfoTile icon={CalendarDays} label="Assigned doctors">
            {doctorIds.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {doctorIds.map((id) => (
                  <span
                    key={id}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                  >
                    {id}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </InfoTile>
        </dl>
      </div>

      {/* ------- STUDENTS SCREENED AT THE SELECTED CAMP ------- */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Students screened at this camp
          </h3>
          {!screeningLoading && campScreeningRecords.length > 0 ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {campScreeningRecords.length}
            </span>
          ) : null}
        </div>

        {screeningLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Loading screening records…
          </p>
        ) : campScreeningRecords.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Student</th>
                  <th className="py-2 pr-3 font-medium">Student id</th>
                  <th className="py-2 pr-3 font-medium">Record id</th>
                  <th className="py-2 font-medium">Screened at</th>
                </tr>
              </thead>
              <tbody>
                {campScreeningRecords.map((record, index) => {
                  const recordId = String(
                    record?.id ?? record?.record_id ?? "",
                  ).trim();

                  return (
                    <tr
                      key={recordId || `record-${index}`}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-2 pr-3 font-medium text-foreground">
                        {getRecordStudentName(record) || "—"}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {getRecordStudentId(record) || "—"}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {recordId || "—"}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {formatCampDate(
                          record?.created_at ?? record?.createdAt,
                        ) ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {campEvent
              ? "No general screening records for this camp yet."
              : "Select a camp to load its screening records."}
          </p>
        )}
      </div>
    </div>
  );
}
