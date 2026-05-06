import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MedicalHistory.module.css';
import { medicalReportApi } from '../../services/api';

type MedicalReport = {
  record_id: number;
  patient_id: number;
  doctor_id: number;
  in_day: string;
  out_day: string;
  in_diagnosis: string;
  out_diagnosis: string;
  reason_in: string;
  treatment_process: string;
  pulse_rate: string;
  temperature: string;
  blood_pressure: string;
  respiratory_rate: string;
  weight: string;
  pathological_process: string;
  personal_history: string;
  family_history: string;
  diagnose_from_recommender: string;
  prescription: string;
  doctor_notes: string;
};

type ViewMode = 'list' | 'timeline';

type SearchFilters = {
  diagnosis: string;
  dateFrom: string;
  dateTo: string;
  status: 'all' | 'active' | 'completed';
};

const MedicalHistory = () => {
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    diagnosis: '',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicalHistory();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicalReports, searchFilters]);

  const fetchMedicalHistory = async () => {
    try {
      const res = await medicalReportApi.getAll();
      setMedicalReports(res.data);
    } catch {
      setError('Không thể tải lịch sử bệnh án.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...medicalReports];

    if (searchFilters.diagnosis) {
      filtered = filtered.filter(report =>
        (report.in_diagnosis || '').toLowerCase().includes(searchFilters.diagnosis.toLowerCase()) ||
        (report.out_diagnosis || '').toLowerCase().includes(searchFilters.diagnosis.toLowerCase())
      );
    }

    if (searchFilters.dateFrom) {
      filtered = filtered.filter(report =>
        new Date(report.in_day) >= new Date(searchFilters.dateFrom)
      );
    }

    if (searchFilters.dateTo) {
      filtered = filtered.filter(report =>
        new Date(report.in_day) <= new Date(searchFilters.dateTo)
      );
    }

    if (searchFilters.status !== 'all') {
      filtered = filtered.filter(report => {
        const isCompleted = report.out_day !== null && report.out_day !== '';
        return searchFilters.status === 'completed' ? isCompleted : !isCompleted;
      });
    }

    setFilteredReports(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({
      diagnosis: '',
      dateFrom: '',
      dateTo: '',
      status: 'all'
    });
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleReportSelect = (report: MedicalReport) => {
    setSelectedReport(report);
  };

  const handleCloseDetails = () => {
    setSelectedReport(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const parsePrescription = (prescriptionJson: string) => {
    try {
      return JSON.parse(prescriptionJson || '[]');
    } catch {
      return [];
    }
  };

  const exportMedicalHistory = () => {
    const csvData = filteredReports.map(report => ({
      'Report ID': report.record_id,
      'Date': formatDate(report.in_day),
      'Diagnosis': report.in_diagnosis || 'N/A',
      'Treatment': report.treatment_process || 'N/A',
      'Notes': report.doctor_notes || 'N/A',
      'Status': report.out_day ? 'Hoàn thành' : 'Đang điều trị'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medical-history.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const printMedicalHistory = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Báo cáo lịch sử bệnh án</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            .report { margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .header { font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
            .section { margin: 10px 0; }
            .label { font-weight: bold; color: #333; }
          </style>
        </head>
        <body>
          <h1>Báo cáo lịch sử bệnh án</h1>
          <p><strong>Xuất ngày:</strong> ${new Date().toLocaleDateString()}</p>
          ${filteredReports.map(report => `
            <div class="report">
              <div class="header">Báo cáo #${report.record_id} - ${formatDate(report.in_day)}</div>
              <div class="section"><span class="label">Chẩn đoán:</span> ${report.in_diagnosis || 'N/A'}</div>
              <div class="section"><span class="label">Lý do:</span> ${report.reason_in || 'N/A'}</div>
              <div class="section"><span class="label">Điều trị:</span> ${report.treatment_process || 'N/A'}</div>
              <div class="section"><span class="label">Ghi chú:</span> ${report.doctor_notes || 'N/A'}</div>
            </div>
          `).join('')}
        </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const renderTimelineView = () => {
    const sortedReports = [...filteredReports].sort((a, b) => 
      new Date(b.in_day).getTime() - new Date(a.in_day).getTime()
    );

    return (
      <div className={styles.timelineContainer}>
        <div className={styles.timeline}>
          {sortedReports.map((report, index) => (
            <div key={report.record_id} className={styles.timelineItem}>
              <div className={styles.timelineMarker}>
                <div className={styles.timelineDot}></div>
                {index < sortedReports.length - 1 && <div className={styles.timelineLine}></div>}
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <h4>Report #{report.record_id}</h4>
                  <span className={styles.timelineDate}>{formatDate(report.in_day)}</span>
                </div>
                <div className={styles.timelineBody}>
                  <p><strong>Chẩn đoán:</strong> {report.in_diagnosis || 'N/A'}</p>
                  <p><strong>Lý do:</strong> {report.reason_in || 'N/A'}</p>
                  <p><strong>Điều trị:</strong> {report.treatment_process || 'N/A'}</p>
                  {report.doctor_notes && (
                    <p><strong>Ghi chú:</strong> {report.doctor_notes}</p>
                  )}
                </div>
                <button 
                  className={styles.viewDetailsButton}
                  onClick={() => setSelectedReport(report)}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.medicalHistoryContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBackToDashboard}>
          ← Quay lại Dashboard
        </button>
        <h2>Lịch sử bệnh án</h2>
        <div className={styles.headerActions}>
          <button className={styles.exportButton} onClick={exportMedicalHistory}>
            📤 Xuất file
          </button>
          <button className={styles.printButton} onClick={printMedicalHistory}>
            🖨️ In
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải lịch sử bệnh án...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : medicalReports.length === 0 ? (
        <div className={styles.noData}>
          <p>Không tìm thấy lịch sử bệnh án nào.</p>
        </div>
      ) : (
        <>
          {/* Search and Filter Controls */}
          <div className={styles.filtersContainer}>
            <h3>Tìm kiếm & Lọc</h3>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label>Chẩn đoán:</label>
                <input
                  type="text"
                  name="diagnosis"
                  value={searchFilters.diagnosis}
                  onChange={handleFilterChange}
                  placeholder="Tìm kiếm theo chẩn đoán..."
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Từ ngày:</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={searchFilters.dateFrom}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Đến ngày:</label>
                <input
                  type="date"
                  name="dateTo"
                  value={searchFilters.dateTo}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Trạng thái:</label>
                <select
                  name="status"
                  value={searchFilters.status}
                  onChange={handleFilterChange}
                  className={styles.filterSelect}
                >
                  <option value="all">Tất cả báo cáo</option>
                  <option value="active">Đang điều trị</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>
              <div className={styles.filterActions}>
                <button onClick={clearFilters} className={styles.clearButton}>
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className={styles.viewModeContainer}>
            <h3>Chế độ xem</h3>
            <div className={styles.viewModeToggle}>
              <button
                className={`${styles.toggleButton} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
              >
                📋 Dạng danh sách
              </button>
              <button
                className={`${styles.toggleButton} ${viewMode === 'timeline' ? styles.active : ''}`}
                onClick={() => setViewMode('timeline')}
              >
                🕒 Dạng thời gian
              </button>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <h4>Tổng số báo cáo</h4>
              <span className={styles.statNumber}>{medicalReports.length}</span>
            </div>
            <div className={styles.statCard}>
              <h4>Đang điều trị</h4>
              <span className={styles.statNumber}>
                {medicalReports.filter(r => !r.out_day || r.out_day === '').length}
              </span>
            </div>
            <div className={styles.statCard}>
              <h4>Hoàn thành</h4>
              <span className={styles.statNumber}>
                {medicalReports.filter(r => r.out_day && r.out_day !== '').length}
              </span>
            </div>
            <div className={styles.statCard}>
              <h4>Kết quả lọc</h4>
              <span className={styles.statNumber}>{filteredReports.length}</span>
            </div>
          </div>

          {/* Main Content */}
          {viewMode === 'timeline' ? (
            renderTimelineView()
          ) : (
            <div className={styles.reportsGrid}>
              <div className={styles.reportsList}>
                <h3>Medical Reports ({filteredReports.length})</h3>
                {filteredReports.length === 0 ? (
                  <div className={styles.noData}>
                    <p>No reports match your search criteria.</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div
                      key={report.record_id}
                      className={`${styles.reportCard} ${selectedReport?.record_id === report.record_id ? styles.selected : ''}`}
                      onClick={() => handleReportSelect(report)}
                    >
                      <div className={styles.reportHeader}>
                        <h4>Report #{report.record_id}</h4>
                        <span className={styles.date}>{formatDate(report.in_day)}</span>
                      </div>
                      <div className={styles.reportPreview}>
                        <p><strong>Diagnosis:</strong> {report.in_diagnosis || 'N/A'}</p>
                        <p><strong>Reason:</strong> {report.reason_in || 'N/A'}</p>
                        <div className={styles.statusBadge}>
                          {report.out_day && report.out_day !== '' ? (
                            <span className={styles.completed}>Completed</span>
                          ) : (
                            <span className={styles.active}>Active</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedReport && (
                <div className={styles.reportDetails}>
                  <div className={styles.detailsHeader}>
                    <h3>Medical Report #{selectedReport.record_id}</h3>
                    <button className={styles.closeButton} onClick={handleCloseDetails}>×</button>
                  </div>

                  <div className={styles.detailsContent}>
                    <div className={styles.section}>
                      <h4>Basic Information</h4>
                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <strong>Admission Date:</strong> {formatDate(selectedReport.in_day)}
                        </div>
                        <div className={styles.infoItem}>
                          <strong>Discharge Date:</strong> {formatDate(selectedReport.out_day)}
                        </div>
                        <div className={styles.infoItem}>
                          <strong>Reason for Visit:</strong> {selectedReport.reason_in || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className={styles.section}>
                      <h4>Diagnosis & Treatment</h4>
                      <div className={styles.infoItem}>
                        <strong>Initial Diagnosis:</strong>
                        <p>{selectedReport.in_diagnosis || 'N/A'}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <strong>Final Diagnosis:</strong>
                        <p>{selectedReport.out_diagnosis || 'N/A'}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <strong>Quá trình điều trị:</strong>
                        <p>{selectedReport.treatment_process || 'Không có'}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <strong>Ghi chú của bác sĩ:</strong>
                        <p>{selectedReport.doctor_notes || 'Không có'}</p>
                      </div>
                    </div>

                    <div className={styles.section}>
                      <h4>Chỉ số sinh tồn</h4>
                      <div className={styles.vitalSignsGrid}>
                        <div className={styles.vitalSign}>
                          <strong>Nhịp tim:</strong> {selectedReport.pulse_rate || 'Không có'}
                        </div>
                        <div className={styles.vitalSign}>
                          <strong>Nhiệt độ:</strong> {selectedReport.temperature || 'Không có'}
                        </div>
                        <div className={styles.vitalSign}>
                          <strong>Huyết áp:</strong> {selectedReport.blood_pressure || 'Không có'}
                        </div>
                        <div className={styles.vitalSign}>
                          <strong>Nhịp thở:</strong> {selectedReport.respiratory_rate || 'Không có'}
                        </div>
                        <div className={styles.vitalSign}>
                          <strong>Cân nặng:</strong> {selectedReport.weight || 'Không có'}
                        </div>
                      </div>
                    </div>

                    {selectedReport.prescription && (
                      <div className={styles.section}>
                        <h4>Đơn thuốc</h4>
                        <div className={styles.prescriptionList}>
                          {parsePrescription(selectedReport.prescription).map((med: any, index: number) => (
                            <div key={index} className={styles.medicationItem}>
                              <div className={styles.medName}>{med.name}</div>
                              <div className={styles.medDetails}>
                                <span><strong>Liều dùng:</strong> {med.dosage}</span>
                                <span><strong>Số lượng:</strong> {med.quantity}</span>
                                <span><strong>Hướng dẫn:</strong> {med.instructions}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedReport.personal_history || selectedReport.family_history) && (
                      <div className={styles.section}>
                        <h4>Tiền sử bệnh nhân</h4>
                        {selectedReport.personal_history && (
                          <div className={styles.infoItem}>
                            <strong>Tiền sử cá nhân:</strong>
                            <p>{selectedReport.personal_history}</p>
                          </div>
                        )}
                        {selectedReport.family_history && (
                          <div className={styles.infoItem}>
                            <strong>Tiền sử gia đình:</strong>
                            <p>{selectedReport.family_history}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MedicalHistory;
