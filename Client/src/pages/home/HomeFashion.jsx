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
        titleTemplate="Personalized Return Gifts & Corporate Gifts Crafted for Every Occasion"
        description="Kamali Gifts Factory offers customized corporate gifts and return gifts for weddings, engagements, baby showers, birthdays, housewarming ceremonies, puberty ceremonies, upanayanam, festivals, Navaratri, Varalakshmi Pooja, corporate events, school functions, retirement functions and special occasions. Personalized gifts, engraved products, keychains, fridge magnets, jewellery, bags, bottles, pens, and bulk return gifts are available."
        keywords="Return gifts, customized gifts, personalized gifts, corporate gifts, wedding return gifts, bulk return gifts, custom gifts Chennai, personalized corporate gifts, laser engraving, laser etching, wedding return gifts in bulk, customized wedding return gifts, return gifts for baby shower, seemantham return gifts, housewarming return gifts, navaratri golu return gifts, varalakshmi pooja return gifts, corporate gifts with logo, personalized gifts for employees, customized pens with name, name engraved bottles, customized keychains in bulk, personalized fridge magnets, laser cut name jewellery, custom brass name pendants, teacher appreciation gifts, diwali corporate gifts, christmas corporate gifts"
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

        {/* Shop by Event */}
        <FeatureIcon spaceTopClass="pt-100" spaceBottomClass="pb-60" />

      </LayoutOne>
    </Fragment>
  );
};

export default HomeFashion;