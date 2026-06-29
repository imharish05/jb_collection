import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logo from "../../assets/image.png"

const NAV_ITEMS = [
  {
    section: 'Main',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )}, { id: 'reports', label: 'Reports', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18"/>
        <path d="M18.4 8.6 13 14l-2.5-2.5L7 15"/>
      </svg>
    )}, 
    // { id: 'payments', label: 'Payments', icon: (
    //   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    //     <rect x="2" y="5" width="20" height="14" rx="2"/>
    //     <line x1="2" y1="10" x2="22" y2="10"/>
    //   </svg>
    // )}
  ],
  },
    {
    section: 'Marketing',
    items: [
      { id: 'marquee', label: 'Slider Messages', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18M1 9v6M23 9v6"/>
        </svg>
      )},
      { id: 'banners', label: 'Banners', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M8 12h8M12 9v6"/>
        </svg>
      )},
      { id: 'timeless_treasures', label: 'Signature Collection', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      )},
      /* { id: 'testimonials', label: 'Testimonials', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )}, */
      { id: 'coupons', label: 'Coupons', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 5l-1.76 1.76a2 2 0 0 0 0 2.83l1.41 1.41a2 2 0 0 0 2.83 0L19 9.24" />
          <path d="M21 11.5V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.5" />
          <line x1="12" y1="5" x2="12" y2="19" strokeDasharray="3 3" />
        </svg>
      )},
    ],
  },
  {
    section: 'Products',
    items: [
      { id: 'categories', label: 'Categories', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20h16M4 4h6l2 3h8v13H4z"/>
        </svg>
      )},
      { id: 'sub_categories', label: 'Sub Categories', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20h16M4 4h4l2 3h10v13H4z"/>
          <path d="M8 12h8M8 16h6"/>
        </svg>
      )},
      /* { id: 'event_categories', label: 'Event Categories', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19h16M4 14h16M4 9h16M4 4h16" />
        </svg>
      )}, */
      { id: 'brands', label: 'Brands', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
          <circle cx="12" cy="15" r="3"/>
        </svg>
      )},
      { id: 'products', label: 'Products', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10"/>
        </svg>
      )},
      { id: 'combos', label: 'Combos', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      )},
      { id: 'variants', label: 'Product Variant', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="6" height="6" rx="1"/>
          <rect x="9" y="3" width="6" height="6" rx="1"/>
          <rect x="16" y="3" width="6" height="6" rx="1"/>
          <rect x="2" y="15" width="6" height="6" rx="1"/>
          <rect x="9" y="15" width="6" height="6" rx="1"/>
          <rect x="16" y="15" width="6" height="6" rx="1"/>
        </svg>
      )},
      { id: 'stock', label: 'Product Stock', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="15" rx="2"/>
          <path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2"/>
        </svg>
      )},
    ],
  },
  {
    section: 'Orders',
    items: [
      { id: 'orders_pending', label: 'Pending Orders', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )},
      { id: 'orders_confirmed', label: 'Confirmed Orders', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      )},
      { id: 'orders_shipped', label: 'Shipped Orders', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      )},
      { id: 'orders_delivery', label: 'Out for Delivery', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <path d="M16 8h4l3 5v4h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      )},
      { id: 'orders_delivered', label: 'Delivered Orders', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )},
      { id: 'orders_cancelled', label: 'Cancelled Orders', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      )},
            { id: 'returns', label: 'Returns & Refunds', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M12 7v5l4 2"/>
        </svg>
      )},
    ],
  },
  {
    section: 'Product Review',
    items: [
      { id: 'reviews', label: 'Reviews', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )},
    ],
  },
  {
    section: 'Users',
    items: [
      { id: 'customers', label: 'Customers', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )},
    ],
  },

  {
    section: 'Support',
    items: [
      { id: 'contacts', label: 'Contact Requests', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      )},
    ],
  },
  {
    section: 'Settings',
    items: [
      { id: 'settings', label: 'Site Settings', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      )},
      { id: 'timeline', label: 'Timeline', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )},
      { id: 'roles', label: 'Roles & Permissions', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      )},
      { id: 'users', label: 'Admin Users', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )},
      /* { id: 'fonts', label: 'Font Management', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      )},
      { id: 'customisation_fields', label: 'Customisation Fields', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      )} */
    ]
  }
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const activePage = location.pathname.split('/')[1] || 'dashboard';

  let permissions = [];
  try {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    permissions = adminUser?.permissions || [];
  } catch (e) {
    permissions = [];
  }

  const hasPermission = (id) => {
    if (!permissions) return false;
    if (permissions.includes('*') || permissions.includes('super_admin')) return true;

    switch (id) {
      case 'dashboard':
        return true;
      case 'reports':
        return permissions.includes('reports_view');
      case 'marquee':
        return permissions.includes('marquee_view');
      case 'banners':
        return permissions.includes('banners_view');
      case 'timeless_treasures':
        return permissions.includes('timeless_view');
      case 'testimonials':
        return permissions.includes('testimonials_view');
      case 'timeline':
        return permissions.includes('timeline_view');
      case 'coupons':
        return permissions.includes('coupons_view');
      case 'categories':
        return permissions.includes('categories_view');
      case 'sub_categories':
        return permissions.includes('subcategories_view');
      case 'event_categories':
        return permissions.includes('categories_view');
      case 'brands':
        return permissions.includes('brands_view');
      case 'products':
        return permissions.includes('products_view');
      case 'combos':
        return permissions.includes('combos_view');
      case 'variants':
        return permissions.includes('variants_view');
      case 'stock':
        return permissions.includes('stock_view');
      case 'orders_pending':
      case 'orders_confirmed':
      case 'orders_shipped':
      case 'orders_delivery':
      case 'orders_delivered':
      case 'orders_cancelled':
        return permissions.includes('orders_view');
      case 'returns':
        return permissions.includes('returns_view');
      case 'reviews':
        return permissions.includes('reviews_view');
      case 'customers':
        return permissions.includes('customers_view');
      case 'contacts':
        return permissions.includes('contacts_view');
      case 'roles':
        return permissions.includes('roles_view');
      case 'settings':
        return permissions.includes('settings_view') || permissions.includes('*') || permissions.includes('super_admin');
      case 'users':
        return permissions.includes('users_view');
      /* case 'fonts':
        return permissions.includes('fonts_view') || permissions.includes('*') || permissions.includes('super_admin');
      case 'customisation_fields':
        return permissions.includes('customisation_fields_view') || permissions.includes('*') || permissions.includes('super_admin'); */
      default:
        return false;
    }
  };

  const [logoUrl, setLogoUrl] = useState('');

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
      console.error("Error fetching logo in sidebar:", e);
    }
  };

  useEffect(() => {
    fetchLogo();
    window.addEventListener('site-settings-updated', fetchLogo);
    return () => {
      window.removeEventListener('site-settings-updated', fetchLogo);
    };
  }, []);

  const IMG_BASE_URL = process.env.REACT_APP_IMG_URL || 'http://localhost:5000';
  let adminRole = 'ADMIN';
  try {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (adminUser?.role?.name) {
      adminRole = adminUser.role.name.toUpperCase();
    } else if (adminUser?.role) {
      adminRole = adminUser.role.toUpperCase();
    }
  } catch (e) {}

  const filteredNavItems = NAV_ITEMS.map((group) => {
    const items = group.items.filter((item) => hasPermission(item.id));
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoText}>
          <div className={styles.logoK}>
            <img src={logoUrl ? `${IMG_BASE_URL}/${logoUrl}` : logo} alt="Logo" />
          </div>
          <div>
            <div className={styles.logoName}></div>
            <div className={styles.logoSub}>{adminRole} PANEL</div>
          </div>
        </div>
      </div>

      <nav className={styles.nav}>
        {filteredNavItems.map((group) => (
          <div key={group.section}>
            <div className={styles.navSection}>{group.section}</div>
            {group.items.map((item) => (
              <Link
                key={item.id}
                to={`/${item.id}`}
                className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.logoutBtn} onClick={onLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.logoutIcon}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}