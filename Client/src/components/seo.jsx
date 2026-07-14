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
    title: "JB Collections",
    titleTemplate: "Online Shopping Mall for Groceries, Fashion, Home & Beauty",
    description: "JB Collections is your one-stop online shopping store for fresh groceries, staples, trendy fashion apparel, beauty products, home essentials, toys, baby care, and food items. Shop the best deals and get safe delivery at your doorstep.",
    keywords: "online shopping, buy groceries, buy fashion clothing, cosmetics beauty care, home products online, toys baby care, food store, gift cards, JB Collections",
};

export default SEO;
