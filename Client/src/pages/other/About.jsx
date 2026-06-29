import { Fragment } from "react"; 
import { useLocation } from "react-router-dom"; 
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SectionTitleWithText from "../../components/section-title/SectionTitleWithText";
import BannerOne from "../../wrappers/banner/BannerOne";
import TextGridOne from "../../wrappers/text-grid/TextGridOne";
import FunFactOne from "../../wrappers/fun-fact/FunFactOne";
import BrandLogoSliderOne from "../../wrappers/brand-logo/BrandLogoSliderOne";
import TestimonialPage from "./TestimonialPage";
import Timeline from "../../components/timeline/Timeline";

const About = () => {
  let { pathname } = useLocation();

  return (
    <Fragment>
      <SEO
        title="About JB House of Fashion"
        titleTemplate="Personalized & Customized Gifts Factory"
        description="Learn about JB House of Fashion - a complete gift solution hub offering personalized and customized return gifts, corporate gifts, and bulk gifts. Established to deliver creativity, quality, and affordability across Chennai and India."
        keywords="about JB House of Fashion, customized gifts factory, return gifts manufacturer, corporate gifts supplier, personalized gifts company, laser engraving services, bulk gifts Chennai"
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


        {/* text grid */}
        <TextGridOne spaceBottomClass="pb-70" />

        {/* timeline */}
        <Timeline />

        {/* fun fact */}
        <FunFactOne
          spaceTopClass="pt-100"
          spaceBottomClass="pb-70"
          bgClass="bg-gray-3"
        />

        {/* <TestimonialPage/> */}

      </LayoutOne>
    </Fragment>
  );
};

export default About;

