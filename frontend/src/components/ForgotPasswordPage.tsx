import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './ForgotPasswordPage.module.css';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post(BACKEND_URL + '/password/forgot-password/', { email });
            setMessage(response.data.message);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || 'Không thể gửi liên kết đặt lại. Vui lòng thử lại.');
            } else {
                setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
            }
            console.error("Forgot password error:", err);
        }
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.heading}>Quên mật khẩu</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <p className={styles.subHeading}>Nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu.</p>

                    
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={styles.input}
                        placeholder="Nhập Email"
                    />

                    {message && <p style={{ color: 'green', textAlign: 'center', margin: '0' }}>{message}</p>}
                    {error && <p style={{ color: 'red', textAlign: 'center', margin: '0' }}>{error}</p>}
                    <button type="submit" disabled={loading} className={styles.button} style={{ backgroundColor: '#007bff' }}>
                        {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                    </button>
                </form>
                <div style={{ marginTop: '16px' }}>
                    <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Quay lại Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
