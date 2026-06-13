import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ChatbotWidget from '../Chatbot/ChatbotWidget';
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
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Scheduled: 'Đã lên lịch',
  Completed: 'Hoàn thành',
  Canceled: 'Đã hủy',
  'No Show': 'Vắng mặt',
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ todayAppointments: 0, totalPatients: 0, pendingRequests: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [apptRes, patientsRes] = await Promise.all([
        appointmentApi.getAll(0, 500),
        patientApi.getAll(0, 500),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const allAppointments: Appointment[] = apptRes.data;
      const todayAppointments = allAppointments.filter(
        (a: Appointment) => a.appointment_day === today
      );
      const pending = allAppointments.filter((a: Appointment) => a.status === 'Pending');

      const enrichAll = async (list: Appointment[]) =>
        Promise.all(
          list.map(async (a: Appointment) => {
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

      const [enrichedToday, enrichedPending] = await Promise.all([
        enrichAll(todayAppointments),
        enrichAll(pending),
      ]);

      enrichedToday.sort((a, b) =>
        new Date(`1970-01-01T${a.appointment_time}`).getTime() -
        new Date(`1970-01-01T${b.appointment_time}`).getTime()
      );

      setAppointments(enrichedToday);
      setPendingAppointments(enrichedPending);
      setStats({
        todayAppointments: enrichedToday.length,
        totalPatients: patientsRes.data.length,
        pendingRequests: pending.length,
        completedToday: enrichedToday.filter((a) => a.status === 'Completed').length,
      });
    } catch {
      setError('Không thể tải dữ liệu bảng điều khiển.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleConfirm = async (appointmentId: number) => {
    try {
      await appointmentApi.confirm(appointmentId);
      toast.success('Đã xác nhận lịch hẹn.');
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể xác nhận lịch hẹn.');
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()}`;
  };

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
          { icon: '⏳', label: 'Yêu cầu chờ duyệt', value: stats.pendingRequests },
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

      {pendingAppointments.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Yêu cầu đặt lịch chờ duyệt ({pendingAppointments.length})</h3>
          <div className={styles.appointmentsTable}>
            <div className={styles.tableHeader}>
              <div>Ngày</div>
              <div>Giờ</div>
              <div>Bệnh nhân</div>
              <div>Bác sĩ</div>
              <div>Lý do</div>
              <div>Thao tác</div>
            </div>
            {pendingAppointments.map((a) => (
              <div key={a.appointment_id} className={styles.tableRow}>
                <div>{formatDate(a.appointment_day)}</div>
                <div className={styles.timeCell}>{a.appointment_time}</div>
                <div>{a.patientName}</div>
                <div>{a.doctorName}</div>
                <div className={styles.reasonCell}>{a.reason}</div>
                <div>
                  <button className={styles.confirmBtn} onClick={() => handleConfirm(a.appointment_id)}>
                    Xác nhận
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.gridLayout}>
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

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🤖 Trợ lý AI y tế</h3>
          <div className={styles.chatCard}>
            <p className={styles.chatDescription}>
              Trò chuyện với trợ lý AI phòng khám để được hỗ trợ thông tin y khoa, quy trình vận hành và tra cứu EMR bệnh nhân.
            </p>
            <div className={styles.flexGrow}>
              <ChatbotWidget
                userRole="CLINIC_STAFF"
                isAuthenticated={true}
                position="inline"
                placeholder="Hỏi về quy trình phòng khám hoặc nhập ID bệnh nhân..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
