const MobileWidgets = () => {
  return (
    <div className="offcanvas-widget-area">
      <div className="off-canvas-contact-widget">
        <div className="header-contact-info">
          <ul className="header-contact-info__list">
            <li>
              <i className="fa fa-phone"></i>
              <a href="tel://12452456012">(1245) 2456 012</a>
            </li>
            <li>
              <i className="fa fa-envelope"></i>
              <a href="mailto:info@yourdomain.com">info@yourdomain.com</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="off-canvas-widget-social">
        <a href="//twitter.com" title="Twitter" aria-label="Twitter">
          <i className="fa fa-twitter"></i>
        </a>
        <a href="//instagram.com" title="Instagram" aria-label="Instagram">
          <i className="fa fa-instagram"></i>
        </a>
        <a href="//facebook.com" title="Facebook" aria-label="Facebook">
          <i className="fa fa-facebook"></i>
        </a>
        <a href="//pinterest.com" title="Pinterest" aria-label="Pinterest">
          <i className="fa fa-pinterest"></i>
        </a>
      </div>
    </div>
  );
};

export default MobileWidgets;