import axios from 'axios';

const BASE_URL = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/token')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Typed helpers ─────────────────────────────────────────────────────

export const appointmentApi = {
  getMyAppointments: () => api.get('/appointments/me'),
  getAll: (skip = 0, limit = 100) => api.get('/appointments/', { params: { skip, limit } }),
  getById: (id: number) => api.get(`/appointments/${id}`),
  book: (payload: object) => api.post('/appointments/book', payload),
  update: (id: number, payload: object) => api.put(`/appointments/${id}`, payload),
  cancel: (id: number) => api.post(`/appointments/${id}/cancel`),
  confirm: (id: number) => api.post(`/appointments/${id}/confirm`),
  accept: (id: number) => api.post(`/appointments/${id}/accept`),
  complete: (id: number) => api.post(`/appointments/${id}/complete`),
  delete: (id: number) => api.delete(`/appointments/${id}`),
  getAvailableSlots: (day: string) => api.get('/appointments/available', { params: { day } }),
  getAvailableRange: (start_date: string, end_date: string) =>
    api.get('/appointments/available-range', { params: { start_date, end_date } }),
};

export const prescriptionApi = {
  getByPatient: (patientId: number) => api.get(`/prescriptions/by-patient/${patientId}`),
  getByReport: (reportId: number) => api.get(`/prescriptions/by-report/${reportId}`),
  getById: (id: number) => api.get(`/prescriptions/${id}`),
  create: (payload: object) => api.post('/prescriptions/', payload),
  update: (id: number, payload: object) => api.put(`/prescriptions/${id}`, payload),
  delete: (id: number) => api.delete(`/prescriptions/${id}`),
};

export const patientApi = {
  getAll: (skip = 0, limit = 100) => api.get('/patients/', { params: { skip, limit } }),
  getById: (id: number) => api.get(`/patients/${id}`),
  create: (payload: object) => api.post('/patients/', payload),
  update: (id: number, payload: object) => api.put(`/patients/${id}`, payload),
  delete: (id: number) => api.delete(`/patients/${id}`),
  search: (payload: object) => api.post('/patients/search', payload),
  updateEmr: (id: number, emr_summary: string) => api.put(`/patients/${id}/emr`, { emr_summary }),
};

export const doctorApi = {
  getAll: (skip = 0, limit = 100) => api.get('/doctors/', { params: { skip, limit } }),
  getById: (id: number) => api.get(`/doctors/${id}`),
  getBySpecialty: (specialty: string) => api.get('/doctors/', { params: { specialty } }),
};

export const medicalReportApi = {
  getAll: () => api.get('/medical_reports/'),
  getById: (id: number) => api.get(`/medical_reports/${id}`),
  create: (payload: object) => api.post('/medical_reports/', payload),
  update: (id: number, payload: object) => api.put(`/medical_reports/${id}`, payload),
  delete: (id: number) => api.delete(`/medical_reports/${id}`),
  search: (params: object) => api.get('/medical_reports/search', { params }),
};

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (payload: object) => api.put('/users/me', payload),
  getAll: () => api.get('/users/'),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (payload: object) => api.post('/users/', payload),
  update: (id: number, payload: object) => api.put(`/users/${id}`, payload),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const otcApi = {
  getAll: () => api.get('/otc_medications/'),
  getByPatient: (patientId: number) => api.get(`/otc_medications/by-patient/${patientId}`),
  create: (payload: object) => api.post('/otc_medications/', payload),
  update: (id: number, payload: object) => api.put(`/otc_medications/${id}`, payload),
  delete: (id: number) => api.delete(`/otc_medications/${id}`),
};

export const provinceApi = {
  getAll: () => api.get('/provinces/'),
  getDistricts: (provinceId: number) => api.get(`/provinces/${provinceId}/districts`),
};

export const chatApi = {
  sendPublic: (message: string) => api.post('/chat/public', { message }),
  sendPatient: (message: string) => api.post('/chat/patient', { message }),
  sendStaff: (patient_id: number, message: string) => api.post('/chat/send', { patient_id, message }),
  getHistory: (skip = 0, limit = 50) => api.get('/chat/history', { params: { skip, limit } }),
};

