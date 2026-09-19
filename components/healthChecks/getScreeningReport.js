"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppDispatch } from "@/lib/hooks";
import { getAllScreeningRecord } from "@/lib/features/registerGeneralScreening";

/*
 
 */
export const useAllScreeningReport = ({ getId = "", campId = "" } = {}) => {
  const dispatch = useAppDispatch();

  const studentId = String(getId ?? "").trim();
  const selectedCampId = String(campId ?? "").trim();

  const {
    data: screeningReportPayload,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["general-screening-report"],
    queryFn: () => dispatch(getAllScreeningRecord()).unwrap(),
    staleTime: 60_000,
  });


  const allScreeningRecords = useMemo(() => {
    if (Array.isArray(screeningReportPayload)) return screeningReportPayload;
    if (Array.isArray(screeningReportPayload?.data)) {
      return screeningReportPayload.data;
    }
    if (Array.isArray(screeningReportPayload?.data?.data)) {
      return screeningReportPayload.data.data;
    }
    return [];
  }, [screeningReportPayload]);

  // ALL screening records belonging to ONE camp. Each record carries `camp_id`
  // (set when the screening is created), so once a camp is selected the
  // consumer gets every student's record for that camp — no student id needed.
  const campScreeningRecords = useMemo(() => {
    if (!selectedCampId) return [];

    return allScreeningRecords.filter((record) => {
      const recordCampKeys = [
        record?.camp_id,
        record?.campId,
        record?.medical_event_id,
        record?.medicalEventId,
        record?.event_id,
        record?.eventId,
        record?.camp?.id,
        record?.camp?.camp_id,
      ]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);

      return recordCampKeys.includes(selectedCampId);
    });
  }, [allScreeningRecords, selectedCampId]);

  // Case-insensitive keys so a lowercased id still matches identifiers like
  // "STU-2401" (mirrors components/students/getScreeningRecord.js).
  const studentKeys = useMemo(
    () => new Set([studentId.toLowerCase()].filter(Boolean)),
    [studentId],
  );

  const generalScreeningRecord = useMemo(() => {
    if (!studentKeys.size || !allScreeningRecords.length) return null;

    // 1) Records belonging to this student.
    const studentMatches = allScreeningRecords.filter((record) => {
      const recordKeys = [
        record?.id,
        record?.cus_id,
        record?.CUS_ID,
        record?.student_cus_id,
        record?.student_id,
        record?.studentId,
        record?.school_registration_number,
        record?.admission_number,
        record?.student?.id,
        record?.student?.cus_id,
        record?.student?.school_registration_number,
        record?.student?.admission_number,
      ]
        .map((value) => String(value ?? "").trim().toLowerCase())
        .filter(Boolean);

      return recordKeys.some((key) => studentKeys.has(key));
    });

    if (!studentMatches.length) return null;

    // 2) When a camp is given, prefer records scoped to it — a student can be
    //    screened at several camps. Records without any camp field still count
    //    as matches (the backend list may not expose one).
    if (selectedCampId) {
      const campMatches = studentMatches.filter((record) => {
        const recordCampKeys = [
          record?.camp_id,
          record?.campId,
          record?.medical_event_id,
          record?.medicalEventId,
          record?.event_id,
          record?.eventId,
          record?.camp?.id,
          record?.camp?.camp_id,
        ]
          .map((value) => String(value ?? "").trim())
          .filter(Boolean);

        return recordCampKeys.includes(selectedCampId);
      });

      if (campMatches.length) return campMatches[0];
    }

    return studentMatches[0];
  }, [allScreeningRecords, studentKeys, selectedCampId]);

  return {
    allScreeningRecords,
    // Every record scoped to the selected camp — always an array, so consumers
    // can call .length directly.
    campScreeningRecords: campScreeningRecords ?? [],
    generalScreeningRecord,
    isLoading,
    error,
  };
};
