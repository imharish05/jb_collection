/**
 * ProductImageGallerySideThumb
 * ─────────────────────────────────────────────────────────────────────────────
 * Equal-height gallery: 4 thumbnails (left/20%) + main image (right/80%).
 * Both columns share the same height at all times.
 *
 * Key design decisions:
 *  - CSS Grid on the row: `grid-template-columns: 1fr 4fr` keeps the 20/80 split.
 *  - Thumb column is a flex-column; each thumb gets `flex: 1` so all 4 share
 *    the column height equally — no stretching on the last one.
 *  - Main image box has `aspect-ratio: 4/3`; thumbs inherit the same total height
 *    via `align-items: stretch` on the grid row.
 *  - Sliding window: only 4 thumbs visible; clicking the 4th (when more exist)
 *    advances the window by 1.
 *  - Variant switch resets activeImageIndex + thumbnailStartIndex to 0.
 *  - Mobile: main image stacks on top, horizontal thumb scroller below.
 */

import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import AnotherLightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import { getImgUrl } from "../../helpers/imageUrl";

const THUMB_COUNT = 4; // visible thumbnails at a time

const ProductImageGallerySideThumb = ({ product, thumbPosition }) => {
  /* ── state ── */
  const [activeImageIndex, setActiveImageIndex]       = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex]             = useState(-1);

  const images = Array.isArray(product?.image)
    ? product.image.filter(Boolean)
    : typeof product?.image === "string"
      ? (() => { try { const p = JSON.parse(product.image); return Array.isArray(p) ? p.filter(Boolean) : [product.image]; } catch { return [product.image]; } })()
      : [];

  /* ── lightbox slides ── */
  const slides = images.map((img) => ({ src: getImgUrl(img) }));

  /* ── visible thumbnail window ── */
  const visibleImages = images.slice(
    thumbnailStartIndex,
    thumbnailStartIndex + THUMB_COUNT
  );

  /* ── thumbnail click handler ──
   * If the user clicks the last visible thumb AND more images exist after it,
   * advance the window by 1 (sliding window).
   * The clicked image always becomes the active main image.
   */
  const handleThumbClick = useCallback(
    (visibleIndex) => {
      const absoluteIndex = thumbnailStartIndex + visibleIndex;

      // Slide window forward if clicking the last visible thumb and more exist
      const isLastVisible = visibleIndex === THUMB_COUNT - 1;
      const moreExist     = thumbnailStartIndex + THUMB_COUNT < images.length;

      if (isLastVisible && moreExist) {
        setThumbnailStartIndex((prev) => prev + 1);
      }

      setActiveImageIndex(absoluteIndex);
    },
    [thumbnailStartIndex, images.length]
  );

  /* ── shared inline styles (no Tailwind dependency) ── */
  const styles = {
    /* Desktop wrapper: CSS Grid row, both cols same height via align-items stretch */
    gridRow: {
      display:       "grid",
      gridTemplateColumns: thumbPosition === "left" ? "1fr 4fr" : "4fr 1fr",
      gap:           10,
      alignItems:    "stretch", // ← makes both columns the same height
    },

    /* Thumbnail column: flex-column so 4 thumbs share height equally */
    thumbCol: {
      display:        "flex",
      flexDirection:  "column",
      gap:            8,
      order:          thumbPosition === "left" ? 0 : 1,
      minWidth:       0,
    },

    /* Each thumb: flex:1 = equal height; no explicit px height */
    thumbItem: (isActive) => ({
      flex:          "1 1 0",        // equal share of column height
      cursor:        "pointer",
      borderRadius:  6,
      overflow:      "hidden",
      border:        isActive ? "2px solid #db1a5d" : "2px solid transparent",
      transition:    "border-color 0.15s ease",
      background:    "#f3f4f6",
    }),

    thumbImg: {
      width:      "100%",
      height:     "100%",
      objectFit:  "cover",
      display:    "block",
    },

    /* Main image column */
    mainCol: {
      position: "relative",
      order:    thumbPosition === "left" ? 1 : 0,
      minWidth: 0,
    },

    mainImgWrap: {
      width:        "100%",
       height:410,        // drives the shared height
      borderRadius: 8,
      overflow:     "hidden",
      background:   "#f9fafb",
      position:     "relative",
    },

    mainImg: {
      width:      "100%",
      height:     "100%",
      objectFit:  "cover",
      display:    "block",
    },

    expandBtn: {
      position:   "absolute",
      top:        12,
      right:      12,
      background: "rgba(255,255,255,0.85)",
      border:     "none",
      borderRadius: 6,
      width:      36,
      height:     36,
      cursor:     "pointer",
      display:    "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize:   18,
      zIndex:     2,
      backdropFilter: "blur(4px)",
    },

    badgeWrap: {
      position: "absolute",
      top:      12,
      left:     12,
      zIndex:   2,
      display:  "flex",
      flexDirection: "column",
      gap:      4,
    },

    /* Mobile horizontal scroller */
    mobileThumbRow: {
      display:      "flex",
      gap:          8,
      overflowX:    "auto",
      paddingBottom: 4,
      scrollbarWidth: "none",
    },

    mobileThumbItem: (isActive) => ({
      flex:        "0 0 70px",
      height:      70,
      borderRadius: 6,
      overflow:    "hidden",
      cursor:      "pointer",
      border:      isActive ? "2px solid #db1a5d" : "2px solid transparent",
      background:  "#f3f4f6",
      transition:  "border-color 0.15s ease",
    }),
  };

  if (!images.length) return null;

  const activeImg   = images[activeImageIndex] || images[0];
  const singleImage = images.length === 1;
  const badgeDiscount = product.discount;
  const badgeNew      = product.new;

  return (
    <>
      {/* ── DESKTOP layout (≥992px) ── */}
      <div
        className="product-img-gallery-custom"
        style={singleImage ? { ...styles.gridRow, gridTemplateColumns: '1fr' } : styles.gridRow}
      >
        {/* Thumbnail column — hidden when only 1 image */}
        {!singleImage && <div style={styles.thumbCol}>
          {visibleImages.map((img, visibleIdx) => {
            const absIdx   = thumbnailStartIndex + visibleIdx;
            const isActive = absIdx === activeImageIndex;
            return (
              <div
                key={absIdx}
                style={styles.thumbItem(isActive)}
                onClick={() => handleThumbClick(visibleIdx)}
                role="button"
                aria-label={`View image ${absIdx + 1}`}
                aria-pressed={isActive}
              >
                <img
                  src={getImgUrl(img)}
                  alt={`Thumbnail ${absIdx + 1}`}
                  style={styles.thumbImg}
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>}

        {/* Main image column */}
        <div style={styles.mainCol}>
          <div style={styles.mainImgWrap}>
            {/* Badges */}
            {(badgeDiscount || badgeNew) && (
              <div style={styles.badgeWrap}>
                {badgeDiscount ? (
                  <span style={{ fontSize: 13, fontWeight: 500, padding: "3px 11px", color: "#fff", borderRadius: 3, background: "#db1a5d" }}>
                    -{badgeDiscount}%
                  </span>
                ) : null}
                {badgeNew ? (
                  <span style={{ fontSize: 13, fontWeight: 500, padding: "3px 11px", color: "#fff", borderRadius: 3, background: "#0d1b40" }}>
                    New
                  </span>
                ) : null}
              </div>
            )}

            {/* Expand / lightbox button */}
            <button
              style={styles.expandBtn}
              onClick={() => setLightboxIndex(activeImageIndex)}
              aria-label="Open fullscreen"
            >
              <i className="pe-7s-expand1" />
            </button>

            <img
              src={getImgUrl(activeImg)}
              alt="Product"
              style={styles.mainImg}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE layout (<992px): main on top, horizontal thumb row below ── */}
      <div className="product-img-gallery-custom--mobile">
        {/* Main image */}
        <div style={{ ...styles.mainImgWrap, borderRadius: 8, marginBottom: 10, position: "relative" }}>
          {(badgeDiscount || badgeNew) && (
            <div style={styles.badgeWrap}>
              {badgeDiscount ? (
                <span style={{ fontSize: 13, fontWeight: 500, padding: "3px 11px", color: "#fff", borderRadius: 3, background: "#db1a5d" }}>
                  -{badgeDiscount}%
                </span>
              ) : null}
              {badgeNew ? (
                <span style={{ fontSize: 13, fontWeight: 500, padding: "3px 11px", color: "#fff", borderRadius: 3, background: "#0d1b40" }}>
                  New
                </span>
              ) : null}
            </div>
          )}
          <button
            style={styles.expandBtn}
            onClick={() => setLightboxIndex(activeImageIndex)}
            aria-label="Open fullscreen"
          >
            <i className="pe-7s-expand1" />
          </button>
          <img src={getImgUrl(activeImg)} alt="Product" style={styles.mainImg} />
        </div>

        {/* Horizontal thumb scroll — hidden when only 1 image */}
        {!singleImage && <div style={styles.mobileThumbRow}>
          {images.map((img, idx) => (
            <div
              key={idx}
              style={styles.mobileThumbItem(idx === activeImageIndex)}
              onClick={() => setActiveImageIndex(idx)}
              role="button"
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={getImgUrl(img)}
                alt={`Thumbnail ${idx + 1}`}
                style={styles.thumbImg}
                loading="lazy"
              />
            </div>
          ))}
        </div>}
      </div>

      {/* Lightbox */}
      <AnotherLightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        plugins={[Thumbnails, Zoom, Fullscreen]}
      />

      {/* Responsive toggle: show desktop on ≥992px, mobile below */}
      <style>{`
        .product-img-gallery-custom        { display: grid; }
        .product-img-gallery-custom--mobile { display: none; }
        @media (max-width: 991px) {
          .product-img-gallery-custom        { display: none !important; }
          .product-img-gallery-custom--mobile { display: block !important; }
        }
        /* Hide thumb scrollbar on webkit */
        .product-img-gallery-custom--mobile div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
};

ProductImageGallerySideThumb.propTypes = {
  product:       PropTypes.shape({
    image:    PropTypes.array,
    discount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    new:      PropTypes.bool,
  }),
  thumbPosition: PropTypes.string, // "left" (default right)
};

export default ProductImageGallerySideThumb;