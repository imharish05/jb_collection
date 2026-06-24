import { Fragment, useState, useEffect, useRef, useMemo } from 'react';
import Paginator from 'react-hooks-paginator';
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchComboById } from '../../store/services/comboService';
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
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [pageLimit, setPageLimit] = useState(20);
  const [showAll, setShowAll] = useState(false);
  const [priceRange, setPriceRange] = useState(null);

  // Mobile UX state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('filter');
  const [mobileSearch, setMobileSearch] = useState('');
  const [draftPrice, setDraftPrice] = useState(null);
  const drawerRef = useRef(null);

  const { products } = useSelector((state) => state.product);
  const { rootCombos: navCombos = [], categories = [], events = [] } = useSelector((state) => state.navMenu || {});
  const { currentCombo: reduxCurrentCombo } = useSelector((state) => state.combo || {});
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

  // ── Dynamic label map built from Redux state ──────────────────────────────
  const labelMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { 
      if (c.value && c.label) map[c.value] = c.label; 
      if (c.subcategories) {
        c.subcategories.forEach(s => {
          if (s.value && s.label) map[s.value] = s.label;
          if (s.id && s.label) map[String(s.id)] = s.label;
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
      setOffset(0); setCurrentPage(1);
      return;
    }
    if (!val) { navigate(S); return; }
    if (type === "search") navigate(S + "?search=" + encodeURIComponent(val));
    else if (type === "category") navigate(S + "?category=" + val);
    else if (type === "tag") navigate(S + "?event=" + val);
    else if (type === "combo") navigate(S + "?combo=" + val);
    else { setFilterSortType(type); setFilterSortValue(val); }
  };

  useEffect(() => { setOffset(0); setCurrentPage(1); }, [search]);

  const isComboMode = !!comboParam;
  useEffect(() => {
    if (comboParam) dispatch(fetchComboById(comboParam));
    else setChildCombos([]);
  }, [comboParam]);

  useEffect(() => {
    if (isComboMode && reduxCurrentCombo?.children) {
      const rootSlug = reduxCurrentCombo.slug || reduxCurrentCombo.id;
      setChildCombos(
        reduxCurrentCombo.children
          .filter(c => c.isActive)
          .map(c => ({ ...c, rootComboId: rootSlug, slug: rootSlug }))
      );
    }
  }, [reduxCurrentCombo, isComboMode]);

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

    sorted = getSortedProducts(sorted, filterSortType, filterSortValue);
    if (priceRange) sorted = sorted.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    setSortedProducts(sorted);
    setCurrentData(showAll ? sorted : sorted.slice(offset, offset + pageLimit));
  }, [offset, products, sortType, sortValue, subCatParam, filterSortType, filterSortValue, pageLimit, showAll, priceRange]);

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

  const activeFilterCount = (priceRange ? 1 : 0) + (catParam || eventParam || comboParam || subCatParam ? 1 : 0);
  const sliderVal = (draftPrice || priceRange) ? [(draftPrice || priceRange).min, (draftPrice || priceRange).max] : [priceMin, priceMax];

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

        <div className="shop-area pt-95 pb-100">
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

            {(categories.length > 0 || events.length > 0 || navCombos.length > 0) && (
              <div className="mobile-cat-pills">
                <button
                  className={`cat-pill${!catParam && !eventParam && !comboParam && !searchParam ? ' active' : ''}`}
                  onClick={() => navigate(S)}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    className={`cat-pill${catParam === cat.value ? ' active' : ''}`}
                    onClick={() => navigate(`${S}?category=${cat.value}`)}
                  >
                    {cat.label}
                  </button>
                ))}
                {events.map(ev => (
                  <button
                    key={ev.value}
                    className={`cat-pill${eventParam === ev.value ? ' active' : ''}`}
                    onClick={() => navigate(`${S}?event=${ev.value}`)}
                  >
                    🎉 {ev.label}
                  </button>
                ))}
                {navCombos.map(combo => (
                  <button
                    key={combo.id}
                    className={`cat-pill${comboParam === String(combo.id) ? ' active' : ''}`}
                    onClick={() => navigate(`${S}?combo=${combo.id}`)}
                  >
                    🎁 {combo.name || combo.label}
                  </button>
                ))}
              </div>
            )}

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
              {subCatParam && (
                <span className="filter-chip">
                  {labelMap[subCatParam] || subCatParam}
                  <button onClick={() => navigate(catParam ? `${S}?category=${catParam}` : S)}>×</button>
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
                  background:"#fdf0ff", color:"#a020c0",
                  fontSize:12, fontWeight:600, borderRadius:20,
                  padding:"4px 12px", border:"1px solid #c050e0",
                }}>
                  ₹{priceRange.min.toLocaleString("en-IN")} – ₹{priceRange.max.toLocaleString("en-IN")}
                  <button
                    onClick={() => setPriceRange(null)}
                    style={{ background:"none", border:"none", color:"#a020c0", cursor:"pointer", padding:0, fontSize:14, lineHeight:1, fontWeight:700 }}
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
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, justifyContent:"flex-end" }}>
                  <span style={{ fontSize:13, color:"#666" }}>Show:</span>
                  {PAGE_SIZES.map(size => (
                    <button key={size} onClick={() => {
                      if (size === "All") { setShowAll(true); setOffset(0); setCurrentPage(1); }
                      else { setShowAll(false); setPageLimit(size); setOffset(0); setCurrentPage(1); }
                    }} style={{
                      padding:"4px 14px", borderRadius:20, border:"1.5px solid", fontSize:13, fontWeight:500, cursor:"pointer",
                      borderColor: (showAll && size==="All")||(!showAll && size===pageLimit) ? "#c0622a":"#ddd",
                      background: (showAll && size==="All")||(!showAll && size===pageLimit) ? "#c0622a":"#fff",
                      color: (showAll && size==="All")||(!showAll && size===pageLimit) ? "#fff":"#555",
                    }}>{size}</button>
                  ))}
                </div>
                <ShopProducts layout={layout} products={currentData} isComboMode={isComboMode} childCombos={childCombos} />
                {!showAll && !isComboMode && (
                  <div className="pro-pagination-style text-center mt-30">
                    <Paginator
                      totalRecords={sortedProducts.length} pageLimit={pageLimit}
                      pageNeighbours={2} setOffset={setOffset}
                      currentPage={currentPage} setCurrentPage={setCurrentPage}
                      pageContainerClass="mb-0 mt-0" pagePrevText="«" pageNextText="»"
                    />
                  </div>
                )}
                <p style={{ textAlign:"center", fontSize:13, color:"#888", marginTop:12 }}>
                  {isComboMode
                    ? `Showing ${childCombos.length} combos`
                    : `Showing ${currentData.length} of ${sortedProducts.length} products`
                  }
                </p>
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
                  <div className="drawer-price-badges">
                    <div className="drawer-price-badge">
                      <span className="badge-label">Min</span>
                      <span className="badge-val">₹{(draftPrice ? draftPrice.min : priceMin).toLocaleString('en-IN')}</span>
                    </div>
                    <span className="drawer-price-sep">—</span>
                    <div className="drawer-price-badge">
                      <span className="badge-label">Max</span>
                      <span className="badge-val">₹{(draftPrice ? draftPrice.max : priceMax).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div style={{ padding: '0 8px' }}>
                    <Slider
                      range
                      min={priceMin} max={priceMax}
                      step={Math.max(1, Math.floor((priceMax - priceMin) / 100))}
                      value={sliderVal}
                      onChange={val => setDraftPrice({ min: val[0], max: val[1] })}
                      trackStyle={[{ backgroundColor: "#db1a5d", height: 3 }]}
                      handleStyle={[
                        { borderColor:"#db1a5d", backgroundColor:"#fff", width:20, height:20, marginTop:-8.5, boxShadow:"0 1px 6px rgba(219,26,93,0.4)", opacity:1 },
                        { borderColor:"#db1a5d", backgroundColor:"#fff", width:20, height:20, marginTop:-8.5, boxShadow:"0 1px 6px rgba(219,26,93,0.4)", opacity:1 },
                      ]}
                      railStyle={{ backgroundColor:"#e8e8e8", height:3 }}
                    />
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:"#bbb" }}>
                      <span>₹{priceMin.toLocaleString('en-IN')}</span>
                      <span>₹{priceMax.toLocaleString('en-IN')}</span>
                    </div>
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

                {events.length > 0 && (
                  <div className="drawer-section">
                    <p className="drawer-section-title">Shop by Event</p>
                    <div className="drawer-chip-grid">
                      {events.map(ev => {
                        const count = products.filter(p => {
                          const tags = Array.isArray(p.tag) ? p.tag : [];
                          return tags.some(t => String(t).toLowerCase() === String(ev.value).toLowerCase());
                        }).length;
                        return (
                          <button
                            key={ev.value}
                            className={`drawer-chip${eventParam === ev.value ? ' active' : ''}`}
                            onClick={() => { navigate(`${S}?event=${ev.value}`); setDrawerOpen(false); }}
                          >
                            🎉 {ev.label}
                            <span className="drawer-chip-count">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {navCombos.length > 0 && (
                  <div className="drawer-section">
                    <p className="drawer-section-title">🎁 Combos</p>
                    <div className="drawer-chip-grid">
                      {navCombos.map(combo => {
                        const count = combo.children ? combo.children.filter(c => c.isActive !== false).length : 0;
                        return (
                          <button
                            key={combo.id}
                            className={`drawer-chip${comboParam === String(combo.id) ? ' active' : ''}`}
                            onClick={() => { navigate(`${S}?combo=${combo.id}`); setDrawerOpen(false); }}
                          >
                            {combo.name || combo.label}
                            <span className="drawer-chip-count">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
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