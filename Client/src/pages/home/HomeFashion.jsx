import { Fragment } from "react";
import { Link } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import HeroSliderFour from "../../wrappers/hero-slider/HeroSliderFour.jsx";
import FeatureIcon from "../../wrappers/feature-icon/FeatureIcon";
import TabProduct from "../../wrappers/product/TabProduct";
import Category from "../../components/category/Category";
import CategoryEvent from "../../components/event/CategoryEvent";

import OfferBanner from "../../components/Offer/OfferBanner.jsx";


const HomeFashion = () => {
  return (
    <Fragment>
      <SEO
        title="JB Collections - Online Shopping Store"
        titleTemplate="Groceries, Fashion, Home & Beauty"
        description="Shop online at JB Collections. We offer fresh groceries, staples, clothing, cosmetics, beauty care, kitchen storage, kids toys, baby care, and food items. Safe and quick doorstep delivery."
        keywords="online shopping, JB Collections, buy groceries online, basmati rice, whole wheat atta, organic ghee, designer sarees, ladies kurti, handbags, cosmetic face wash, sunscreen spf 50, kitchen tools, kids toys, baby body wash, school stationery, gift cards"
      />
      <LayoutOne
        headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-1"
        >
        {/* hero slider */}
        <HeroSliderFour/>

        {/* <CategoryEvent/> */}
        {/* feature icons */}



        {/* Categories */}
        <div style={{ backgroundColor: "#ffffff", paddingTop: "40px" }}>
          <Category/>
        </div>

        {/* Timeless Treasure - Offer Banners */}
        <div style={{ backgroundColor: "#faf5f5", padding: "60px 0" }}>
          <OfferBanner />
        </div>

        {/* tab product */}
        <div style={{ backgroundColor: "#ffffff" }}>
          <TabProduct spaceBottomClass="pb-60" spaceTopClass="pt-60" />
        </div>



        {/* Parallax Banner */}
        <style>{`
          .parallax-banner {
            height: 450px;
            background-image: url('${process.env.PUBLIC_URL}/assets/img/online-shopping-parallax.png');
            background-attachment: fixed;
            background-position: center;
            background-repeat: no-repeat;
            background-size: cover;
            width: 100%;
          }
          @media (max-width: 768px) {
            .parallax-banner {
              height: 250px;
              background-attachment: scroll;
            }
          }
        `}</style>
        <div className="parallax-banner" />

        {/* Shop by Event */}
        <div style={{ backgroundColor: "#ffffff" }}>
          <FeatureIcon spaceTopClass="pt-100" spaceBottomClass="pb-60" />
        </div>

      </LayoutOne>
    </Fragment>
  );
};

export default HomeFashion;
