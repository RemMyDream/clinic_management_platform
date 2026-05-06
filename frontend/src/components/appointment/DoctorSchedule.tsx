import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { Badge, CircularProgress, Box, Modal } from '@mui/material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import styles from './DoctorSchedule.module.css';
import { appointmentApi, patientApi } from '../../services/api';

type Appointment = {
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  appointment_id: number;
  patientName?: string;
};

const DoctorSchedule = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await appointmentApi.getMyAppointments();
        const today = new Date().toISOString().split('T')[0];
        const upcoming = res.data.filter((a: Appointment) => a.appointment_day >= today);

        const enriched = await Promise.all(
          upcoming.map(async (a: Appointment) => {
            try {
              const p = await patientApi.getById(a.patient_id);
              return { ...a, patientName: p.data.full_name };
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
    };

    fetchAppointments();
  }, []);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  const filteredAppointments = appointments.filter((appointment) =>
      dayjs(appointment.appointment_day).isSame(selectedDate, 'day')
    );
  

  const appointmentDates = appointments.map((appointment) => appointment.appointment_day);

  const CustomDay = (props: PickersDayProps) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dateString = day.format('YYYY-MM-DD');
    const hasAppointment = appointmentDates.includes(dateString);

    return (
      <Badge
        key={dateString}
        overlap="circular"
        badgeContent={hasAppointment ? <span className={styles.appointmentDot} /> : undefined}
      >
        <PickersDay day={day} outsideCurrentMonth={outsideCurrentMonth} {...other} />
      </Badge>
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
                  <p><strong>Ngày:</strong> {selectedAppointment.appointment_day}</p>
                  <p><strong>Giờ:</strong> {selectedAppointment.appointment_time}</p>

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