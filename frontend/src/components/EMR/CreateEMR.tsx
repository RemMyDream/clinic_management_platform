import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { appointmentApi, patientApi, medicalReportApi, prescriptionApi } from '../../services/api';
import styles from './CreateEMR.module.css';

interface Patient {
  id: number;
  name: string;
}

interface PrescriptionItem {
  medication_name: string;
  dosage: string;
  quantity: string;
}

interface FormData {
  in_day: string;
  in_diagnosis: string;
  doctor_notes: string;
  reason_in: string;
  treatment_process: string;
  pulse_rate: string;
  temperature: string;
  blood_pressure: string;
  respiratory_rate: string;
  weight: string;
  personal_history: string;
  family_history: string;
}

const todayStr = () => dayjs().format('YYYY-MM-DD');

const emptyForm = (): FormData => ({
  in_day: todayStr(),
  in_diagnosis: '',
  doctor_notes: '',
  reason_in: '',
  treatment_process: '',
  pulse_rate: '',
  temperature: '',
  blood_pressure: '',
  respiratory_rate: '',
  weight: '',
  personal_history: '',
  family_history: '',
});

const CreateEMR: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm());
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [newMed, setNewMed] = useState<PrescriptionItem>({ medication_name: '', dosage: '', quantity: '' });
  const [dose, setDose] = useState({ morning: '', evening: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  const doctorId = Number(localStorage.getItem('user_id'));

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await appointmentApi.getMyAppointments();
        const uniqueIds: number[] = Array.from(new Set<number>(res.data.map((a: any) => a.patient_id)));
        const patientList = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const p = await patientApi.getById(id);
              return { id, name: p.data.full_name };
            } catch {
              return { id, name: `Bệnh nhân #${id}` };
            }
          })
        );
        setPatients(patientList);
      } catch {
        setError('Không thể tải danh sách bệnh nhân.');
      }
    };
    fetchPatients();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMedication = () => {
    if (!newMed.medication_name.trim()) return;
    const dosage = `Sáng ${dose.morning || 0} viên, chiều ${dose.evening || 0} viên / ngày`;
    setPrescriptions((prev) => [...prev, { ...newMed, dosage }]);
    setNewMed({ medication_name: '', dosage: '', quantity: '' });
    setDose({ morning: '', evening: '' });
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setFormData(emptyForm());
    setPrescriptions([]);
    setError('');
    setSuccess('');
    setSelectedPatientId(null);
    setStep(1);
  };

  const handleSaveEMR = async () => {
    setError('');
    setSuccess('');

    if (!selectedPatientId || !doctorId) {
      setError('Vui lòng chọn bệnh nhân.');
      return;
    }
    if (!formData.in_diagnosis.trim() || !formData.reason_in.trim() || !formData.treatment_process.trim()) {
      setError('Chẩn đoán, lý do nhập viện và quá trình điều trị là bắt buộc.');
      return;
    }

    try {
      const emrPayload: Record<string, any> = {
        patient_id: selectedPatientId,
        doctor_id: doctorId,
        in_diagnosis: formData.in_diagnosis,
        doctor_notes: formData.doctor_notes,
        reason_in: formData.reason_in,
        treatment_process: formData.treatment_process,
      };

      if (formData.in_day) emrPayload.in_day = formData.in_day;

      if (formData.pulse_rate) emrPayload.pulse_rate = formData.pulse_rate;
      if (formData.temperature) emrPayload.temperature = formData.temperature;
      if (formData.blood_pressure) emrPayload.blood_pressure = formData.blood_pressure;
      if (formData.respiratory_rate) emrPayload.respiratory_rate = formData.respiratory_rate;
      if (formData.weight) emrPayload.weight = formData.weight;
      if (formData.personal_history) emrPayload.personal_history = formData.personal_history;
      if (formData.family_history) emrPayload.family_history = formData.family_history;

      const reportRes = await medicalReportApi.create(emrPayload);
      const reportId: number = reportRes.data.record_id;

      await Promise.all(
        prescriptions.map((med) =>
          prescriptionApi.create({
            report_id: reportId,
            medication_name: med.medication_name,
            dosage: med.dosage,
            quantity: parseInt(med.quantity) || 1,
          })
        )
      );

      setSuccess('Hồ sơ bệnh án đã được lưu thành công!');
      handleReset();
    } catch (err: any) {
      if (err.response?.status === 422) {
        const detail = err.response.data?.detail;
        if (Array.isArray(detail)) {
          setError(`Lỗi xác thực: ${detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ')}`);
        } else {
          setError('Lỗi xác thực: Vui lòng kiểm tra dữ liệu đầu vào.');
        }
      } else {
        setError(err.response?.data?.detail || 'Không thể lưu hồ sơ bệnh án. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className={styles.createEmrContainer}>
      <h1 className={styles.title}>Tạo Hồ sơ Bệnh án</h1>

      <div className={styles.stepBar}>
        {(['Chọn bệnh nhân', 'Thông tin', 'Đơn thuốc', 'Xem lại'] as const).map((label, i) => {
          const num = i + 1;
          const isDone = step > num;
          const isActive = step === num;
          return (
            <React.Fragment key={num}>
              {i > 0 && <div className={`${styles.stepLine} ${step > i ? styles.stepLineDone : ''}`} />}
              <div className={styles.stepItem}>
                <div className={`${styles.stepDot} ${isDone ? styles.stepDotDone : isActive ? styles.stepDotActive : ''}`}>
                  {isDone ? '✓' : num}
                </div>
                <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>{label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}
      {success && <p className={styles.successMessage}>{success}</p>}

      {/* Step 1: Patient Selection */}
      {step === 1 && (
        <div className={styles.patientSelection}>
          <h2 className={styles.subtitle}>Chọn Bệnh nhân</h2>
          {patients.length === 0 && !error ? (
            <p className={styles.loading}>Đang tải...</p>
          ) : patients.length > 0 ? (
            <ul className={styles.patientList}>
              {patients.map((p) => (
                <li key={p.id}>
                  <button
                    className={styles.patientButton}
                    onClick={() => { setSelectedPatientId(p.id); setStep(2); }}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noPatients}>Không có bệnh nhân nào.</p>
          )}
        </div>
      )}

      {/* Step 2: EMR Form */}
      {step === 2 && (
        <div className={styles.emrForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Ngày nhập viện:</label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={formData.in_day ? dayjs(formData.in_day) : null}
                onChange={(v) => setFormData((prev) => ({ ...prev, in_day: v ? v.format('YYYY-MM-DD') : '' }))}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="reason_in" className={styles.label}>Lý do nhập viện:</label>
            <textarea id="reason_in" name="reason_in" value={formData.reason_in} onChange={handleChange} required className={styles.textarea} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="doctor_notes" className={styles.label}>Ghi chú tư vấn:</label>
            <textarea id="doctor_notes" name="doctor_notes" value={formData.doctor_notes} onChange={handleChange} className={styles.textarea} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="in_diagnosis" className={styles.label}>Chẩn đoán:</label>
            <input type="text" id="in_diagnosis" name="in_diagnosis" value={formData.in_diagnosis} onChange={handleChange} required className={styles.input} />
          </div>

          <div className={styles.vitalSignsSection}>
            <h3 className={styles.sectionTitle}>Dấu hiệu sinh tồn</h3>
            <div className={styles.vitalSignsGrid}>
              {[
                { id: 'pulse_rate', label: 'Nhịp tim (lần/phút)', placeholder: 'ví dụ: 72', type: 'number', min: '0' },
                { id: 'temperature', label: 'Nhiệt độ (°C)', placeholder: 'ví dụ: 36.5', type: 'number', step: '0.1', min: '0' },
                { id: 'blood_pressure', label: 'Huyết áp', placeholder: 'ví dụ: 120/80', type: 'text' },
                { id: 'respiratory_rate', label: 'Nhịp thở (lần/phút)', placeholder: 'ví dụ: 16', type: 'number', min: '0' },
                { id: 'weight', label: 'Cân nặng (kg)', placeholder: 'ví dụ: 70.5', type: 'number', step: '0.1', min: '0' },
              ].map(({ id, label, placeholder, type, step, min }) => (
                <div key={id} className={styles.formGroup}>
                  <label htmlFor={id} className={styles.label}>{label}:</label>
                  <input
                    type={type}
                    id={id}
                    name={id}
                    step={step}
                    min={min}
                    value={(formData as any)[id]}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.historySection}>
            <h3 className={styles.sectionTitle}>Tiền sử Bệnh nhân</h3>
            <div className={styles.formGroup}>
              <label htmlFor="personal_history" className={styles.label}>Tiền sử cá nhân:</label>
              <textarea id="personal_history" name="personal_history" value={formData.personal_history} onChange={handleChange} className={styles.textarea} placeholder="Tiền sử bệnh lý cá nhân, dị ứng, thuốc đang sử dụng, v.v." />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="family_history" className={styles.label}>Tiền sử gia đình:</label>
              <textarea id="family_history" name="family_history" value={formData.family_history} onChange={handleChange} className={styles.textarea} placeholder="Tiền sử bệnh lý gia đình, các bệnh di truyền, v.v." />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="treatment_process" className={styles.label}>Quá trình điều trị:</label>
            <textarea id="treatment_process" name="treatment_process" value={formData.treatment_process} onChange={handleChange} required className={styles.textarea} />
          </div>
          <button className={styles.button} onClick={() => setStep(3)}>Thêm đơn thuốc</button>
          <button className={styles.button} onClick={() => setStep(1)}>← Quay lại</button>
        </div>
      )}

      {/* Step 3: Prescriptions */}
      {step === 3 && (
        <div className={styles.prescriptionForm}>
          <h2>Đơn thuốc</h2>

          <div className={styles.formGroup}>
            <label className={styles.label}>Tên thuốc:</label>
            <input
              type="text"
              value={newMed.medication_name}
              onChange={(e) => setNewMed((p) => ({ ...p, medication_name: e.target.value }))}
              className={styles.input}
              placeholder="Tên thuốc"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Liều dùng (số viên mỗi buổi):</label>
            <div className={styles.doseGrid}>
              <div>
                <span className={styles.doseSubLabel}>Sáng</span>
                <input
                  type="number"
                  min="0"
                  value={dose.morning}
                  onChange={(e) => setDose((p) => ({ ...p, morning: e.target.value }))}
                  className={styles.input}
                  placeholder="số viên"
                />
              </div>
              <div>
                <span className={styles.doseSubLabel}>Chiều</span>
                <input
                  type="number"
                  min="0"
                  value={dose.evening}
                  onChange={(e) => setDose((p) => ({ ...p, evening: e.target.value }))}
                  className={styles.input}
                  placeholder="số viên"
                />
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Số ngày:</label>
            <input
              type="number"
              min="0"
              value={newMed.quantity}
              onChange={(e) => setNewMed((p) => ({ ...p, quantity: e.target.value }))}
              className={styles.input}
              placeholder="ví dụ: 7"
            />
          </div>
          <button className={styles.button} onClick={handleAddMedication}>Thêm thuốc</button>

          {prescriptions.length > 0 && (
            <ul className={styles.medicationList}>
              {prescriptions.map((med, i) => (
                <li key={i} className={styles.medicationListItem}>
                  <strong>{med.medication_name}</strong> — {med.dosage} · Số ngày: {med.quantity}
                  <button onClick={() => handleRemoveMedication(i)} style={{ marginLeft: 8, color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </li>
              ))}
            </ul>
          )}

          <button className={styles.button} onClick={() => setStep(4)}>Xem lại hồ sơ</button>
          <button className={styles.button} onClick={() => setStep(2)}>← Quay lại</button>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className={styles.reviewEmr}>
          <div className={styles.reviewHeader}>
            <span className={styles.reviewHeaderIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </span>
            <h2>Xem lại Hồ sơ Bệnh án</h2>
          </div>

          <div className={styles.reviewBody}>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Ngày nhập viện</span>
              <span className={styles.reviewValue}>{formData.in_day ? dayjs(formData.in_day).format('DD/MM/YYYY') : '—'}</span>
            </div>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Lý do nhập viện</span>
              <span className={styles.reviewValue}>{formData.reason_in || '—'}</span>
            </div>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Chẩn đoán</span>
              <span className={styles.reviewValue}>{formData.in_diagnosis || '—'}</span>
            </div>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Ghi chú tư vấn</span>
              <span className={styles.reviewValue}>{formData.doctor_notes || 'Không có'}</span>
            </div>
            <div className={styles.reviewRow}>
              <span className={styles.reviewLabel}>Quá trình điều trị</span>
              <span className={styles.reviewValue}>{formData.treatment_process || '—'}</span>
            </div>
          </div>

          <div className={styles.prescBlock}>
            <h3 className={styles.prescTitle}>💊 Đơn thuốc ({prescriptions.length})</h3>
            {prescriptions.length === 0 ? (
              <p className={styles.prescEmpty}>Không có đơn thuốc.</p>
            ) : (
              <div className={styles.prescList}>
                {prescriptions.map((med, i) => (
                  <div key={i} className={styles.prescItem}>
                    <span className={styles.prescName}>{med.medication_name}</span>
                    <span className={styles.prescMeta}>{med.dosage} · Số ngày: {med.quantity || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.reviewActions}>
            <button className={styles.btnSave} onClick={handleSaveEMR}>Lưu hồ sơ</button>
            <button className={styles.btnCancel} onClick={() => setStep(3)}>← Quay lại</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEMR;
