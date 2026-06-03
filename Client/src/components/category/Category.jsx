import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const S = process.env.PUBLIC_URL + "/shop";
const AUTO_SLIDE_INTERVAL = 3000;
const BASE_URL = process.env.REACT_APP_IMG_URL;

const Category = () => {
  const { categories = [] } = useSelector((state) => state.navMenu || {});
  const gridCategories = categories.filter((cat) => cat.value !== null);

  const [page, setPage]       = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const scrollRef   = useRef(null);
  const timerRef    = useRef(null);
  const isUserRef   = useRef(false); // true while user is interacting
  const resumeRef   = useRef(null);  // debounce handle for resume

  // ── Resize ──
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const itemsPerPage = isMobile ? 2 : 7;

  // ── Build pages ──
  const pages = [];
  for (let i = 0; i < gridCategories.length; i += itemsPerPage) {
    pages.push(gridCategories.slice(i, i + itemsPerPage));
  }
  const totalPages = pages.length;

  // ── Scroll to page (smooth) ──
  const scrollToPage = useCallback((idx) => {
    const el = scrollRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    el.scrollTo({ left: idx * pageWidth, behavior: "smooth" });
  }, []);

  // ── Auto-slide ──
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (totalPages <= 1) return;
    timerRef.current = setInterval(() => {
      setPage((p) => {
        const next = (p + 1) % totalPages;
        scrollToPage(next);
        return next;
      });
    }, AUTO_SLIDE_INTERVAL);
  }, [totalPages, scrollToPage]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  // ── Pause / resume helpers ──
  const pauseTimer = () => clearInterval(timerRef.current);

  const scheduleResume = useCallback(() => {
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      isUserRef.current = false;
      startTimer();
    }, 1500);
  }, [startTimer]);

  // ── Sync page dot from scroll position ──
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setPage(idx);

    if (isUserRef.current) {
      pauseTimer();
      scheduleResume();
    }
  }, [scheduleResume]);

  // ── Mouse-wheel horizontal scroll (desktop trackpad / wheel) ──
  const onWheel = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;
    // Only hijack horizontal-dominant or shift+wheel
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      e.preventDefault();
      isUserRef.current = true;
      el.scrollLeft += e.deltaX || e.deltaY;
    }
  }, []);

  // ── Touch swipe ──
  const touchStartX = useRef(0);
  const onTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    isUserRef.current = true;
    pauseTimer();
  }, []);

  const onTouchEnd = useCallback((e) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    const el = scrollRef.current;
    if (!el) return;
    const threshold = el.clientWidth * 0.25;
    if (Math.abs(delta) > threshold) {
      const next = delta > 0
        ? Math.min(page + 1, totalPages - 1)
        : Math.max(page - 1, 0);
      scrollToPage(next);
      setPage(next);
    } else {
      // snap back to current page
      scrollToPage(page);
    }
    scheduleResume();
  }, [page, totalPages, scrollToPage, scheduleResume]);

  // ── Attach wheel listener (non-passive so preventDefault works) ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // ── Arrow / dot navigation ──
  const goToPage = useCallback((idx) => {
    const target = (idx + totalPages) % totalPages;
    scrollToPage(target);
    setPage(target);
    pauseTimer();
    scheduleResume();
  }, [totalPages, scrollToPage, scheduleResume]);

  // ── Image URL ──
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    const filename = imagePath.replace(/^\//, "").replace(/^uploads\//, "");
    return `${BASE_URL}/uploads/${filename}`;
  };

  if (!totalPages) return null;

  return (
    <div className="category-area-wrapper pt-30 pb-30">
      <div className="container position-relative">
        <div className="section-title text-center mb-50">
          <h2 className="event-title pb-2">Shop by Category</h2>
          <div className="event-subtitle">Custom creations that speak louder than words</div>
        </div>

        <div className="modern-slider-wrapper">
          {/* Prev arrow */}
          <button
            className={`nav-arrow prev-arrow${page === 0 ? " disabled" : ""}`}
            onClick={() => goToPage(page - 1)}
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Next arrow */}
          <button
            className={`nav-arrow next-arrow${page >= totalPages - 1 ? " disabled" : ""}`}
            onClick={() => goToPage(page + 1)}
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* ── Scroll container — all pages rendered side-by-side ── */}
          <div
            className="category-scroll-container"
            ref={scrollRef}
            onScroll={onScroll}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {pages.map((pageCats, pIdx) => (
              <div className="category-scroll-page" key={pIdx}>
                <div className="modern-category-grid">
                  {pageCats.map((cat) => (
                    <div className="modern-cat-card" key={cat.value}>
                      <Link to={`${S}?category=${cat.value}`}>
                        <div className="image-holder">
                          <img
                            src={getImageUrl(cat.image)}
                            alt={cat.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='8' fill='%23999'%3ENo Img%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <span className="cat-label">{cat.label}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        {/* {totalPages > 1 && (
          <div className="modern-pagination-container">
            <div className="modern-pagination">
              {pages.map((_, i) => (
                <button
                  key={i}
                  className={`cat-dot${i === page ? " cat-dot--active" : ""}`}
                  onClick={() => goToPage(i)}
                  aria-label={`Page ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Category;