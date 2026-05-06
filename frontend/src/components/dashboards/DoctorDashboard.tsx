import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DoctorDashboard.module.css';
import { appointmentApi, patientApi, medicalReportApi } from '../../services/api';

type Appointment = {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  status: string;
  patientName?: string;
};

type DashboardStats = {
  todayAppointments: number;
  totalPatients: number;
  upcomingAppointments: number;
  completedToday: number;
  totalMedicalReports: number;
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalPatients: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    totalMedicalReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [apptRes, patientsRes] = await Promise.all([
          appointmentApi.getAll(0, 500),
          patientApi.getAll(0, 500),
        ]);

        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

        const todayAppointments: Appointment[] = apptRes.data
          .filter((a: Appointment) => a.appointment_day === today)
          .sort((a: Appointment, b: Appointment) =>
            new Date(`1970-01-01T${a.appointment_time}`).getTime() -
            new Date(`1970-01-01T${b.appointment_time}`).getTime()
          );

        const upcomingAppointments = apptRes.data.filter((a: Appointment) =>
          new Date(a.appointment_day) > todayStart
        ).length;

        const completedToday = todayAppointments.filter(
          (a: Appointment) => a.status === 'Completed'
        ).length;

        const enriched = await Promise.all(
          todayAppointments.map(async (a: Appointment) => {
            try {
              const res = await patientApi.getById(a.patient_id);
              return { ...a, patientName: res.data.full_name };
            } catch {
              return { ...a, patientName: 'Bệnh nhân không xác định' };
            }
          })
        );

        let totalMedicalReports = 0;
        try {
          const reportsRes = await medicalReportApi.getAll();
          totalMedicalReports = reportsRes.data.length;
        } catch {}

        setAppointments(enriched);
        setStats({
          todayAppointments: todayAppointments.length,
          totalPatients: patientsRes.data.length,
          upcomingAppointments,
          completedToday,
          totalMedicalReports,
        });
      } catch {
        setError('Không thể tải dữ liệu dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    { title: 'Xem lịch trình đầy đủ', description: 'Quản lý lịch hẹn của bạn', icon: '📅', action: () => navigate('/dashboard/schedule'), color: '#3498db' },
    { title: 'Tìm kiếm bệnh nhân', description: 'Tìm và xem hồ sơ bệnh nhân', icon: '👥', action: () => navigate('/dashboard/patients'), color: '#27ae60' },
    { title: 'Tạo hồ sơ y tế', description: 'Ghi chép cuộc tư vấn bệnh nhân', icon: '📝', action: () => navigate('/dashboard/create_records'), color: '#e74c3c' },
    { title: 'Báo cáo y tế', description: 'Quản lý báo cáo y tế của bạn', icon: '📊', action: () => navigate('/dashboard/medical-reports'), color: '#f39c12' },
    { title: 'Tiền sử bệnh án', description: 'Xem tiền sử y tế của bệnh nhân', icon: '📋', action: () => navigate('/dashboard/medical-history'), color: '#9b59b6' },
    { title: 'Đơn thuốc', description: 'Quản lý đơn thuốc bệnh nhân', icon: '💊', action: () => navigate('/dashboard/prescriptions'), color: '#1abc9c' },
  ];

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải dashboard...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Bảng điều khiển bác sĩ</h2>
        <p className={styles.subtitle}>Quản lý bệnh nhân và hoạt động y tế của bạn</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsGrid}>
        {[
          { icon: '📅', label: 'Lịch hẹn hôm nay', value: stats.todayAppointments },
          { icon: '👥', label: 'Tổng bệnh nhân', value: stats.totalPatients },
          { icon: '⏰', label: 'Lịch hẹn sắp tới', value: stats.upcomingAppointments },
          { icon: '✅', label: 'Hoàn thành hôm nay', value: stats.completedToday },
          { icon: '📊', label: 'Báo cáo y tế', value: stats.totalMedicalReports },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon}>{s.icon}</div>
            <div className={styles.statInfo}>
              <h3>{s.label}</h3>
              <p className={styles.statNumber}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Hành động nhanh</h3>
        <div className={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <div key={index} className={styles.actionCard} onClick={action.action} style={{ borderLeftColor: action.color }}>
              <div className={styles.actionIcon}>{action.icon}</div>
              <div className={styles.actionContent}>
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Lịch trình hôm nay</h3>
        {appointments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Không có lịch hẹn nào được lên lịch cho hôm nay.</p>
          </div>
        ) : (
          <div className={styles.appointmentsTable}>
            <div className={styles.tableHeader}>
              <div>Thời gian</div>
              <div>Bệnh nhân</div>
              <div>Lý do</div>
              <div>Trạng thái</div>
            </div>
            {appointments.map((a) => (
              <div key={a.appointment_id} className={styles.tableRow}>
                <div className={styles.timeCell}>{a.appointment_time}</div>
                <div>{a.patientName}</div>
                <div className={styles.reasonCell}>{a.reason}</div>
                <div>
                  <span className={
                    a.status === 'Completed' ? styles.statusCompleted :
                    a.status === 'Canceled' ? styles.statusCanceled :
                    styles.statusUpcoming
                  }>
                    {a.status === 'Completed' ? 'Hoàn thành' :
                     a.status === 'Canceled' ? 'Đã hủy' :
                     a.status === 'No Show' ? 'Vắng mặt' : 'Đã lên lịch'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
