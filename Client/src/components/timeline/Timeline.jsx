import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../api/axios";

const IMG_URL = process.env.REACT_APP_IMG_URL || "";

const resolveImg = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  const clean = image.replace(/^\/?uploads\//, "");
  return `${IMG_URL}/uploads/${clean}`;
};

const Timeline = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get dynamic settings from Redux
  const { settings } = useSelector((state) => state.settings);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const res = await api.get("/timeline");
        setMilestones(res.data);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
        setError("Could not load timeline milestones.");
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, []);

  if (loading) {
    return (
      <div className="timeline-section text-center">
        <div className="container">
          <p>Loading our journey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Silently hide or show nothing if there is an error
  }

  if (milestones.length === 0) {
    return null; // Don't render the section if no milestones exist
  }

  return (
    <section className="timeline-section">
      <div className="container">
        <div className="timeline-title-container">
          <h2>{settings?.timelineTitle || "Five Years, One Thread"}</h2>
          <div className="timeline-sub">{settings?.timelineSubtitle || "Our journey through the years"}</div>
        </div>

        <div className="timeline-container">
          {milestones.map((milestone, index) => (
            <div className="timeline-row" key={milestone.id || index}>
              {/* Central dot on the line */}
              <div className="timeline-dot" />

              <div className="timeline-col">
                <div className="timeline-card">
                  <div className="timeline-card-img-wrapper">
                    <img
                      src={resolveImg(milestone.image)}
                      alt={milestone.title}
                    />
                  </div>
                  <div className="timeline-card-content">
                    <span className="timeline-card-year">{milestone.year}</span>
                    <h3 className="timeline-card-title">{milestone.title}</h3>
                    <p className="timeline-card-desc">{milestone.description}</p>
                  </div>
                </div>
              </div>
              
              {/* Empty column for spacing on desktop */}
              <div className="timeline-col" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Timeline;
