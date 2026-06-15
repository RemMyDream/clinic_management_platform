// pages/Dashboard.tsx
import React from 'react';

import { Routes, Route } from 'react-router-dom';

import {UserRole} from '../types/UserType'; // Adjust the import path as necessary

import BaseDashboard from '../components/layout/BaseDashboard';
import DoctorDashboard from '../components/dashboards/DoctorDashboard';
import PatientDashboard from '../components/dashboards/PatientDashboard';
import StaffDashboard from '../components/dashboards/StaffDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import BookAppointment from '../components/appointment/BookAppointment';
import ScheduleAppointment from '../components/appointment/ScheduleAppointment';
import PatientSearch from '../components/patients/PatientSearch';
import MyAppointment from '../components/appointment/ViewAppointment';
import DoctorSchedule from '../components/appointment/DoctorSchedule';
import CreateEMR from '../components/EMR/CreateEMR';
import UserManagement from '../components/admin/UserManagement';
import ReportsAnalytics from '../components/admin/ReportsAnalytics';
import SystemLogs from '../components/admin/SystemLogs';
import ScheduleSettings from '../components/admin/ScheduleSettings';
import MedicalHistory from '../components/medical/MedicalHistory';
import MedicalReportsManagement from '../components/medical/MedicalReportsManagement';
import Prescriptions from '../components/medical/Prescriptions';
import CheckInOut from '../components/staff/CheckInOut';
import Billing from '../components/staff/Billing';

type Props = {
  role: UserRole;
};

/**
 * Dashboard component renders the appropriate dashboard layout
 * based on the user's role. It supports roles such as 'doctor', 'patient',
 * 'staff', and 'admin'.
 */
const Dashboard: React.FC<Props> = ({ role }) => {
  const renderDashboard = () => {
    const dashboardMap: Record<Props['role'], React.ReactNode> = {
      DOCTOR: <DoctorDashboard />,
      PATIENT: <PatientDashboard />,
      CLINIC_STAFF: <StaffDashboard />,
      ADMIN: <AdminDashboard />,
    };

    if (!dashboardMap[role]) {
      console.warn(`Unsupported role encountered: ${role}`);
      return null;
    }

    return dashboardMap[role];
  };

  return (
    <BaseDashboard role={role}>
      <Routes>
        <Route path="/" element={renderDashboard()} />
        <Route path="appointments/book" element={<BookAppointment />} />
        <Route path="appointments/schedule" element={<ScheduleAppointment />} />
        <Route path="patients" element={<PatientSearch />} />
        <Route path="appointments" element={<MyAppointment />} />
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="medical-history" element={<MedicalHistory />} />
        <Route path="records" element={<MedicalHistory />} />
        <Route path="medical-reports" element={<MedicalReportsManagement />} />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route path="create_records" element={<CreateEMR />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="logs" element={<SystemLogs />} />
        <Route path="schedule-settings" element={<ScheduleSettings />} />
        <Route path="checkin" element={<CheckInOut />} />
        <Route path="billing" element={<Billing />} />
      </Routes>
    </BaseDashboard>
  );
};

export default Dashboard;
