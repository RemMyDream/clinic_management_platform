import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StaffDashboard.module.css';
import { appointmentApi, patientApi, doctorApi } from '../../services/api';

type Appointment = {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  status: string;
  patientName?: string;
  doctorName?: string;
};

const STATUS_LABEL: Record<string, string> = {
  Scheduled: 'Đã lên lịch',
  Completed: 'Hoàn thành',
  Canceled: 'Đã hủy',
  'No Show': 'Vắng mặt',
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ todayAppointments: 0, totalPatients: 0, pendingCheckIns: 0, completedToday: 0 });
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
        const todayAppointments: Appointment[] = apptRes.data.filter(
          (a: Appointment) => a.appointment_day === today
        );

        const enriched = await Promise.all(
          todayAppointments.map(async (a: Appointment) => {
            try {
              const [patRes, docRes] = await Promise.all([
                patientApi.getById(a.patient_id),
                doctorApi.getById(a.doctor_id),
              ]);
              return { ...a, patientName: patRes.data.full_name, doctorName: docRes.data.doctor_name };
            } catch {
              return { ...a, patientName: 'Bệnh nhân không xác định', doctorName: 'Bác sĩ không xác định' };
            }
          })
        );

        enriched.sort((a, b) =>
          new Date(`1970-01-01T${a.appointment_time}`).getTime() -
          new Date(`1970-01-01T${b.appointment_time}`).getTime()
        );

        setAppointments(enriched);
        setStats({
          todayAppointments: enriched.length,
          totalPatients: patientsRes.data.length,
          pendingCheckIns: enriched.filter((a) => a.status === 'Scheduled').length,
          completedToday: enriched.filter((a) => a.status === 'Completed').length,
        });
      } catch {
        setError('Không thể tải dữ liệu bảng điều khiển.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    { title: 'Lên lịch cuộc hẹn', description: 'Đặt cuộc hẹn cho bệnh nhân', icon: '📅', action: () => navigate('/dashboard/appointments/schedule'), color: '#3498db' },
    { title: 'Tìm kiếm bệnh nhân', description: 'Tìm và xem hồ sơ bệnh nhân', icon: '🔍', action: () => navigate('/dashboard/patients'), color: '#27ae60' },
    { title: 'Check-in bệnh nhân', description: 'Quản lý việc check-in của bệnh nhân', icon: '✅', action: () => navigate('/dashboard/checkin'), color: '#f39c12' },
  ];

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải bảng điều khiển...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Bảng điều khiển nhân viên</h2>
        <p className={styles.subtitle}>Quản lý hoạt động phòng khám và chăm sóc bệnh nhân</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsGrid}>
        {[
          { icon: '📅', label: 'Cuộc hẹn hôm nay', value: stats.todayAppointments },
          { icon: '👥', label: 'Tổng số bệnh nhân', value: stats.totalPatients },
          { icon: '⏳', label: 'Chờ check-in', value: stats.pendingCheckIns },
          { icon: '✅', label: 'Hoàn thành hôm nay', value: stats.completedToday },
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
        <h3 className={styles.sectionTitle}>Lịch hôm nay</h3>
        {appointments.length === 0 ? (
          <div className={styles.emptyState}><p>Không có cuộc hẹn nào được lên lịch cho hôm nay</p></div>
        ) : (
          <div className={styles.appointmentsTable}>
            <div className={styles.tableHeader}>
              <div>Thời gian</div>
              <div>Bệnh nhân</div>
              <div>Bác sĩ</div>
              <div>Lý do</div>
              <div>Trạng thái</div>
            </div>
            {appointments.map((a) => (
              <div key={a.appointment_id} className={styles.tableRow}>
                <div className={styles.timeCell}>{a.appointment_time}</div>
                <div>{a.patientName}</div>
                <div>{a.doctorName}</div>
                <div className={styles.reasonCell}>{a.reason}</div>
                <div>
                  <span className={styles.statusPending}>{STATUS_LABEL[a.status] || a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
