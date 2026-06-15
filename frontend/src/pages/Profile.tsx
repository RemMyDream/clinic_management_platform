import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Profile.module.css';
import { userApi } from '../services/api';

// Define all possible fields for user profile
interface UserProfileForm {
    full_name: string;
    username: string;
    email: string;
    phone: string;
    phone_number?: string;
    address: string;
    password?: string;
    date_of_birth?: string;
    gender?: string;
    ethnic_group?: string;
    health_insurance_card_no?: string;
    identification_id?: string;
    job?: string;
    class_role?: string;
    // Doctor fields
    doctor_name?: string;
    major?: string;
    hospital_id?: number | string;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserProfileForm>({
        full_name: '',
        username: '',
        email: '',
        phone: '',
        address: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<UserProfileForm>({ ...userData });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await userApi.getMe();
                setUserData(res.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Không thể tải dữ liệu người dùng.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        setFormData({ ...userData });
    }, [userData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEdit = () => {
        setEditMode(true);
        setError('');
    };

    const handleCancel = () => {
        setEditMode(false);
        setFormData({ ...userData });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if ('patient_id' in userData) {
            if (formData.identification_id && !/^\d{12}$/.test(formData.identification_id)) {
                toast.error('CMND/CCCD phải bao gồm đúng 12 chữ số.');
                setLoading(false);
                return;
            }
            if (formData.health_insurance_card_no && formData.health_insurance_card_no.length < 10) {
                toast.error('Số BHYT không hợp lệ (tối thiểu 10 ký tự).');
                setLoading(false);
                return;
            }
        }

        try {
            const payload: { [key: string]: any } = { ...formData };
            if (payload.phone && !payload.phone_number) payload.phone_number = payload.phone;
            delete payload.phone;
            if (!payload.password) delete payload.password;
            Object.keys(payload).forEach((k) => { if (payload[k] === '' || payload[k] === undefined) delete payload[k]; });
            await userApi.updateMe(payload);
            setUserData((prev) => ({ ...prev, ...payload }));
            toast.success('Cập nhật hồ sơ thành công!');
            setEditMode(false);
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Không thể cập nhật hồ sơ.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Helper to safely display possibly undefined values
    const safeDisplay = (value: string | undefined) => (value && value.trim() !== '' ? value : '—');

    // Helper to render fields dynamically
    const renderProfileDetails = () => {
        if ('doctor_id' in userData) {
            // Doctor
            const doctorData = userData as any;
            return (
                <>
                    <p><strong>Tên:</strong> {safeDisplay(doctorData.doctor_name || doctorData.full_name)}</p>
                    <p><strong>Tên đăng nhập:</strong> {safeDisplay(doctorData.username)}</p>
                    <p><strong>Email:</strong> {safeDisplay(doctorData.email)}</p>
                    <p><strong>Chuyên khoa:</strong> {safeDisplay(doctorData.major)}</p>
                    <p><strong>ID bệnh viện:</strong> {safeDisplay(doctorData.hospital_id?.toString())}</p>
                </>
            );
        } else if ('patient_id' in userData) {
            // Patient
            const patientData = userData as any;
            return (
                <>
                    <p><strong>Tên:</strong> {safeDisplay(patientData.full_name)}</p>
                    <p><strong>Tên đăng nhập:</strong> {safeDisplay(patientData.username)}</p>
                    <p><strong>Email:</strong> {safeDisplay(patientData.email)}</p>
                    <p><strong>Số điện thoại:</strong> {safeDisplay(patientData.phone_number)}</p>
                    <p><strong>Địa chỉ:</strong> {safeDisplay(patientData.address)}</p>
                    <p><strong>Ngày sinh:</strong> {safeDisplay(patientData.date_of_birth)}</p>
                    <p><strong>Giới tính:</strong> {safeDisplay(patientData.gender)}</p>
                    <p><strong>Dân tộc:</strong> {safeDisplay(patientData.ethnic_group)}</p>
                    <p><strong>Số thẻ BHYT:</strong> {safeDisplay(patientData.health_insurance_card_no)}</p>
                    <p><strong>CMND/CCCD:</strong> {safeDisplay(patientData.identification_id)}</p>
                    <p><strong>Nghề nghiệp:</strong> {safeDisplay(patientData.job)}</p>
                    <p><strong>Loại đối tượng:</strong> {safeDisplay(patientData.class_role)}</p>
                </>
            );
        } else {
            // Generic user
            return (
                <>
                    <p><strong>Tên:</strong> {safeDisplay(userData.full_name)}</p>
                    <p><strong>Tên đăng nhập:</strong> {safeDisplay(userData.username)}</p>
                    <p><strong>Email:</strong> {safeDisplay(userData.email)}</p>
                    <p><strong>Số điện thoại:</strong> {safeDisplay(userData.phone)}</p>
                    <p><strong>Địa chỉ:</strong> {safeDisplay(userData.address)}</p>
                </>
            );
        }
    };

    const renderEditForm = () => {
        if ('doctor_id' in userData) {
            // Doctor edit form
            return (
                <form className={styles['profile-form']} onSubmit={handleSubmit}>
                    <label className={styles['profile-label']}>
                        Tên:
                        <input name="doctor_name" value={formData.doctor_name || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Tên đăng nhập:
                        <input name="username" value={formData.username || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Email:
                        <input name="email" value={formData.email || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Chuyên khoa:
                        <input name="major" value={formData.major || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        ID bệnh viện:
                        <input name="hospital_id" value={formData.hospital_id || ''} onChange={handleChange} className={styles['profile-input']} type="number" disabled />
                    </label>
                    <label className={styles['profile-label']}>
                        Mật khẩu mới:
                        <input name="password" type="password" value={formData.password || ''} onChange={handleChange} autoComplete="new-password" className={styles['profile-input']} />
                    </label>
                    <div className={styles['profile-form-actions']}>
                        <button type="submit" disabled={loading} className={styles['profile-button']}>Lưu</button>
                        <button type="button" onClick={handleCancel} disabled={loading} className={styles['profile-button-cancel']}>Hủy</button>
                    </div>
                </form>
            );
        } else if ('patient_id' in userData) {
            // Patient edit form (as before)
            return (
                <form className={styles['profile-form']} onSubmit={handleSubmit}>
                    <label className={styles['profile-label']}>
                        Tên:
                        <input name="full_name" value={formData.full_name} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Tên đăng nhập:
                        <input name="username" value={formData.username || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Email:
                        <input name="email" value={formData.email || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Số điện thoại:
                        <input name="phone" value={formData.phone || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Địa chỉ:
                        <input name="address" value={formData.address || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Ngày sinh:
                        <input name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} type="date" className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Giới tính:
                        <select name="gender" value={formData.gender || ''} onChange={handleChange} className={styles['profile-input']}>
                            <option value="">Chọn</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                        </select>
                    </label>
                    <label className={styles['profile-label']}>
                        Dân tộc:
                        <input name="ethnic_group" value={formData.ethnic_group || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Số thẻ BHYT:
                        <input name="health_insurance_card_no" value={formData.health_insurance_card_no || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        CMND/CCCD:
                        <input name="identification_id" value={formData.identification_id || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Nghề nghiệp:
                        <input name="job" value={formData.job || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Loại đối tượng:
                        <select name="class_role" value={formData.class_role || ''} onChange={handleChange} className={styles['profile-input']}>
                            <option value="">Chọn</option>
                            <option value="Assisted">Hỗ trợ</option>
                            <option value="Normal">Bình thường</option>
                            <option value="Free">Miễn phí</option>
                            <option value="Other">Khác</option>
                        </select>
                    </label>
                    <label className={styles['profile-label']}>
                        Mật khẩu mới:
                        <input name="password" type="password" value={formData.password || ''} onChange={handleChange} autoComplete="new-password" className={styles['profile-input']} />
                    </label>
                    <div className={styles['profile-form-actions']}>
                        <button type="submit" disabled={loading} className={styles['profile-button']}>Lưu</button>
                        <button type="button" onClick={handleCancel} disabled={loading} className={styles['profile-button-cancel']}>Hủy</button>
                    </div>
                </form>
            );
        } else {
            // Generic user edit form
            return (
                <form className={styles['profile-form']} onSubmit={handleSubmit}>
                    <label className={styles['profile-label']}>
                        Tên:
                        <input name="full_name" value={formData.full_name} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Tên đăng nhập:
                        <input name="username" value={formData.username || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Email:
                        <input name="email" value={formData.email || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Số điện thoại:
                        <input name="phone" value={formData.phone || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Địa chỉ:
                        <input name="address" value={formData.address || ''} onChange={handleChange} className={styles['profile-input']} />
                    </label>
                    <label className={styles['profile-label']}>
                        Mật khẩu mới:
                        <input name="password" type="password" value={formData.password || ''} onChange={handleChange} autoComplete="new-password" className={styles['profile-input']} />
                    </label>
                    <div className={styles['profile-form-actions']}>
                        <button type="submit" disabled={loading} className={styles['profile-button']}>Lưu</button>
                        <button type="button" onClick={handleCancel} disabled={loading} className={styles['profile-button-cancel']}>Hủy</button>
                    </div>
                </form>
            );
        }
    };

    if (loading) {
        return <div className={styles['profile-container']}>Đang tải...</div>;
    }

    if (error) {
        return <div className={styles['profile-container']}>{error}</div>;
    }

    return (
        <div className={styles['profile-container']}>
            <button onClick={() => navigate('/dashboard')} className={styles['profile-button']} style={{marginBottom: 16}}>Về trang chủ</button>
            <h1 className={styles['profile-title']}>Hồ sơ người dùng</h1>
            {error && <div className={styles['profile-error']}>{error}</div>}
            {editMode ? (
                renderEditForm()
            ) : (
                <div className={styles['profile-details']}>
                    {renderProfileDetails()}
                    <button onClick={handleEdit} className={styles['profile-button']}>Chỉnh sửa hồ sơ</button>
                </div>
            )}
        </div>
    );
};

export default Profile;