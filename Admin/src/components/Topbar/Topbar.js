import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';
import logo from '../../assets/image.png';
import { fetchProducts } from '../../redux/services/productsService';

export default function Topbar({ title, addBtn, addLabel, onAdd, onNotifClick }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: products } = useSelector(state => state.products);

  useEffect(() => {
    // Only fetch if not already loaded
    if (products.length === 0) dispatch(fetchProducts());
  }, []);

  let low = 0, out = 0;
  products.forEach(p => {
    const totalStock = p.Variants?.reduce((a, v) => a + Number(v.stock), 0) || 0;
    if (totalStock === 0) out++;
    else if (totalStock < 50) low++;
  });
  const totalAlertCount = low + out;

  const handleBellClick = () => {
    if (onNotifClick) onNotifClick();
    else navigate('/products?filter=lowstock');
  };

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
          <img src={logo} alt="Kamali gifts" className="adminLogo" />
          <div className="adminInfo">
            <span className="adminName">Admin</span>
            <span className="adminRole">Kamali Gifts</span>
          </div>
        </div>
        <div className="notifWrapper" onClick={handleBellClick}
          style={{ cursor: 'pointer', position: 'relative' }}
          title={`Out of stock: ${out}, Low stock: ${low}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {totalAlertCount > 0 && (
            <div className="badgeNotif"
              style={{ background: out > 0 ? '#dc2626' : '#ea580c', color: 'white', position: 'absolute', top: -5, right: -5, fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
              {totalAlertCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
