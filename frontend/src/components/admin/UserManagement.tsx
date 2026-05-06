import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { UserRole } from '../../types/UserType';
import styles from './UserManagement.module.css';
import { userApi } from '../../services/api';

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
}

interface CreateUserForm {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

interface EditUserForm {
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'PATIENT'
  });
  
  const [editForm, setEditForm] = useState<EditUserForm>({
    username: '',
    email: '',
    full_name: '',
    role: 'PATIENT'
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userApi.getAll();
      setUsers(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.create(createForm);
      toast.success('Tạo người dùng thành công!');
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', full_name: '', password: '', role: 'PATIENT' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Tạo người dùng thất bại.');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    try {
      await userApi.update(userToEdit.user_id, editForm);
      toast.success('Cập nhật người dùng thành công!');
      setShowEditModal(false);
      setUserToEdit(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Cập nhật người dùng thất bại.');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await userApi.delete(userId);
      toast.success('Xóa người dùng thành công!');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Xóa người dùng thất bại.');
    }
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setEditForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
    setShowEditModal(true);
  };

  // Filter users based on search term and selected role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return styles.roleAdmin;
      case 'DOCTOR': return styles.roleDoctor;
      case 'CLINIC_STAFF': return styles.roleStaff;
      case 'PATIENT': return styles.rolePatient;
      default: return styles.roleDefault;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải danh sách người dùng...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Quản lý người dùng</h2>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateModal(true)}
        >
          Tạo người dùng mới
        </button>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Tìm kiếm người dùng theo tên đăng nhập, email hoặc họ tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterContainer}>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'ALL')}
            className={styles.roleFilter}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="PATIENT">Bệnh nhân</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="CLINIC_STAFF">Nhân viên phòng khám</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ID</th>
              <th>Tên đăng nhập</th>
              <th>Email</th>
              <th>Họ và tên</th>
              <th>Vai trò</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.user_id} className={styles.tableRow}>
                  <td>{user.user_id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.full_name}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openEditModal(user)}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteUser(user.user_id, user.username)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  Không tìm thấy người dùng nào phù hợp với tiêu chí.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Tạo người dùng mới</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateUser} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="create-username">Tên đăng nhập:</label>
                <input
                  id="create-username"
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-email">Email:</label>
                <input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-fullname">Họ và tên:</label>
                <input
                  id="create-fullname"
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-password">Mật khẩu:</label>
                <input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-role">Vai trò:</label>
                <select
                  id="create-role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value as UserRole})}
                  className={styles.select}
                >
                  <option value="PATIENT">Bệnh nhân</option>
                  <option value="DOCTOR">Bác sĩ</option>
                  <option value="CLINIC_STAFF">Nhân viên phòng khám</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={styles.cancelButton}>
                  Hủy
                </button>
                <button type="submit" className={styles.submitButton}>
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && userToEdit && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Chỉnh sửa người dùng: {userToEdit.username}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditUser} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="edit-username">Tên đăng nhập:</label>
                <input
                  id="edit-username"
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-email">Email:</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-fullname">Họ và tên:</label>
                <input
                  id="edit-fullname"
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edit-role">Vai trò:</label>
                <select
                  id="edit-role"
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value as UserRole})}
                  className={styles.select}
                >
                  <option value="PATIENT">Bệnh nhân</option>
                  <option value="DOCTOR">Bác sĩ</option>
                  <option value="CLINIC_STAFF">Nhân viên phòng khám</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowEditModal(false)} className={styles.cancelButton}>
                  Hủy
                </button>
                <button type="submit" className={styles.submitButton}>
                  Cập nhật người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
