import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const S = process.env.PUBLIC_URL + "/shop";
const BASE_URL = process.env.REACT_APP_IMG_URL;

const Category = () => {
  const { categories = [] } = useSelector((state) => state.navMenu || {});
  const gridCategories = categories.filter((cat) => cat.value !== null);

  const scrollRef = useRef(null);
  const isUserRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check if there are fewer categories than what fits a desktop screen width to center them
  const shouldCenter = gridCategories.length < 6;

  // Check scroll positions to enable/disable navigation arrows
  const checkScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  // Set up auto scroll timer and event listeners
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollButtons();

    const handleScroll = () => {
      checkScrollButtons();
    };

    el.addEventListener("scroll", handleScroll);

    const autoScroll = () => {
      if (isUserRef.current) return;
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      if (maxScrollLeft <= 0) return;

      // Wrap back to beginning when we reach the end, else scroll right by one item width
      if (el.scrollLeft >= maxScrollLeft - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const cardWidth = window.innerWidth < 768 ? 146 : 204;
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    };

    const timer = setInterval(autoScroll, 3000);

    return () => {
      clearInterval(timer);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [checkScrollButtons, gridCategories.length]);

  // Scroll manually via buttons
  const scrollPrev = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = window.innerWidth < 768 ? 146 : 204;
    el.scrollBy({ left: -cardWidth, behavior: "smooth" });
  };

  const scrollNext = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = window.innerWidth < 768 ? 146 : 204;
    el.scrollBy({ left: cardWidth, behavior: "smooth" });
  };

  // Pause auto-scroll on hover / touch interaction
  const handleInteractionStart = () => {
    isUserRef.current = true;
  };

  const handleInteractionEnd = () => {
    isUserRef.current = false;
  };

  // Translate image path to absolute URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    const filename = imagePath.replace(/^\//, "").replace(/^uploads\//, "");
    return `${BASE_URL}/uploads/${filename}`;
  };

  if (!gridCategories.length) return null;

  return (
    <div className="category-area-wrapper pt-30 pb-30">
      <div className="container position-relative">
        <div className="section-title text-center mb-50">
          <h2 className="event-title pb-2">Shop by Category</h2>
          <div className="event-subtitle">Wear your story on your sleeve</div>
        </div>

        <div
          className="modern-slider-wrapper"
          onMouseEnter={handleInteractionStart}
          onMouseLeave={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchEnd={handleInteractionEnd}
        >
          {/* Prev navigation button */}
          <button
            className={`nav-arrow prev-arrow${!canScrollLeft ? " disabled" : ""}`}
            onClick={scrollPrev}
            aria-label="Previous categories"
            disabled={!canScrollLeft}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Next navigation button */}
          <button
            className={`nav-arrow next-arrow${!canScrollRight ? " disabled" : ""}`}
            onClick={scrollNext}
            aria-label="Next categories"
            disabled={!canScrollRight}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Scrollable category list */}
          <div
            className={`category-scroll-container${shouldCenter ? " justify-center" : ""}`}
            ref={scrollRef}
          >
            {gridCategories.map((cat) => (
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
                    <div className="glass-overlay">
                      <span className="cat-label">{cat.label}</span>
                      <span className="explore-text">Explore &rarr;</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
