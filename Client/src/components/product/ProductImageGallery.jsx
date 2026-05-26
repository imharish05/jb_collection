import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import AnotherLightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import { getImgUrl } from "../../helpers/imageUrl";

const ProductImageGallery = ({ product }) => {
  const images = Array.isArray(product?.image) ? product.image : [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const slides = images.map((img) => ({ src: getImgUrl(img) }));

  const handleThumbClick = useCallback((idx) => {
    setActiveIdx(idx);
    setImgLoaded(false);
    setImgError(false);
  }, []);

  const openLightbox = (idx) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  const discount = product?.discount;
  const isNew = product?.isNew || product?.new;

  return (
    <div className="pdp-gallery">
      {/* ── Main image ─────────────────────────────────────────── */}
      <div
        className="pdp-gallery__main"
        onClick={() => images.length > 0 && openLightbox(activeIdx)}
        title="Click to zoom"
      >
        {/* Badges */}
        <div className="pdp-gallery__badges">
          {discount > 0 && (
            <span className="pdp-badge pdp-badge--discount">-{discount}%</span>
          )}
          {isNew && <span className="pdp-badge pdp-badge--new">New</span>}
        </div>

        {/* Zoom hint */}
        <div className="pdp-gallery__zoom-hint">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          Zoom
        </div>

        {images.length > 0 ? (
          <>
            {/* Skeleton while loading */}
            {!imgLoaded && !imgError && (
              <div className="pdp-gallery__skeleton" />
            )}
            <img
              key={activeIdx}
              src={getImgUrl(images[activeIdx])}
              alt={product?.name || "Product"}
              className={`pdp-gallery__main-img${imgLoaded ? " is-loaded" : ""}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
            />
            {imgError && (
              <div className="pdp-gallery__error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Image not available</span>
              </div>
            )}
          </>
        ) : (
          <div className="pdp-gallery__placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>No image</span>
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="pdp-gallery__counter">
            {activeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* ── Thumbnails ─────────────────────────────────────────── */}
      {images.length > 1 && (
        <div className="pdp-gallery__thumbs">
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`pdp-gallery__thumb${idx === activeIdx ? " is-active" : ""}`}
              onClick={() => handleThumbClick(idx)}
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={getImgUrl(img)}
                alt={`${product?.name} ${idx + 1}`}
                onError={(e) => { e.target.style.opacity = 0.3; }}
              />
              {idx === activeIdx && <span className="pdp-gallery__thumb-ring" />}
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ───────────────────────────────────────────── */}
      <AnotherLightbox
        open={lightboxOpen}
        index={lightboxIdx}
        close={() => setLightboxOpen(false)}
        slides={slides}
        plugins={[Thumbnails, Zoom, Fullscreen]}
      />

      {/* ── Styles ─────────────────────────────────────────────── */}
      <style>{`
        .pdp-gallery {
          display: flex;
          flex-direction: column;
          gap: 12px;
          user-select: none;
        }

        /* Main image wrapper */
        .pdp-gallery__main {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          background: #f8f7f5;
          border-radius: 16px;
          overflow: hidden;
          cursor: zoom-in;
          border: 1px solid #f0ede8;
          transition: box-shadow 0.25s ease;
        }
        .pdp-gallery__main:hover {
          box-shadow: 0 8px 40px rgba(0,0,0,0.10);
        }

        /* Skeleton shimmer */
        .pdp-gallery__skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #f0ede8 25%, #e8e4df 50%, #f0ede8 75%);
          background-size: 200% 100%;
          animation: pdp-shimmer 1.4s infinite;
          z-index: 1;
        }
        @keyframes pdp-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Main image */
        .pdp-gallery__main-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          padding: 12px;
          box-sizing: border-box;
        }
        .pdp-gallery__main-img.is-loaded {
          opacity: 1;
        }

        /* Error / placeholder */
        .pdp-gallery__error,
        .pdp-gallery__placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #bbb;
          font-size: 13px;
        }

        /* Badges */
        .pdp-gallery__badges {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 4;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pdp-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .pdp-badge--discount {
          background: #F15A24;
          color: #fff;
        }
        .pdp-badge--new {
          background: #0d1b40;
          color: #fff;
        }

        /* Zoom hint */
        .pdp-gallery__zoom-hint {
          position: absolute;
          bottom: 14px;
          right: 14px;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 20px;
          padding: 5px 12px 5px 8px;
          font-size: 11px;
          font-weight: 600;
          color: #555;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.2s, transform 0.2s;
          pointer-events: none;
        }
        .pdp-gallery__main:hover .pdp-gallery__zoom-hint {
          opacity: 1;
          transform: translateY(0);
        }

        /* Image counter */
        .pdp-gallery__counter {
          position: absolute;
          bottom: 14px;
          left: 14px;
          z-index: 4;
          background: rgba(0,0,0,0.45);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.03em;
        }

        /* Thumbnails row */
        .pdp-gallery__thumbs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Single thumbnail */
        .pdp-gallery__thumb {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid #ebe8e2;
          background: #f8f7f5;
          padding: 0;
          cursor: pointer;
          transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
          flex-shrink: 0;
        }
        .pdp-gallery__thumb:hover {
          border-color: #F15A24;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(241,90,36,0.18);
        }
        .pdp-gallery__thumb.is-active {
          border-color: #F15A24;
          box-shadow: 0 0 0 3px rgba(241,90,36,0.15);
        }
        .pdp-gallery__thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .pdp-gallery__thumb-ring {
          position: absolute;
          inset: 0;
          border-radius: 8px;
          border: 2px solid rgba(241,90,36,0.3);
          pointer-events: none;
        }

        /* Responsive */
        @media (max-width: 767px) {
          .pdp-gallery__main {
            border-radius: 12px;
          }
          .pdp-gallery__thumb {
            width: 58px;
            height: 58px;
          }
        }
      `}</style>
    </div>
  );
};

ProductImageGallery.propTypes = {
  product: PropTypes.shape({}),
};

export default ProductImageGallery;