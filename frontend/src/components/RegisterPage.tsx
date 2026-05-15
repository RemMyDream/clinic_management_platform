import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

import styles from './RegisterPage.module.css';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [mail, setMail] = useState('');
    const [password, setPassword] = useState('');
    const [fullname, setFullname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/register', {
                username,
                email: mail,
                password,
                full_name: fullname,
            });

            if (response.status === 201 || response.status === 200) {
                toast.success('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
                setTimeout(() => {
                    navigate('/login');
                }, 1000);
            }
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                const detail = err.response.data.detail;

                if (Array.isArray(detail)) {
                    // Join all error messages into a single string
                    setError(detail.map((e: any) => e.msg).join(' | '));
                } else {
                    setError(detail || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
                }
            }
            console.error("Register error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.heading}>Đăng ký tài khoản</h2>
                <p className={styles.subHeading}>Tạo tài khoản bệnh nhân</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username" className={styles.label}>Tên đăng nhập</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="Nhập tên đăng nhập"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="mail" className={styles.label}>Email</label>
                        <input
                            type="email"
                            id="mail"
                            value={mail}
                            onChange={(e) => setMail(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="Nhập email"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="fullname" className={styles.label}>Họ và tên</label>
                        <input
                            type="text"
                            id="fullname"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="Nhập họ và tên"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>Mật khẩu</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="Nhập mật khẩu"
                        />
                    </div>

                    {error && (
                        <p className={styles.errorText}>{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.button}
                        style={{backgroundColor: '#28a745' }}
                    >
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>

                    <button
                        type="button"
                        onClick={handleLogin}
                        className={styles.button}
                        style={{backgroundColor: '#6c757d' }}
                    >
                        Đã có tài khoản? Đăng nhập
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;