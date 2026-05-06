import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from './SystemLogs.module.css';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  category: 'AUTH' | 'APPOINTMENT' | 'USER' | 'SYSTEM' | 'DATABASE' | 'API';
  message: string;
  details?: string;
  userId?: number;
  ipAddress?: string;
}

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchSystemLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, levelFilter, categoryFilter, searchTerm, dateFilter]);

  const fetchSystemLogs = async () => {
    try {
      
      // Since there might not be a logs endpoint, we'll simulate logs based on user activities
      // In a real system, this would fetch from an actual logging service
      
      // For demonstration, we'll create mock logs based on recent activities
      const mockLogs = generateMockLogs();
      setLogs(mockLogs);
      
    } catch (err: any) {
      console.error('Error fetching system logs:', err);
      setError('Không thể tải nhật ký hệ thống');
      toast.error('Không thể tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const generateMockLogs = (): LogEntry[] => {
    const levels: LogEntry['level'][] = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
    const categories: LogEntry['category'][] = ['AUTH', 'APPOINTMENT', 'USER', 'SYSTEM', 'DATABASE', 'API'];
    
    const mockMessages = {
      AUTH: [
        'Đăng nhập thành công',
        'Thất bại khi đăng nhập',
        'Yêu cầu đặt lại mật khẩu',
        'Đăng xuất người dùng',
        'Token xác thực đã hết hạn'
      ],
      APPOINTMENT: [
        'Cuộc hẹn đã được tạo',
        'Cuộc hẹn đã được hủy',
        'Cuộc hẹn đã được cập nhật',
        'Nhắc nhở cuộc hẹn đã được gửi',
        'Cuộc hẹn đã hoàn thành'
      ],
      USER: [
        'Hồ sơ người dùng đã được cập nhật',
        'Người dùng mới đã đăng ký',
        'Vai trò người dùng đã được thay đổi',
        'Tài khoản người dùng đã bị vô hiệu hóa',
        'Quyền người dùng đã được sửa đổi'
      ],
      SYSTEM: [
        'Sao lưu hệ thống đã hoàn thành',
        'Bảo trì cơ sở dữ liệu đã bắt đầu',
        'Khởi động lại máy chủ',
        'Cấu hình hệ thống đã được cập nhật',
        'Cảnh báo giám sát hiệu suất'
      ],
      DATABASE: [
        'Kết nối cơ sở dữ liệu đã được thiết lập',
        'Thực thi truy vấn đã hoàn thành',
        'Bản sao lưu cơ sở dữ liệu đã được tạo',
        'Tối ưu hóa chỉ mục đã hoàn thành',
        'Lỗi cơ sở dữ liệu đã xảy ra'
      ],
      API: [
        'Yêu cầu API đã được xử lý',
        'Vượt quá giới hạn tốc độ',
        'Điểm cuối API đã được truy cập',
        'Xác thực yêu cầu thất bại',
        'Vượt quá ngưỡng thời gian phản hồi'
      ]
    };

    const logs: LogEntry[] = [];
    
    for (let i = 0; i < 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const messages = mockMessages[category];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      logs.push({
        id: `log-${i}`,
        timestamp: date.toISOString(),
        level,
        category,
        message,
        details: level === 'ERROR' ? 'Chi tiết lỗi và stack trace sẽ xuất hiện ở đây' : undefined,
        userId: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 1 : undefined,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`
      });
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(log => 
        log.timestamp.split('T')[0] === dateFilter
      );
    }

    setFilteredLogs(filtered);
  };

  const clearLogs = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả nhật ký không? Hành động này không thể hoàn tác.')) {
      try {
        setLogs([]);
        setFilteredLogs([]);
        toast.success('Nhật ký đã được xóa thành công');
      } catch (err: any) {
        console.error('Error clearing logs:', err);
        toast.error('Không thể xóa nhật ký');
      }
    }
  };

  const exportLogs = () => {
    const csvContent = [
      'Thời gian,Mức độ,Danh mục,Tin nhắn,ID Người dùng,Địa chỉ IP',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.category}","${log.message}","${log.userId || ''}","${log.ipAddress || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nhat-ky-he-thong-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Nhật ký đã được xuất thành công!');
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'ERROR': return '#e74c3c';
      case 'WARNING': return '#f39c12';
      case 'INFO': return '#3498db';
      case 'DEBUG': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  const getCategoryIcon = (category: LogEntry['category']) => {
    switch (category) {
      case 'AUTH': return '🔐';
      case 'APPOINTMENT': return '📅';
      case 'USER': return '👤';
      case 'SYSTEM': return '⚙️';
      case 'DATABASE': return '🗄️';
      case 'API': return '🔌';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải nhật ký hệ thống...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Nhật ký Hệ thống</h2>
        <div className={styles.headerActions}>
          <button onClick={exportLogs} className={styles.exportButton}>
            Xuất Nhật ký
          </button>
          <button onClick={clearLogs} className={styles.clearButton}>
            Xóa Nhật ký
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Mức độ:</label>
          <select 
            value={levelFilter} 
            onChange={(e) => setLevelFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">Tất cả Mức độ</option>
            <option value="ERROR">Lỗi</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="INFO">Thông tin</option>
            <option value="DEBUG">Debug</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Danh mục:</label>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">Tất cả Danh mục</option>
            <option value="AUTH">Xác thực</option>
            <option value="APPOINTMENT">Cuộc hẹn</option>
            <option value="USER">Quản lý Người dùng</option>
            <option value="SYSTEM">Hệ thống</option>
            <option value="DATABASE">Cơ sở dữ liệu</option>
            <option value="API">API</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Ngày:</label>
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Tìm kiếm:</label>
          <input 
            type="text"
            placeholder="Tìm kiếm nhật ký..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.filterInput}
          />
        </div>
      </div>

      {/* Log Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Tổng cộng:</span>
          <span className={styles.summaryValue}>{filteredLogs.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Lỗi:</span>
          <span className={styles.summaryValue} style={{ color: '#e74c3c' }}>
            {filteredLogs.filter(log => log.level === 'ERROR').length}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Cảnh báo:</span>
          <span className={styles.summaryValue} style={{ color: '#f39c12' }}>
            {filteredLogs.filter(log => log.level === 'WARNING').length}
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <div className={styles.logsContainer}>
        {filteredLogs.length === 0 ? (
          <div className={styles.noLogs}>Không tìm thấy nhật ký nào phù hợp với tiêu chí của bạn.</div>
        ) : (
          <div className={styles.logsList}>
            {filteredLogs.map((log) => (
              <div key={log.id} className={styles.logEntry}>
                <div className={styles.logHeader}>
                  <div className={styles.logMeta}>
                    <span className={styles.logIcon}>{getCategoryIcon(log.category)}</span>
                    <span 
                      className={styles.logLevel}
                      style={{ backgroundColor: getLevelColor(log.level) }}
                    >
                      {log.level}
                    </span>
                    <span className={styles.logCategory}>{log.category}</span>
                    <span className={styles.logTimestamp}>
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {log.userId && (
                    <span className={styles.logUserId}>Người dùng: {log.userId}</span>
                  )}
                </div>
                <div className={styles.logMessage}>{log.message}</div>
                {log.details && (
                  <div className={styles.logDetails}>{log.details}</div>
                )}
                {log.ipAddress && (
                  <div className={styles.logIp}>IP: {log.ipAddress}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
