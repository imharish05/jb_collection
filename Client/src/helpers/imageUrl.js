// Shared image URL resolver for all product components.
// Backend stores images as "uploads/products/xxx.jpg" (relative path).
// Static/legacy images start with "/assets/..." (served from public folder).

const IMG_URL = process.env.REACT_APP_IMG_URL || "";

/**
 * Resolve any product image path to a full URL.
 * @param {string|null|undefined} img
 * @returns {string}
 */
export function getImgUrl(img) {
  if (!img) return "";
  // Some fields store image as array — take the first entry
  const src = Array.isArray(img) ? (img[0] || "") : img;
  if (!src || typeof src !== "string") return "";
  // Already absolute
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  // Static legacy asset (from public folder)
  if (src.startsWith("/assets")) return process.env.PUBLIC_URL + src;
  // Backend-stored relative path: strip leading slash + "uploads/" prefix
  const clean = src.replace(/^\//, "").replace(/^uploads\//, "");
  return `${IMG_URL}/uploads/${clean}`;
}
