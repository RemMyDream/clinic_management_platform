import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './scheduleAppointment.css';
import { appointmentApi, patientApi, doctorApi } from '../../services/api';

type Patient = {
  patient_id: number;
  full_name: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
};

type Doctor = {
  doctor_id: number;
  doctor_name: string;
  major: string;
  hospital_id: number;
};

type FormData = {
  patientId: number | null;
  doctorId: number | null;
  date: string;
  time: string;
  reason: string;
};

const ScheduleAppointment: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    patientId: null,
    doctorId: null,
    date: '',
    time: '',
    reason: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Fetch patients and doctors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          patientApi.getAll(0, 500),
          doctorApi.getAll(),
        ]);
        setPatients(patientsRes.data);
        setFilteredPatients(patientsRes.data);
        setDoctors(doctorsRes.data);
      } catch {
        setError('Không thể tải danh sách bệnh nhân và bác sĩ.');
      }
    };

    fetchData();
  }, []);

  // Filter patients based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone && patient.phone.includes(searchTerm)) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  // Fetch available slots when patient, doctor, and date are selected
  const fetchAvailableSlots = async () => {
    if (!formData.date) {
      setError('Vui lòng chọn ngày trước.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await appointmentApi.getAvailableSlots(formData.date);

      let slots = response.data;

      // Filter by selected doctor if specified
      if (formData.doctorId) {
        slots = slots.filter((slot: any) =>
          slot.available_doctors.some((doc: any) => doc.doctor_id === formData.doctorId)
        );
      }

      setAvailableSlots(slots);
      setStep(3);
    } catch (err) {
      console.error('Failed to fetch available slots:', err);
      setError('Không thể tải danh sách lịch trống.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setFormData({ ...formData, patientId: patient.patient_id });
    setStep(2);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'doctorId' || name === 'patientId' ? 
      (value === '' ? null : parseInt(value)) : value });
  };

  const handleSlotSelect = (slot: any, doctorId: number) => {
    const [date, time] = slot.datetime.split('T');
    setFormData({
      ...formData,
      date,
      time: time.slice(0, 5),
      doctorId,
    });
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time || !formData.reason) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await appointmentApi.book({
        patient_id: formData.patientId,
        doctor_id: formData.doctorId,
        appointment_day: formData.date,
        appointment_time: formData.time,
        reason: formData.reason,
      });

      setSuccess('Sắp xếp lịch hẹn thành công!');
      toast.success('Sắp xếp lịch hẹn thành công!');
      
      // Reset form
      setFormData({
        patientId: null,
        doctorId: null,
        date: '',
        time: '',
        reason: '',
      });
      setStep(1);
      setSearchTerm('');
    } catch (err) {
      console.error('Failed to schedule appointment:', err);
      setError('Không thể sắp xếp lịch hẹn. Vui lòng thử lại.');
      toast.error('Không thể sắp xếp lịch hẹn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-appointment">
      <h1>Sắp xếp lịch hẹn</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Step 1: Select Patient */}
      {step === 1 && (
        <div className="step-container">
          <h2>Bước 1: Chọn bệnh nhân</h2>
          
          <div className="search-section">
            <input
              type="text"
              placeholder="Tìm kiếm bệnh nhân theo tên, số điện thoại hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="patients-grid">
            {filteredPatients.length === 0 ? (
              <p>Không tìm thấy bệnh nhân nào.</p>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.patient_id}
                  className="patient-card"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <h3>{patient.full_name}</h3>
                  <p>ID: {patient.patient_id}</p>
                  {patient.phone && <p>SĐT: {patient.phone}</p>}
                  {patient.email && <p>Email: {patient.email}</p>}
                  {patient.date_of_birth && <p>Ngày sinh: {patient.date_of_birth}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Doctor and Date */}
      {step === 2 && (
        <div className="step-container">
          <h2>Bước 2: Chọn bác sĩ và ngày</h2>
          
          <div className="selected-patient-info">
            <h3>Bệnh nhân đã chọn:</h3>
            <p>{patients.find(p => p.patient_id === formData.patientId)?.full_name}</p>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Bác sĩ (Tùy chọn - để trống để chọn bác sĩ bất kỳ)</label>
              <select
                name="doctorId"
                value={formData.doctorId || ''}
                onChange={handleFormChange}
              >
                <option value="">Bác sĩ bất kỳ</option>
                {doctors.map((doctor) => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.doctor_name} - {doctor.major}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Ngày *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-buttons">
              <button onClick={fetchAvailableSlots} disabled={loading || !formData.date}>
                {loading ? 'Đang tải...' : 'Tìm lịch trống'}
              </button>
              <button onClick={() => setStep(1)} className="back-button">
                ← Quay lại chọn bệnh nhân
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Select Time Slot */}
      {step === 3 && (
        <div className="step-container">
          <h2>Bước 3: Chọn khung giờ</h2>
          
          <div className="appointment-info">
            <p><strong>Bệnh nhân:</strong> {patients.find(p => p.patient_id === formData.patientId)?.full_name}</p>
            <p><strong>Ngày:</strong> {formData.date ? (() => { const dt = new Date(formData.date); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; })() : ''}</p>
            {formData.doctorId && (
              <p><strong>Bác sĩ ưu tiên:</strong> {doctors.find(d => d.doctor_id === formData.doctorId)?.doctor_name}</p>
            )}
          </div>

          {availableSlots.length === 0 ? (
            <div className="no-slots">
              <p>Không có lịch trống cho ngày và bác sĩ đã chọn.</p>
              <button onClick={() => setStep(2)} className="back-button">
                ← Thử ngày/bác sĩ khác
              </button>
            </div>
          ) : (
            <div className="slots-section">
              {availableSlots.map((slot) => (
                <div key={slot.datetime} className="time-slot">
                  <h4>{slot.datetime.split('T')[1].slice(0, 5)}</h4>
                  <div className="available-doctors">
                    {slot.available_doctors
                      .filter((doc: any) => !formData.doctorId || doc.doctor_id === formData.doctorId)
                      .map((doctor: any) => (
                        <button
                          key={doctor.doctor_id}
                          className="doctor-slot-button"
                          onClick={() => handleSlotSelect(slot, doctor.doctor_id)}
                        >
                          Dr. {doctor.doctor_name}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
              
              <button onClick={() => setStep(2)} className="back-button">
                ← Quay lại chọn ngày
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Confirm Appointment */}
      {step === 4 && (
        <div className="step-container">
          <h2>Bước 4: Xác nhận lịch hẹn</h2>
          
          <div className="confirmation-details">
            <p><strong>Bệnh nhân:</strong> {patients.find(p => p.patient_id === formData.patientId)?.full_name}</p>
            <p><strong>Bác sĩ:</strong> {doctors.find(d => d.doctor_id === formData.doctorId)?.doctor_name}</p>
            <p><strong>Ngày:</strong> {formData.date ? (() => { const dt = new Date(formData.date); return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; })() : ''}</p>
            <p><strong>Giờ:</strong> {formData.time}</p>
          </div>

          <div className="form-group">
            <label>Lý do khám bệnh *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleFormChange}
              placeholder="Nhập lý do khám bệnh..."
              required
            />
          </div>

          <div className="form-buttons">
            <button 
              onClick={handleSubmit} 
              disabled={loading || !formData.reason}
              className="confirm-button"
            >
              {loading ? 'Đang sắp xếp...' : 'Xác nhận lịch hẹn'}
            </button>
            <button onClick={() => setStep(3)} className="back-button">
              ← Quay lại chọn giờ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleAppointment;
