'use client';

import React from "react";
import { useSelector } from "react-redux";

import { getRoleFromAccount, getRoleFromTypeId } from "@/lib/user-role";

import StudentOverviewCharts from "./student-overview-charts";



const resolveEffectiveRole = ({ account, user, account_type, role }) => {
  const namedRole = [account_type, role].find(
    (value) =>
      typeof value === "string" &&
      value.trim() &&
      value.trim().toLowerCase() !== "staff",
  );

  if (namedRole) {
    return getRoleFromTypeId(namedRole) || namedRole.trim().toLowerCase();
  }

  return getRoleFromAccount(account) || getRoleFromAccount(user) || "";
};

const MasterDashboard = () => {
  const { user: authUser, account, account_type, role } = useSelector(
    (state) => state.auth,
  );

  const effectiveRole = resolveEffectiveRole({
    account,
    user: authUser,
    account_type,
    role,
  });

  const checkDoctor = effectiveRole === "doctor";
  const isAdmin = effectiveRole === "admin";

  console.log({ effectiveRole, authUser }, "MasterDashboard");

  if (checkDoctor || isAdmin) {
    return <StudentOverviewCharts user={authUser} />;
  }

  return <div>Welcome, user</div>;
};

export default MasterDashboard;