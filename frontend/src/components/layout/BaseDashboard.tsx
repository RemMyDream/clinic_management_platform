import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { UserRole } from '../../types/UserType';
import { userApi } from '../../services/api';
import { toast } from 'react-toastify';
import './BaseDashboard.css';

type Props = {
  role: UserRole;
  children: React.ReactNode;
};

const BaseDashboard: React.FC<Props> = ({ role, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    userApi.getMe()
      .then((res) => {
        const name = res.data.full_name || res.data.doctor_name || res.data.username || '';
        setUserName(name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleProfile = () => {
    setMenuOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    toast.success('Ban đã đăng xuất thành công.');
    setTimeout(() => {
      setMenuOpen(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <Sidebar role={role} />
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Healthcare background decorations */}
        <div className="health-decor" aria-hidden="true">
          <svg className="decor-heart" viewBox="0 0 240 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M120 190 C100 175 20 130 20 75 C20 45 42 22 68 22 C90 22 108 38 120 58 C132 38 150 22 172 22 C198 22 220 45 220 75 C220 130 140 175 120 190Z" fill="rgba(37,99,235,0.06)" stroke="rgba(37,99,235,0.22)" strokeWidth="3"/>
            <polyline points="28,115 53,115 67,82 82,148 93,100 105,122 118,115 142,115 153,92 165,135 178,115 202,115" stroke="rgba(37,99,235,0.32)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <svg className="decor-cross dc1" viewBox="0 0 50 50" fill="none">
            <rect x="18" y="2" width="14" height="46" rx="7" fill="rgba(37,99,235,0.2)"/>
            <rect x="2" y="18" width="46" height="14" rx="7" fill="rgba(37,99,235,0.2)"/>
          </svg>
          <svg className="decor-cross dc2" viewBox="0 0 50 50" fill="none">
            <rect x="18" y="2" width="14" height="46" rx="7" fill="rgba(37,99,235,0.14)"/>
            <rect x="2" y="18" width="46" height="14" rx="7" fill="rgba(37,99,235,0.14)"/>
          </svg>
          <svg className="decor-cross dc3" viewBox="0 0 50 50" fill="none">
            <rect x="18" y="2" width="14" height="46" rx="7" fill="rgba(37,99,235,0.1)"/>
            <rect x="2" y="18" width="46" height="14" rx="7" fill="rgba(37,99,235,0.1)"/>
          </svg>
          <svg className="decor-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none">
            <path d="M0 60 C360 100 720 20 1080 60 C1260 80 1380 65 1440 60 L1440 120 L0 120 Z" fill="rgba(37,99,235,0.07)"/>
            <path d="M0 88 C400 50 800 110 1200 72 C1320 58 1400 82 1440 88 L1440 120 L0 120 Z" fill="rgba(37,99,235,0.04)"/>
          </svg>
        </div>

        {/* Header */}
        <header className="header">
          <div className="header-left">
            <img
              src="/logo.png"
              alt="Clinic Logo"
              className="logo"
            />
            <h1 className="title">
              Nền tảng quản lý phòng khám
            </h1>
          </div>

          {/* Account dropdown */}
          <div className="account-menu" ref={menuRef}>
            <button
              className="account-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
            >
              <span className="account-avatar">{userName ? userName.charAt(0).toUpperCase() : 'A'}</span>
              <span className="account-label">{userName || 'Tài khoản'}</span>
              <svg
                className="chevron"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="dropdown">
                <button
                  className="dropdown-item"
                  onClick={handleProfile}
                >
                  Hồ sơ
                </button>
                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="content">
          {children}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default BaseDashboard;
