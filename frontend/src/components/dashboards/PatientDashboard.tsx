import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatbotWidget from '../Chatbot/ChatbotWidget';
import styles from './PatientDashboard.module.css';
import { appointmentApi, prescriptionApi, doctorApi } from '../../services/api';

type Appointment = {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  status?: string;
  doctorName?: string;
};

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPrescriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const patientId = Number(localStorage.getItem('user_id'));
      const today = new Date().toISOString().split('T')[0];
      const [apptRes, prescRes] = await Promise.all([
        appointmentApi.getMyAppointments(),
        patientId ? prescriptionApi.getByPatient(patientId) : Promise.resolve({ data: [] }),
      ]);

      const allAppts: Appointment[] = apptRes.data;
      const todayAppts = allAppts.filter((a) => a.appointment_day === today);

      const upcoming = allAppts.filter((a) => {
        const d = new Date(a.appointment_day);
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        return d >= todayStart && a.status === 'Scheduled';
      }).length;

      const completed = allAppts.filter((a) => a.status === 'Completed').length;

      // Enrich today's appointments with doctor names
      const enriched = await Promise.all(
        todayAppts.map(async (a) => {
          try {
            const res = await doctorApi.getById(a.doctor_id);
            return { ...a, doctorName: res.data.doctor_name };
          } catch {
            return { ...a, doctorName: 'Bác sĩ không xác định' };
          }
        })
      );

      setAppointments(enriched);
      setStats({
        todayAppointments: todayAppts.length,
        upcomingAppointments: upcoming,
        completedAppointments: completed,
        totalPrescriptions: prescRes.data.length,
      });
    } catch (err) {
      setError('Không thể tải dữ liệu bảng điều khiển.');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Đặt cuộc hẹn mới',
      description: 'Lên lịch cuộc hẹn mới với bác sĩ của bạn',
      icon: '📅',
      action: () => navigate('/dashboard/appointments/book'),
      color: '#3b82f6',
    },
    {
      title: 'Xem tiền sử bệnh án',
      description: 'Truy cập hồ sơ y tế đầy đủ của bạn',
      icon: '📋',
      action: () => navigate('/dashboard/medical-history'),
      color: '#10b981',
    },
    {
      title: 'Xem đơn thuốc',
      description: 'Kiểm tra đơn thuốc hiện tại của bạn',
      icon: '💊',
      action: () => navigate('/dashboard/prescriptions'),
      color: '#f59e0b',
    },
  ];

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải bảng điều khiển...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard Bệnh nhân</h2>
        <p className={styles.subtitle}>Quản lý cuộc hẹn và hồ sơ sức khỏe của bạn</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsGrid}>
        {[
          { icon: '📅', label: 'Cuộc hẹn hôm nay', value: stats.todayAppointments },
          { icon: '⏰', label: 'Cuộc hẹn sắp tới', value: stats.upcomingAppointments },
          { icon: '✅', label: 'Đã hoàn thành', value: stats.completedAppointments },
          { icon: '💊', label: 'Đơn thuốc', value: stats.totalPrescriptions },
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
            <div
              key={index}
              className={styles.actionCard}
              onClick={action.action}
              style={{ borderLeftColor: action.color }}
            >
              <div className={styles.actionIcon}>{action.icon}</div>
              <div className={styles.actionContent}>
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.gridLayout}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Lịch hẹn hôm nay</h3>
          {appointments.length === 0 ? (
            <div className={styles.emptyState}><p>Không có cuộc hẹn nào hôm nay</p></div>
          ) : (
            <div className={styles.appointmentsTable}>
              <div className={styles.tableHeader}>
                <div>Thời gian</div>
                <div>Bác sĩ</div>
                <div>Lý do</div>
                <div>Trạng thái</div>
              </div>
              {appointments.map((a) => (
                <div key={a.appointment_id} className={styles.tableRow}>
                  <div className={styles.timeCell}>{a.appointment_time}</div>
                  <div>{a.doctorName}</div>
                  <div className={styles.reasonCell}>{a.reason}</div>
                  <div className={styles.statusUpcoming}>{a.status || 'Đã lên lịch'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🤖 Trợ lý sức khỏe cá nhân</h3>
          <div className={styles.chatCard}>
            <p className={styles.chatDescription}>
              Trò chuyện với trợ lý AI để được hướng dẫn về sức khỏe, hỗ trợ cuộc hẹn và các câu hỏi y tế.
            </p>
            <div className={styles.flexGrow}>
              <ChatbotWidget
                userRole="PATIENT"
                isAuthenticated={true}
                position="inline"
                placeholder="Hỏi về sức khỏe, triệu chứng hoặc cuộc hẹn của bạn..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
