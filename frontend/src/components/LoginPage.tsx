import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css';
import { toast } from 'react-toastify';
import api from '../services/api';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/auth/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data.access_token) {
                localStorage.setItem('accessToken', response.data.access_token);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('user_id', response.data.user_id);
                toast.success('Đăng nhập thành công!');

                if (response.data.role === 'PATIENT') {
                    try {
                        const patientRes = await api.get(`/patients/${response.data.user_id}`);
                        if (!patientRes.data.phone_number && !patientRes.data.date_of_birth) {
                            navigate('/complete-profile');
                            return;
                        }
                    } catch {
                        navigate('/complete-profile');
                        return;
                    }
                }
                navigate('/dashboard');
            }
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                if (status === 401 || status === 403) {
                    setError('Sai tài khoản hoặc mật khẩu. Vui lòng thử lại.');
                    toast.error('Sai tài khoản hoặc mật khẩu.');
                } else {
                    const msg = `Đăng nhập thất bại: ${err.response.data.detail || 'Lỗi máy chủ'}`;
                    setError(msg);
                    toast.error(msg);
                }
            } else {
                setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
                toast.error('Không thể kết nối đến máy chủ.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <div className={styles.brandContent}>
                    <div className={styles.brandIcon}>
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <rect width="48" height="48" rx="12" fill="white" fillOpacity="0.2"/>
                            <path d="M24 12v24M12 24h24" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <h1 className={styles.brandTitle}>Nền tảng quản lý phòng khám</h1>
                    <p className={styles.brandSub}>Quản lý lịch hẹn, hồ sơ bệnh nhân và hoạt động y tế một cách chuyên nghiệp, hiệu quả.</p>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>&#128197;</span>
                            <span>Đặt lịch khám nhanh chóng</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>&#128203;</span>
                            <span>Quản lý hồ sơ bệnh án</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>&#128172;</span>
                            <span>Trợ lý AI hỗ trợ 24/7</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.card}>
                    <h2 className={styles.heading}>Đăng nhập</h2>
                    <p className={styles.subHeading}>Chào mừng bạn quay trở lại</p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="username" className={styles.label}>Email</label>
                            <input type="text" id="username" value={username}
                                onChange={(e) => setUsername(e.target.value)} required
                                className={styles.input} placeholder="Nhập email" />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>Mật khẩu</label>
                            <input type="password" id="password" value={password}
                                onChange={(e) => setPassword(e.target.value)} required
                                className={styles.input} placeholder="Nhập mật khẩu" />
                        </div>

                        {error && <p className={styles.errorText}>{error}</p>}

                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>

                        <div className={styles.divider}>
                            <span>hoặc đăng nhập với</span>
                        </div>

                        <div className={styles.socialRow}>
                            <button type="button" className={styles.socialBtn} onClick={() => toast.info('Tính năng đang phát triển')}>
                                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.5 33.1 29.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 5.8 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 5.8 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5 0 9.5-1.7 13.1-4.5l-6-5.2C29.1 36 26.7 36.8 24 36.8c-5 0-9.4-3-11.2-7.2l-6.5 5C9.5 40.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6 5.2C36.7 39.1 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
                                <span>Google</span>
                            </button>
                            <button type="button" className={styles.socialBtn} onClick={() => toast.info('Tính năng đang phát triển')}>
                                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#1877F2" d="M24 4C12.9 4 4 12.9 4 24c0 10 7.3 18.2 16.9 19.7V30.1h-5.1V24h5.1v-4.6c0-5 3-7.8 7.5-7.8 2.2 0 4.5.4 4.5.4v5h-2.5c-2.5 0-3.3 1.6-3.3 3.2V24h5.6l-.9 6.1h-4.7v13.6C36.7 42.2 44 34 44 24 44 12.9 35.1 4 24 4z"/></svg>
                                <span>Facebook</span>
                            </button>
                        </div>

                        <div className={styles.links}>
                            <Link to="/forgot-password" className={styles.link}>Quên mật khẩu?</Link>
                            <Link to="/register" className={styles.link}>Tạo tài khoản mới</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
