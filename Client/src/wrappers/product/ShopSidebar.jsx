import PropTypes from "prop-types";
import clsx from "clsx";
import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const S = process.env.PUBLIC_URL + "/shop";

const ShopSidebar = ({ products, getSortParams, sideSpaceClass }) => {
  const { categories = [], events = [], combos = [], rootCombos = [] } = useSelector((state) => state.navMenu);

  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const activeCategory = params.get("category") || "";
  const activeEvent    = params.get("event")    || "";
  const activeCombo    = params.get("combo")    || "";
  const activeSubCat   = params.get("subcategory") || "";

  // ── Mobile Responsive State ──
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSections, setMobileSections] = useState({
    price: true,
    categories: false,
    events: false,
    combos: false,
  });

  // Track window resizing to detect mobile viewports smoothly
  useEffect(() => {
    const handleResize = () => {
      const mobileMode = window.innerWidth <= 768;
      setIsMobile(mobileMode);
      if (!mobileMode) {
        // Keep everything open on desktop
        setMobileSections({ price: true, categories: true, events: true, combos: true });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobileSection = (section) => {
    if (!isMobile) return;
    setMobileSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ── Track which category's subcategories are expanded ──
  const [expandedCat, setExpandedCat] = useState(() => {
    return activeCategory || null;
  });

  // ── Price range (Force minimum starting from 0) ──
  const allPrices = useMemo(() => products.map(p => p.price).filter(Boolean), [products]);
  const priceMin  = 0; // Fixed at 0 per your request
  const priceMax  = useMemo(() => allPrices.length ? Math.ceil(Math.max(...allPrices))  : 5000, [allPrices]);
  const [priceRange, setPriceRange] = useState(null);

  const sliderValue = priceRange ? [priceRange.min, priceRange.max] : [priceMin, priceMax];

  const handlePriceChange      = (value) => setPriceRange({ min: value[0], max: value[1] });
  const handlePriceAfterChange = (value) => {
    const [min, max] = value;
    const isFullRange = min <= priceMin && max >= priceMax;
    getSortParams("priceRange", isFullRange ? [priceMin, priceMax] : value);
    if (isFullRange) setPriceRange(null);
  };
  const clearPrice = () => {
    setPriceRange(null);
    getSortParams("priceRange", [priceMin, priceMax]);
  };

  // ── Category click: navigate + toggle subcategory drawer ──
  const handleCategoryClick = (cat) => {
    if (cat.value === null) {
      setExpandedCat(null);
      navigate(S);
      return;
    }
    if (expandedCat === cat.value && activeCategory === cat.value) {
      setExpandedCat(null);
      navigate(S);
    } else {
      setExpandedCat(cat.value);
      navigate(`${S}?category=${cat.value}`);
    }
  };

  const isAllProductsActive = !activeCategory && !activeEvent && !activeCombo && !activeSubCat;

  return (
    <div className={clsx("sidebar-style", sideSpaceClass)} style={styles.root}>
      
      {/* Injecting simple CSS rule just to clean up native button focus & layout flow on phones */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-accordion-header { cursor: pointer; padding: 12px 4px; display: flex; justify-content: space-between; align-items: center; }
          .mobile-accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.25s ease-out; }
          .mobile-accordion-content.open { max-height: 1200px; transition: max-height 0.4s ease-in; }
        }
      `}</style>

      {/* ── Price Range ── */}
      <div style={styles.section}>
        <div 
          className="mobile-accordion-header" 
          onClick={() => toggleMobileSection("price")}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 0 : 14 }}
        >
          <p style={{ ...styles.sectionTitle, margin: 0 }}>
            Price Range {isMobile && <span style={styles.mobileChevron}>{mobileSections.price ? "▲" : "▼"}</span>}
          </p>
          {priceRange && (
            <button onClick={(e) => { e.stopPropagation(); clearPrice(); }} style={styles.clearBtn}>Reset</button>
          )}
        </div>

        <div className={clsx("mobile-accordion-content", (mobileSections.price || !isMobile) && "open")} style={(!mobileSections.price && isMobile) ? {display: 'none'} : {marginTop: 14}}>
          <div style={styles.priceBadgeRow} >
            <div style={styles.priceBadge}>
              <span style={styles.badgeLabel}>Min</span>
              <span style={styles.badgeValue}>
                ₹{(priceRange ? priceRange.min : priceMin).toLocaleString("en-IN")}
              </span>
            </div>
            <span style={styles.priceSep}>—</span>
            <div style={styles.priceBadge}>
              <span style={styles.badgeLabel}>Max</span>
              <span style={styles.badgeValue}>
                ₹{(priceRange ? priceRange.max : priceMax).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Wrapper to add horizontal indentation specifically for the track on mobile viewports */}
          <div style={isMobile ? styles.sliderMobileWrapper : undefined}>
            <Slider
              range
              min={priceMin}
              max={priceMax}
              step={Math.max(1, Math.floor((priceMax - priceMin) / 100))}
              value={sliderValue}
              onChange={handlePriceChange}
              onAfterChange={handlePriceAfterChange}
              trackStyle={[{ backgroundColor: "#db1a5d", height: 3 }]}
              handleStyle={[
                { borderColor: "#db1a5d", backgroundColor: "#fff", width: 18, height: 18, marginTop: -7.5, boxShadow: "0 1px 4px rgba(219, 26, 93,0.35)", opacity: 1 },
                { borderColor: "#db1a5d", backgroundColor: "#fff", width: 18, height: 18, marginTop: -7.5, boxShadow: "0 1px 4px rgba(219, 26, 93,0.35)", opacity: 1 },
              ]}
              railStyle={{ backgroundColor: "#e8e8e8", height: 3 }}
            />

            <div style={styles.priceLimits}>
              <span>₹{priceMin.toLocaleString("en-IN")}</span>
              <span>₹{priceMax.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Categories + Subcategories ── */}
      <div style={styles.section}>
        <div className="mobile-accordion-header" onClick={() => toggleMobileSection("categories")}>
          <p style={{...styles.sectionTitle, margin: 0}}>
            Categories {isMobile && <span style={styles.mobileChevron}>{mobileSections.categories ? "▲" : "▼"}</span>}
          </p>
        </div>
        
        <div className={clsx("mobile-accordion-content", (mobileSections.categories || !isMobile) && "open")} style={(!mobileSections.categories && isMobile) ? {display: 'none'} : {marginTop: 14}}>
          <ul style={styles.filterList}>
            {/* ── All Products Button ── */}
            <li>
              <button
                onClick={() => {
                  setExpandedCat(null);
                  navigate(S);
                }}
                style={{ ...styles.filterBtn, ...(isAllProductsActive ? styles.filterBtnActive : {}) }}
              >
                <span>All Products</span>
                <span style={{ ...styles.filterCount, ...(isAllProductsActive ? styles.filterCountActive : {}) }}>
                  ({products.length})
                </span>
              </button>
            </li>

            {categories.map((cat) => {
              const isAll    = cat.value === null;
              const isActive = isAll
                ? !activeCategory && !activeEvent && !activeCombo
                : activeCategory === cat.value;
              const isExpanded  = expandedCat === cat.value;
              const subcategories = cat.subcategories || [];
              const hasSubCats  = !isAll && subcategories.length > 0;

              const count = isAll
                ? products.length
                : products.filter(p =>
                    // match by categoryId UUID (primary, what backend stores)
                    (p.categoryId && String(p.categoryId) === String(cat.id)) ||
                    // fallback: category array contains the slug value
                    p.category?.includes(cat.value)
                  ).length;

              return (
                <li key={cat.value ?? "__all"}>
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    style={{ ...styles.filterBtn, ...(isActive ? styles.filterBtnActive : {}) }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {hasSubCats && (
                        <span style={{
                          ...styles.chevron,
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        }}>
                          ›
                        </span>
                      )}
                      {cat.label}
                    </span>
                    <span style={{ ...styles.filterCount, ...(isActive ? styles.filterCountActive : {}) }}>
                      ({count})
                    </span>
                  </button>

                  {/* ── Subcategory drawer ── */}
                  {hasSubCats && isExpanded && (
                    <ul style={styles.subList}>
                      <li>
                        <button
                          onClick={() => navigate(`${S}?category=${cat.value}`)}
                          style={{
                            ...styles.subBtn,
                            ...(!activeSubCat && activeCategory === cat.value ? styles.subBtnActive : {}),
                          }}
                        >
                          <span>All {cat.label}</span>
                          <span style={styles.filterCount}>({count})</span>
                        </button>
                      </li>

                      {subcategories.map((sub) => {
                        const subCount  = products.filter(p => p.subcategory?.includes(sub.value)).length;
                        const subActive = activeSubCat === sub.value;
                        return (
                          <li key={sub.value}>
                            <button
                              onClick={() =>
                                navigate(`${S}?category=${cat.value}&subcategory=${sub.value}`)
                              }
                              style={{ ...styles.subBtn, ...(subActive ? styles.subBtnActive : {}) }}
                            >
                              <span>{sub.label}</span>
                              <span style={{ ...styles.filterCount, ...(subActive ? styles.filterCountActive : {}) }}>
                                ({subCount})
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Events ── */}
      <div style={styles.section}>
        <div className="mobile-accordion-header" onClick={() => toggleMobileSection("events")}>
          <p style={{...styles.sectionTitle, margin: 0}}>
            Shop by Event {isMobile && <span style={styles.mobileChevron}>{mobileSections.events ? "▲" : "▼"}</span>}
          </p>
        </div>
        
        <div className={clsx("mobile-accordion-content", (mobileSections.events || !isMobile) && "open")} style={(!mobileSections.events && isMobile) ? {display: 'none'} : {marginTop: 14}}>
          <ul style={styles.filterList}>
            {events.map((evt) => {
              const count    = products.filter(p => p.tag?.includes(evt.value)).length;
              if (count === 0) return null;
              const isActive = activeEvent === evt.value;
              return (
                <li key={evt.value}>
                  <button
                    onClick={() => navigate(`${S}?event=${evt.value}`)}
                    style={{ ...styles.filterBtn, ...(isActive ? styles.filterBtnActive : {}) }}
                  >
                    <span>{evt.label}</span>
                    <span style={{ ...styles.filterCount, ...(isActive ? styles.filterCountActive : {}) }}>
                      ({count})
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Combos ── */}
      {rootCombos.length > 0 && (
        <div style={{ ...styles.section, borderBottom: "none", paddingBottom: 0 }}>
          <div className="mobile-accordion-header" onClick={() => toggleMobileSection("combos")}>
            <p style={{...styles.sectionTitle, margin: 0}}>
              Combos {isMobile && <span style={styles.mobileChevron}>{mobileSections.combos ? "▲" : "▼"}</span>}
            </p>
          </div>
          
          <div className={clsx("mobile-accordion-content", (mobileSections.combos || !isMobile) && "open")} style={(!mobileSections.combos && isMobile) ? {display: 'none'} : {marginTop: 14}}>
            <ul style={styles.filterList}>
              {rootCombos.map((combo) => {
                const count = combo.children ? combo.children.filter(c => c.isActive !== false && c.is_active !== false).length : 0;
                const isActive = activeCombo === String(combo.id);
                return (
                  <li key={combo.id}>
                    <button
                      onClick={() => navigate(`${S}?combo=${combo.id}`)}
                      style={{ ...styles.filterBtn, ...(isActive ? styles.filterBtnActive : {}) }}
                    >
                      <span>{combo.name}</span>
                      <span style={{ ...styles.filterCount, ...(isActive ? styles.filterCountActive : {}) }}>
                        ({count})
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  root: { fontFamily: "inherit" },
  section: { borderBottom: "1px solid #f0f0f0", paddingBottom: 20, marginBottom: 20 },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: 12,
    fontWeight: 600,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%"
  },
  mobileChevron: { fontSize: 10, color: "#bbb" },
  clearBtn: {
    background: "none", border: "none", color: "#db1a5d",
    fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline",
  },
  priceBadgeRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  priceBadge: {
    flex: 1, border: "1px solid #e8e8e8", borderRadius: 4,
    textAlign: "center", background: "#fafafa", display: "flex", flexDirection: "column", gap: 2,
  },
  badgeLabel: { fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.4px" },
  badgeValue: { fontSize: 14, fontWeight: 600, color: "#222" },
  priceSep: { color: "#bbb", fontSize: 14, flexShrink: 0 },
  priceLimits: { display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "#bbb" },
  // This layout padding pinches the slider length in comfortably on small touch screens
  sliderMobileWrapper: { paddingLeft: 16, paddingRight: 16 },
  filterList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 1 },
  filterBtn: {
    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "none", border: "none", outline: "none", cursor: "pointer",
    paddingTop: 10, paddingBottom: 10, paddingRight: 10, paddingLeft: 10,
    fontSize: 13, color: "#444", borderRadius: 6,
    transition: "background 0.15s, color 0.15s", textAlign: "left",
  },
  filterBtnActive: { background: "#fdf0ff", color: "#a020c0", fontWeight: 600 },
  filterCount: { fontSize: 11, color: "#bbb", fontWeight: 400, flexShrink: 0 },
  filterCountActive: { color: "#c050e0" },
  chevron: {
    display: "inline-block",
    fontSize: 25,
    lineHeight: 1,
    color: "#bbb",
    transition: "transform 0.2s ease",
    fontWeight: 900,
  },
  subList: {
    listStyle: "none",
    margin: "2px 0 4px 0",
    padding: "0 0 0 20px",
    display: "flex",
    flexDirection: "column",
    gap: 1,
    borderLeft: "2px solid #f0e0ff",
  },
  subBtn: {
    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "none", border: "none", outline: "none", cursor: "pointer",
    paddingTop: 8, paddingBottom: 8, paddingRight: 10, paddingLeft: 8,
    fontSize: 12, color: "#666", borderRadius: 5,
    transition: "background 0.15s, color 0.15s", textAlign: "left",
  },
  subBtnActive: { background: "#fdf0ff", color: "#a020c0", fontWeight: 600 },
  comboIcon: { marginRight: 6 },
};

ShopSidebar.propTypes = {
  getSortParams: PropTypes.func,
  products: PropTypes.array,
  sideSpaceClass: PropTypes.string,
};

export default ShopSidebar;