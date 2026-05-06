import React, { useState, useEffect } from 'react';
import { userApi } from '../../services/api';
import { toast } from 'react-toastify';
import styles from './ScheduleSettings.module.css';


interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

interface DaySettings {
  dayOfWeek: string;
  isEnabled: boolean;
  timeSlots: TimeSlot[];
}

interface Doctor {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
}

interface ClinicSettings {
  appointmentDuration: number; // in minutes
  bufferTime: number; // buffer between appointments in minutes
  advanceBookingDays: number; // how many days in advance can appointments be booked
  maxAppointmentsPerDay: number;
  allowWeekendAppointments: boolean;
  holidayDates: string[]; // array of holiday dates in YYYY-MM-DD format
}

const ScheduleSettings: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySettings[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>({
    appointmentDuration: 30,
    bufferTime: 5,
    advanceBookingDays: 30,
    maxAppointmentsPerDay: 20,
    allowWeekendAppointments: false,
    holidayDates: []
  });
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const daysOfWeek = [
    'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'
  ];

  useEffect(() => {
    fetchDoctors();
    loadClinicSettings();
    initializeWeeklySchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await userApi.getAll();
      const doctorUsers = response.data.filter((user: any) => user.role === 'DOCTOR');
      setDoctors(doctorUsers);
      
      if (doctorUsers.length > 0) {
        setSelectedDoctor(doctorUsers[0].user_id);
      }
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      setError('Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const loadClinicSettings = () => {
    // In a real application, this would load from the backend
    // For now, we'll use localStorage or default values
    const savedSettings = localStorage.getItem('clinicSettings');
    if (savedSettings) {
      setClinicSettings(JSON.parse(savedSettings));
    }
  };

  const initializeWeeklySchedule = () => {
    const defaultSchedule: DaySettings[] = daysOfWeek.map(day => ({
      dayOfWeek: day,
      isEnabled: !['Thứ Bảy', 'Chủ Nhật'].includes(day),
      timeSlots: [
        {
          id: `${day}-morning`,
          startTime: '09:00',
          endTime: '12:00',
          isEnabled: true
        },
        {
          id: `${day}-afternoon`,
          startTime: '14:00',
          endTime: '17:00',
          isEnabled: true
        }
      ]
    }));
    
    setWeeklySchedule(defaultSchedule);
  };

  const updateDayEnabled = (dayIndex: number, enabled: boolean) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex].isEnabled = enabled;
    setWeeklySchedule(newSchedule);
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, updates: Partial<TimeSlot>) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex].timeSlots[slotIndex] = {
      ...newSchedule[dayIndex].timeSlots[slotIndex],
      ...updates
    };
    setWeeklySchedule(newSchedule);
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSchedule = [...weeklySchedule];
    const newSlot: TimeSlot = {
      id: `${newSchedule[dayIndex].dayOfWeek}-${Date.now()}`,
      startTime: '09:00',
      endTime: '10:00',
      isEnabled: true
    };
    newSchedule[dayIndex].timeSlots.push(newSlot);
    setWeeklySchedule(newSchedule);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setWeeklySchedule(newSchedule);
  };

  const updateClinicSettings = (updates: Partial<ClinicSettings>) => {
    setClinicSettings(prev => ({ ...prev, ...updates }));
  };

  const addHoliday = () => {
    if (newHolidayDate && !clinicSettings.holidayDates.includes(newHolidayDate)) {
      updateClinicSettings({
        holidayDates: [...clinicSettings.holidayDates, newHolidayDate].sort()
      });
      setNewHolidayDate('');
      toast.success('Đã thêm ngày nghỉ lễ');
    }
  };

  const removeHoliday = (dateToRemove: string) => {
    updateClinicSettings({
      holidayDates: clinicSettings.holidayDates.filter(date => date !== dateToRemove)
    });
    toast.success('Đã xóa ngày nghỉ lễ');
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In a real application, this would save to the backend
      // For now, we'll save to localStorage
      localStorage.setItem('clinicSettings', JSON.stringify(clinicSettings));
      localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
      
      toast.success('Cài đặt đã được lưu thành công!');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả cài đặt về giá trị mặc định không?')) {
      initializeWeeklySchedule();
      setClinicSettings({
        appointmentDuration: 30,
        bufferTime: 5,
        advanceBookingDays: 30,
        maxAppointmentsPerDay: 20,
        allowWeekendAppointments: false,
        holidayDates: []
      });
      toast.success('Cài đặt đã được đặt lại về giá trị mặc định');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải cài đặt lịch trình...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Cài đặt Lịch trình</h2>
        <div className={styles.headerActions}>
          <button onClick={resetToDefault} className={styles.resetButton}>
            Đặt lại mặc định
          </button>
          <button 
            onClick={saveSettings} 
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Doctor Selection */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cấu hình Lịch trình Bác sĩ</h3>
        <div className={styles.doctorSelection}>
          <label htmlFor="doctor-select">Chọn Bác sĩ:</label>
          <select
            id="doctor-select"
            value={selectedDoctor || ''}
            onChange={(e) => setSelectedDoctor(Number(e.target.value))}
            className={styles.doctorSelect}
          >
            <option value="">Chọn một bác sĩ...</option>
            {doctors.map(doctor => (
              <option key={doctor.user_id} value={doctor.user_id}>
                {doctor.full_name} ({doctor.username})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Lịch trình Hàng tuần</h3>
        <div className={styles.weeklySchedule}>
          {weeklySchedule.map((day, dayIndex) => (
            <div key={day.dayOfWeek} className={styles.dayCard}>
              <div className={styles.dayHeader}>
                <div className={styles.dayTitle}>
                  <input
                    type="checkbox"
                    checked={day.isEnabled}
                    onChange={(e) => updateDayEnabled(dayIndex, e.target.checked)}
                    className={styles.dayCheckbox}
                  />
                  <span className={day.isEnabled ? styles.dayEnabled : styles.dayDisabled}>
                    {day.dayOfWeek}
                  </span>
                </div>
                {day.isEnabled && (
                  <button
                    onClick={() => addTimeSlot(dayIndex)}
                    className={styles.addSlotButton}
                  >
                    + Thêm Khung giờ
                  </button>
                )}
              </div>
              
              {day.isEnabled && (
                <div className={styles.timeSlots}>
                  {day.timeSlots.map((slot, slotIndex) => (
                    <div key={slot.id} className={styles.timeSlot}>
                      <input
                        type="checkbox"
                        checked={slot.isEnabled}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { isEnabled: e.target.checked })}
                        className={styles.slotCheckbox}
                      />
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { startTime: e.target.value })}
                        className={styles.timeInput}
                        disabled={!slot.isEnabled}
                      />
                      <span className={styles.timeSeparator}>đến</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(dayIndex, slotIndex, { endTime: e.target.value })}
                        className={styles.timeInput}
                        disabled={!slot.isEnabled}
                      />
                      <button
                        onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                        className={styles.removeSlotButton}
                        disabled={day.timeSlots.length <= 1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Clinic Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cài đặt Chung của Phòng khám</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.settingItem}>
            <label htmlFor="appointment-duration">Thời lượng Cuộc hẹn (phút):</label>
            <input
              id="appointment-duration"
              type="number"
              min="15"
              max="120"
              step="15"
              value={clinicSettings.appointmentDuration}
              onChange={(e) => updateClinicSettings({ appointmentDuration: Number(e.target.value) })}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="buffer-time">Thời gian Nghỉ giữa các Cuộc hẹn (phút):</label>
            <input
              id="buffer-time"
              type="number"
              min="0"
              max="30"
              step="5"
              value={clinicSettings.bufferTime}
              onChange={(e) => updateClinicSettings({ bufferTime: Number(e.target.value) })}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="advance-booking">Số ngày Đặt trước:</label>
            <input
              id="advance-booking"
              type="number"
              min="1"
              max="365"
              value={clinicSettings.advanceBookingDays}
              onChange={(e) => updateClinicSettings({ advanceBookingDays: Number(e.target.value) })}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="max-appointments">Số Cuộc hẹn Tối đa Mỗi ngày:</label>
            <input
              id="max-appointments"
              type="number"
              min="1"
              max="100"
              value={clinicSettings.maxAppointmentsPerDay}
              onChange={(e) => updateClinicSettings({ maxAppointmentsPerDay: Number(e.target.value) })}
              className={styles.settingInput}
            />
          </div>

          <div className={styles.settingItem}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={clinicSettings.allowWeekendAppointments}
                onChange={(e) => updateClinicSettings({ allowWeekendAppointments: e.target.checked })}
                className={styles.settingCheckbox}
              />
              Cho phép Cuộc hẹn Cuối tuần
            </label>
          </div>
        </div>
      </div>

      {/* Holiday Management */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Quản lý Ngày nghỉ lễ</h3>
        <div className={styles.holidaySection}>
          <div className={styles.addHoliday}>
            <input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className={styles.holidayInput}
            />
            <button onClick={addHoliday} className={styles.addHolidayButton}>
              Thêm Ngày nghỉ lễ
            </button>
          </div>
          
          <div className={styles.holidayList}>
            {clinicSettings.holidayDates.length === 0 ? (
              <p className={styles.noHolidays}>Chưa cấu hình ngày nghỉ lễ nào</p>
            ) : (
              clinicSettings.holidayDates.map(date => (
                <div key={date} className={styles.holidayItem}>
                  <span className={styles.holidayDate}>
                    {new Date(date).toLocaleDateString('vi-VN')}
                  </span>
                  <button
                    onClick={() => removeHoliday(date)}
                    className={styles.removeHolidayButton}
                  >
                    Xóa
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSettings;
