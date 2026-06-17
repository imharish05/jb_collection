import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&family=Bodoni+Moda:ital,wght@1,400;1,500&display=swap');

  :root {
    --grad-linear: linear-gradient(90deg, #ffffff 0%, #fff0f3 50%, #fce4ec 100%);
    --glass-bg: rgba(255, 255, 255, 0.4);
    --glass-border: rgba(251, 111, 146, 0.15);
    --navy-text: #001d3d;
    --rose-vibrant: #fb6f92;
    
    /* Social Brand Colors */
    --whatsapp-green: #25D366;
    --fb-blue: #1877F2;
    --ig-gradient: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
    --x-black: #000000;
  }

  .luxury-top-bar {
    background: var(--grad-linear);
    position: relative;
    height: 60px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between; /* Space out left, center, right */
    padding: 0 40px;
    overflow: hidden;
    border-bottom: 1px solid var(--glass-border);
    font-family: 'Montserrat', sans-serif;
    z-index: 1000;
  }

  /* WhatsApp Styling (Left) */
  .wp-button {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    background: white;
    padding: 6px 14px;
    border-radius: 50px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    transition: transform 0.3s ease;
  }
  .wp-button:hover { transform: translateY(-2px); }
  .wp-icon { fill: var(--whatsapp-green); width: 18px; height: 18px; }
  .wp-number { color: var(--navy-text); font-size: 12px; font-weight: 700; }

  /* Content Slider (Center) */
  .content-slider {
    flex: 1;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .promo-message {
    position: absolute;
    color: var(--navy-text);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.8s cubic-bezier(0.2, 1, 0.3, 1);
    white-space: nowrap;
  }
  .promo-message.active { opacity: 1; transform: translateY(0); }
  .promo-message em {
    font-family: 'Bodoni Moda', serif;
    color: var(--rose-vibrant);
    font-size: 16px;
  }

  /* Social Icons (Right) */
  .social-container {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  .social-link {
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
  }
  .social-link:hover { opacity: 0.7; }
  .social-link svg { width: 18px; height: 18px; }

  .fb-icon { fill: var(--fb-blue); }
  .ig-icon { fill: #bc1888; } /* Fallback, SVG uses the gradient def */
  .x-icon { fill: var(--x-black); }

  .timer-line {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--navy-text), var(--rose-vibrant));
  }
  
  @media (max-width: 768px) {
    .luxury-top-bar { padding: 0 15px; }
    .wp-number, .social-container { display: none; }
  }
`;

const HeaderTop = () => {
  const reduxMessages = useSelector((state) => state.marquee?.messages);
  const messages = reduxMessages?.length > 0 ? reduxMessages : [
    "Complimentary Worldwide <em>Shipping</em>",
    "The <em>Pink</em> Collection — Now Available",
    "Subscribe for <em>15% Off</em> Your First Order"
  ];

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const styleInjected = useRef(false);

  useEffect(() => {
    if (!styleInjected.current) {
      const tag = document.createElement("style");
      tag.textContent = styles;
      document.head.appendChild(tag);
      styleInjected.current = true;
    }
  }, []);

  useEffect(() => {
    const duration = 4000;
    const intervalTime = 50;
    const increment = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIndex((i) => (i + 1) % messages.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="luxury-top-bar">
      {/* LEFT SIDE: WhatsApp */}
      <a 
        href="https://wa.me/7338814319?text=Hello! I have a question about your services." 
        target="_blank" 
        rel="noreferrer"
        className="wp-button"
      >
        <svg className="wp-icon" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.4-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.5 5.5-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
        <span className="wp-number">7338814319</span>
      </a>

      {/* CENTER: Marquee */}
      <div className="content-slider">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`promo-message ${i === index ? "active" : ""}`}
            dangerouslySetInnerHTML={{ __html: msg }}
          />
        ))}
      </div>

      {/* RIGHT SIDE: Social Icons */}
      <div className="social-container">
        <a
          href="https://www.facebook.com/share/1F6BNcFs9L/"
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <svg className="fb-icon" viewBox="0 0 448 512"><path d="M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h137.25V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.27c-30.81 0-40.41 19.12-40.41 38.73V256h68.75l-11 71.69h-57.75V480H400a48 48 0 0 0 48-48V80a48 48 0 0 0-48-48z"/></svg>
        </a>
        <a href="#" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg viewBox="0 0 448 512">
            <defs>
              <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor:'#f09433'}} />
                <stop offset="25%" style={{stopColor:'#e6683c'}} />
                <stop offset="50%" style={{stopColor:'#dc2743'}} />
                <stop offset="75%" style={{stopColor:'#cc2366'}} />
                <stop offset="100%" style={{stopColor:'#bc1888'}} />
              </linearGradient>
            </defs>
            <path fill="url(#ig-grad)" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
          </svg>
        </a>
        {/* <a href="#" className="social-link">
          <svg className="x-icon" viewBox="0 0 512 512"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>
        </a> */}
      </div>

      <div 
        className="timer-line" 
        style={{ width: `${progress}%` }} 
      />
    </div>
  );
};

export default HeaderTop;