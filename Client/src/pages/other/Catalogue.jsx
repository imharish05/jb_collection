import { Fragment } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";

const IMG_BASE = process.env.REACT_APP_IMG_URL;
const getImgUrl = (path) =>
  path ? `${IMG_BASE}/uploads/${path.replace(/^\/?(uploads\/)?/, "")}` : null;

const CategoryCard = ({ cat, shopBase }) => {
  const subs = cat.subcategories ?? [];
  const imgSrc = cat.image ? getImgUrl(cat.image) : null;

  return (
    <div className="kcat-row-card">
      <Link
        to={cat.value ? `${shopBase}?category=${cat.value}` : shopBase}
        className="kcat-row-card__left"
      >
        <div className="kcat-row-card__circle">
          {imgSrc ? (
            <img src={imgSrc} alt={cat.label} className="kcat-row-card__img"
              onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          ) : null}
          <span className="kcat-row-card__emoji" style={{ display: imgSrc ? "none" : "flex" }}>🗂️</span>
        </div>
        <span className="kcat-row-card__name">{cat.label}</span>
      </Link>

      <div className="kcat-row-card__right">
        {subs.length > 0 ? (
          <div className="kcat-row-card__pills">
            {subs.map(sub => (
              <Link
                key={sub.value ?? sub.id}
                to={`${shopBase}?category=${cat.value}&subcategory=${sub.value}`}
                className="kcat-pill"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        ) : (
          <span className="kcat-row-card__no-sub">Browse all →</span>
        )}
      </div>
    </div>
  );
};

const SimpleCard = ({ to, imgSrc, label, emoji = "🗂️" }) => (
  <Link to={to} className="kcat-simple-card">
    <div className="kcat-simple-card__circle">
      {imgSrc ? (
        <img src={imgSrc} alt={label} className="kcat-row-card__img"
          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
      ) : null}
      <span className="kcat-row-card__emoji" style={{ display: imgSrc ? "none" : "flex" }}>{emoji}</span>
    </div>
    <span className="kcat-simple-card__name">{label}</span>
  </Link>
);

const SectionTitle = ({ children }) => (
  <div className="kcat-section-title">
    <span>{children}</span>
    <div className="kcat-section-title__line" />
  </div>
);

const Catalogue = () => {
  const { pathname } = useLocation();
  const { categories = [], events = [], rootCombos = [] } = useSelector(s => s.navMenu || {});
  const S = process.env.PUBLIC_URL + "/shop";

  return (
    <Fragment>
      <SEO titleTemplate="Catalogue" description="Browse all our product categories and events." />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Catalogue", path: process.env.PUBLIC_URL + pathname },
          ]}
        />
        <div className="kcat-page">

          {categories.length > 0 && (
            <section className="kcat-section">
              <SectionTitle>Categories</SectionTitle>
              <div className="kcat-list">
                {categories.map(cat => (
                  <CategoryCard key={cat.value ?? cat.id} cat={cat} shopBase={S} />
                ))}
              </div>
            </section>
          )}

          {events.length > 0 && (
            <section className="kcat-section">
              <SectionTitle>Shop by Event</SectionTitle>
              <div className="kcat-simple-grid">
                {events.map(evt => (
                  <SimpleCard key={evt.value} to={`${S}?event=${evt.value}`}
                    imgSrc={evt.image ? getImgUrl(evt.image) : null} label={evt.label} emoji="🎉" />
                ))}
              </div>
            </section>
          )}

          {rootCombos.length > 0 && (
            <section className="kcat-section">
              <SectionTitle>Combos</SectionTitle>
              <div className="kcat-simple-grid">
                {rootCombos.map(combo => (
                  <SimpleCard key={combo.id} to={`${S}?combo=${combo.id}`}
                    imgSrc={combo.image ? getImgUrl(combo.image) : null} label={combo.name} emoji="🎁" />
                ))}
              </div>
            </section>
          )}

          {!categories.length && !events.length && !rootCombos.length && (
            <p className="kcat-empty">No categories found.</p>
          )}
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default Catalogue;