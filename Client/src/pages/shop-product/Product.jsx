import React, { Fragment } from "react"; 
import { useSelector } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import RelatedProductSlider from "../../wrappers/product/RelatedProductSlider";
import ProductDescriptionTab from "../../wrappers/product/ProductDescriptionTab";
import ProductImageDescription from "../../wrappers/product/ProductImageDescription";

const Product = () => {
  let { pathname } = useLocation();
  let { id } = useParams();
  const { products } = useSelector((state) => state.product);

  // Support both numeric IDs (static JSON) and UUIDs (backend)
  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  // Guard: product not found yet (backend fetch in progress) or bad URL
  if (!product) {
    return (
      <LayoutOne headerTop="visible">
        <div style={{ padding: "120px 0", textAlign: "center", color: "#888" }}>
          <p>Loading product…</p>
        </div>
      </LayoutOne>
    );
  }

  // Category slug for related products: prefer Category.value, then first category slug
  const relatedCategory =
    product.Category?.value ||
    (product.category?.length ? product.category[0] : null);

  return (
    <Fragment>
      <SEO
        titleTemplate="Product Page"
        description="Product Page of Kamali Gifts."
      />

      <LayoutOne headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb 
          pages={[
            {label: "Home", path: process.env.PUBLIC_URL + "/" },
            {label: "Shop Product", path: process.env.PUBLIC_URL + pathname }
          ]} 
        />

        {/* product description with image */}
        <ProductImageDescription
          spaceTopClass="pt-100"
          spaceBottomClass="pb-100"
          product={product}
        />

        {/* product description tab — pass productId for dynamic reviews */}
        <ProductDescriptionTab
          spaceBottomClass="pb-90"
          productFullDesc={product.fullDescription}
          productId={product.id}
        />

        {/* related product slider */}
        {relatedCategory && (
          <RelatedProductSlider
            spaceBottomClass="pb-95"
            category={relatedCategory}
          />
        )}
      </LayoutOne>
    </Fragment>
  );
};

export default Product;