export const PRODUCT_IMAGE_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 426%22%3E%3Crect width=%22320%22 height=%22426%22 fill=%22%23f2f4f7%22/%3E%3Cpath d=%22M90 260l48-54 34 37 25-27 42 44H90z%22 fill=%22%23cbd5e1%22/%3E%3Ccircle cx=%22125%22 cy=%22164%22 r=%2218%22 fill=%22%23cbd5e1%22/%3E%3Ctext x=%22160%22 y=%22315%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2216%22 fill=%22%2364748b%22%3ERasm mavjud emas%3C/text%3E%3C/svg%3E';

export function getProductImageUrl(image) {
  if (!image) return PRODUCT_IMAGE_FALLBACK;
  if (image.startsWith('/uploads/')) return `http://localhost:5000${image}`;
  return image;
}
