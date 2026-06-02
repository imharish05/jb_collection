import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

const S = process.env.PUBLIC_URL + "/shop";
const AUTO_SLIDE_INTERVAL = 3000;
const BASE_URL = process.env.REACT_APP_IMG_URL;


const Category = () => {
  const { categories = [] } = useSelector((state) => state.navMenu || {});
  const gridCategories = categories.filter((cat) => cat.value !== null);

  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const timerRef = useRef(null);

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine items per page: 2 for mobile, 7 for desktop
  const itemsPerPage = isMobile ? 2 : 7;

  // Chunk the categories based on itemsPerPage
  const pages = [];
  for (let i = 0; i < gridCategories.length; i += itemsPerPage) {
    pages.push(gridCategories.slice(i, i + itemsPerPage));
  }

  const totalPages = pages.length;
  const visible = pages[page] || [];

  const startTimer = () => {
    clearInterval(timerRef.current);
    if (totalPages <= 1) return;
    timerRef.current = setInterval(() => {
      setPage((p) => (p + 1) % totalPages);
    }, AUTO_SLIDE_INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [totalPages, page]); // Re-run when page count changes

  const goToPage = (index) => {
    setPage(index);
    startTimer();
  };

  const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const filename = imagePath.replace(/^\//, '').replace(/^uploads\//, '');
  return `${BASE_URL}/uploads/${filename}`;
};

  return (
    <div className="category-area-wrapper pt-30 pb-30">
      <div className="container position-relative">
        <div className="section-title text-center mb-50">
          <h2 className="event-title pb-2">Shop by Category</h2>
          <div className="event-subtitle">Custom creations that speak louder than words</div>
        </div>

        <div className="modern-slider-wrapper">
          <button
            className={`nav-arrow prev-arrow ${page === 0 ? "disabled" : ""}`}
            onClick={() => goToPage((page - 1 + totalPages) % totalPages)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            className={`nav-arrow next-arrow ${page >= totalPages - 1 ? "disabled" : ""}`}
            onClick={() => goToPage((page + 1) % totalPages)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* This grid will now respect the 2-item limit on mobile via CSS */}
          <div className="modern-category-grid">
            {visible.map((cat) => (
              <div className="modern-cat-card" key={cat.value}>
                <Link to={`${S}?category=${cat.value}`}>
                  <div className="image-holder">
                   <img
                      src={getImageUrl(cat.image)}
                      alt={cat.name}
                      width="40" height="40"
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                      onError={e => {
                        e.target.onerror = null;  // must be BEFORE src change, and NO more src changes after
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%23999'%3ENo Img%3C/text%3E%3C/svg%3E";
                      }}/>
                  </div>
                  <span className="cat-label">{cat.label}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="modern-pagination-container">
            <div className="modern-pagination">
              {pages.map((_, i) => (
                <button
                  key={i}
                  className={`cat-dot${i === page ? " cat-dot--active" : ""}`}
                  onClick={() => goToPage(i)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;