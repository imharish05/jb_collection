import { Fragment } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";

const IMG_BASE = process.env.REACT_APP_IMG_URL;
const getImgUrl = (path) =>
  path ? `${IMG_BASE}/uploads/${path.replace(/^\/?(uploads\/)?/, "")}` : null;

// Modern SVG fallback icon instead of generic emojis
const FallbackIcon = () => (
  <svg className="kcat-fallback-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
  </svg>
);

// Unified visual card used for Categories, Events, and Combos
const FeatureCard = ({ title, to, imgSrc, subtitle, pills = [], fallbackText = "Explore Collection" }) => {
  return (
    <div className="kcat-card">
      <Link to={to} className="kcat-card__banner">
        <div className="kcat-card__image-wrapper">
          {imgSrc ? (
            <img 
              src={imgSrc} 
              alt={title} 
              className="kcat-card__img"
              onError={e => { 
                e.target.style.display = "none"; 
                e.target.nextSibling.style.display = "block"; 
              }} 
            />
          ) : null}
          <div className="kcat-card__icon-fallback" style={{ display: imgSrc ? "none" : "block" }}>
            <FallbackIcon />
          </div>
        </div>
        <div className="kcat-card__overlay">
          <h3 className="kcat-card__title">{title}</h3>
          {subtitle && <span className="kcat-card__subtitle">{subtitle}</span>}
        </div>
      </Link>

      <div className="kcat-card__content">
        {pills.length > 0 ? (
          <div className="kcat-card__pills">
            {pills.slice(0, 5).map((pill, idx) => (
              <Link key={pill.value ?? pill.id ?? idx} to={pill.to} className="kcat-pill">
                {pill.label}
              </Link>
            ))}
            {pills.length > 5 && (
              <Link to={to} className="kcat-pill kcat-pill--more">
                +{pills.length - 5} More
              </Link>
            )}
          </div>
        ) : (
          <Link to={to} className="kcat-card__explore-btn">
            {fallbackText}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <div className="kcat-section-title">
    <h2>{children}</h2>
    <div className="kcat-section-title__indicator" />
  </div>
);

const Catalogue = () => {
  const { pathname } = useLocation();
  const { categories = [], events = [], rootCombos = [] } = useSelector(s => s.navMenu || {});
  const S = process.env.PUBLIC_URL + "/shop";

  return (
    <Fragment>
      <SEO title="Catalogue" titleTemplate="All Gift Categories & Collections - Kamali Gifts" description="Browse our complete catalogue of gift categories, events, and collections. Find the perfect customized gift for every occasion." keywords="gift categories, gift collections, gift events, personalized gifts catalogue, customized gifts shop, bulk gifts catalogue" />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Home", path: process.env.PUBLIC_URL + "/" },
            { label: "Catalogue", path: process.env.PUBLIC_URL + pathname },
          ]}
        />
        <div className="kcat-container">
          
          {/* Categories Section */}
          {categories.length > 0 && (
            <section className="kcat-section">
              <SectionTitle>Shop by Category</SectionTitle>
              <div className="kcat-grid-main">
                {categories.map(cat => {
                  const subs = cat.subcategories ?? [];
                  const mappedPills = subs.map(sub => ({
                    label: sub.label,
                    to: `${S}?category=${cat.value}&subcategory=${sub.value}`
                  }));

                  return (
                    <FeatureCard 
                      key={cat.value ?? cat.id}
                      title={cat.label}
                      to={cat.value ? `${S}?category=${cat.value}` : S}
                      imgSrc={cat.image ? getImgUrl(cat.image) : null}
                      subtitle={`${subs.length} Subcategories`}
                      pills={mappedPills}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Events Section */}
          {events.length > 0 && (
            <section className="kcat-section">
              <SectionTitle>Shop by Event</SectionTitle>
              <div className="kcat-grid-main">
                {events.map(evt => (
                  <FeatureCard 
                    key={evt.value}
                    title={evt.label}
                    to={`${S}?event=${evt.value}`}
                    imgSrc={evt.image ? getImgUrl(evt.image) : null}
                    subtitle="Special Occasions"
                    fallbackText="View Event Items"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Combos Section */}
          {rootCombos.length > 0 && (
            <section className="kcat-section">
              <SectionTitle>Curated Combos</SectionTitle>
              <div className="kcat-grid-main">
                {rootCombos.map(combo => (
                  <FeatureCard 
                    key={combo.id}
                    title={combo.name}
                    to={`${S}?combo=${combo.id}`}
                    imgSrc={combo.image ? getImgUrl(combo.image) : null}
                    subtitle="Value Bundles"
                    fallbackText="View Combo Bundles"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty Fallback Block */}
          {!categories.length && !events.length && !rootCombos.length && (
            <div className="kcat-empty-state">
              <FallbackIcon />
              <p>No categories or collections found at this time.</p>
              <Link to={S} className="kcat-empty-state__btn">Go to Shop</Link>
            </div>
          )}
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default Catalogue;