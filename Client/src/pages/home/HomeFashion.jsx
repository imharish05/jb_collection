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
        titleTemplate="Handcrafted Gifts for Every Celebration"
        description="Shop handcrafted and customised gifts for weddings, baby showers, birthdays and all South Indian celebrations."
        />
      <LayoutOne
        headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-1"
        >
        {/* hero slider */}
        <HeroSliderFour/>

        <CategoryEvent/>
        {/* feature icons */}


{/* Categories */}
<Category/>

        {/* tab product */}
        <TabProduct spaceBottomClass="pb-60" spaceTopClass="pt-60" />
        <OfferBanner/>

        {/* Shop by Event */}
        <FeatureIcon spaceTopClass="pt-100" spaceBottomClass="pb-60" />

      </LayoutOne>
    </Fragment>
  );
};

export default HomeFashion;