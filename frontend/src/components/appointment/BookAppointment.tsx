import React, { useState, useEffect, useMemo } from 'react';
import { appointmentApi, doctorApi } from '../../services/api';
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
  dateFrom: string;
  dateTo: string;
};

const BookAppointment: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ date: '', time: '', doctorId: null, reason: '' });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [filters, setFilters] = useState<Filters>({ service: '', dateFrom: '', dateTo: '' });
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
    if (filters.dateFrom < today) {
      setError('Không thể đặt lịch trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.');
      return;
    }
    if (filters.dateFrom > filters.dateTo) {
      setError('Ngày bắt đầu phải trước ngày kết thúc.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const dateFromString = new Date(filters.dateFrom).toISOString().split('T')[0];
      const dateToString = new Date(filters.dateTo).toISOString().split('T')[0];
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
      setError('Không thể đặt lịch khám. Vui lòng thử lại.');
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
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()}`;
  };

  return (
    <div className="appointment-page">
      <h1>Đặt lịch khám</h1>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

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
            <div className="date-range">
              <input type="date" name="dateFrom" min={today} value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
              <input type="date" name="dateTo" min={filters.dateFrom || today} value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
            </div>
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
        <div className="confirmation-section">
          <h2>Xác nhận lịch khám</h2>
          <p><strong>Ngày:</strong> {formatDate(selectedSlot.date)}</p>
          <p><strong>Giờ:</strong> {selectedSlot.time}</p>
          <p><strong>Bác sĩ:</strong> {selectedSlot.doctorName}</p>
          <div className="form-group">
            <label>Lý do khám bệnh</label>
            <textarea name="reason" value={formData.reason} onChange={handleChange} required />
          </div>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
          </button>
          <button onClick={() => setStep(2)}>← Quay lại lịch</button>
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