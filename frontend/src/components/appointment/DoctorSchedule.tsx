import React, { useState, useEffect, useCallback } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { CircularProgress, Box, Modal, Chip } from '@mui/material';
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

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  Pending: 'warning',
  Confirmed: 'primary',
  Scheduled: 'success',
  Completed: 'success',
  Canceled: 'error',
  'No Show': 'warning',
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
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '16px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        backgroundColor: appointment.status === 'Confirmed' ? '#e3f2fd' : (appointment.status === 'Scheduled' ? '#e8f5e9' : '#f5f5f5'),
                        color: appointment.status === 'Confirmed' ? '#1976d2' : (appointment.status === 'Scheduled' ? '#2e7d32' : '#rgba(0, 0, 0, 0.87)'),
                      }}
                    >
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
            <h2>Thao tác với lịch hẹn</h2>
            {selectedAppointment && (
                <>
                  <p><strong>Bệnh nhân:</strong> {selectedAppointment.patientName}</p>
                  <p><strong>Ngày:</strong> {formatDate(selectedAppointment.appointment_day)}</p>
                  <p><strong>Giờ:</strong> {selectedAppointment.appointment_time}</p>
                  <p><strong>Trạng thái:</strong>{' '}
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '16px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        backgroundColor: selectedAppointment.status === 'Confirmed' ? '#e3f2fd' : '#f5f5f5',
                        color: selectedAppointment.status === 'Confirmed' ? '#1976d2' : '#rgba(0, 0, 0, 0.87)',
                      }}
                    >
                      {STATUS_LABEL[selectedAppointment.status] || selectedAppointment.status}
                    </span>
                  </p>

                  {selectedAppointment.status === 'Confirmed' && (
                    <Box mt={2}>
                      <button
                        className={styles.acceptButton}
                        onClick={handleAccept}
                      >
                        Chấp nhận lịch hẹn
                      </button>
                    </Box>
                  )}

                  {error && (
                  <Box mt={2} color="error.main">
                    <p style={{ color: 'red', margin: 0 }}>{error}</p>
                  </Box>
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