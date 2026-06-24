import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './Topbar.css';
import logo from '../../assets/image.png';
import { fetchNotifications, doMarkAllRead } from '../../redux/services/notificationsService';
import NotificationDropdown from '../Notifications/NotificationDropdown';

export default function Topbar({ title, addBtn, addLabel, onAdd }) {
  const dispatch = useDispatch();
  const { unreadCount } = useSelector(s => s.notifications);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Fetch notifications on mount and poll every 5 seconds for real-time updates
  useEffect(() => {
    dispatch(fetchNotifications());

    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const badgeStr = unreadCount > 99 ? '99+' : String(unreadCount);

  const handleBellClick = (e) => {
    e.stopPropagation();
    setOpen(v => !v);
  };

  const [logoUrl, setLogoUrl] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  const [adminRole, setAdminRole] = useState('Kamali Gifts');

  const fetchLogo = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/settings`);
      const data = await res.json();
      if (data && data.logoUrl) {
        setLogoUrl(data.logoUrl);
      } else {
        setLogoUrl('');
      }
    } catch (e) {
      console.error("Error fetching logo in topbar:", e);
    }
  };

  useEffect(() => {
    fetchLogo();
    window.addEventListener('site-settings-updated', fetchLogo);

    // Get admin details from storage
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      if (adminUser?.name) {
        setAdminName(adminUser.name);
      }
      if (adminUser?.role?.name) {
        setAdminRole(adminUser.role.name);
      } else if (adminUser?.role) {
        setAdminRole(adminUser.role);
      }
    } catch (e) {
      console.error("Error reading admin user in topbar:", e);
    }

    return () => {
      window.removeEventListener('site-settings-updated', fetchLogo);
    };
  }, []);

  const IMG_BASE_URL = process.env.REACT_APP_IMG_URL || 'http://localhost:5000';

  return (
    <div className="topbar">
      <div className="topbarLeft">
        <div className="topbarTitle">{title}</div>
      </div>
      <div className="topbarActions">
        {(onAdd || addBtn) && (
          <button className="tbBtn btnPrimary" onClick={onAdd}>
            {addLabel || '+ Add New'}
          </button>
        )}
        <div className="adminProfile">
          <img
            src={logoUrl ? `${IMG_BASE_URL}/${logoUrl}` : logo}
            alt="Kamali gifts"
            className="adminLogo"
          />
          <div className="adminInfo">
            <span className="adminName">{adminName}</span>
            <span className="adminRole">{adminRole}</span>
          </div>
        </div>

        {/* Bell */}
        <div
          ref={wrapperRef}
          className="notifWrapper"
          style={{ position: 'relative' }}
          title="Notifications"
        >
          <button
            onClick={handleBellClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', position: 'relative' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <div className="badgeNotif">{badgeStr}</div>
            )}
          </button>

          {open && (
            <NotificationDropdown onClose={() => setOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}