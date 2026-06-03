import PropTypes from "prop-types";
import clsx from "clsx";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import SectionTitle from "../../components/section-title/SectionTitle";
import ProductGrid from "./ProductGrid";
import { getProducts } from "../../helpers/product";

const SECTIONS = [
  { key: "customisable", label: "Customisable", emoji: "🎨", type: "customisable" },
  { key: "newArrival",   label: "New Arrivals",  emoji: "✨", type: "newArrival"   },
  { key: "hotDeals",     label: "Hot Deals",     emoji: "🔥", type: "hotDeals"     },
];

const TabProduct = ({ spaceTopClass, spaceBottomClass, bgColorClass, category }) => {
  const { products } = useSelector((state) => state.product);

  const sectionData = SECTIONS.map((s) => ({
    ...s,
    items: getProducts(products, category, s.type) || [],
  })).filter((s) => s.items.length > 0);

  if (sectionData.length === 0) return null;

  return (
    <div className={clsx("deals-area pb-60 pt-60", bgColorClass)}>
      <div className="container">
        <div className="section-title text-center mb-50">
          <h2 className="event-title pb-2">Daily Deals</h2>
          <div className="event-subtitle">Custom creations that speak louder than words</div>
        </div>

        <div className="deals-sections">
          {sectionData.map((section, idx) => (
            <DealSection key={section.key} section={section} isLast={idx === sectionData.length - 1} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
};

const DealSection = ({ section, isLast, category }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [section.items]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className={clsx("deal-section", !isLast && "deal-section--divider")}>
      {/* Section header */}
      <div className="deal-section__header">
        <div className="deal-section__title">
          <span className="deal-section__emoji">{section.emoji}</span>
          <h3 className="deal-section__name">{section.label}</h3>
        </div>
        <div className="deal-section__arrows">
          <button
            className={clsx("deal-arrow", !canScrollLeft && "deal-arrow--hidden")}
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            className={clsx("deal-arrow", !canScrollRight && "deal-arrow--hidden")}
            onClick={() => scroll(1)}
            aria-label="Scroll right"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div className="deal-scroll-track" ref={scrollRef}>
        <div className="deal-scroll-inner">
          <ProductGrid
            category={category}
            type={section.type}
            limit={10}
            spaceBottomClass="mb-0"
            productsList={section.items}
          />
        </div>
      </div>
    </div>
  );
};

TabProduct.propTypes = {
  bgColorClass: PropTypes.string,
  category: PropTypes.string,
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
};

export default TabProduct;