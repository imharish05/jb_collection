import { Suspense, lazy, useEffect } from "react";
import ScrollToTop from "./helpers/scroll-top";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useDispatch } from "react-redux";
import { getNavCategories } from "./store/services/navMenuService";
import { getAllProducts } from "./store/services/productService";
import { getMarqueeMessages } from "./store/services/marqueeService";
import { getOfferBanners } from "./store/services/offerService";
import { getHeroSlides } from "./store/services/heroSliderService";

// Main home
const HomeFashion = lazy(() => import("./pages/home/HomeFashion"));

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

  useEffect(() => {
    Promise.all([
      getNavCategories(dispatch),
      getAllProducts(),
      getMarqueeMessages(),
      getOfferBanners(),
      getHeroSlides(),
    ]);
  }, []);

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

            {/* Products */}
            <Route path={process.env.PUBLIC_URL + "/product/:id"} element={<Product />} />
            <Route path={process.env.PUBLIC_URL + "/product-tab-left/:id"} element={<ProductTabLeft />} />
            <Route path={process.env.PUBLIC_URL + "/product-tab-right/:id"} element={<ProductTabRight />} />
            <Route path={process.env.PUBLIC_URL + "/product-sticky/:id"} element={<ProductSticky />} />
            <Route path={process.env.PUBLIC_URL + "/product-slider/:id"} element={<ProductSlider />} />
            <Route path={process.env.PUBLIC_URL + "/product-fixed-image/:id"} element={<ProductFixedImage />} />

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