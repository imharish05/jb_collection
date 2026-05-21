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
  // Already absolute
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  // Static legacy asset (from public folder)
  if (img.startsWith("/assets")) return process.env.PUBLIC_URL + img;
  // Backend-stored relative path: strip leading slash + "uploads/" prefix
  const clean = img.replace(/^\//, "").replace(/^uploads\//, "");
  return `${IMG_URL}/uploads/${clean}`;
}
