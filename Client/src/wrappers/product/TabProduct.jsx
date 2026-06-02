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
  const [customisableProducts, setCustomisableProducts] = useState([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState([]);
  const [hotDealsProducts, setHotDealsProducts] = useState([]);

  useEffect(() => {
    // Check if products exist for each type
    const customProds = getProducts(products, category, "customisable");
    const newProds = getProducts(products, category, "newArrival");
    const hotProds = getProducts(products, category, "hotDeals");

    setCustomisableProducts(customProds || []);
    setNewArrivalProducts(newProds || []);
    setHotDealsProducts(hotProds || []);

    setHasCustomisable((customProds && customProds.length > 0) || false);
    setHasNewArrival((newProds && newProds.length > 0) || false);
    setHasHotDeals((hotProds && hotProds.length > 0) || false);
  }, [products, category]);

  // Determine default active tab priority: Customisable → Hot Deals → New Arrivals
  const availableTabs = [];
  if (hasCustomisable) availableTabs.push("customisable");
  if (hasHotDeals) availableTabs.push("hotDeals");
  if (hasNewArrival) availableTabs.push("newArrival");
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    // choose first available tab or keep current if still available
    if (availableTabs.length > 0) {
      setActiveTab(prev => (prev && availableTabs.includes(prev) ? prev : availableTabs[0]));
    } else {
      setActiveTab(null);
    }
  }, [hasCustomisable, hasHotDeals, hasNewArrival]);

  return (
    <div
      className={clsx("product-area", spaceTopClass, spaceBottomClass, bgColorClass)}
    >
      <div className="container">
        <SectionTitle titleText="DAILY DEALS!" positionClass="text-center" />
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
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
                    productsList={customisableProducts}
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
                    productsList={newArrivalProducts}
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
                    productsList={hotDealsProducts}
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

