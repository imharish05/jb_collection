import PropTypes from "prop-types";
import clsx from "clsx";
import { useState, useMemo, useEffect, cloneElement } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { getImgUrl } from "../../helpers/imageUrl";

const S = process.env.PUBLIC_URL + "/shop";

const ShopSidebar = ({ products, getSortParams, filterSortValue, sideSpaceClass }) => {
  const { categories = [], rootCombos = [] } = useSelector((state) => state.navMenu);
  const { brands: allBrands = [] } = useSelector((state) => state.brands || {});

  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const activeCategory = params.get("category") || "";
  const activeEvent    = params.get("event")    || "";
  const activeCombo    = params.get("combo")    || "";
  const activeSubCat   = params.get("subcategory") || "";
  const activeSubSubCat = params.get("subsubcategory") || "";
  const activeBrand    = params.get("brand") || "";

  // Image base URL and source resolver
  const IMG_BASE = process.env.REACT_APP_IMG_URL + "/uploads/";
  const imgSrc = (path) =>
    path ? `${IMG_BASE}${path.replace(/^\/?(uploads\/)?/, "")}` : null;

  // ── Mobile Responsive State ──
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSections, setMobileSections] = useState({
    price: true,
    categories: false,
    events: false,
    combos: false,
    brands: false,
  });

  // Track window resizing to detect mobile viewports smoothly
  useEffect(() => {
    const handleResize = () => {
      const mobileMode = window.innerWidth <= 768;
      setIsMobile(mobileMode);
      if (!mobileMode) {
        // Keep everything open on desktop
        setMobileSections({ price: true, categories: true, events: true, combos: true, brands: true });
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

  // Sync expandedCat with activeCategory from URL
  useEffect(() => {
    if (activeCategory) {
      setExpandedCat(activeCategory);
    }
  }, [activeCategory]);

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

  const handleRender = (node, handleProps) => {
    const { value, dragging, index } = handleProps;
    const isLeft = index === 0;
    const color = isLeft ? "var(--theme-color-secondary)" : "var(--theme-color)";
    
    return cloneElement(node, {
      style: {
        ...node.props.style,
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
        width: 24,
        height: 24,
        marginTop: -9, // center over the track
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: dragging ? 2 : 1
      }
    }, (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {/* Tooltip */}
        <div style={{
          position: "absolute",
          top: -38,
          backgroundColor: color,
          color: "white",
          padding: "4px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "bold",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
        }}>
          ₹{value}
          <div style={{
            position: "absolute",
            bottom: -5,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `6px solid ${color}`
          }}></div>
        </div>
        
        {/* Thumb design */}
        <div style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: color,
          border: "3px solid #fff", 
          boxShadow: `0 0 0 2px ${color}80, 0 2px 4px rgba(0,0,0,0.2)`, 
          boxSizing: "border-box"
        }}></div>
      </div>
    ));
  };

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


          {/* Wrapper to add horizontal indentation specifically for the track on mobile viewports */}
          <div style={{ ...(isMobile ? styles.sliderMobileWrapper : {}), marginTop: 50, marginBottom: 20 }}>
            <Slider
              range
              min={priceMin}
              max={priceMax}
              step={Math.max(1, Math.floor((priceMax - priceMin) / 100))}
              value={sliderValue}
              onChange={handlePriceChange}
              onAfterChange={handlePriceAfterChange}
              trackStyle={[{ background: "linear-gradient(to right, var(--theme-color-secondary), var(--theme-color))", height: 6, borderRadius: 3 }]}
              handleRender={handleRender}
              railStyle={{ backgroundColor: "#f0f0f0", height: 6, borderRadius: 3 }}
            />


          </div>
        </div>
      </div>

      {/* ── Sort By ── */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>Sort By</p>
        <div style={{ marginTop: 14 }}>
          <select
            value={filterSortValue || "default"}
            onChange={(e) => getSortParams("filterSort", e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              color: "#333",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              background: "#fff",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="default">Relevance</option>
            <option value="priceLowToHigh">Price - Low to High</option>
            <option value="priceHighToLow">Price - High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* ── Brands Section (multi-select checkboxes) ── */}
      {(() => {
        const productBrandIds = new Set(
          products
            .filter(p => p.brandId || p.Brand?.id)
            .map(p => String(p.brandId || p.Brand?.id))
        );
        const visibleBrands = allBrands.filter(b => productBrandIds.has(String(b.id)));
        if (visibleBrands.length === 0) return null;

        // Parse comma-separated active brand IDs
        const activeBrandSet = new Set(
          activeBrand ? activeBrand.split(",").filter(Boolean) : []
        );

        const toggleBrand = (brandId) => {
          const id = String(brandId);
          const next = new Set(activeBrandSet);
          if (next.has(id)) { next.delete(id); } else { next.add(id); }
          const p = new URLSearchParams(search);
          if (next.size === 0) { p.delete("brand"); } else { p.set("brand", [...next].join(",")); }
          const qs = p.toString();
          navigate(S + (qs ? `?${qs}` : ""));
        };

        return (
          <div style={styles.section}>
            <div className="mobile-accordion-header" onClick={() => toggleMobileSection("brands")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <p style={{...styles.sectionTitle, margin: 0}}>
                Brands {isMobile && <span style={styles.mobileChevron}>{mobileSections.brands ? "▲" : "▼"}</span>}
              </p>
              {activeBrandSet.size > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); const p = new URLSearchParams(search); p.delete("brand"); const qs = p.toString(); navigate(S + (qs ? `?${qs}` : "")); }}
                  style={styles.clearBtn}
                >
                  Reset
                </button>
              )}
            </div>
            <div
              className={clsx("mobile-accordion-content", (mobileSections.brands || !isMobile) && "open")}
              style={(!mobileSections.brands && isMobile) ? {display: "none"} : {marginTop: 14}}
            >
              <ul style={styles.filterList}>
                {visibleBrands.map(brand => {
                  const id = String(brand.id);
                  const checked = activeBrandSet.has(id);
                  const count = products.filter(p =>
                    String(p.brandId) === id || String(p.Brand?.id) === id
                  ).length;
                  return (
                    <li key={brand.id}>
                      <button
                        onClick={() => toggleBrand(brand.id)}
                        style={{ ...styles.filterBtn, ...(checked ? styles.filterBtnActive : {}) }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {/* Checkbox square */}
                          <span style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: checked ? "2px solid var(--theme-color)" : "2px solid #ccc",
                            background: checked ? "var(--theme-color)" : "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.15s",
                          }}>
                            {checked && (
                              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          {brand.name}
                        </span>
                        <span style={{ ...styles.filterCount, ...(checked ? styles.filterCountActive : {}) }}>
                          ({count})
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })()}

      {/* ── Subcategories Section (Cascading) ── */}
      {activeCategory && (
        <div style={styles.section}>
          <div className="mobile-accordion-header" onClick={() => toggleMobileSection("categories")}>
            <p style={{...styles.sectionTitle, margin: 0}}>
              Subcategories {isMobile && <span style={styles.mobileChevron}>{mobileSections.categories ? "▲" : "▼"}</span>}
            </p>
          </div>
          
          <div className={clsx("mobile-accordion-content", (mobileSections.categories || !isMobile) && "open")} style={(!mobileSections.categories && isMobile) ? {display: 'none'} : {marginTop: 14}}>
            <ul style={styles.filterList}>
              {(() => {
                const activeCatObj = categories.find(c => c.value === activeCategory);
                const subcategories = activeCatObj?.subcategories || [];
                if (!activeCatObj || subcategories.length === 0) return (
                   <li style={{ fontSize: "13px", color: "#777" }}>No subcategories found.</li>
                );

                return (
                  <>
                    {/* All Subcategories (Clear Subcategory Filter) */}
                    <li>
                      <button
                        onClick={() => navigate(`${S}?category=${activeCategory}`)}
                        style={{
                          ...styles.filterBtn,
                          color: !activeSubCat ? "var(--theme-color)" : "#333",
                          fontWeight: !activeSubCat ? 600 : 400,
                          borderBottom: "1px dashed #eee",
                          paddingBottom: "12px",
                          marginBottom: "8px",
                          borderRadius: 0
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <span style={{
                            ...styles.radioCircle,
                            ...(!activeSubCat ? styles.radioCircleActive : {})
                          }}>
                            <span style={{
                              ...styles.radioInner,
                              ...(!activeSubCat ? styles.radioInnerActive : {})
                            }} />
                          </span>
                          All Subcategories
                        </span>
                      </button>
                    </li>

                    {/* Subcategories with radio buttons for sub-subcategories */}
                    {subcategories.map((sub) => {
                      const subCount = products.filter(p => 
                        (p.subCategoryId && String(p.subCategoryId) === String(sub.id)) ||
                        p.SubCategory?.value === sub.value
                      ).length;
                      const subActive = activeSubCat === sub.value;
                      const subsubs = sub.subsubcategories || [];

                      return (
                        <li key={sub.value} style={{ marginBottom: "6px" }}>
                          <button
                            onClick={() => navigate(`${S}?category=${activeCategory}&subcategory=${sub.value}`)}
                            style={{ ...styles.subBtn, ...(subActive ? styles.subBtnActive : {}) }}
                          >
                            <span style={{ display: "flex", alignItems: "center" }}>
                              <span style={{
                                ...styles.radioCircle,
                                ...(subActive ? styles.radioCircleActive : {})
                              }}>
                                <span style={{
                                  ...styles.radioInner,
                                  ...(subActive ? styles.radioInnerActive : {})
                                }} />
                              </span>
                              {sub.image ? (
                                <img src={imgSrc(sub.image)} alt={sub.label} style={styles.thumbImg} />
                              ) : (
                                <span style={styles.thumbPlaceholder}>📁</span>
                              )}
                              {sub.label}
                            </span>
                            <span style={{ ...styles.filterCount, ...(subActive ? styles.filterCountActive : {}) }}>
                              ({subCount})
                            </span>
                          </button>

                          {/* Sub-subcategory Radio Buttons */}
                          {subActive && subsubs.length > 0 && (
                            <div style={{ paddingLeft: "32px", marginTop: "8px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                              {subsubs.map(ss => {
                                const ssActive = activeSubSubCat === ss.value;
                                return (
                                  <label key={ss.value} style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "13px", color: ssActive ? "var(--theme-color)" : "#555", fontWeight: ssActive ? "500" : "400" }}>
                                    <span style={{
                                      ...styles.radioCircle,
                                      ...(ssActive ? styles.radioCircleActive : {}),
                                      marginRight: "8px"
                                    }}>
                                      <span style={{
                                        ...styles.radioInner,
                                        ...(ssActive ? styles.radioInnerActive : {})
                                      }} />
                                    </span>
                                    <input
                                      type="radio"
                                      name="subsubcategory"
                                      value={ss.value}
                                      checked={ssActive}
                                      onChange={() => navigate(`${S}?category=${activeCategory}&subcategory=${sub.value}&subsubcategory=${ss.value}`)}
                                      style={{ display: 'none' }}
                                    />
                                    {ss.label}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </>
                );
              })()}
            </ul>
          </div>
        </div>
      )}



    </div>
  );
};

// ── Inline Brand Logo ─────────────────────────────────────────────────────────
const BrandLogo = ({ logo }) => {
  const IMG_BASE = process.env.REACT_APP_IMG_URL + "/uploads/";
  if (!logo) return null;
  const src = logo.startsWith("http") ? logo : `${IMG_BASE}${logo.replace(/^\/?(uploads\/)?/, "")}`;
  return (
    <img
      src={src}
      alt=""
      style={{ width: 28, height: 18, objectFit: "contain", marginRight: 8, borderRadius: 2, background: "#f8f8f8" }}
      onError={e => { e.target.style.display = "none"; }}
    />
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
    background: "none", border: "none", color: "var(--theme-color)",
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
  filterBtnActive: { background: "transparent", color: "var(--theme-color)", fontWeight: 600 },
  filterCount: { fontSize: 11, color: "#bbb", fontWeight: 400, flexShrink: 0 },
  filterCountActive: { color: "var(--theme-color)" },
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
    padding: "0 0 0 10px",
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
  subBtnActive: { background: "transparent", color: "var(--theme-color)", fontWeight: 600 },
  subSubList: {
    listStyle: "none",
    margin: "2px 0 4px 0",
    padding: "0 0 0 20px",
    display: "flex",
    flexDirection: "column",
    gap: 1,
    borderLeft: "2px dashed #f0e0ff",
  },
  subSubBtn: {
    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "none", border: "none", outline: "none", cursor: "pointer",
    paddingTop: 6, paddingBottom: 6, paddingRight: 10, paddingLeft: 8,
    fontSize: 11, color: "#888", borderRadius: 4,
    transition: "background 0.15s, color 0.15s", textAlign: "left",
  },
  subSubBtnActive: { background: "transparent", color: "var(--theme-color)", fontWeight: 600 },
  radioCircle: {
    display: "inline-flex",
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "1px solid #ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
    background: "#fff",
  },
  radioCircleActive: {
    borderColor: "var(--theme-color)",
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "transparent",
  },
  radioInnerActive: {
    background: "var(--theme-color)",
  },
  thumbImg: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    objectFit: "cover",
    marginRight: 8,
    border: "1px solid #eee",
    background: "#fff",
  },
  thumbPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#f1f1f1",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    fontSize: 10,
  },
  pillBtn: {
    background: "#f3f4f6",
    border: "none",
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "11px",
    fontWeight: 500,
    color: "#4b5563",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    whiteSpace: "nowrap",
    outline: "none"
  },
  pillBtnActive: {
    background: "var(--theme-color)",
    color: "#fff",
  },
  comboIcon: { marginRight: 6 },
};

ShopSidebar.propTypes = {
  getSortParams: PropTypes.func,
  products: PropTypes.array,
  filterSortValue: PropTypes.string,
  sideSpaceClass: PropTypes.string,
};

export default ShopSidebar;
