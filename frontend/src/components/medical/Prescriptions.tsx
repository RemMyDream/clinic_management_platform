import React, { useState, useEffect } from 'react';
import { prescriptionApi } from '../../services/api';
import styles from './Prescriptions.module.css';

interface Prescription {
  prescription_id: number;
  report_id: number;
  medication_name: string;
  dosage: string;
  quantity: number;
}


const Prescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Prescription | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const patientId = Number(localStorage.getItem('user_id'));
      if (!patientId) {
        setError('Không tìm thấy thông tin người dùng.');
        return;
      }

      const prescRes = await prescriptionApi.getByPatient(patientId);
      setPrescriptions(prescRes.data);
      if (prescRes.data.length > 0) setSelected(prescRes.data[0]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể tải đơn thuốc.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Đang tải đơn thuốc...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h3>Lỗi</h3>
          <p>{error}</p>
          <button onClick={loadData} className={styles.retryButton}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Đơn thuốc của tôi</h1>
        <span className={styles.count}>{prescriptions.length} đơn thuốc</span>
      </div>

      {prescriptions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💊</div>
          <h3>Chưa có đơn thuốc</h3>
          <p>Bạn chưa có đơn thuốc nào được kê.</p>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.prescriptionsList}>
            {prescriptions.map((p) => (
              <div
                key={p.prescription_id}
                className={`${styles.prescriptionCard} ${selected?.prescription_id === p.prescription_id ? styles.selected : ''}`}
                onClick={() => setSelected(p)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.medName}>{p.medication_name}</span>
                  <span className={styles.qty}>SL: {p.quantity}</span>
                </div>
                <p className={styles.dosagePreview}>{p.dosage}</p>
                <p className={styles.reportRef}>Phiếu khám #{p.report_id}</p>
              </div>
            ))}
          </div>

          {selected && (
            <div className={styles.prescriptionDetails}>
              <div className={styles.detailsHeader}>
                <h2>Chi tiết thuốc</h2>
              </div>

              <div className={styles.prescriptionInfo}>
                <div className={styles.infoRow}>
                  <label>Tên thuốc:</label>
                  <span><strong>{selected.medication_name}</strong></span>
                </div>
                <div className={styles.infoRow}>
                  <label>Liều dùng:</label>
                  <span>{selected.dosage}</span>
                </div>
                <div className={styles.infoRow}>
                  <label>Số lượng:</label>
                  <span>{selected.quantity}</span>
                </div>
                <div className={styles.infoRow}>
                  <label>Phiếu khám:</label>
                  <span>#{selected.report_id}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
