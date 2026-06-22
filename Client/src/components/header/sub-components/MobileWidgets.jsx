const MobileWidgets = () => {
  return (
    <div className="offcanvas-widget-area">
      <div className="off-canvas-contact-widget">
        <div className="header-contact-info">
          <ul className="header-contact-info__list">
            <li>
              <i className="fa fa-phone"></i>
              <a href="tel:+917338814319">+91 73388 14319</a>
            </li>
            <li>
              <i className="fa fa-envelope"></i>
              <a href="mailto:Kamalireturngifts@gmail.com">Kamalireturngifts@gmail.com</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="off-canvas-widget-social">
        <a href="//twitter.com" title="Twitter" aria-label="Twitter">
          <i className="fa fa-twitter"></i>
        </a>
        <a href="https://www.instagram.com/kamaligiftsfactory?utm_source=qr&igsh=MThqdmp6ODBlazdkdw==" title="Instagram" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
          <i className="fa fa-instagram"></i>
        </a>
        <a href="https://www.facebook.com/share/1F6BNcFs9L/" title="Facebook" aria-label="Facebook">
          <i className="fa fa-facebook"></i>
        </a>
      </div>
    </div>
  );
};

export default MobileWidgets;