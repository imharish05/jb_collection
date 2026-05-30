import PropTypes from "prop-types";
import clsx from "clsx";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import SectionTitle from "../../components/section-title/SectionTitle";
import ProductGrid from "./ProductGrid";

const TabProduct = ({
  spaceTopClass,
  spaceBottomClass,
  bgColorClass,
  category
}) => {
  return (
    <div
      className={clsx("product-area", spaceTopClass, spaceBottomClass, bgColorClass)}
    >
      <div className="container">
        <SectionTitle titleText="DAILY DEALS!" positionClass="text-center" />
        <Tab.Container defaultActiveKey="customisable">
          <Nav
            variant="pills"
            className="product-tab-list product-tab-list--scroll pt-30 pb-55 text-center"
          >
            <Nav.Item>
              <Nav.Link eventKey="customisable">
                <h4>🎨 Customisable</h4>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="newArrival">
                <h4>✨ New Arrivals</h4>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="hotDeals">
                <h4>🔥 Hot Deals</h4>
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
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

