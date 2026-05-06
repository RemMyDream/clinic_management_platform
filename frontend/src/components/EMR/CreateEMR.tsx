import React, { useState, useEffect } from 'react';
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

const EMPTY_FORM: FormData = {
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
};

const CreateEMR: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [newMed, setNewMed] = useState<PrescriptionItem>({ medication_name: '', dosage: '', quantity: '' });
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
    setPrescriptions((prev) => [...prev, { ...newMed }]);
    setNewMed({ medication_name: '', dosage: '', quantity: '' });
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setFormData(EMPTY_FORM);
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
                { id: 'pulse_rate', label: 'Nhịp tim (lần/phút)', placeholder: 'ví dụ: 72', type: 'number' },
                { id: 'temperature', label: 'Nhiệt độ (°C)', placeholder: 'ví dụ: 36.5', type: 'number', step: '0.1' },
                { id: 'blood_pressure', label: 'Huyết áp', placeholder: 'ví dụ: 120/80', type: 'text' },
                { id: 'respiratory_rate', label: 'Nhịp thở (lần/phút)', placeholder: 'ví dụ: 16', type: 'number' },
                { id: 'weight', label: 'Cân nặng (kg)', placeholder: 'ví dụ: 70.5', type: 'number', step: '0.1' },
              ].map(({ id, label, placeholder, type, step }) => (
                <div key={id} className={styles.formGroup}>
                  <label htmlFor={id} className={styles.label}>{label}:</label>
                  <input
                    type={type}
                    id={id}
                    name={id}
                    step={step}
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
            <label className={styles.label}>Liều dùng:</label>
            <input
              type="text"
              value={newMed.dosage}
              onChange={(e) => setNewMed((p) => ({ ...p, dosage: e.target.value }))}
              className={styles.input}
              placeholder="ví dụ: 1 viên/ngày"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Số lượng:</label>
            <input
              type="number"
              value={newMed.quantity}
              onChange={(e) => setNewMed((p) => ({ ...p, quantity: e.target.value }))}
              className={styles.input}
              placeholder="ví dụ: 30"
            />
          </div>
          <button className={styles.button} onClick={handleAddMedication}>Thêm thuốc</button>

          {prescriptions.length > 0 && (
            <ul className={styles.medicationList}>
              {prescriptions.map((med, i) => (
                <li key={i} className={styles.medicationListItem}>
                  <strong>{med.medication_name}</strong> — Liều: {med.dosage}, SL: {med.quantity}
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
          <h2>Xem lại Hồ sơ Bệnh án</h2>
          <p><strong>Lý do nhập viện:</strong> {formData.reason_in}</p>
          <p><strong>Chẩn đoán:</strong> {formData.in_diagnosis}</p>
          <p><strong>Ghi chú tư vấn:</strong> {formData.doctor_notes}</p>
          <p><strong>Quá trình điều trị:</strong> {formData.treatment_process}</p>
          {prescriptions.length > 0 && (
            <>
              <h3>Đơn thuốc:</h3>
              <ul>
                {prescriptions.map((med, i) => (
                  <li key={i}><strong>{med.medication_name}</strong> — Liều: {med.dosage}, SL: {med.quantity}</li>
                ))}
              </ul>
            </>
          )}
          <button className={styles.button} onClick={handleSaveEMR}>Lưu hồ sơ</button>
          <button className={styles.button} onClick={handleReset}>Hủy</button>
        </div>
      )}
    </div>
  );
};

export default CreateEMR;
