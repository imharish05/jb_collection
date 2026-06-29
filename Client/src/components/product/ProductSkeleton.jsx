import React from "react";
import clsx from "clsx";

const ProductSkeleton = ({ spaceBottomClass }) => {
  return (
    <div className={clsx("product-wrap", spaceBottomClass)}>
      <div className="product-img skeleton-img" style={{ height: 280, backgroundColor: "#f0f0f0", borderRadius: 8, animation: "pulse 1.5s infinite ease-in-out" }}></div>
      <div className="product-content text-center mt-15">
        <div className="skeleton-title" style={{ height: 16, width: "70%", backgroundColor: "#f0f0f0", margin: "0 auto 10px", borderRadius: 4, animation: "pulse 1.5s infinite ease-in-out" }}></div>
        <div className="skeleton-price" style={{ height: 14, width: "40%", backgroundColor: "#f0f0f0", margin: "0 auto", borderRadius: 4, animation: "pulse 1.5s infinite ease-in-out" }}></div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ProductSkeleton;
