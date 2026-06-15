import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CircularProgress, Modal, Box, Chip } from '@mui/material';
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

const STATUS_BADGE: Record<string, string> = {
  Pending: 'apptm-badge-warning',
  Confirmed: 'apptm-badge-primary',
  Scheduled: 'apptm-badge-success',
  Completed: 'apptm-badge-success',
  Canceled: 'apptm-badge-error',
  'No Show': 'apptm-badge-warning',
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
            {selected && (
              <>
                <div className="apptm-header">
                  <span className="apptm-header-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11H3v10h6V11zM21 3h-6v18h6V3zM15 7H9v14h6V7z"/>
                    </svg>
                  </span>
                  <div className="apptm-header-text">
                    <h2 className="apptm-title">Chi tiết lịch hẹn</h2>
                    <span className={`apptm-status ${STATUS_BADGE[selected.status] || 'apptm-badge-default'}`}>
                      {STATUS_LABEL[selected.status] || selected.status}
                    </span>
                  </div>
                </div>

                <div className="apptm-info">
                  <div className="apptm-row">
                    <span className="apptm-ic ic-green">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    <div className="apptm-text">
                      <span className="apptm-label">Bác sĩ</span>
                      <span className="apptm-value">{selected.doctorName}</span>
                    </div>
                  </div>
                  <div className="apptm-row">
                    <span className="apptm-ic ic-blue">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </span>
                    <div className="apptm-text">
                      <span className="apptm-label">Ngày khám</span>
                      <span className="apptm-value">{formatDate(selected.appointment_day)}</span>
                    </div>
                  </div>
                  <div className="apptm-row">
                    <span className="apptm-ic ic-violet">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </span>
                    <div className="apptm-text">
                      <span className="apptm-label">Giờ khám</span>
                      <span className="apptm-value">{selected.appointment_time}</span>
                    </div>
                  </div>
                  <div className="apptm-row apptm-row-last">
                    <span className="apptm-ic ic-amber">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </span>
                    <div className="apptm-text">
                      <span className="apptm-label">Dịch vụ</span>
                      <span className="apptm-value">{mapService(selected.service)}</span>
                    </div>
                  </div>
                </div>

                {['Pending', 'Confirmed', 'Scheduled'].includes(selected.status) && (
                  <div className="apptm-actions">
                    <button className="apptm-btn apptm-btn-cancel" onClick={handleCancel}>
                      Hủy lịch hẹn
                    </button>
                    <button className="apptm-btn apptm-btn-reschedule" onClick={() => setShowReschedule((v) => !v)}>
                      {showReschedule ? 'Ẩn thay đổi lịch' : 'Thay đổi lịch'}
                    </button>
                  </div>
                )}

                {showReschedule && ['Pending', 'Confirmed', 'Scheduled'].includes(selected.status) && (
                  <div className="reschedule-section">
                    <h2 className="reschedule-title">Chọn lịch mới</h2>
                    <div className="form-group">
                      <label>Ngày mới</label>
                      <DatePicker
                        value={rescheduleDate ? dayjs(rescheduleDate) : null}
                        onChange={(v) => {
                          const str = v ? v.format('YYYY-MM-DD') : '';
                          setRescheduleDate(str);
                          if (str) fetchRescheduleSlots(str);
                        }}
                        format="DD/MM/YYYY"
                        minDate={dayjs()}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
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
