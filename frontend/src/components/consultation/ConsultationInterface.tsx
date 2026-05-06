// components/consultation/ConsultationInterface.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './ConsultationInterface.module.css';
import { patientApi, medicalReportApi } from '../../services/api';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
}

interface MedicalHistory {
  id: string;
  in_diagnosis: string;
  doctor_notes: string;
  created_at: string;
  pulse_rate: number;
  temperature: number;
  blood_pressure: string;
}

interface ConsultationData {
  symptoms: string;
  consultation_notes: string;
  preliminary_diagnosis: string;
  recommended_tests: string;
  current_vitals: {
    pulse_rate: string;
    temperature: string;
    blood_pressure: string;
    respiratory_rate: string;
    weight: string;
  };
}

const ConsultationInterface: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    symptoms: '',
    consultation_notes: '',
    preliminary_diagnosis: '',
    recommended_tests: '',
    current_vitals: {
      pulse_rate: '',
      temperature: '',
      blood_pressure: '',
      respiratory_rate: '',
      weight: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const appointmentId = location.state?.appointmentId;
  const patientId = location.state?.patientId;

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const [patRes, histRes] = await Promise.all([
        patientApi.getById(Number(patientId)),
        medicalReportApi.search({ patient_id: patientId }),
      ]);
      setPatient(patRes.data);
      setMedicalHistory(histRes.data.slice(0, 5));
      setLoading(false);
    } catch {
      setError('Không thể tải thông tin bệnh nhân');
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('vitals.')) {
      const vitalField = field.split('.')[1];
      setConsultationData(prev => ({
        ...prev,
        current_vitals: {
          ...prev.current_vitals,
          [vitalField]: value
        }
      }));
    } else {
      setConsultationData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleProceedToEMR = () => {
    navigate('/emr/create', {
      state: {
        appointmentId,
        patientId,
        consultationData,
        fromConsultation: true
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải giao diện khám bệnh...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.consultationContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.patientInfo}>
          <h1>Khám bệnh: {patient?.name}</h1>
          <div className={styles.patientDetails}>
            <span>Tuổi: {patient?.age}</span>
            <span>Giới tính: {patient?.gender === 'male' ? 'Nam' : patient?.gender === 'female' ? 'Nữ' : 'Khác'}</span>
            <span>Điện thoại: {patient?.phone}</span>
          </div>
        </div>
        <div className={styles.stepIndicator}>
          <span className={currentStep >= 1 ? styles.active : ''}>1. Đánh giá</span>
          <span className={currentStep >= 2 ? styles.active : ''}>2. Khám</span>
          <span className={currentStep >= 3 ? styles.active : ''}>3. Chẩn đoán</span>
        </div>
      </div>

      <div className={styles.consultationContent}>
        {/* Patient History Sidebar */}
        <div className={styles.historyPanel}>
          <h3>Tiền Sử Bệnh Án Gần Đây</h3>
          {medicalHistory.length === 0 ? (
            <p className={styles.noHistory}>Không có hồ sơ trước đó</p>
          ) : (
            <div className={styles.historyList}>
              {medicalHistory.map((record) => (
                <div key={record.id} className={styles.historyItem}>
                  <div className={styles.historyDate}>{formatDate(record.created_at)}</div>
                  <div className={styles.historyDiagnosis}>{record.in_diagnosis}</div>
                  <div className={styles.historyVitals}>
                    {record.pulse_rate && `Mạch: ${record.pulse_rate}`}
                    {record.temperature && ` | Nhiệt độ: ${record.temperature}°C`}
                    {record.blood_pressure && ` | Huyết áp: ${record.blood_pressure}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Consultation Area */}
        <div className={styles.mainPanel}>
          {/* Step 1: Initial Assessment */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <h2>Đánh Giá Bệnh Nhân</h2>
              <div className={styles.formGroup}>
                <label>Triệu Chứng Chính & Khiếu Nại:</label>
                <textarea
                  value={consultationData.symptoms}
                  onChange={(e) => handleInputChange('symptoms', e.target.value)}
                  placeholder="Mô tả các mối quan tâm chính và triệu chứng của bệnh nhân..."
                  rows={4}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Ghi Chú Khám Ban Đầu:</label>
                <textarea
                  value={consultationData.consultation_notes}
                  onChange={(e) => handleInputChange('consultation_notes', e.target.value)}
                  placeholder="Quan sát ban đầu, hành vi bệnh nhân, ghi chú bổ sung..."
                  rows={4}
                />
              </div>
              <button className={styles.nextButton} onClick={() => setCurrentStep(2)}>
                Tiến Hành Khám
              </button>
            </div>
          )}

          {/* Step 2: Physical Examination & Vitals */}
          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <h2>Khám Thể Chất & Sinh Hiệu</h2>
              <div className={styles.vitalsGrid}>
                <div className={styles.formGroup}>
                  <label>Mạch (lần/phút):</label>
                  <input
                    type="number"
                    value={consultationData.current_vitals.pulse_rate}
                    onChange={(e) => handleInputChange('vitals.pulse_rate', e.target.value)}
                    placeholder="72"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Nhiệt Độ (°C):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={consultationData.current_vitals.temperature}
                    onChange={(e) => handleInputChange('vitals.temperature', e.target.value)}
                    placeholder="36.5"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Huyết Áp:</label>
                  <input
                    type="text"
                    value={consultationData.current_vitals.blood_pressure}
                    onChange={(e) => handleInputChange('vitals.blood_pressure', e.target.value)}
                    placeholder="120/80"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Nhịp Thở:</label>
                  <input
                    type="number"
                    value={consultationData.current_vitals.respiratory_rate}
                    onChange={(e) => handleInputChange('vitals.respiratory_rate', e.target.value)}
                    placeholder="16"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Cân Nặng (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={consultationData.current_vitals.weight}
                    onChange={(e) => handleInputChange('vitals.weight', e.target.value)}
                    placeholder="70.5"
                  />
                </div>
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.backButton} onClick={() => setCurrentStep(1)}>
                  Quay Lại
                </button>
                <button className={styles.nextButton} onClick={() => setCurrentStep(3)}>
                  Tiến Hành Chẩn Đoán
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Diagnosis & Treatment Plan */}
          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <h2>Chẩn Đoán & Kế Hoạch Điều Trị</h2>
              <div className={styles.formGroup}>
                <label>Chẩn Đoán Sơ Bộ:</label>
                <input
                  type="text"
                  value={consultationData.preliminary_diagnosis}
                  onChange={(e) => handleInputChange('preliminary_diagnosis', e.target.value)}
                  placeholder="Chẩn đoán chính dựa trên khám bệnh..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Xét Nghiệm/Chẩn Đoán Hình Ảnh Khuyến Nghị:</label>
                <textarea
                  value={consultationData.recommended_tests}
                  onChange={(e) => handleInputChange('recommended_tests', e.target.value)}
                  placeholder="Liệt kê các xét nghiệm, chẩn đoán hình ảnh hoặc khám bổ sung cần thiết..."
                  rows={3}
                />
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.backButton} onClick={() => setCurrentStep(2)}>
                  Quay Lại
                </button>
                <button className={styles.completeButton} onClick={handleProceedToEMR}>
                  Hoàn Thành Khám & Tạo Hồ Sơ Bệnh Án
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationInterface;
