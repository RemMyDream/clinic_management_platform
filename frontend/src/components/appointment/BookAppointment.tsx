import React, { useState, useEffect, useMemo } from 'react';
import { appointmentApi, doctorApi } from '../../services/api';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import './bookAppointment.css';

type FormData = {
  date: string;
  time: string;
  doctorId: number | null;
  reason: string;
};

type Doctor = {
  doctor_id: number;
  doctor_name: string;
  major: string;
  hospital_id: number;
};

type Slot = {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  doctorId: number;
};

type Filters = {
  service: string;
  dateFrom: Dayjs | null;
  dateTo: Dayjs | null;
};

const BookAppointment: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ date: '', time: '', doctorId: null, reason: '' });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [filters, setFilters] = useState<Filters>({ service: '', dateFrom: null, dateTo: null });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterDoctorIds, setFilterDoctorIds] = useState<number[]>([]);
  const [showDoctorFilter, setShowDoctorFilter] = useState(false);
  const [cellPopup, setCellPopup] = useState<{ date: string; time: string } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    doctorApi.getAll()
      .then((res) => setDoctors(res.data))
      .catch(() => setError('Không thể lấy danh sách bác sĩ.'));
  }, []);

  const slotDoctors = useMemo(() => {
    const map = new Map<number, string>();
    slots.forEach((s) => map.set(s.doctorId, s.doctorName));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [slots]);

  const filteredSlots = useMemo(() => {
    if (filterDoctorIds.length === 0) return slots;
    return slots.filter((s) => filterDoctorIds.includes(s.doctorId));
  }, [slots, filterDoctorIds]);

  const { uniqueDates, uniqueTimes, cellMap } = useMemo(() => {
    const dates = new Set<string>();
    const times = new Set<string>();
    const map = new Map<string, Slot[]>();
    filteredSlots.forEach((s) => {
      dates.add(s.date);
      times.add(s.time);
      const key = `${s.date}_${s.time}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    const allDates = new Set<string>();
    slots.forEach((s) => { allDates.add(s.date); times.add(s.time); });
    const sortedDates = Array.from(allDates).sort();
    const sortedTimes = Array.from(times).sort();
    return { uniqueDates: sortedDates, uniqueTimes: sortedTimes, cellMap: map };
  }, [filteredSlots, slots]);

  const fetchAvailableSlots = async () => {
    if (!filters.dateFrom || !filters.dateTo) {
      setError('Vui lòng chọn khoảng thời gian.');
      return;
    }
    if (filters.dateFrom.isBefore(dayjs(today))) {
      setError('Không thể đặt lịch trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.');
      return;
    }
    if (filters.dateFrom.isAfter(filters.dateTo)) {
      setError('Ngày bắt đầu phải trước ngày kết thúc.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const dateFromString = filters.dateFrom.format('YYYY-MM-DD');
      const dateToString = filters.dateTo.format('YYYY-MM-DD');
      const response = await appointmentApi.getAvailableRange(dateFromString, dateToString);
      const mapped: Slot[] = response.data.flatMap((slot: any) => {
        const [date, time] = slot.datetime.split('T');
        return slot.available_doctors.map((doctor: any) => ({
          id: `${slot.datetime}_${doctor.doctor_id}`,
          date,
          time: time.slice(0, 5),
          doctorName: doctor.doctor_name,
          doctorId: doctor.doctor_id,
        }));
      });
      setSlots(mapped);
      setFilterDoctorIds([]);
      setStep(2);
    } catch {
      setError('Không thể lấy lịch trống.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const user_id = Number(localStorage.getItem('user_id')) || null;
      await appointmentApi.book({
        patient_id: user_id,
        appointment_day: formData.date,
        appointment_time: formData.time,
        doctor_id: formData.doctorId,
        reason: formData.reason,
      });
      setSuccess('Yêu cầu đặt lịch đã được gửi. Vui lòng chờ nhân viên xác nhận.');
      setFormData({ date: '', time: '', doctorId: null, reason: '' });
      setStep(4);
    } catch {
      setError('Không thể đặt lịch khám. Vui lòng chọn lịch khám khác.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSlot) {
      setFormData({
        date: selectedSlot.date,
        time: selectedSlot.time,
        doctorId: selectedSlot.doctorId,
        reason: formData.reason,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot]);

  const formatDateLabel = (d: string) => {
    const dt = new Date(d);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${days[dt.getDay()]} ${dd}/${mm}`;
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T12:00:00');
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()}`;
  };

  const formatDateFull = (d: string) => {
    const dt = new Date(d + 'T12:00:00');
    const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${days[dt.getDay()]}, ${dd}/${mm}/${dt.getFullYear()}`;
  };

  return (
    <div className="appointment-page">
      <h1>Đặt lịch khám</h1>
      {error && <p className="error-message">{error}</p>}

      {step <= 3 && (
        <div className="step-indicator">
          {(['Chọn ngày', 'Chọn lịch', 'Xác nhận'] as const).map((label, i) => {
            const num = i + 1;
            const isDone = step > num;
            const isActive = step === num;
            return (
              <React.Fragment key={num}>
                {i > 0 && <div className={`step-line ${step > i ? 'step-line-done' : ''}`} />}
                <div className="step-item">
                  <div className={`step-dot ${isDone ? 'step-dot-done' : isActive ? 'step-dot-active' : ''}`}>
                    {isDone
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      : num}
                  </div>
                  <span className={`step-lbl ${isActive ? 'step-lbl-active' : ''}`}>{label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="filter-section">
          <div className="form-group">
            <label>Loại dịch vụ</label>
            <select
              name="service"
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
            >
              <option value="">Chọn dịch vụ</option>
              <option value="consultation">Khám tư vấn</option>
              <option value="checkup">Khám tổng quát</option>
            </select>
          </div>

          <div className="form-group">
            <label>Khoảng thời gian</label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="date-range">
                <DatePicker
                  label="Từ ngày"
                  value={filters.dateFrom}
                  onChange={(v) => setFilters({ ...filters, dateFrom: v })}
                  format="DD/MM/YYYY"
                  minDate={dayjs(today)}
                  slotProps={{ popper: { placement: 'top-start' } }}
                />
                <DatePicker
                  label="Đến ngày"
                  value={filters.dateTo}
                  onChange={(v) => setFilters({ ...filters, dateTo: v })}
                  format="DD/MM/YYYY"
                  minDate={filters.dateFrom ?? dayjs(today)}
                  slotProps={{ popper: { placement: 'top-start' } }}
                />
              </div>
            </LocalizationProvider>
          </div>

          <button className="search-btn" onClick={fetchAvailableSlots} disabled={loading}>
            {loading ? 'Đang tìm kiếm...' : 'Tìm lịch trống'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="slots-section">
          <div className="slots-header">
            <h2>Lịch trống khả dụng</h2>
            <div className="doctor-filter-wrapper">
              <button className="doctor-filter-btn" onClick={() => setShowDoctorFilter((v) => !v)}>
                Lọc bác sĩ {filterDoctorIds.length > 0 ? `(${filterDoctorIds.length})` : ''}
              </button>
              {showDoctorFilter && (
                <div className="doctor-filter-dropdown">
                  <label className="doctor-filter-item">
                    <input type="checkbox" checked={filterDoctorIds.length === 0}
                      onChange={() => setFilterDoctorIds([])} />
                    Tất cả bác sĩ
                  </label>
                  {slotDoctors.map((doc) => (
                    <label className="doctor-filter-item" key={doc.id}>
                      <input type="checkbox" checked={filterDoctorIds.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) setFilterDoctorIds((p) => [...p, doc.id]);
                          else setFilterDoctorIds((p) => p.filter((id) => id !== doc.id));
                        }} />
                      {doc.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {uniqueDates.length === 0 ? (
            <p>Không có lịch trống nào cho bộ lọc đã chọn.</p>
          ) : (
            <div className="time-grid-wrapper">
              <table className="time-grid">
                <thead>
                  <tr>
                    <th className="time-grid-corner">Ngày</th>
                    {uniqueTimes.map((t) => (
                      <th key={t} className="time-grid-th">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uniqueDates.map((date) => (
                    <tr key={date}>
                      <td className="time-grid-date">{formatDateLabel(date)}</td>
                      {uniqueTimes.map((time) => {
                        const key = `${date}_${time}`;
                        const available = cellMap.get(key);
                        const isAvailable = available && available.length > 0;
                        const isPopupOpen = cellPopup?.date === date && cellPopup?.time === time;
                        return (
                          <td key={key}
                            className={`time-grid-cell ${isAvailable ? 'cell-available' : 'cell-unavailable'}`}
                            onClick={() => {
                              if (isAvailable) setCellPopup(isPopupOpen ? null : { date, time });
                            }}
                          >
                            {isAvailable && <span className="cell-count">{available.length}</span>}
                            {isPopupOpen && available && (
                              <div className="cell-doctor-popup" onClick={(e) => e.stopPropagation()}>
                                <div className="cell-popup-title">Chọn bác sĩ</div>
                                {available.map((s) => (
                                  <div key={s.id} className="cell-popup-item"
                                    onClick={() => { setSelectedSlot(s); setCellPopup(null); setStep(3); }}>
                                    {s.doctorName}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={() => { setStep(1); setCellPopup(null); }}>← Quay lại bộ lọc</button>
        </div>
      )}

      {step === 3 && selectedSlot && (
        <div className="confirm-card">
          <div className="confirm-header">
            <h2 className="confirm-title">Xác nhận lịch khám</h2>
            <p className="confirm-subtitle">Kiểm tra lại thông tin trước khi xác nhận</p>
          </div>

          <div className="confirm-info-block">
            <div className="confirm-info-row">
              <span className="confirm-icon ci-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <div className="confirm-info-text">
                <span className="ci-label">Ngày khám</span>
                <span className="ci-value">{formatDateFull(selectedSlot.date)}</span>
              </div>
            </div>

            <div className="confirm-info-row">
              <span className="confirm-icon ci-violet">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
              <div className="confirm-info-text">
                <span className="ci-label">Giờ khám</span>
                <span className="ci-value">{selectedSlot.time}</span>
              </div>
            </div>

            <div className="confirm-info-row confirm-info-row-last">
              <span className="confirm-icon ci-green">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <div className="confirm-info-text">
                <span className="ci-label">Bác sĩ</span>
                <span className="ci-value">{selectedSlot.doctorName}</span>
              </div>
            </div>
          </div>

          <div className="confirm-reason-block">
            <label className="ci-label" htmlFor="reason">
              Lý do khám <span className="ci-optional">(không bắt buộc)</span>
            </label>
            <textarea
              id="reason"
              className="confirm-textarea"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Mô tả triệu chứng hoặc lý do khám..."
              rows={3}
            />
          </div>

          <div className="confirm-actions">
            <button className="btn-confirm" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
            </button>
            <button className="btn-back-text" onClick={() => setStep(2)}>
              ← Quay lại
            </button>
          </div>
        </div>
      )}

      {step === 4 && success && (
        <div className="success-message">
          <h2>Đã đặt lịch khám!</h2>
          <p>{success}</p>
          <button onClick={() => {
            setStep(1); setSelectedSlot(null);
            setFormData({ date: '', time: '', doctorId: null, reason: '' });
            setSuccess('');
          }}>
            Đặt lịch khám khác
          </button>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;