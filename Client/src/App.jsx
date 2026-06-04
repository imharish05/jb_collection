import { Suspense, lazy, useEffect } from "react";
import ScrollToTop from "./helpers/scroll-top";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useDispatch, useSelector } from "react-redux";
import { getNavCategories } from "./store/services/navMenuService";
import { getAllProducts } from "./store/services/productService";
import { getMarqueeMessages } from "./store/services/marqueeService";
import { getOfferBanners } from "./store/services/offerService";
import { getHeroSlides } from "./store/services/heroSliderService";
import { loadWishlistService } from "./store/services/wishlistService";
import api from "./api/axios";
import { replaceCart } from "./store/slices/cart-slice";

// Main home
const HomeFashion = lazy(() => import("./pages/home/HomeFashion"));

// Combo page
// const ComboPage = lazy(() => import("./pages/combo/ComboPage"));
const ComboDetailPage = lazy(() => import("./pages/combo/ComboDetailPage"));
const CombosPage = lazy(() => import("./pages/combo/CombosPage"));

// Shop pages
const ShopGridStandard = lazy(() => import("./pages/shop/ShopGridStandard"));

// Product pages
const Product = lazy(() => import("./pages/shop-product/Product"));
const ProductTabLeft = lazy(() => import("./pages/shop-product/ProductTabLeft"));
const ProductTabRight = lazy(() => import("./pages/shop-product/ProductTabRight"));
const ProductSticky = lazy(() => import("./pages/shop-product/ProductSticky"));
const ProductSlider = lazy(() => import("./pages/shop-product/ProductSlider"));
const ProductFixedImage = lazy(() => import("./pages/shop-product/ProductFixedImage"));

// Blog pages
const BlogStandard = lazy(() => import("./pages/blog/BlogStandard"));
const BlogNoSidebar = lazy(() => import("./pages/blog/BlogNoSidebar"));
const BlogRightSidebar = lazy(() => import("./pages/blog/BlogRightSidebar"));
const BlogDetailsStandard = lazy(() => import("./pages/blog/BlogDetailsStandard"));

// Other pages
const About = lazy(() => import("./pages/other/About"));
const Catalogue = lazy(() => import("./pages/other/Catalogue"));
const Contact = lazy(() => import("./pages/other/Contact"));
const MyAccount = lazy(() => import("./pages/other/MyAccount"));
const LoginRegister = lazy(() => import("./pages/other/LoginRegister"));
const Cart = lazy(() => import("./pages/other/Cart"));
const Wishlist = lazy(() => import("./pages/other/Wishlist"));
const Compare = lazy(() => import("./pages/other/Compare"));
const Checkout = lazy(() => import("./pages/other/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/other/OrderConfirmation"));
const OrderDetails = lazy(() => import("./pages/other/OrderDetails"));
const NotFound = lazy(() => import("./pages/other/NotFound"));

