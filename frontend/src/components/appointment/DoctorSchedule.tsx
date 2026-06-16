import React, { useState, useEffect, useCallback } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { CircularProgress, Box, Modal } from '@mui/material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import styles from './DoctorSchedule.module.css';
import { appointmentApi, patientApi } from '../../services/api';

type Appointment = {
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  appointment_id: number;
  status: string;
  patientName?: string;
};

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Scheduled: 'Đã lên lịch',
  Completed: 'Hoàn thành',
  Canceled: 'Đã hủy',
  'No Show': 'Vắng mặt',
};

const STATUS_BADGE: Record<string, string> = {
  Pending: styles.statusWarning,
  Confirmed: styles.statusPrimary,
  Scheduled: styles.statusScheduled,
  Completed: styles.statusSuccess,
  Canceled: styles.statusError,
  'No Show': styles.statusDefault,
};

const DoctorSchedule = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getMyAppointments();
      const today = new Date().toISOString().split('T')[0];
      const upcoming = res.data.filter((a: Appointment) => a.appointment_day >= today);

      const enriched = await Promise.all(
        upcoming.map(async (a: Appointment) => {
          try {
            const p = await patientApi.getById(a.patient_id);
            return { ...a, patientName: p.data?.full_name || 'Bệnh nhân không xác định' };
          } catch {
            return { ...a, patientName: 'Bệnh nhân không xác định' };
          }
        })
      );

      enriched.sort((a: Appointment, b: Appointment) =>
        new Date(`${a.appointment_day}T${a.appointment_time}`).getTime() -
        new Date(`${b.appointment_day}T${b.appointment_time}`).getTime()
      );

      setAppointments(enriched);
    } catch {
      setError('Không thể tải danh sách lịch hẹn.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleAccept = async () => {
    if (!selectedAppointment) return;
    try {
      await appointmentApi.accept(selectedAppointment.appointment_id);
      toast.success('Đã chấp nhận lịch hẹn.');
      setModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể chấp nhận lịch hẹn.');
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()}`;
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  const filteredAppointments = appointments.filter((appointment) =>
      dayjs(appointment.appointment_day).isSame(selectedDate, 'day')
    );
  

  const appointmentDates = new Set(appointments.map((appointment) => appointment.appointment_day));

  const CustomDay = (props: PickersDayProps) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dateString = day.format('YYYY-MM-DD');
    const hasAppointment = appointmentDates.has(dateString);

    return (
      <PickersDay
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        {...other}
        sx={hasAppointment && !outsideCurrentMonth ? {
          backgroundColor: '#f57c00 !important',
          color: '#fff !important',
          fontWeight: 700,
          '&:hover': { backgroundColor: '#ef6c00 !important' },
          '&.Mui-selected': { backgroundColor: '#e65100 !important' },
        } : undefined}
      />
    );
  };

  const isAppointmentNow = (appointment: Appointment) => {
    const now = dayjs();
    const appointmentStart = dayjs(`${appointment.appointment_day}T${appointment.appointment_time}`);
    const oneHourBefore = appointmentStart.subtract(1, 'hour');
    const oneHourAfter = appointmentStart.add(1, 'hour');
    return now.isAfter(oneHourBefore) && now.isBefore(oneHourAfter);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={styles.appointmentsContainer}>
        <h1 className={styles.appointmentsHeader}>Lịch bác sĩ</h1>

        {loading ? (
          <div className={styles.loadingSpinner}>
            <CircularProgress />
            <p>Đang tải...</p>
          </div>
        ) : (
          <DateCalendar
            value={selectedDate}
            onChange={(newValue) => {
              if (newValue) setSelectedDate(newValue);
            }}
            views={['year', 'month', 'day']}
            slots={{ day: CustomDay }}
          />
        )}

        {!loading && filteredAppointments.length > 0 ? (
          <table className={styles.appointmentsTable}>
            <thead>
              <tr>
                <th>Giờ</th>
                <th>Bệnh nhân</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr
                  key={appointment.appointment_id}
                  onClick={() => handleAppointmentClick(appointment)}
                  className={
                    isAppointmentNow(appointment) ? styles.currentAppointmentRow : styles.clickableRow
                  }
                >
                  <td>{appointment.appointment_time}</td>
                  <td>{appointment.patientName}</td>
                  <td>{appointment.reason}</td>
                  <td>
                    <span className={`${styles.modalStatus} ${STATUS_BADGE[appointment.status] || styles.statusDefault}`}>
                      {STATUS_LABEL[appointment.status] || appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <p className={styles.noAppointments}>Không có lịch hẹn nào trong ngày này.</p>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Box className={styles.appointmentModal}>
            {selectedAppointment && (
              <>
                <div className={styles.modalHeader}>
                  <span className={styles.modalHeaderIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </span>
                  <h2 className={styles.modalTitle}>Chi tiết lịch hẹn</h2>
                </div>

                <div className={styles.modalInfo}>
                  <div className={styles.modalRow}>
                    <span className={`${styles.modalIcon} ${styles.icGreen}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    <div className={styles.modalText}>
                      <span className={styles.modalLabel}>Bệnh nhân</span>
                      <span className={styles.modalValue}>{selectedAppointment.patientName}</span>
                    </div>
                  </div>
                  <div className={styles.modalRow}>
                    <span className={`${styles.modalIcon} ${styles.icBlue}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </span>
                    <div className={styles.modalText}>
                      <span className={styles.modalLabel}>Ngày khám</span>
                      <span className={styles.modalValue}>{formatDate(selectedAppointment.appointment_day)}</span>
                    </div>
                  </div>
                  <div className={styles.modalRow}>
                    <span className={`${styles.modalIcon} ${styles.icViolet}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </span>
                    <div className={styles.modalText}>
                      <span className={styles.modalLabel}>Giờ khám</span>
                      <span className={styles.modalValue}>{selectedAppointment.appointment_time}</span>
                    </div>
                  </div>
                  <div className={`${styles.modalRow} ${styles.modalRowLast}`}>
                    <span className={`${styles.modalIcon} ${styles.icBlue}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </span>
                    <div className={styles.modalText}>
                      <span className={styles.modalLabel}>Trạng thái</span>
                      <span className={`${styles.modalStatus} ${STATUS_BADGE[selectedAppointment.status] || styles.statusDefault}`}>
                        {STATUS_LABEL[selectedAppointment.status] || selectedAppointment.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedAppointment.status === 'Confirmed' && (
                  <div className={styles.modalActions}>
                    <button className={styles.acceptButton} onClick={handleAccept}>
                      Chấp nhận lịch hẹn
                    </button>
                  </div>
                )}

                {error && (
                  <div className={styles.modalActions}>
                    <p style={{ color: 'red', margin: 0 }}>{error}</p>
                  </div>
                )}
              </>
            )}
          </Box>
        </Modal>
      </div>
    </LocalizationProvider>
  );
};

export default DoctorSchedule;