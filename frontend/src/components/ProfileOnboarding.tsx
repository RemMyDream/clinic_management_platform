import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { patientApi, provinceApi } from '../services/api';
import styles from './ProfileOnboarding.module.css';

const ETHNIC_GROUPS = [
  "Kinh","Tày","Thái","Mường","Khmer","Hoa","Nùng","H'Mông","Dao","Gia Rai",
  "Ê Đê","Ba Na","Sán Chay","Chăm","Xơ Đăng","Sán Dìu","Hrê","Cơ Ho","Ra Glai",
  "Mnông","Thổ","Xtiêng","Khơ Mú","Bru-Vân Kiều","Cơ Tu","Giáy","Tà Ôi","Mạ",
  "Giẻ Triêng","Co","Chơ Ro","Xinh Mun","Hà Nhì","Chu Ru","Lào","La Chí","Kháng",
  "Phù Lá","La Hủ","La Ha","Pà Thẻn","Lự","Ngái","Chứt","Lô Lô","Mảng","Cờ Lao",
  "Bố Y","Cống","Si La","Pu Péo","Rơ Măm","Brâu","Ơ Đu","Người nước ngoài","Khác",
];

const OCCUPATIONS = [
  "Giáo viên","Bác sĩ","Kỹ sư","Công nhân","Nông dân","Sinh viên","Học sinh",
  "Kinh doanh","Nội trợ","Lái xe","Công chức","Sĩ quan","Hưu trí","Khác",
];

type Province = { id: number; name: string };
type District = { id: number; name: string };

const ProfileOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [personal, setPersonal] = useState({
    full_name: '',
    date_of_birth: '',
    email: '',
    phone_number: '',
    gender: '',
    identification_id: '',
    health_insurance_card_no: '',
  });

  const [address, setAddress] = useState({
    country: 'Việt Nam',
    ethnic_group: 'Kinh',
    job: '',
    province_id: 0,
    district: '',
    detail_address: '',
  });

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      patientApi.getById(Number(userId))
        .then((res) => {
          if (res.data.full_name) setPersonal((p) => ({ ...p, full_name: res.data.full_name }));
          if (res.data.email) setPersonal((p) => ({ ...p, email: res.data.email }));
        })
        .catch(() => {});
    }
    provinceApi.getAll()
      .then((res) => setProvinces(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (address.province_id) {
      provinceApi.getDistricts(address.province_id)
        .then((res) => setDistricts(res.data))
        .catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [address.province_id]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!personal.full_name || !personal.date_of_birth || !personal.phone_number || !personal.gender || !personal.identification_id) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
        return;
      }
      if (!/^\d{12}$/.test(personal.identification_id)) {
        toast.error('CMND/CCCD phải bao gồm đúng 12 chữ số.');
        return;
      }
      if (personal.health_insurance_card_no && personal.health_insurance_card_no.length < 10) {
        toast.error('Số BHYT không hợp lệ (tối thiểu 10 ký tự).');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const userId = Number(localStorage.getItem('user_id'));
      const parts = personal.date_of_birth.split('/');
      let dobISO = personal.date_of_birth;
      if (parts.length === 3) {
        dobISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      const provinceName = provinces.find((p) => p.id === address.province_id)?.name || '';
      const fullAddress = [address.detail_address, address.district, provinceName, address.country]
        .filter(Boolean).join(', ');

      await patientApi.update(userId, {
        full_name: personal.full_name,
        date_of_birth: dobISO,
        gender: personal.gender,
        phone_number: personal.phone_number,
        email: personal.email || undefined,
        identification_id: personal.identification_id,
        health_insurance_card_no: personal.health_insurance_card_no || undefined,
        ethnic_group: address.ethnic_group,
        job: address.job,
        address: fullAddress,
      });

      toast.success('Hoàn thiện thông tin thành công!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể cập nhật thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Hoàn thiện thông tin tài khoản</h1>

        <div className={styles.steps}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.stepActive : ''} ${currentStep > 1 ? styles.stepDone : ''}`}>
            <span className={styles.stepNum}>{currentStep > 1 ? '✓' : '1'}</span>
            <span className={styles.stepLabel}>Thông tin cá nhân</span>
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${currentStep >= 2 ? styles.stepActive : ''}`}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepLabel}>Địa chỉ & bổ sung</span>
          </div>
        </div>

        {currentStep === 1 && (
          <div className={styles.formSection}>
            <div className={styles.field}>
              <label>Họ và tên <span className={styles.required}>*</span></label>
              <input type="text" value={personal.full_name} placeholder="Nhập họ và tên"
                onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Ngày sinh (DD/MM/YYYY) <span className={styles.required}>*</span></label>
              <input type="text" value={personal.date_of_birth} placeholder="25/10/2004"
                onChange={(e) => setPersonal({ ...personal, date_of_birth: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Email (tùy chọn)</label>
              <input type="email" value={personal.email} placeholder="email@example.com"
                onChange={(e) => setPersonal({ ...personal, email: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Số điện thoại <span className={styles.required}>*</span></label>
              <input type="tel" value={personal.phone_number} placeholder="0xx xxxx xxx"
                maxLength={10}
                onChange={(e) => setPersonal({ ...personal, phone_number: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Giới tính <span className={styles.required}>*</span></label>
              <select value={personal.gender}
                onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}>
                <option value="">Chọn giới tính</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Số CMND / CCCD <span className={styles.required}>*</span></label>
              <input type="text" value={personal.identification_id} placeholder="Nhập 12 số CCCD"
                maxLength={12}
                onChange={(e) => setPersonal({ ...personal, identification_id: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Số thẻ BHYT (tùy chọn)</label>
              <input type="text" value={personal.health_insurance_card_no} placeholder="Mã số bảo hiểm y tế"
                onChange={(e) => setPersonal({ ...personal, health_insurance_card_no: e.target.value })} />
            </div>
            <button className={styles.primaryBtn} onClick={handleNext}>Tiếp tục</button>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.formSection}>
            <div className={styles.field}>
              <label>Quốc gia</label>
              <input type="text" value={address.country} readOnly />
            </div>
            <div className={styles.field}>
              <label>Dân tộc</label>
              <select value={address.ethnic_group}
                onChange={(e) => setAddress({ ...address, ethnic_group: e.target.value })}>
                {ETHNIC_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Nghề nghiệp</label>
              <select value={address.job}
                onChange={(e) => setAddress({ ...address, job: e.target.value })}>
                <option value="">Chọn nghề nghiệp</option>
                {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Tỉnh / Thành phố</label>
              <select value={address.province_id}
                onChange={(e) => setAddress({ ...address, province_id: Number(e.target.value), district: '' })}>
                <option value={0}>Chọn tỉnh/thành phố</option>
                {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {districts.length > 0 && (
              <div className={styles.field}>
                <label>Phường / Xã</label>
                <select value={address.district}
                  onChange={(e) => setAddress({ ...address, district: e.target.value })}>
                  <option value="">Chọn phường/xã</option>
                  {districts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            )}
            <div className={styles.field}>
              <label>Địa chỉ chi tiết</label>
              <input type="text" value={address.detail_address} placeholder="Số nhà, đường..."
                onChange={(e) => setAddress({ ...address, detail_address: e.target.value })} />
            </div>
            <div className={styles.btnRow}>
              <button className={styles.secondaryBtn} onClick={handleBack}>Quay lại</button>
              <button className={styles.primaryBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Hoàn tất'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileOnboarding;
