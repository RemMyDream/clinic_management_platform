import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatbotWidget from '../Chatbot/ChatbotWidget';
import styles from './AdminDashboard.module.css';
import { userApi } from '../../services/api';

interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalStaff: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalStaff: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await userApi.getAll();
      const users = res.data;
      setStats({
        totalUsers: users.length,
        totalPatients: users.filter((u: any) => u.role === 'PATIENT').length,
        totalDoctors: users.filter((u: any) => u.role === 'DOCTOR').length,
        totalStaff: users.filter((u: any) => u.role === 'CLINIC_STAFF').length,
      });
    } catch {
      setError('Không thể tải thống kê dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Bảng điều khiển quản trị viên</h2>
        <p className={styles.subtitle}>Quản lý và giám sát hoạt động phòng khám</p>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalUsers}</h3>
            <p className={styles.statLabel}>Tổng người dùng</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏥</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalPatients}</h3>
            <p className={styles.statLabel}>Bệnh nhân</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👨‍⚕️</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalDoctors}</h3>
            <p className={styles.statLabel}>Bác sĩ</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👩‍💼</div>
          <div className={styles.statInfo}>
            <h3 className={styles.statNumber}>{loading ? '...' : stats.totalStaff}</h3>
            <p className={styles.statLabel}>Nhân viên</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsSection}>
        <h3 className={styles.sectionTitle}>Hành động nhanh</h3>
        <div className={styles.actionsGrid}>
          <Link to="/dashboard/users" className={styles.actionCard}>
            <div className={styles.actionIcon}>👥</div>
            <div className={styles.actionContent}>
              <h4>Quản lý người dùng</h4>
              <p>Tạo, chỉnh sửa và quản lý tài khoản người dùng</p>
            </div>
          </Link>
          
          <Link to="/dashboard/reports" className={styles.actionCard}>
            <div className={styles.actionIcon}>📊</div>
            <div className={styles.actionContent}>
              <h4>Báo cáo & Phân tích</h4>
              <p>Xem báo cáo sử dụng hệ thống và hiệu suất</p>
            </div>
          </Link>
          
          <Link to="/dashboard/schedule-settings" className={styles.actionCard}>
            <div className={styles.actionIcon}>⚙️</div>
            <div className={styles.actionContent}>
              <h4>Cài đặt lịch trình</h4>
              <p>Cấu hình lịch trình bác sĩ và cài đặt phòng khám</p>
            </div>
          </Link>
          
          <Link to="/dashboard/logs" className={styles.actionCard}>
            <div className={styles.actionIcon}>🗂️</div>
            <div className={styles.actionContent}>
              <h4>Nhật ký hệ thống</h4>
              <p>Theo dõi hoạt động hệ thống và khắc phục sự cố</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity & AI Assistant */}
      <div className={styles.gridLayout}>
        <div className={styles.activitySection}>
          <h3 className={styles.sectionTitle}>Tổng quan hệ thống</h3>
          <div className={styles.activityCard}>
            <p>✅ Hệ thống đang hoạt động ổn định</p>
            <p>📈 Hoạt động người dùng bình thường</p>
            <p>🛡️ Tất cả kiểm tra bảo mật đã vượt qua</p>
            <p>💾 Sao lưu cơ sở dữ liệu đã cập nhật</p>
          </div>
        </div>

        <div className={styles.activitySection}>
          <h3 className={styles.sectionTitle}>🤖 Trợ lý AI y tế (Quản trị)</h3>
          <div className={styles.chatCard}>
            <p className={styles.chatDescription}>
              Trò chuyện với trợ lý AI phòng khám để được hỗ trợ quản trị hệ thống, tra cứu thông tin vận hành phòng khám hoặc nhập ID bệnh nhân để xem EMR.
            </p>
            <div className={styles.flexGrow}>
              <ChatbotWidget
                userRole="ADMIN"
                isAuthenticated={true}
                position="inline"
                placeholder="Hỏi về quản trị hệ thống, tài khoản hoặc nhập ID bệnh nhân..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
