import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { CircularProgress, Modal, Box, Button, Chip } from '@mui/material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import { toast } from 'react-toastify';
import 'dayjs/locale/vi';
import { appointmentApi, doctorApi } from '../../services/api';
import './viewAppointment.css';

type Appointment = {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  appointment_day: string;
  reason: string;
  status: string;
  service?: string;
  doctorName?: string;
};

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  Pending: 'warning',
  Confirmed: 'primary',
  Scheduled: 'success',
  Completed: 'success',
  Canceled: 'error',
  'No Show': 'warning',
};

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Scheduled: 'Đã lên lịch',
  Completed: 'Hoàn thành',
  Canceled: 'Đã hủy',
  'No Show': 'Vắng mặt',
};

const ViewAppointment = () => {
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patient_id');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const formatDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()}`;
  };

  const mapService = (s?: string) => {
    if (!s || s === 'General Consultation') return 'Khám tổng quát';
    return s;
  };

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getMyAppointments();
      let appointmentsData = res.data;
      if (patientIdParam) {
        appointmentsData = appointmentsData.filter(
          (a: Appointment) => a.patient_id === parseInt(patientIdParam, 10)
        );
      }

      const enriched = await Promise.all(
        appointmentsData.map(async (a: Appointment) => {
          try {
            const docRes = await doctorApi.getById(a.doctor_id);
            return { ...a, doctorName: docRes.data?.doctor_name || 'Bác sĩ không xác định' };
          } catch {
            return { ...a, doctorName: 'Bác sĩ không xác định' };
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
  }, [patientIdParam]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const handleCancel = async () => {
    if (!selected) return;
    try {
      await appointmentApi.cancel(selected.appointment_id);
      toast.success('Đã hủy lịch hẹn.');
      setModalOpen(false);
      loadAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể hủy lịch hẹn.');
    }
  };

  const handleReschedule = async () => {
    if (!selected || !rescheduleDate || !rescheduleTime) return;
    try {
      await appointmentApi.update(selected.appointment_id, {
        appointment_day: rescheduleDate,
        appointment_time: rescheduleTime,
      });
      toast.success('Đã thay đổi lịch hẹn!');
      setModalOpen(false);
      setShowReschedule(false);
      loadAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể thay đổi lịch hẹn.');
    }
  };

  const fetchRescheduleSlots = async (dateStr: string) => {
    if (!selected) return;
    setLoadingSlots(true);
    setRescheduleSlots([]);
    setRescheduleTime('');
    try {
      const res = await appointmentApi.getAvailableSlots(dateStr);
      const times: string[] = res.data
        .flatMap((slot: any) =>
          slot.available_doctors
            .filter((d: any) => d.doctor_id === selected.doctor_id)
            .map(() => {
              const t = slot.datetime.split('T')[1];
              return t ? t.slice(0, 5) : '';
            })
        )
        .filter(Boolean);
      setRescheduleSlots(Array.from(new Set(times)).sort());
    } catch {
      setRescheduleSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const filteredByDay = appointments.filter((a) =>
    dayjs(a.appointment_day).isSame(selectedDate, 'day')
  );
  const appointmentDates = new Set(appointments.map((a) => a.appointment_day));

  const CustomDay = (props: PickersDayProps) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dateStr = day.format('YYYY-MM-DD');
    const has = appointmentDates.has(dateStr);
    return (
      <PickersDay
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        {...other}
        sx={has && !outsideCurrentMonth ? {
          backgroundColor: '#f57c00 !important',
          color: '#fff !important',
          fontWeight: 700,
          '&:hover': { backgroundColor: '#ef6c00 !important' },
          '&.Mui-selected': { backgroundColor: '#e65100 !important' },
        } : undefined}
      />
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <div className="appointments-container">
        <h1 className="appointments-header">Lịch hẹn của tôi</h1>

        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <div className="loading-spinner">
            <CircularProgress />
            <p>Đang tải...</p>
          </div>
        ) : (
          <DateCalendar
            value={selectedDate}
            onChange={(v: Dayjs | null) => { if (v) setSelectedDate(v); }}
            views={['year', 'month', 'day']}
            slots={{ day: CustomDay }}
          />
        )}

        {!loading && (
          filteredByDay.length > 0 ? (
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Giờ</th>
                  <th>Bác sĩ</th>
                  <th>Lý do</th>
                  <th>Dịch vụ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredByDay.map((a) => (
                  <tr
                    key={a.appointment_id}
                    onClick={() => { setSelected(a); setShowReschedule(false); setModalOpen(true); }}
                    className="clickable-row"
                  >
                    <td>{a.appointment_time}</td>
                    <td>{a.doctorName}</td>
                    <td>{a.reason}</td>
                    <td>{mapService(a.service)}</td>
                    <td>
                      <Chip
                        label={STATUS_LABEL[a.status] || a.status}
                        color={STATUS_COLOR[a.status] || 'default'}
                        size="small"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Không có lịch hẹn nào trong ngày này.</p>
          )
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Box className="appointment-modal">
            <h2>Chi tiết lịch hẹn</h2>
            {selected && (
              <>
                <p><strong>Bác sĩ:</strong> {selected.doctorName}</p>
                <p><strong>Ngày:</strong> {formatDate(selected.appointment_day)}</p>
                <p><strong>Giờ:</strong> {selected.appointment_time}</p>
                <p><strong>Dịch vụ:</strong> {mapService(selected.service)}</p>
                <p>
                  <strong>Trạng thái: </strong>
                  <Chip
                    label={STATUS_LABEL[selected.status] || selected.status}
                    color={STATUS_COLOR[selected.status] || 'default'}
                    size="small"
                  />
                </p>

                {['Pending', 'Confirmed', 'Scheduled'].includes(selected.status) && (
                  <Box display="flex" gap={2} mt={2} flexWrap="wrap">
                    <Button variant="contained" color="error" onClick={handleCancel}>
                      Hủy lịch hẹn
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setShowReschedule((v) => !v)}
                    >
                      {showReschedule ? 'Ẩn thay đổi lịch' : 'Thay đổi lịch'}
                    </Button>
                  </Box>
                )}

                {showReschedule && ['Pending', 'Confirmed', 'Scheduled'].includes(selected.status) && (
                  <div className="reschedule-section">
                    <h2 className="reschedule-title">Chọn lịch mới</h2>
                    <div className="form-group">
                      <label>Ngày mới</label>
                      <input
                        type="date"
                        min={dayjs().format('YYYY-MM-DD')}
                        value={rescheduleDate}
                        onChange={(e) => {
                          setRescheduleDate(e.target.value);
                          if (e.target.value) fetchRescheduleSlots(e.target.value);
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Giờ mới</label>
                      {loadingSlots ? (
                        <p style={{ color: '#888', fontSize: 14 }}>Đang tải giờ trống...</p>
                      ) : rescheduleDate && rescheduleSlots.length === 0 ? (
                        <p style={{ color: '#e53e3e', fontSize: 14 }}>Không có giờ trống cho ngày này.</p>
                      ) : (
                        <select value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)}>
                          <option value="" disabled>Chọn giờ</option>
                          {rescheduleSlots.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <button
                      className="confirm-button"
                      onClick={handleReschedule}
                      disabled={!rescheduleDate || !rescheduleTime}
                    >
                      Xác nhận thay đổi
                    </button>
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

export default ViewAppointment;
