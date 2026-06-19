import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import Dashboard from './components/Dashboard/Dashboard';
import Reports from './components/Reports/Reports';
import Payments from './components/Payments/Payments';
import Categories from './components/Categories/Categories';
import SubCategories from './components/SubCategories/SubCategories';
import EventCategories from './components/EventCategories/EventCategories';
import Brands from './components/Brands/Brands';
import Combos from "./components/Combos/Combos";
import NewCombos from "./components/Combos/NewCombos";
import Products from './components/Products/Products';
import Variants from './components/Variants/Variants';
import Stock from './components/Stock/Stock';
import Customers from './components/Customers/Customers';
import Reviews from './components/Reviews/Reviews';
import Coupons from './components/Coupons/AddCoupon';
import Orders from './components/Orders/Orders';
import AdminContactManager from './components/Admincontactmanager';
import { fetchInventorySettings } from './redux/services/notificationsService';
// ── Marketing pages ──────────────────────────────────────────
import HeroSlider from './components/HeroSlider/HeroSlider';
import TimelessTreasures from './components/TimelessTreasures/TimelessTreasures';
import Marquee from './components/Marquee/Marquee';
import Testimonials from './components/Testimonials/Testimonials';
// ── Returns / Refunds ────────────────────────────────────────
import ReturnsDashboard from './components/Returns/ReturnsDashboard';
import ReturnDetail from './components/Returns/ReturnDetail';

import './components/global.css';
import Swal from 'sweetalert2';

const PAGE_CONFIG = {
  dashboard:           { title: 'Dashboard' },
  reports:             { title: 'Reports' },
  payments:            { title: 'Payments & Transactions' },
  categories:          { title: 'Categories' },
  sub_categories:      { title: 'Sub Categories' },
  event_categories:    { title: 'Event Categories' },
  brands:              { title: 'Brands' },
  combos:              { title: 'Combos' },
  products:            { title: 'Products' },
  variants:            { title: 'Variants' },
  stock:               { title: 'Stock Management' },
  customers:           { title: 'Customers' },
  reviews:             { title: 'Reviews' },
  coupons:             { title: 'Coupon Management' },
  orders:              { title: 'All Orders' },
  orders_new:          { title: 'New Orders' },
  orders_pending:      { title: 'Pending Orders' },
  orders_confirmed:    { title: 'Confirmed Orders' },
  orders_shipped:      { title: 'Shipped Orders' },
  orders_delivery:     { title: 'Out for Delivery' },
  orders_delivered:    { title: 'Delivered Orders' },
  orders_cancelled:    { title: 'Cancelled Orders' },
  contacts:            { title: 'Contact Requests' },
  // ── Marketing ───────────────────────────────────────────────
  banners:             { title: 'Banners' },
  timeless_treasures:  { title: 'Timeless Treasures' },
  marquee:             { title: 'Slider Messages' },
  testimonials:        { title: 'Testimonials' },
  // ── Returns ─────────────────────────────────────────────────
  returns:             { title: 'Returns & Refunds' },
};

function AdminLayoutWrapper({ handleLogout }) {
  const dispatch = useDispatch();

  // Load inventory settings once on app mount so all pages have correct thresholds
  useEffect(() => { dispatch(fetchInventorySettings()); }, []);

  const showToast = useCallback(Object.assign(
    (msg) => toast(msg),
    {
      loading: (msg) => toast.loading(msg),
      success: (msg, id) => id ? toast.success(msg, { id }) : toast.success(msg),
      error:   (msg, id) => id ? toast.error(msg, { id })   : toast.error(msg),
    }
  ), []);

  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  useEffect(() => { toast.dismiss(); }, [location.pathname]);
  const cfg = PAGE_CONFIG[currentPath] || PAGE_CONFIG.dashboard;

  return (
    <div className="layout">
      <Sidebar activePage={currentPath} onLogout={handleLogout} />
      <main className="main">
        <Topbar title={cfg.title} />
        <div className="content">
          <Routes>
            <Route path="/dashboard"           element={<Dashboard          showToast={showToast} />} />
            <Route path="/reports"             element={<Reports            showToast={showToast} />} />
            {/* <Route path="/payments"            element={<Payments           showToast={showToast} />} /> */}
            <Route path="/categories"          element={<Categories         showToast={showToast} />} />
            <Route path="/sub_categories"      element={<SubCategories      showToast={showToast} />} />
            <Route path="/event_categories"    element={<EventCategories    showToast={showToast} />} />
            <Route path="/brands"              element={<Brands             showToast={showToast} />} />
            <Route path="/combos" element={<NewCombos showToast={showToast} />} />
            <Route path="/products"            element={<Products           showToast={showToast} />} />
            <Route path="/variants"            element={<Variants           showToast={showToast} />} />
            <Route path="/stock"               element={<Stock              showToast={showToast} />} />
            <Route path="/customers"           element={<Customers          showToast={showToast} />} />
            <Route path="/reviews"             element={<Reviews            />} />
            <Route path="/coupons"             element={<Coupons            showToast={showToast} />} />
            <Route path="/orders"              element={<Orders             status={null} />} />
            <Route path="/orders_new"          element={<Orders             status="pending" />} />
            <Route path="/orders_pending"      element={<Orders             status="pending" />} />
            <Route path="/orders_confirmed"    element={<Orders             status="confirmed" />} />
            <Route path="/orders_shipped"      element={<Orders             status="shipped" />} />
            <Route path="/orders_delivery"     element={<Orders             status="processing" />} />
            <Route path="/orders_delivered"    element={<Orders             status="delivered" />} />
            <Route path="/orders_cancelled"    element={<Orders             status="cancelled" />} />
            <Route path="/contacts"            element={<AdminContactManager />} />
            {/* ── Marketing ──────────────────────────────────── */}
            <Route path="/banners"             element={<HeroSlider         showToast={showToast} />} />
            <Route path="/timeless_treasures"  element={<TimelessTreasures  showToast={showToast} />} />
            <Route path="/marquee"             element={<Marquee            showToast={showToast} />} />
            <Route path="/testimonials"        element={<Testimonials       showToast={showToast} />} />
            {/* ── Returns & Refunds ──────────────────────────── */}
            <Route path="/returns"             element={<ReturnsDashboard   showToast={showToast} />} />
            <Route path="/returns/:id"         element={<ReturnDetail />} />
            <Route path="/"                    element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) setIsAdminLoggedIn(true);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to exit?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00b894',
      cancelButtonColor: '#ff4444',
      confirmButtonText: 'Yes, Logout!',
      background: '#131f33',
      color: '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('adminToken');
        setIsAdminLoggedIn(false);
      }
    });
  };

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2800,
          style: {
            background: '#273142',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          },
          success: { iconTheme: { primary: '#45b369', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={!isAdminLoggedIn ? <Login onLoginSuccess={() => setIsAdminLoggedIn(true)} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/*"
          element={
            isAdminLoggedIn
              ? <AdminLayoutWrapper handleLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}