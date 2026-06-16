import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { appointmentApi, patientApi, doctorApi } from '../../services/api';
import styles from './CheckInOut.module.css';

interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  status: string;
  patientName?: string;
  doctorName?: string;
}

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Scheduled: 'Đã lên lịch',
  Completed: 'Hoàn thành',
  Canceled: 'Đã hủy',
  'No Show': 'Vắng mặt',
};

const CheckInOut: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientQuery, setPatientQuery] = useState('');
  const [doctorQuery, setDoctorQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'completed'>('scheduled');

  const fetchTodayAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getAll(0, 200);
      const today = new Date().toISOString().split('T')[0];
      const todayAppts: Appointment[] = res.data.filter(
        (a: Appointment) => a.appointment_day === today
      );

      const enriched = await Promise.all(
        todayAppts.map(async (appt) => {
          try {
            const [patRes, docRes] = await Promise.all([
              patientApi.getById(appt.patient_id),
              doctorApi.getById(appt.doctor_id),
            ]);
            return {
              ...appt,
              patientName: patRes.data.full_name,
              doctorName: docRes.data.doctor_name,
            };
          } catch {
            return {
              ...appt,
              patientName: 'Bệnh nhân không xác định',
              doctorName: 'Bác sĩ không xác định',
            };
          }
        })
      );

      enriched.sort((a, b) =>
        new Date(`1970-01-01T${a.appointment_time}`).getTime() -
        new Date(`1970-01-01T${b.appointment_time}`).getTime()
      );

      setAppointments(enriched);
    } catch {
      toast.error('Không thể tải danh sách cuộc hẹn.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAppointments();
  }, [fetchTodayAppointments]);

  const handleComplete = async (appt: Appointment) => {
    try {
      await appointmentApi.complete(appt.appointment_id);
      toast.success(`${appt.patientName} đã hoàn thành khám!`);
      fetchTodayAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể cập nhật trạng thái.');
    }
  };

  const handleCancel = async (appt: Appointment) => {
    if (!window.confirm(`Hủy cuộc hẹn của ${appt.patientName}?`)) return;
    try {
      await appointmentApi.cancel(appt.appointment_id);
      toast.success('Đã hủy cuộc hẹn.');
      fetchTodayAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể hủy cuộc hẹn.');
    }
  };

  const filtered = appointments.filter((a) => {
    const matchPatient = (a.patientName || '').toLowerCase().includes(patientQuery.toLowerCase());
    const matchDoctor = (a.doctorName || '').toLowerCase().includes(doctorQuery.toLowerCase());
    const matchTab =
      activeTab === 'scheduled'
        ? (a.status === 'Scheduled' || a.status === 'Confirmed')
        : a.status === 'Completed';
    return matchPatient && matchDoctor && matchTab;
  });

  const scheduledCount = appointments.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;
  const canceledCount = appointments.filter((a) => a.status === 'Canceled').length;

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải cuộc hẹn...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Quản lý bệnh nhân hôm nay</h2>
        <p className={styles.subtitle}>Xem và cập nhật trạng thái cuộc hẹn</p>
      </div>

      {/* Statistics */}
      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <h4>Tổng cuộc hẹn</h4>
              <p className={styles.statNumber}>{appointments.length}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <h4>Đang chờ</h4>
              <p className={styles.statNumber}>{scheduledCount}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <h4>Hoàn thành</h4>
              <p className={styles.statNumber}>{completedCount}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statInfo}>
              <h4>Đã hủy</h4>
              <p className={styles.statNumber}>{canceledCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.searchContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Lọc theo bệnh nhân</label>
          <input
            type="text"
            placeholder="Nhập tên bệnh nhân..."
            value={patientQuery}
            onChange={(e) => setPatientQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Lọc theo bác sĩ</label>
          <input
            type="text"
            placeholder="Nhập tên bác sĩ..."
            value={doctorQuery}
            onChange={(e) => setDoctorQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'scheduled' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Đang chờ ({scheduledCount})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'completed' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Hoàn thành ({completedCount})
        </button>
      </div>

      {/* Appointments List */}
      <div className={styles.section}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Không tìm thấy cuộc hẹn nào</p>
          </div>
        ) : (
          <div className={styles.appointmentsList}>
            {filtered.map((appt) => (
              <div key={appt.appointment_id} className={styles.appointmentCard}>
                <div className={styles.appointmentInfo}>
                  <div className={styles.appointmentHeader}>
                    <h4>{appt.patientName}</h4>
                    <span className={`${styles.statusBadge} ${styles[`status${appt.status.replace(' ', '')}`] || styles.statusScheduled}`}>
                      {STATUS_LABEL[appt.status] || appt.status}
                    </span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Giờ:</span>
                      <span>{appt.appointment_time}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Bác sĩ:</span>
                      <span>{appt.doctorName}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Lý do:</span>
                      <span>{appt.reason}</span>
                    </div>
                  </div>
                </div>

                {(appt.status === 'Scheduled' || appt.status === 'Confirmed') && (
                  <div className={styles.appointmentActions}>
                    <button
                      className={styles.checkInButton}
                      onClick={() => handleComplete(appt)}
                    >
                      ✓ Hoàn thành
                    </button>
                    <button
                      className={styles.checkOutButton}
                      onClick={() => handleCancel(appt)}
                    >
                      Hủy lịch
                    </button>
                  </div>
                )}

                {appt.status === 'Completed' && (
                  <div className={styles.appointmentActions}>
                    <span className={styles.completedLabel}>✓ Đã hoàn thành</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInOut;
