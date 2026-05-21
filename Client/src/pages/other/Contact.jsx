import { Fragment } from "react";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";

const Contact = () => {
  return (
    <Fragment>
      <SEO titleTemplate="Contact Us" description="Customer Support & Inquiries" />
      <LayoutOne headerTop="visible">
        <div className="glass-contact-wrapper">
          <div className="glass-shape shape-1"></div>
          <div className="glass-shape shape-2"></div>
          
          <div className="container">
            {/* Contact Form Card */}
            <div className="glass-card-container">
              <div className="row g-0">
                {/* Info Section */}
                <div className="col-lg-5 glass-info-side">
                  <div className="glass-content">
                    <span className="glass-tag">Customer Support</span>
                    <h2 className="glass-title">We're here to <span>help.</span></h2>
                    <p className="glass-text">
                      Have a question about your order? Our support team typically responds within 24 hours.
                    </p>
                    
                    <div className="glass-links">
                      <div className="glass-link-item d-flex gap-3 mt-4">
                        <div className="icon-circle"><i className="fa fa-envelope"></i></div>
                        <div>
                          <strong>Email Us</strong><br/>
                          <span>support@yourstore.com</span>
                        </div>
                      </div>
                      <div className="glass-link-item d-flex gap-3 mt-4">
                        <div className="icon-circle"><i className="fa fa-map-marker"></i></div>
                        <div>
                          <strong>Visit Our HQ</strong><br/>
                          <span>123 Design St, Creative City, NY</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="col-lg-7">
                  <div className="glass-form-side">
                    <form className="glass-form" onSubmit={(e) => e.preventDefault()}>
                      <div className="input-row">
                        <div className="glass-input-group">
                          <label>Full Name</label>
                          <input type="text" placeholder="e.g. Jane Doe" />
                        </div>
                        <div className="glass-input-group">
                          <label>Email Address</label>
                          <input type="email" placeholder="jane@example.com" />
                        </div>
                      </div>
                      <div className="glass-input-group">
                        <label>Message</label>
                        <textarea rows="4" placeholder="How can we help?"></textarea>
                      </div>
                      <button type="submit" className="glass-button">Send Inquiry</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* --- NEW MAP SECTION --- */}
            <div className="glass-card-container mt-5">
              <div className="glass-map-wrapper">
                <iframe
                  title="Store Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215152809347!2d-73.9878431!3d40.7579787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                {/* Overlay to blend the map into the glass aesthetic */}
                <div className="map-glass-overlay"></div>
              </div>
            </div>
          </div>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default Contact;