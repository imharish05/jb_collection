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
import TestimonialOneSingle from "../../components/testimonial/TestimonialOneSingle"
import TestimonialPage from "./TestimonialPage";

const About = () => {
  let { pathname } = useLocation();

  return (
    <Fragment>
      <SEO
        titleTemplate="About us - Kamali Gifts"
        description="Learn about Kamali Gifts - a complete gift solution hub for personalized and handcrafted gifts established in 2025. Creativity, quality, affordability."
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

        {/* fun fact */}
        <FunFactOne
          spaceTopClass="pt-100"
          spaceBottomClass="pb-70"
          bgClass="bg-gray-3"
        />

        <TestimonialPage/>

      </LayoutOne>
    </Fragment>
  );
};

export default About;

