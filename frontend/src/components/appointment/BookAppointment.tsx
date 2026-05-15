import React, { useState, useEffect } from 'react';
import { appointmentApi, doctorApi } from '../../services/api';
import './bookAppointment.css';

const BookAppointment: React.FC = () => {
  type FormData = {
    date: string;
    time: string;
    doctorId: number | null;
    reason: string
  };
  const [formData, setFormData] = useState<FormData>({
    date: '',
    time: '',
    doctorId: null,
    reason: '',
  });
  type Doctor = {
  doctor_id: number;
  doctor_name: string;
  major: string;
  hospital_id: number;
};
const [doctors, setDoctors] = useState<Doctor[]>([]);
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
  doctorId: number | null;
};
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [filters, setFilters] = useState<Filters>({ service: '', dateFrom: '', dateTo: '', doctorId: null });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterByDoctor, setFilterByDoctor] = useState(false);

  useEffect(() => {
    doctorApi.getAll()
      .then((res) => setDoctors(res.data))
      .catch(() => setError('Không thể lấy danh sách bác sĩ.'));
  }, []);

  const fetchAvailableSlots = async () => {
    if (!filters.dateFrom || !filters.dateTo) {
      setError('Vui lòng chọn khoảng thời gian.');
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
      setStep(2);
    } catch {
      setError('Không thể lấy lịch trống.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
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
      setSuccess('Đặt lịch khám thành công!');
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
        doctorId: selectedSlot.doctorId, // or doctorId from selectedSlot if available
        reason: formData.reason, // keep existing reason
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot]);

  return (
    <div className="appointment-page">
      <h1>Đặt lịch khám</h1>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      {/* Step 1: Filters */}
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
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Bác sĩ mong muốn (Tùy chọn)</label>
            <select
              name="doctorId"
              value={filters.doctorId ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  doctorId: value === '' ? null : parseInt(value, 10),
                });
              }}
            >
              <option key="any" value="">Bất kỳ</option>
              {doctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.doctor_name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={fetchAvailableSlots} disabled={loading}>
            {loading ? 'Đang tìm kiếm...' : 'Tìm lịch trống'}
          </button>
        </div>
      )}

      {/* Step 2: Available Slots */}
      {step === 2 && (
        <div className="slots-section">
          <h2>Lịch trống khả dụng</h2>

          {/* Checkbox to toggle filter by doctor */}
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={filterByDoctor}
                onChange={(e) => setFilterByDoctor(e.target.checked)}
                disabled={!filters.doctorId} // disable if no doctor selected
              />
              Chỉ hiển thị lịch có bác sĩ mong muốn
            </label>
          </div>

          {slots.length === 0 ? (
            <p>Không có lịch trống nào cho bộ lọc đã chọn.</p>
          ) : (
            // Filter slots based on filterByDoctor toggle
            slots
              .filter((slot) =>
                filterByDoctor && filters.doctorId
                  ? slot.doctorId === filters.doctorId
                  : true
              )
              .map((slot) => (
                <div
                  key={slot.id}
                  className="slot-card"
                  onClick={() => {
                    setSelectedSlot(slot);
                    setStep(3);
                  }}
                >
                  <p>
                    <strong>{slot.time}</strong> ngày {slot.date}
                  </p>
                  <p>Bác sĩ: {slot.doctorName}</p>
                </div>
              ))
          )}
          <button onClick={() => setStep(1)}>← Quay lại bộ lọc</button>
        </div>
      )}

      {/* Step 3: Confirm Appointment */}
      {step === 3 && selectedSlot && (
        <div className="confirmation-section">
          <h2>Xác nhận lịch khám</h2>
          <p>
            <strong>Ngày:</strong> {selectedSlot.date}
          </p>
          <p>
            <strong>Giờ:</strong> {selectedSlot.time}
          </p>
          <p>
            <strong>Bác sĩ:</strong> {selectedSlot.doctorName}
          </p>
          <div className="form-group">
            <label>Lý do khám bệnh</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
            />
          </div>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}
          </button>
          <button onClick={() => setStep(2)}>← Quay lại danh sách lịch</button>
        </div>
      )}

      {/* Step 4: Success Message */}
      {step === 4 && success && (
        <div className="success-message">
          <h2>✅ Đã đặt lịch khám!</h2>
          <p>{success}</p>
          <button
            onClick={() => {
              setStep(1);
              setSelectedSlot(null);
              setFormData({ date: '', time: '', doctorId: null, reason: '' });
              setSuccess('');
            }}
          >
            Đặt lịch khám khác
          </button>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;