import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const S = process.env.PUBLIC_URL + "/shop";

const CategoryEvent = () => {
  const { events = [] } = useSelector((state) => state.navMenu || {});

  return (
    <div className="event-section-wrapper pt-60 pb-60">
      <div className="container">
        <div className="section-title text-center mb-40">
          <h2 className="event-title">Shop by Event</h2>
          <p className="event-subtitle">Curated collections for every milestone</p>
        </div>
        
        <div className="event-flex-container">
          {events.map((event) => (
            <Link
              key={event.value}
              to={`${S}?event=${event.value}`}
              className="event-pill"
            >
              <span className="event-dot"></span>
              {event.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryEvent;