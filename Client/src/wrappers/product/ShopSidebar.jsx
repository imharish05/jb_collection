import PropTypes from "prop-types";
import clsx from "clsx";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const S = process.env.PUBLIC_URL + "/shop";

const ShopSidebar = ({ products, getSortParams, sideSpaceClass }) => {
  const { categories = [], events = [], combos = [] } = useSelector((state) => state.navMenu);

  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const activeCategory = params.get("category") || "";
  const activeEvent    = params.get("event")    || "";
  const activeCombo    = params.get("combo")    || "";
  const activeSubCat   = params.get("subcategory") || "";

  // ── Track which category's subcategories are expanded ──
  const [expandedCat, setExpandedCat] = useState(() => {
    // Auto-expand the category that matches the current URL on first render
    return activeCategory || null;
  });

  // ── Price range ──
  const allPrices = useMemo(() => products.map(p => p.price).filter(Boolean), [products]);
  const priceMin  = useMemo(() => allPrices.length ? Math.floor(Math.min(...allPrices)) : 0,    [allPrices]);
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
    // If already expanded + active → collapse and go back to "all"
    if (expandedCat === cat.value && activeCategory === cat.value) {
      setExpandedCat(null);
      navigate(S);
    } else {
      setExpandedCat(cat.value);
      navigate(`${S}?category=${cat.value}`);
    }
  };

  return (
    <div className={clsx("sidebar-style", sideSpaceClass)} style={styles.root}>

      {/* ── Price Range ── */}
      <div style={styles.section}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ ...styles.sectionTitle, margin: 0 }}>Price Range</p>
          {priceRange && (
            <button onClick={clearPrice} style={styles.clearBtn}>Reset</button>
          )}
        </div>

        <div style={styles.priceBadgeRow}>
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
            { borderColor: "#db1a5d", backgroundColor: "#fff", width: 16, height: 16, marginTop: -6.5, boxShadow: "0 1px 4px rgba(219, 26, 93,0.35)", opacity: 1 },
            { borderColor: "#db1a5d", backgroundColor: "#fff", width: 16, height: 16, marginTop: -6.5, boxShadow: "0 1px 4px rgba(219, 26, 93,0.35)", opacity: 1 },
          ]}
          railStyle={{ backgroundColor: "#e8e8e8", height: 3 }}
        />

        <div style={styles.priceLimits}>
          <span>₹{priceMin.toLocaleString("en-IN")}</span>
          <span>₹{priceMax.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* ── Categories + Subcategories ── */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>Categories</p>
        <ul style={styles.filterList}>
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
              : products.filter(p => p.category?.includes(cat.value)).length;

            return (
              <li key={cat.value ?? "__all"}>
                {/* ── Category row ── */}
                <button
                  onClick={() => handleCategoryClick(cat)}
                  style={{ ...styles.filterBtn, ...(isActive ? styles.filterBtnActive : {}) }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Chevron — only shown for cats that have subcategories */}
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
                    {/* "All in <Category>" option */}
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

      {/* ── Events ── */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>Shop by Event</p>
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

      {/* ── Combos ── */}
      {combos.length > 0 && (
        <div style={{ ...styles.section, borderBottom: "none", paddingBottom: 0 }}>
          <p style={styles.sectionTitle}>
            <span style={styles.comboIcon}></span> Combos
          </p>
          <ul style={styles.filterList}>
            {combos.map((combo) => {
              const isAll    = combo.value === null;
              const isActive = isAll ? activeCombo === "all" : activeCombo === combo.value;
              const count    = isAll
                ? products.filter(p => p.combo && p.combo.length > 0).length
                : products.filter(p => p.combo?.includes(combo.value)).length;
              if (!isAll && count === 0) return null;
              return (
                <li key={combo.value ?? "__all-combos"}>
                  <button
                    onClick={() => combo.value ? navigate(`${S}?combo=${combo.value}`) : navigate(`${S}?combo=all`)}
                    style={{ ...styles.filterBtn, ...(isActive ? styles.filterBtnActive : {}) }}
                  >
                    <span>{combo.label}</span>
                    <span style={{ ...styles.filterCount, ...(isActive ? styles.filterCountActive : {}) }}>
                      ({count})
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
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
  },
  clearBtn: {
    background: "none", border: "none", color: "#db1a5d",
    fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline",
  },
  priceBadgeRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  priceBadge: {
    flex: 1, border: "1px solid #e8e8e8", borderRadius: 4, padding: "7px 10px",
    textAlign: "center", background: "#fafafa", display: "flex", flexDirection: "column", gap: 2,
  },
  badgeLabel: { fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.4px" },
  badgeValue: { fontSize: 14, fontWeight: 600, color: "#222" },
  priceSep: { color: "#bbb", fontSize: 14, flexShrink: 0 },
  priceLimits: { display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "#bbb" },
  filterList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 1 },
  filterBtn: {
    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "none", border: "none", outline: "none", cursor: "pointer",
    paddingTop: 7, paddingBottom: 7, paddingRight: 10, paddingLeft: 10,
    fontSize: 13, color: "#444", borderRadius: 6,
    transition: "background 0.15s, color 0.15s", textAlign: "left",
  },
  filterBtnActive: { background: "#fdf0ff", color: "#a020c0", fontWeight: 600 },
  filterCount: { fontSize: 11, color: "#bbb", fontWeight: 400, flexShrink: 0 },
  filterCountActive: { color: "#c050e0" },
chevron: {
    display: "inline-block",
    fontSize: 25,        // was 16
    lineHeight: 1,
    color: "#bbb",
    transition: "transform 0.2s ease",
    fontWeight: 900,     // was 400
},
  // ── Subcategory styles ──
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
    paddingTop: 6, paddingBottom: 6, paddingRight: 10, paddingLeft: 8,
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