const App = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  useEffect(() => {
    Promise.all([
      getNavCategories(dispatch),
      getAllProducts(),
      getMarqueeMessages(),
      getOfferBanners(),
      getHeroSlides(),
    ]);
  }, []);

  // Sync cart + wishlist from server whenever auth state is active
  // (covers page refresh with persisted token, not just fresh login)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Sync cart
    api.get("/cart").then(res => {
      const safeParseSnap = (raw) => {
        if (!raw) return {};
        if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return {}; } }
        return raw;
      };
      const items = (res.data || []).map(cartItem => {
        const snap = safeParseSnap(cartItem.productSnapshot);
        const variants = cartItem.product?.Variants || cartItem.product?.variants || [];
        const matched = variants.find(v => String(v.id) === String(cartItem.selectedVariantId));
        const resolvedPrice = matched?.salesPrice ?? snap.price ?? cartItem.product?.price ?? 0;
        const resolvedDiscount = snap.discount ?? cartItem.product?.discount ?? 0;
        return {
          id: cartItem.productId,
          slug: cartItem.product?.slug || null,
          cartItemId: cartItem.id,
          quantity: cartItem.quantity,
          selectedVariantId: cartItem.selectedVariantId != null ? Number(cartItem.selectedVariantId) : null,
          selectedVariantName: snap.selectedVariantName || null,
          selectedProductColor: cartItem.selectedProductColor || null,
          selectedProductSize: cartItem.selectedProductSize || null,
          name: snap.name || cartItem.product?.name,
          price: typeof resolvedPrice === "string" ? parseFloat(resolvedPrice) : resolvedPrice,
          discount: typeof resolvedDiscount === "string" ? parseFloat(resolvedDiscount) : resolvedDiscount,
          image: snap.image || cartItem.product?.image || [],
          variation: cartItem.product?.variation || [],
          // Combo specific fields
          isCombo: snap.isCombo || false,
          rootComboId: snap.rootComboId || null,
          comboSlug: snap.comboSlug || null,
          childComboId: snap.childComboId || null,
          selectedProducts: snap.products || null,
          comboType: snap.comboType || null,
        };
      });
      dispatch(replaceCart(items));
    }).catch((err) => {
      // Silently ignore 401 on startup — token may have expired;
      // the interceptor handles clearing storage, no redirect needed here.
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    });

    // Sync wishlist
    loadWishlistService();
  }, [isAuthenticated]);

  return (
    <Router>
      <ScrollToTop>
        <Suspense
          fallback={
            <div className="flone-preloader-wrapper">
              <div className="flone-preloader">
                <span></span>
                <span></span>
              </div>
            </div>
          }
        >
          <Routes>
            {/* Public */}
            <Route path={process.env.PUBLIC_URL + "/"} element={<HomeFashion />} />
            <Route path={process.env.PUBLIC_URL + "/home-fashion"} element={<HomeFashion />} />
            <Route path={process.env.PUBLIC_URL + "/shop"} element={<ShopGridStandard />} />
            <Route path={process.env.PUBLIC_URL + "/combos"} element={<CombosPage />} />
            <Route path={process.env.PUBLIC_URL + "/combo/root/:rootComboId"} element={<ComboDetailPage />} />
            {/* <Route path={process.env.PUBLIC_URL + "/combo/:id"} element={<ComboPage />} /> */}

            {/* Products */}
            <Route path={process.env.PUBLIC_URL + "/product/:slug"} element={<Product />} />
            <Route path={process.env.PUBLIC_URL + "/product-tab-left/:slug"} element={<ProductTabLeft />} />
            <Route path={process.env.PUBLIC_URL + "/product-tab-right/:slug"} element={<ProductTabRight />} />
            <Route path={process.env.PUBLIC_URL + "/product-sticky/:slug"} element={<ProductSticky />} />
            <Route path={process.env.PUBLIC_URL + "/product-slider/:slug"} element={<ProductSlider />} />
            <Route path={process.env.PUBLIC_URL + "/product-fixed-image/:slug"} element={<ProductFixedImage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginRegister />} />
            <Route path="/register" element={<LoginRegister />} />

            {/* Protected */}
            <Route path={process.env.PUBLIC_URL + "/my-account"} element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
            <Route path={process.env.PUBLIC_URL + "/cart"} element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path={process.env.PUBLIC_URL + "/wishlist"} element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path={process.env.PUBLIC_URL + "/checkout"} element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path={process.env.PUBLIC_URL + "/order-confirmation"} element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
            <Route path="/order-details/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />

            {/* Other public */}
            <Route path={process.env.PUBLIC_URL + "/about"} element={<About />} />
            <Route path={process.env.PUBLIC_URL + "/catalogue"} element={<Catalogue />} />
            <Route path={process.env.PUBLIC_URL + "/contact"} element={<Contact />} />
            <Route path={process.env.PUBLIC_URL + "/compare"} element={<Compare />} />
            <Route path={process.env.PUBLIC_URL + "/blog-standard"} element={<BlogStandard />} />
            <Route path={process.env.PUBLIC_URL + "/blog-no-sidebar"} element={<BlogNoSidebar />} />
            <Route path={process.env.PUBLIC_URL + "/blog-right-sidebar"} element={<BlogRightSidebar />} />
            <Route path={process.env.PUBLIC_URL + "/blog-details-standard"} element={<BlogDetailsStandard />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ScrollToTop>
    </Router>
  );
};

export default App;