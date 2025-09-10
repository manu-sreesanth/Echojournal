"use client";

import React from "react";
import "./FloatingShapes.css"; // We'll create a small CSS file for animation

const FloatingShapes: React.FC = () => {
  return (
    <div className="floating-shapes">
      <div className="shape"></div>
      <div className="shape"></div>
      <div className="shape"></div>
      <div className="shape"></div>
    </div>
  );
};

export default FloatingShapes;
