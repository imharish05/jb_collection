import { Fragment, useState, useEffect } from 'react';
import Paginator from 'react-hooks-paginator';
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { getSortedProducts } from '../../helpers/product';
import SEO from "../../components/seo";
import LayoutOne from '../../layouts/LayoutOne';
import Breadcrumb from '../../wrappers/breadcrumb/Breadcrumb';
import ShopSidebar from '../../wrappers/product/ShopSidebar';
import ShopTopbar from '../../wrappers/product/ShopTopbar';
import ShopProducts from '../../wrappers/product/ShopProducts';

const PAGE_SIZES = [20, 50, "All"];

const LABEL_MAP = {
  gifts:"Gifts", divine:"Divine", "return-gifts":"School Return Gifts",
  tambulam:"Tambulam Bags", toys:"Toys", jewellery:"Customised Jewellery",
  crochet:"Crochet Gifts", bracelets:"Customised Bracelets",
  birthday:"Birthday", engagement:"Engagement", wedding:"Wedding",
  "baby-shower":"Baby Shower", "cradle-ceremony":"Cradle Ceremony",
  "ear-piercing":"Ear Piercing", upanayanam:"Upanayanam", baptism:"Baptism",
  navarathri:"Navarathri / Golu", varalakshmi:"Varalakshmi Poojai",
  "house-warming":"House Warming", puberty:"Puberty", retirement:"Retirement",
  // Combos
  "birthday-combo":"Birthday Combo", "wedding-combo":"Wedding Combo",
  "baby-shower-combo":"Baby Shower Combo", "return-gift-combo":"Return Gift Combo",
  "festival-combo":"Festival Combo", "corporate-combo":"Corporate Combo",
};

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

  const { products } = useSelector((state) => state.product);
  const { combos: navCombos = [] } = useSelector((state) => state.navMenu || {});
  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(search);
  const rawCatParam = params.get("category");
  const catParam    = ["all", "all-categories", "all-products"].includes(String(rawCatParam || "").toLowerCase()) ? null : rawCatParam;
  const eventParam  = params.get("event");
  const comboParam  = params.get("combo");
  const searchParam = params.get("search");

  const sortType  = searchParam ? "search" : catParam ? "category" : eventParam ? "tag" : comboParam ? "combo" : "";
  const sortValue = searchParam || catParam || eventParam || comboParam || "";
  const activeLabel = searchParam
    ? `Search: "${searchParam}"`
    : catParam ? LABEL_MAP[catParam]
    : eventParam ? LABEL_MAP[eventParam]
    : comboParam === "all" ? "All Combos"
    : comboParam ? (LABEL_MAP[comboParam] || comboParam)
    : null;

  const handleSortParams = (type, val) => {
    if (type === "priceRange") {
      const [min, max] = val;
      setPriceRange(min === 0 && max === 5000 ? null : { min, max });
      setOffset(0);
      setCurrentPage(1);
      return;
    }
    if (!val) { navigate(process.env.PUBLIC_URL + "/shop"); return; }
    if (type === "search") navigate(process.env.PUBLIC_URL + "/shop?search=" + encodeURIComponent(val));
    else if (type === "category") navigate(process.env.PUBLIC_URL + "/shop?category=" + val);
    else if (type === "tag") navigate(process.env.PUBLIC_URL + "/shop?event=" + val);
    else if (type === "combo") navigate(process.env.PUBLIC_URL + "/shop?combo=" + val);
    else { setFilterSortType(type); setFilterSortValue(val); }
  };

  useEffect(() => {
    setOffset(0);
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    let source = products;
    let comboHandled = false;

    if (sortType === 'combo' && sortValue) {
      const combo = navCombos.find(c => c.value === sortValue || String(c.id) === String(sortValue));
      if (sortValue === 'all') {
        source = products.filter(product => product.comboId || (Array.isArray(product.combo) && product.combo.length > 0));
        comboHandled = true;
      } else if (combo) {
        if (Array.isArray(combo.productIds) && combo.productIds.length) {
          source = products.filter(
            p => combo.productIds.includes(p.id) || (p.comboId && String(p.comboId) === String(combo.id))
          );
          comboHandled = true;
        } else {
          source = getSortedProducts(products, 'combo', sortValue);
          comboHandled = true;
        }
      }
    }

    let sorted = comboHandled ? source : getSortedProducts(source, sortType, sortValue);
    sorted = getSortedProducts(sorted, filterSortType, filterSortValue);
    if (priceRange) {
      sorted = sorted.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    }
    setSortedProducts(sorted);
    setCurrentData(showAll ? sorted : sorted.slice(offset, offset + pageLimit));
  }, [offset, products, sortType, sortValue, filterSortType, filterSortValue, pageLimit, showAll, priceRange]);

  return (
    <Fragment>
      <SEO titleTemplate={activeLabel ? `${activeLabel} — Kamali Gifts` : "Shop — Kamali Gifts"} description="Browse handcrafted gifts." />
      <LayoutOne headerTop="visible">
        <Breadcrumb pages={[
          { label: "Home", path: process.env.PUBLIC_URL + "/" },
          { label: activeLabel || "All Products", path: process.env.PUBLIC_URL + pathname + search }
        ]} />

        <div className="shop-area pt-95 pb-100">
          <div className="container">
            {activeLabel && (
              <div style={{ marginBottom:24, display:"flex", alignItems:"center", gap:10 }}>
                <h4 style={{ margin:0, fontSize:20, fontWeight:700 }}>{activeLabel}</h4>
                <span style={{ fontSize:13, color:"#888" }}>({sortedProducts.length} products)</span>
                <a href={process.env.PUBLIC_URL + "/shop"} style={{ marginLeft:8, fontSize:12, color:"#c0622a" }}>Clear ×</a>
              </div>
            )}
            {priceRange && (
              <div style={{ marginBottom:16, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
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
              {/* Changed order-2 to order-1 for mobile visibility at the top */}
              <div className="col-lg-3 order-1 order-lg-1">
                <ShopSidebar
                  products={products}
                  getSortParams={handleSortParams}
                  sideSpaceClass="mr-30"
                />
              </div>
              {/* Changed order-1 to order-2 so product grids sit below the mobile menu */}
              <div className="col-lg-9 order-2 order-lg-2">
                <ShopTopbar
                  getLayout={setLayout}
                  getFilterSortParams={(type, val) => { setFilterSortType(type); setFilterSortValue(val); }}
                  productCount={products.length}
                  sortedProductCount={currentData.length}
                />
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
                <ShopProducts layout={layout} products={currentData} />
                {!showAll && (
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
                  Showing {currentData.length} of {sortedProducts.length} products
                </p>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default ShopGridStandard;