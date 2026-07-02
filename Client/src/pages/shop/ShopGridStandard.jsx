import { Fragment, useState, useEffect, useRef, useMemo, cloneElement } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { getSortedProducts } from '../../helpers/product';
import SEO from "../../components/seo";
import LayoutOne from '../../layouts/LayoutOne';
import Breadcrumb from '../../wrappers/breadcrumb/Breadcrumb';
import ShopSidebar from '../../wrappers/product/ShopSidebar';
import ShopTopbar from '../../wrappers/product/ShopTopbar';
import ShopProducts from '../../wrappers/product/ShopProducts';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const PAGE_SIZES = [20, 50, "All"];

const SORT_OPTIONS = [
  { value: 'default',        label: 'Relevance',          icon: '✦' },
  { value: 'priceLowToHigh', label: 'Price: Low to High', icon: '↑' },
  { value: 'priceHighToLow', label: 'Price: High to Low', icon: '↓' },
  { value: 'newest',         label: 'Newest First',       icon: '🆕' },
];

const ShopGridStandard = () => {
  const [layout, setLayout] = useState('grid three-column');
  const [filterSortType, setFilterSortType] = useState('');
  const [filterSortValue, setFilterSortValue] = useState('');
  const [displayCount, setDisplayCount] = useState(20);
  const [currentData, setCurrentData] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [pageLimit, setPageLimit] = useState(20);
  const [showAll, setShowAll] = useState(false);
  const [priceRange, setPriceRange] = useState(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const isFetchingRef = useRef(false);

  // Mobile UX state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('filter');
  const [mobileSearch, setMobileSearch] = useState('');
  const [draftPrice, setDraftPrice] = useState(null);
  const drawerRef = useRef(null);

  const { products } = useSelector((state) => state.product);
  const { rootCombos: navCombos = [], categories = [], events = [] } = useSelector((state) => state.navMenu || {});

  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [childCombos, setChildCombos] = useState([]);

  const params = new URLSearchParams(search);
  const rawCatParam = params.get("category");
  const catParam    = ["all", "all-categories", "all-products"].includes(String(rawCatParam || "").toLowerCase()) ? null : rawCatParam;
  const eventParam  = params.get("event");
  const comboParam  = params.get("combo");
  const searchParam = params.get("search");
  const subCatParam = params.get("subcategory");
  const subSubCatParam = params.get("subsubcategory");

  const IMG_BASE = process.env.REACT_APP_IMG_URL + "/uploads/";
  const imgSrc = (path) =>
    path ? `${IMG_BASE}${path.replace(/^\/?(uploads\/)?/, "")}` : null;

  const labelMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { 
      if (c.value && c.label) map[c.value] = c.label; 
      if (c.subcategories) {
        c.subcategories.forEach(s => {
          if (s.value && s.label) map[s.value] = s.label;
          if (s.id && s.label) map[String(s.id)] = s.label;
          if (s.subsubcategories) {
            s.subsubcategories.forEach(ss => {
              if (ss.value && ss.label) map[ss.value] = ss.label;
              if (ss.id && ss.label) map[String(ss.id)] = ss.label;
            });
          }
        });
      }
    });
    events.forEach(e => { if (e.value && e.label) map[e.value] = e.label; });
    navCombos.forEach(c => { if (c.value && (c.label || c.name)) map[c.value] = c.label || c.name; });
    // also index by id string for combo lookups
    navCombos.forEach(c => { if (c.id) map[String(c.id)] = c.label || c.name; });
    return map;
  }, [categories, events, navCombos]);
  // ─────────────────────────────────────────────────────────────────────────

  const sortType  = searchParam ? "search" : catParam ? "category" : eventParam ? "tag" : comboParam ? "combo" : "";
  const sortValue = searchParam || catParam || eventParam || comboParam || "";
  const currentCombo = comboParam ? navCombos.find(c => c.value === comboParam || String(c.id) === String(comboParam)) : null;

  const activeLabel = searchParam
    ? `Search: "${searchParam}"`
    : subSubCatParam ? (labelMap[subSubCatParam] || subSubCatParam)
    : subCatParam ? (labelMap[subCatParam] || subCatParam)
    : catParam  ? (labelMap[catParam]  || catParam)
    : eventParam ? (labelMap[eventParam] || eventParam)
    : comboParam === "all" ? "All Combos"
    : currentCombo ? (currentCombo.label || currentCombo.name || labelMap[comboParam] || comboParam)
    : comboParam ? (labelMap[comboParam] || comboParam)
    : null;

  const S = process.env.PUBLIC_URL + "/shop";

  const allPrices = products.map(p => p.price).filter(Boolean);
  const priceMin = 0;
  const priceMax = allPrices.length ? Math.ceil(Math.max(...allPrices)) : 5000;

  const handleSortParams = (type, val) => {
    if (type === "priceRange") {
      const [min, max] = val;
      setPriceRange(min === 0 && max === priceMax ? null : { min, max });
      setDisplayCount(pageLimit);
      return;
    }
    if (!val) { navigate(S); return; }
    if (type === "search") navigate(S + "?search=" + encodeURIComponent(val));
    else if (type === "category") navigate(S + "?category=" + val);
    else if (type === "tag") navigate(S + "?event=" + val);
    else if (type === "combo") navigate(S + "?combo=" + val);
    else { setFilterSortType(type); setFilterSortValue(val); }
  };

  useEffect(() => { setDisplayCount(pageLimit); }, [search, filterSortType, filterSortValue]);

  const isComboMode = !!comboParam;

  useEffect(() => {
    let source = products;
    let comboHandled = false;
    if (sortType === 'combo' && sortValue) {
      const combo = navCombos.find(c => c.value === sortValue || String(c.id) === String(sortValue));
      if (sortValue === 'all') {
        const allComboProductIds = new Set(navCombos.flatMap(c => Array.isArray(c.productIds) ? c.productIds : []));
        source = products.filter(p => p.comboId != null || allComboProductIds.has(p.id));
        comboHandled = true;
      } else if (combo) {
        const ids = new Set(Array.isArray(combo.productIds) ? combo.productIds : []);
        source = ids.size > 0
          ? products.filter(p => ids.has(p.id) || (p.comboId && String(p.comboId) === String(combo.id)))
          : products.filter(p => p.comboId && String(p.comboId) === String(combo.id));
        comboHandled = true;
      }
    }
    let sorted = comboHandled ? source : getSortedProducts(source, sortType, sortValue);

    // Apply subcategory filter if present
    if (subCatParam) {
      sorted = sorted.filter(p => 
        (p.subCategoryId && String(p.subCategoryId) === String(subCatParam)) ||
        p.SubCategory?.value === subCatParam ||
        (p.SubCategory?.id && String(p.SubCategory.id) === String(subCatParam)) ||
        (p.SubCategory && String(p.SubCategory) === String(subCatParam))
      );
    }

    // Apply sub-subcategory filter if present
    if (subSubCatParam) {
      sorted = sorted.filter(p =>
        (p.subSubCategoryId && String(p.subSubCategoryId) === String(subSubCatParam)) ||
        p.SubSubCategory?.value === subSubCatParam ||
        (p.SubSubCategory?.id && String(p.SubSubCategory.id) === String(subSubCatParam)) ||
        (p.SubSubCategory && String(p.SubSubCategory) === String(subSubCatParam))
      );
    }

    sorted = getSortedProducts(sorted, filterSortType, filterSortValue);
    if (priceRange) sorted = sorted.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    setSortedProducts(sorted);
    setCurrentData(showAll ? sorted : sorted.slice(0, displayCount));
  }, [displayCount, products, sortType, sortValue, subCatParam, subSubCatParam, filterSortType, filterSortValue, pageLimit, showAll, priceRange]);

  // Infinite Scroll Listener
  useEffect(() => {
    if (showAll || currentData.length >= sortedProducts.length) return;
    
    const handleScroll = () => {
      // If user scrolled near the bottom (within 1400px, to trigger BEFORE reaching footer on mobile)
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1400 &&
        !isFetchingRef.current
      ) {
        isFetchingRef.current = true;
        setIsFetchingMore(true);
        setTimeout(() => {
          setDisplayCount(prev => prev + pageLimit);
          setIsFetchingMore(false);
          isFetchingRef.current = false;
        }, 800);
      }
    };
    
    // Add debounce to scroll event
    let timeout;
    const debouncedScroll = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', debouncedScroll);
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, [showAll, currentData.length, sortedProducts.length, pageLimit]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setDrawerOpen(false);
  };

  const handleMobileSearch = (e) => {
    e.preventDefault();
    if (mobileSearch.trim()) {
      navigate(S + "?search=" + encodeURIComponent(mobileSearch.trim()));
      setMobileSearch('');
    }
  };

  const applyDrawerFilters = () => {
    if (draftPrice) setPriceRange(draftPrice);
    setDrawerOpen(false);
  };

  const clearAllFilters = () => {
    setPriceRange(null);
    setDraftPrice(null);
    navigate(S);
    setFilterSortType('');
    setFilterSortValue('');
    setDrawerOpen(false);
  };

  const activeFilterCount = (priceRange ? 1 : 0) + (catParam || eventParam || comboParam || subCatParam || subSubCatParam ? 1 : 0);
  const sliderVal = (draftPrice || priceRange) ? [(draftPrice || priceRange).min, (draftPrice || priceRange).max] : [priceMin, priceMax];

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
        marginTop: -9,
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
    <Fragment>
      <SEO 
        title={activeLabel ? activeLabel : "Shop Customized Gifts"}
        titleTemplate="Personalized & Customized Gifts for Every Occasion" 
        description="Browse our collection of customized return gifts, personalized corporate gifts, laser engraved products, and bulk gifts for weddings, baby showers, festivals, and corporate events."
        keywords="buy customized gifts online, personalized gifts shop, return gifts, corporate gifts online, engraved gifts, bulk gifts, keychains, bottles, pens, laser cut jewelry, wedding return gifts, baby shower gifts, corporate gifts"
      />
      <LayoutOne headerTop="visible">
        <Breadcrumb pages={[
          { label: "Home", path: S.replace("/shop","") + "/" },
          { label: activeLabel || "All Products", path: process.env.PUBLIC_URL + pathname + search }
        ]} />

        {/* Infinite Auto-Scrolling Category Marquee */}
        {categories.length > 0 && (
          <div style={marqueeStyles.container}>
            <style>{`
              @keyframes marquee-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-25%); }
              }
              .category-marquee-track {
                display: flex;
                width: max-content;
                animation: marquee-scroll 25s linear infinite;
              }
              .category-marquee-track-wrapper:hover .category-marquee-track {
                animation-play-state: paused;
              }
              .category-marquee-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                width: 90px;
                flex-shrink: 0;
                margin: 0 20px;
                user-select: none;
                transition: transform 0.2s ease;
              }
              .category-marquee-item:hover {
                transform: scale(1.06);
              }
              .category-marquee-img-wrap {
                width: 72px;
                height: 72px;
                border-radius: 50%;
                border: 2px solid #e5e7eb;
                background: #fafafa;
                display: flex;
                align-items: center;
                justifyContent: center;
                overflow: hidden;
                transition: all 0.25s ease;
              }
              .category-marquee-item.active .category-marquee-img-wrap {
                border: 2.5px solid #db1a5d;
                box-shadow: 0 0 0 3px #fff, 0 0 0 5px #db1a5d, 0 4px 10px rgba(219, 26, 93, 0.15);
              }
            `}</style>
            <div className="category-marquee-fade category-marquee-fade--left" style={marqueeStyles.fadeLeft} />
            <div className="category-marquee-track-wrapper" style={marqueeStyles.trackWrapper}>
              <div className="category-marquee-track">
                {/* Loop 1 */}
                {categories.map((cat) => {
                  const isActive = catParam === cat.value;
                  return (
                    <div
                      key={`cat-1-${cat.value}`}
                      onClick={() => navigate(`${S}?category=${cat.value}`)}
                      className={`category-marquee-item${isActive ? ' active' : ''}`}
                    >
                      <div className="category-marquee-img-wrap">
                        {cat.image ? (
                          <img src={imgSrc(cat.image)} alt={cat.label} style={marqueeStyles.img} />
                        ) : (
                          <span style={{ fontSize: 24 }}>📁</span>
                        )}
                      </div>
                      <span style={isActive ? marqueeStyles.labelActive : marqueeStyles.label}>{cat.label}</span>
                    </div>
                  );
                })}
                {/* Loop 2 */}
                {categories.map((cat) => {
                  const isActive = catParam === cat.value;
                  return (
                    <div
                      key={`cat-2-${cat.value}`}
                      onClick={() => navigate(`${S}?category=${cat.value}`)}
                      className={`category-marquee-item${isActive ? ' active' : ''}`}
                    >
                      <div className="category-marquee-img-wrap">
                        {cat.image ? (
                          <img src={imgSrc(cat.image)} alt={cat.label} style={marqueeStyles.img} />
                        ) : (
                          <span style={{ fontSize: 24 }}>📁</span>
                        )}
                      </div>
                      <span style={isActive ? marqueeStyles.labelActive : marqueeStyles.label}>{cat.label}</span>
                    </div>
                  );
                })}
                {/* Loop 3 */}
                {categories.map((cat) => {
                  const isActive = catParam === cat.value;
                  return (
                    <div
                      key={`cat-3-${cat.value}`}
                      onClick={() => navigate(`${S}?category=${cat.value}`)}
                      className={`category-marquee-item${isActive ? ' active' : ''}`}
                    >
                      <div className="category-marquee-img-wrap">
                        {cat.image ? (
                          <img src={imgSrc(cat.image)} alt={cat.label} style={marqueeStyles.img} />
                        ) : (
                          <span style={{ fontSize: 24 }}>📁</span>
                        )}
                      </div>
                      <span style={isActive ? marqueeStyles.labelActive : marqueeStyles.label}>{cat.label}</span>
                    </div>
                  );
                })}
                {/* Loop 4 */}
                {categories.map((cat) => {
                  const isActive = catParam === cat.value;
                  return (
                    <div
                      key={`cat-4-${cat.value}`}
                      onClick={() => navigate(`${S}?category=${cat.value}`)}
                      className={`category-marquee-item${isActive ? ' active' : ''}`}
                    >
                      <div className="category-marquee-img-wrap">
                        {cat.image ? (
                          <img src={imgSrc(cat.image)} alt={cat.label} style={marqueeStyles.img} />
                        ) : (
                          <span style={{ fontSize: 24 }}>📁</span>
                        )}
                      </div>
                      <span style={isActive ? marqueeStyles.labelActive : marqueeStyles.label}>{cat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="category-marquee-fade category-marquee-fade--right" style={marqueeStyles.fadeRight} />
          </div>
        )}

        <div className="shop-area pb-100" style={{ paddingTop: "35px" }}>
          <div className="container">

            {activeLabel && (
              <div style={{ marginBottom:24, display:"flex", alignItems:"center", gap:10 }}>
                <h4 style={{ margin:0, fontSize:20, fontWeight:700 }}>{activeLabel}</h4>
                <span style={{ fontSize:13, color:"#888" }}>
                  {isComboMode ? `(${childCombos.length} combos)` : `(${sortedProducts.length} products)`}
                </span>
                <a href={S} style={{ marginLeft:8, fontSize:12, color:"#c0622a" }}>Clear ×</a>
              </div>
            )}

            <form className="mobile-shop-search" onSubmit={handleMobileSearch}>
              <input
                type="search"
                placeholder="Search gifts..."
                value={mobileSearch}
                onChange={e => setMobileSearch(e.target.value)}
              />
              <button type="submit" aria-label="Search">
                <i className="fa fa-search" />
              </button>
            </form>

            <div className="mobile-active-filters">
              {priceRange && (
                <span className="filter-chip filter-chip-price">
                  ₹{priceRange.min.toLocaleString('en-IN')} – ₹{priceRange.max.toLocaleString('en-IN')}
                  <button onClick={() => { setPriceRange(null); setDraftPrice(null); }}>×</button>
                </span>
              )}
              {catParam && !subCatParam && (
                <span className="filter-chip">
                  {labelMap[catParam] || catParam}
                  <button onClick={() => navigate(S)}>×</button>
                </span>
              )}
              {subCatParam && !subSubCatParam && (
                <span className="filter-chip">
                  {labelMap[subCatParam] || subCatParam}
                  <button onClick={() => navigate(catParam ? `${S}?category=${catParam}` : S)}>×</button>
                </span>
              )}
              {subSubCatParam && (
                <span className="filter-chip">
                  {labelMap[subSubCatParam] || subSubCatParam}
                  <button onClick={() => navigate(subCatParam ? `${S}?category=${catParam}&subcategory=${subCatParam}` : catParam ? `${S}?category=${catParam}` : S)}>×</button>
                </span>
              )}
              {eventParam && (
                <span className="filter-chip">
                  🎉 {labelMap[eventParam] || eventParam}
                  <button onClick={() => navigate(S)}>×</button>
                </span>
              )}
              {comboParam && (
                <span className="filter-chip">
                  🎁 {currentCombo?.name || currentCombo?.label || labelMap[comboParam] || comboParam}
                  <button onClick={() => navigate(S)}>×</button>
                </span>
              )}
              {searchParam && (
                <span className="filter-chip">
                  🔍 "{searchParam}"
                  <button onClick={() => navigate(S)}>×</button>
                </span>
              )}
            </div>

            {priceRange && (
              <div className="d-none d-lg-flex" style={{ marginBottom:16, alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:13, color:"#555" }}>Active filter:</span>
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  background:"transparent", color:"var(--theme-color)",
                  fontSize:12, fontWeight:600, borderRadius:20,
                  padding:"4px 12px", border:"1px solid var(--theme-color)",
                }}>
                  ₹{priceRange.min.toLocaleString("en-IN")} – ₹{priceRange.max.toLocaleString("en-IN")}
                  <button
                    onClick={() => setPriceRange(null)}
                    style={{ background:"none", border:"none", color:"var(--theme-color)", cursor:"pointer", padding:0, fontSize:14, lineHeight:1, fontWeight:700 }}
                  >×</button>
                </span>
                <span style={{ fontSize:12, color:"#888" }}>{sortedProducts.length} products found</span>
              </div>
            )}

            <div className="row">
              <div className="col-lg-3 order-1 order-lg-1 shop-sidebar-col">
                <ShopSidebar
                  products={products}
                  getSortParams={handleSortParams}
                  filterSortValue={filterSortValue}
                  sideSpaceClass="mr-30"
                />
              </div>

              <div className="col-lg-9 order-2 order-lg-2 shop-products-col">
                <div className="d-none d-lg-block">
                  <ShopTopbar
                    getLayout={setLayout}
                    getFilterSortParams={(type, val) => { setFilterSortType(type); setFilterSortValue(val); }}
                    productCount={sortedProducts.length}
                    sortedProductCount={currentData.length}
                  />
                </div>
                <div className="d-flex d-lg-none align-items-center mb-3" style={{ padding:'4px 0' }}>
                  <p style={{ margin:0, fontSize:13, color:'#888' }}>
                    <strong style={{ color:'#222' }}>{currentData.length}</strong> of {sortedProducts.length} products
                  </p>
                </div>

                <ShopProducts 
                  layout={layout} 
                  products={currentData} 
                  isComboMode={isComboMode} 
                  childCombos={childCombos} 
                  isLoadingMore={isFetchingMore}
                />
                
              </div>
            </div>
          </div>
        </div>

        <div className="mobile-filter-bar">
          <button
            className="mobile-filter-bar__btn mobile-filter-bar__btn--filter"
            onClick={() => { setDrawerTab('filter'); setDrawerOpen(true); setDraftPrice(priceRange); }}
          >
            <i className="fa fa-sliders" style={{ fontSize:15 }} />
            Filter
            {activeFilterCount > 0 && (
              <span className="filter-bar-badge">{activeFilterCount}</span>
            )}
          </button>
          <button
            className="mobile-filter-bar__btn mobile-filter-bar__btn--sort"
            onClick={() => { setDrawerTab('sort'); setDrawerOpen(true); }}
          >
            <i className="fa fa-sort-amount-asc" style={{ fontSize:14 }} />
            Sort
          </button>
        </div>

        <div
          className={`mobile-filter-overlay${drawerOpen ? ' open' : ''}`}
          onClick={handleOverlayClick}
        >
          <div className="mobile-filter-drawer" ref={drawerRef}>
            <div className="drawer-handle" />
            <div className="drawer-header">
              <h3>{drawerTab === 'sort' ? 'Sort By' : 'Filter'}</h3>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
            </div>

            {drawerTab === 'sort' ? (
              <div className="drawer-section">
                <div className="drawer-sort-list">
                  {SORT_OPTIONS.map(opt => {
                    const isActive = filterSortValue === opt.value || (opt.value === 'default' && !filterSortValue);
                    return (
                      <button
                        key={opt.value}
                        className={`drawer-sort-option${isActive ? ' active' : ''}`}
                        onClick={() => {
                          setFilterSortType('filterSort');
                          setFilterSortValue(opt.value);
                          setDrawerOpen(false);
                        }}
                      >
                        <span className="sort-opt-left">
                          <span className="sort-opt-icon">{opt.icon}</span>
                          <span className="sort-opt-label">{opt.label}</span>
                        </span>
                        <span className={`sort-opt-check${isActive ? ' sort-opt-check--active' : ''}`}>
                          {isActive && <i className="fa fa-check" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="drawer-section">
                  <p className="drawer-section-title">Price Range</p>

                  <div style={{ padding: '0 8px', marginTop: '50px', marginBottom: '20px' }}>
                    <Slider
                      range
                      min={priceMin} max={priceMax}
                      step={Math.max(1, Math.floor((priceMax - priceMin) / 100))}
                      value={sliderVal}
                      onChange={val => setDraftPrice({ min: val[0], max: val[1] })}
                      trackStyle={[{ background: "linear-gradient(to right, var(--theme-color-secondary), var(--theme-color))", height: 6, borderRadius: 3 }]}
                      handleRender={handleRender}
                      railStyle={{ backgroundColor: "#f0f0f0", height: 6, borderRadius: 3 }}
                    />

                  </div>
                </div>

                {categories.length > 0 && (
                  <div className="drawer-section">
                    <p className="drawer-section-title">Categories</p>
                    <div className="drawer-chip-grid">
                      {categories.map(cat => {
                        const count = products.filter(p =>
                          (p.categoryId && String(p.categoryId) === String(cat.id)) ||
                          p.category?.includes(cat.value)
                        ).length;
                        return (
                          <button
                            key={cat.value}
                            className={`drawer-chip${catParam === cat.value ? ' active' : ''}`}
                            onClick={() => { navigate(`${S}?category=${cat.value}`); setDrawerOpen(false); }}
                          >
                            {cat.label}
                            <span className="drawer-chip-count">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Subcategories (separate section in drawer) */}
                {catParam && (
                  (() => {
                    const activeCatObj = categories.find(c => c.value === catParam);
                    const subcats = activeCatObj?.subcategories || [];
                    if (subcats.length === 0) return null;
                    return (
                      <div className="drawer-section">
                        <p className="drawer-section-title">Sub-categories</p>
                        <div className="drawer-chip-grid">
                          <button
                            className={`drawer-chip${!subCatParam ? ' active' : ''}`}
                            onClick={() => { navigate(`${S}?category=${catParam}`); setDrawerOpen(false); }}
                          >
                            All {activeCatObj.label}
                          </button>
                          {subcats.map(sub => {
                            const count = products.filter(p => 
                              (p.subCategoryId && String(p.subCategoryId) === String(sub.id)) ||
                              p.SubCategory?.value === sub.value
                            ).length;
                            return (
                              <button
                                key={sub.value}
                                className={`drawer-chip${subCatParam === sub.value ? ' active' : ''}`}
                                onClick={() => { navigate(`${S}?category=${catParam}&subcategory=${sub.value}`); setDrawerOpen(false); }}
                              >
                                {sub.label}
                                <span className="drawer-chip-count">({count})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Sub-subcategories (separate section, pill design) */}
                {catParam && subCatParam && (
                  (() => {
                    const activeCatObj = categories.find(c => c.value === catParam);
                    const activeSubObj = activeCatObj?.subcategories?.find(s => s.value === subCatParam);
                    const subsubcats = activeSubObj?.subsubcategories || [];
                    if (subsubcats.length === 0) return null;
                    return (
                      <div className="drawer-section">
                        <p className="drawer-section-title">Sub-subcategories</p>
                        <div className="drawer-chip-grid" style={{ gap: 8 }}>
                          <button
                            className={`drawer-pill${!subSubCatParam ? ' active' : ''}`}
                            onClick={() => { navigate(`${S}?category=${catParam}&subcategory=${subCatParam}`); setDrawerOpen(false); }}
                            style={{
                              background: !subSubCatParam ? "var(--theme-gradient)" : "#f3f4f6",
                              color: !subSubCatParam ? "#fff" : "#4b5563",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "16px",
                              fontSize: "11px",
                              fontWeight: 500,
                              cursor: "pointer",
                              outline: "none"
                            }}
                          >
                            All
                          </button>
                          {subsubcats.map(subsub => {
                            const isActive = subSubCatParam === subsub.value;
                            const count = products.filter(p => 
                              (p.subSubCategoryId && String(p.subSubCategoryId) === String(subsub.id)) ||
                              p.SubSubCategory?.value === subsub.value
                            ).length;
                            return (
                              <button
                                key={subsub.value}
                                className={`drawer-pill${isActive ? ' active' : ''}`}
                                onClick={() => { navigate(`${S}?category=${catParam}&subcategory=${subCatParam}&subsubcategory=${subsub.value}`); setDrawerOpen(false); }}
                                style={{
                                  background: isActive ? "var(--theme-gradient)" : "#f3f4f6",
                                  color: isActive ? "#fff" : "#4b5563",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: "16px",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  outline: "none"
                                }}
                              >
                                {subsub.label}
                                <span style={{ fontSize: "10px", opacity: 0.8, marginLeft: 4 }}>({count})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                )}

                <div className="drawer-footer">
                  <button className="drawer-footer__clear" onClick={clearAllFilters}>Clear All</button>
                  <button className="drawer-footer__apply" onClick={applyDrawerFilters}>Apply Filters</button>
                </div>
              </>
            )}
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ShopGridStandard;

const marqueeStyles = {
  container: {
    position: "relative",
    width: "100%",
    background: "#fff",
    borderBottom: "1px solid #f3f4f6",
    padding: "15px 0",
    overflow: "hidden",
  },
  trackWrapper: {
    display: "flex",
    width: "100%",
    overflow: "hidden",
  },
  track: {
    display: "flex",
    width: "max-content",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    width: "90px",
    flexShrink: 0,
    margin: "0 20px",
    userSelect: "none",
    transition: "transform 0.2s ease",
  },
  itemActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    width: "90px",
    flexShrink: 0,
    margin: "0 20px",
    userSelect: "none",
    transform: "scale(1.04)",
    transition: "transform 0.2s ease",
  },
  imgWrap: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    border: "2px solid #e5e7eb",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transition: "all 0.25s ease",
  },
  imgWrapActive: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    border: "2.5px solid var(--theme-color)",
    boxShadow: "0 0 0 3px #fff, 0 0 0 5px var(--theme-color), 0 4px 10px rgba(0, 0, 0, 0.15)",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transition: "all 0.25s ease",
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#6b7280",
    textAlign: "center",
    whiteSpace: "normal",
    width: "100%",
    transition: "color 0.2s",
  },
  labelActive: {
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--theme-color)",
    textAlign: "center",
    whiteSpace: "normal",
    width: "100%",
    transition: "color 0.2s",
  },
  fadeLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "80px",
    height: "100%",
    background: "linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))",
    zIndex: 2,
    pointerEvents: "none",
  },
  fadeRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "80px",
    height: "100%",
    background: "linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))",
    zIndex: 2,
    pointerEvents: "none",
  }
};
