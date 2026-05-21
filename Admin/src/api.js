import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;

const API = axios.create({
    baseURL: `${BASE_URL}`,
});

// =====================
// Products
// =====================
export const getAllProducts  = ()              => API.get('/products');
export const addProduct     = (formData)      => API.post('/products/add', formData);
export const updateProduct  = (id, formData)  => API.put(`/products/update/${id}`, formData);
export const deleteProduct  = (id)            => API.delete(`/products/${id}`);

// =====================
// Categories
// =====================
export const getAllCategories  = ()             => API.get('/categories');
export const addCategory       = (formData)     => API.post('/categories/add', formData);
export const updateCategory    = (id, formData) => API.put(`/categories/update/${id}`, formData);
export const deleteCategory    = (id)           => API.delete(`/categories/delete/${id}`);


// =====================
// Brands
// =====================
export const getAllBrands  = ()             => API.get('/brands');
export const addBrand     = (formData)     => API.post('/brands/add', formData);
export const updateBrand  = (id, formData) => API.put(`/brands/update/${id}`, formData);
export const deleteBrand  = (id)           => API.delete(`/brands/${id}`);

// =====================
// Variants
// =====================
export const getAllVariants       = ()            => API.get('/variants');
export const getVariantsByProduct = (productId)  => API.get(`/variants/product/${productId}`);
export const addVariant           = (data)        => API.post('/variants/add', data);
export const updateVariant        = (id, data)    => API.put(`/variants/update/${id}`, data);
export const deleteVariant        = (id)          => API.delete(`/variants/${id}`);

// =====================
// Reviews
// =====================
export const getAllReviews  = ()          => API.get('/reviews');
export const addReview     = (data)      => API.post('/reviews/add', data);
export const updateReview  = (id, data)  => API.put(`/reviews/update/${id}`, data);
export const deleteReview  = (id)        => API.delete(`/reviews/${id}`);

// =====================
// Cart
// =====================
export const getCart        = (customerId) => API.get(`/cart/customer/${customerId}`);  // ← updated path
export const addToCart      = (data)       => API.post('/cart/add', data);
export const updateCartItem = (id, data)   => API.put(`/cart/update/${id}`, data);
export const removeCartItem = (id)         => API.delete(`/cart/${id}`);
export const clearCart      = (customerId) => API.delete(`/cart/clear/${customerId}`);

// =====================
// Wishlist
// =====================
export const getWishlist        = (customerId)     => API.get(`/wishlist/${customerId}`);
export const addToWishlist      = (data)           => API.post('/wishlist/add', data);
export const removeFromWishlist = (id)             => API.delete(`/wishlist/${id}`);
export const moveToCart         = (wishlistItemId) => API.post(`/wishlist/move-to-cart/${wishlistItemId}`);

// =====================
// Auth
// =====================
export const registerUser = (data) => API.post('/user/register', data);
export const loginUser    = (data) => API.post('/user/login', data);

// =====================
// Image helper
// =====================
export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

    if (cleanPath.startsWith('uploads/')) {
        return `${BASE_URL}/api/${cleanPath}`;
    }

    return `${BASE_URL}/api/uploads/${cleanPath}`;
};

export default API;