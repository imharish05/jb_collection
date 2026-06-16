import { Fragment, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import cogoToast from "cogo-toast";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import { submitContactForm } from "../../store/services/contactService";
import { resetContactForm } from "../../store/slices/contactSlice";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { useLocation } from "react-router-dom";


const Contact = () => {
    let { pathname } = useLocation();
    
  const dispatch = useDispatch();
  const { loading, error, success, message } = useSelector((state) => state.contact);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // Show success toast and clear form after 5 seconds
  useEffect(() => {
    if (success) {
      cogoToast.success(message || "Message sent successfully!", { position: "top-center" });
      const timer = setTimeout(() => {
        dispatch(resetContactForm());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch, message]);

  // Show error toast
  useEffect(() => {
    if (error) {
      cogoToast.error(error, { position: "top-center" });
    }
  }, [error]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!formData.message.trim()) errors.message = "Message is required";
    if (formData.message.trim().length < 10) errors.message = "Message must be at least 10 characters";
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await dispatch(submitContactForm(formData));
      setFormData({ name: "", email: "", phone: "", message: "" });
      setFormErrors({});
    } catch (err) {
      console.error("Contact form error:", err);
    }
  };

  return (
    <Fragment>
      <SEO titleTemplate="Contact Us" description="Customer Support & Inquiries" />

      <LayoutOne headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb 
          pages={[
            {label: "Home", path: process.env.PUBLIC_URL + "/" },
            {label: "Contact us", path: process.env.PUBLIC_URL + pathname }
          ]} 
        />
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
                          <strong>Email Us</strong>
                          <span>Kamalireturngifts@gmail.com</span>
                        </div>
                      </div>
                      <div className="glass-link-item d-flex gap-3 mt-4">
                        <div className="icon-circle"><i className="fa fa-phone"></i></div>
                      <div>
                          <strong>Call Us</strong>
                          <span>+91 73388 14319</span>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="col-lg-7">
                  <div className="glass-form-side">
                    <form className="glass-form" onSubmit={handleSubmit}>
                      <div className="input-row">
                        <div className="glass-input-group">
                          <label>Full Name {formErrors.name && <span style={{ color: '#ef4444', fontSize: '12px' }}>- {formErrors.name}</span>}</label>
                          <input
                            type="text"
                            name="name"
                            placeholder="e.g. Jane Doe"
                            value={formData.name}
                            onChange={handleChange}
                            style={{
                              borderColor: formErrors.name ? '#ef4444' : 'rgba(0, 0, 0, 0.1)',
                              background: formErrors.name ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.7)'
                            }}
                          />
                        </div>
                        <div className="glass-input-group">
                          <label>Email Address {formErrors.email && <span style={{ color: '#ef4444', fontSize: '12px' }}>- {formErrors.email}</span>}</label>
                          <input
                            type="email"
                            name="email"
                            placeholder="jane@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                              borderColor: formErrors.email ? '#ef4444' : 'rgba(0, 0, 0, 0.1)',
                              background: formErrors.email ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.7)'
                            }}
                          />
                        </div>
                      </div>

                      <div className="glass-input-group">
                        <label>Phone Number (Optional)</label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="e.g. 9876543210"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="glass-input-group">
                        <label>Message {formErrors.message && <span style={{ color: '#ef4444', fontSize: '12px' }}>- {formErrors.message}</span>}</label>
                        <textarea
                          rows="4"
                          name="message"
                          placeholder="How can we help?"
                          value={formData.message}
                          onChange={handleChange}
                          style={{
                            borderColor: formErrors.message ? '#ef4444' : 'rgba(0, 0, 0, 0.1)',
                            background: formErrors.message ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                            resize: 'vertical',
                            minHeight: '120px'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="glass-button"
                        disabled={loading}
                        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                      >
                        {loading ? 'Sending...' : 'Send Inquiry'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* --- NEW MAP SECTION --- */}
  
          </div>

          <style>{`
            .glass-contact-wrapper {
              position: relative;
              overflow: hidden;
            }
          `}</style>
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default Contact;