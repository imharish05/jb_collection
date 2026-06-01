import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MobileSearch = () => {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(process.env.PUBLIC_URL + "/shop?search=" + encodeURIComponent(q.trim()));
      setQ("");
    }
  };

  return (
    <div className="offcanvas-mobile-search-area">
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="Search products..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button type="submit" aria-label="Search">
          <i className="fa fa-search" />
        </button>
      </form>
    </div>
  );
};

export default MobileSearch;