import { Fragment } from "react"; 
import { useLocation } from "react-router-dom"; 
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SectionTitleWithText from "../../components/section-title/SectionTitleWithText";
import BannerOne from "../../wrappers/banner/BannerOne";
import TextGridOne from "../../wrappers/text-grid/TextGridOne";
import BrandLogoSliderOne from "../../wrappers/brand-logo/BrandLogoSliderOne";
import TestimonialPage from "./TestimonialPage";
import Timeline from "../../components/timeline/Timeline";
import FunFactTwo from "../../wrappers/fun-fact/FunFactTwo";

const About = () => {
  let { pathname } = useLocation();

  return (
    <Fragment>
      <SEO
        title="About JB Collections"
        titleTemplate="Online Shopping Store"
        description="Learn about JB Collections - your premium online shopping mall offering high-quality groceries, fashion, beauty, home goods, toys, and food items at the best prices."
        keywords="about JB Collections, online department store, grocery store, fashion clothing retailer, beauty care shop, home goods store, baby products"
      /> 
      <LayoutOne headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb 
          pages={[
            {label: "Home", path: process.env.PUBLIC_URL + "/" },
            {label: "About us", path: process.env.PUBLIC_URL + pathname }
          ]} 
        />

        {/* section title with text */}
        <SectionTitleWithText spaceTopClass="pt-100" spaceBottomClass="pb-95" />


        {/* fun fact */}
        <div style={{ backgroundColor: "#111111", marginBottom: "40px" }}>
          <FunFactTwo spaceTopClass="pt-100" spaceBottomClass="pb-70" />
        </div>

        {/* text grid */}
        <TextGridOne spaceBottomClass="pb-70" />

        {/* timeline */}
        <Timeline />

        {/* <TestimonialPage/> */}

      </LayoutOne>
    </Fragment>
  );
};

export default About;

