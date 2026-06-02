import PropTypes from "prop-types";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import SectionTitle from "../../components/section-title/SectionTitle";
import ProductGrid from "./ProductGrid";
import { getProducts } from "../../helpers/product";

const TabProduct = ({
  spaceTopClass,
  spaceBottomClass,
  bgColorClass,
  category
}) => {
  const { products } = useSelector((state) => state.product);
  const [hasCustomisable, setHasCustomisable] = useState(false);
  const [hasNewArrival, setHasNewArrival] = useState(false);
  const [hasHotDeals, setHasHotDeals] = useState(false);

  useEffect(() => {
    // Check if products exist for each type
    const customisableProducts = getProducts(products, category, "customisable");
    const newArrivalProducts = getProducts(products, category, "newArrival");
    const hotDealsProducts = getProducts(products, category, "hotDeals");
    
    setHasCustomisable(customisableProducts && customisableProducts.length > 0);
    setHasNewArrival(newArrivalProducts && newArrivalProducts.length > 0);
    setHasHotDeals(hotDealsProducts && hotDealsProducts.length > 0);
  }, [products, category]);

  // Determine default active tab priority: Customizable → Hot Deals → New Arrivals
  const defaultTab = hasCustomisable ? "customisable" : hasHotDeals ? "hotDeals" : "newArrival";

  return (
    <div
      className={clsx("product-area", spaceTopClass, spaceBottomClass, bgColorClass)}
    >
      <div className="container">
        <SectionTitle titleText="DAILY DEALS!" positionClass="text-center" />
        <Tab.Container defaultActiveKey={defaultTab}>
          <Nav
            variant="pills"
            className="product-tab-list product-tab-list--scroll pt-30 pb-55 text-center"
          >
            {hasCustomisable && (
              <Nav.Item>
                <Nav.Link eventKey="customisable">
                  <h4>🎨 Customisable</h4>
                </Nav.Link>
              </Nav.Item>
            )}
            {hasNewArrival && (
              <Nav.Item>
                <Nav.Link eventKey="newArrival">
                  <h4>✨ New Arrivals</h4>
                </Nav.Link>
              </Nav.Item>
            )}
            {hasHotDeals && (
              <Nav.Item>
                <Nav.Link eventKey="hotDeals">
                  <h4>🔥 Hot Deals</h4>
                </Nav.Link>
              </Nav.Item>
            )}
          </Nav>
          <Tab.Content>
            {hasCustomisable && (
              <Tab.Pane eventKey="customisable">
                <div className="row tab-product-carousel">
                  <ProductGrid
                    category={category}
                    type="customisable"
                    limit={6}
                    spaceBottomClass="mb-25"
                  />
                </div>
              </Tab.Pane>
            )}
            {hasNewArrival && (
              <Tab.Pane eventKey="newArrival">
                <div className="row tab-product-carousel">
                  <ProductGrid
                    category={category}
                    type="newArrival"
                    limit={6}
                    spaceBottomClass="mb-25"
                  />
                </div>
              </Tab.Pane>
            )}
            {hasHotDeals && (
              <Tab.Pane eventKey="hotDeals">
                <div className="row tab-product-carousel">
                  <ProductGrid
                    category={category}
                    type="hotDeals"
                    limit={6}
                    spaceBottomClass="mb-25"
                  />
                </div>
              </Tab.Pane>
            )}
          </Tab.Content>
        </Tab.Container>
      </div>
    </div>
  );
};

TabProduct.propTypes = {
  bgColorClass: PropTypes.string,
  category: PropTypes.string,
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string
};

export default TabProduct;

