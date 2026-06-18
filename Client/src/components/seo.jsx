import PropTypes from "prop-types";
import { Helmet, HelmetProvider } from "react-helmet-async";

const SEO = ({ 
    title, 
    titleTemplate, 
    description, 
    keywords,
    image,
    url,
    ogType = "website",
    twitterCard = "summary_large_image"
}) => {
    const fullTitle = title ? `${title} | ${titleTemplate}` : titleTemplate;
    
    return (
        <HelmetProvider>
            <Helmet>
                <meta charSet="utf-8" />
                <title>{fullTitle}</title>
                <meta name="description" content={description} />
                {keywords && <meta name="keywords" content={keywords} />}
                
                {/* Open Graph Tags */}
                <meta property="og:title" content={fullTitle} />
                <meta property="og:description" content={description} />
                {image && <meta property="og:image" content={image} />}
                {url && <meta property="og:url" content={url} />}
                <meta property="og:type" content={ogType} />
                
                {/* Twitter Card Tags */}
                <meta name="twitter:card" content={twitterCard} />
                <meta name="twitter:title" content={fullTitle} />
                <meta name="twitter:description" content={description} />
                {image && <meta name="twitter:image" content={image} />}
                
                {/* Additional SEO */}
                <meta name="robots" content="index, follow" />
                <meta name="language" content="en" />
            </Helmet>
        </HelmetProvider>
    );
};

SEO.propTypes = {
    title: PropTypes.string,
    titleTemplate: PropTypes.string,
    description: PropTypes.string,
    keywords: PropTypes.string,
    image: PropTypes.string,
    url: PropTypes.string,
    ogType: PropTypes.string,
    twitterCard: PropTypes.string,
}

SEO.defaultProps = {
    title: "Kamali Gifts",
    titleTemplate: "Personalized Return Gifts & Corporate Gifts Crafted for Every Occasion",
    description: "Kamali Gifts Factory offers customized corporate gifts and return gifts for weddings, engagements, baby showers, birthdays, housewarming ceremonies, puberty ceremonies, upanayanam, festivals, Navaratri, Varalakshmi Pooja, corporate events, school functions, retirement functions and special occasions.",
    keywords: "Return gifts, customized gifts, personalized gifts, corporate gifts, wedding return gifts, bulk return gifts, custom gifts Chennai, personalized corporate gifts, laser engraving, laser etching",
};

export default SEO;
