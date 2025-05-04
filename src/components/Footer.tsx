import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <p>Image Annotation Tool - Home assignment for ProtexAI</p>
      <p className="instructions">
        <strong>Instructions:</strong> Upload an image using the button or
        drag-and-drop. Select a mode (Polygon/Arrow), click on the image to
        create annotations. Use Select mode to edit or move annotations.
        Select a point and press Delete key or use Delete Point button to
        remove individual polygon points. Press Enter to complete a polygon or
        to finish moving an object. Use zoom controls or Ctrl+mouse wheel to
        zoom in and out.
      </p>
    </footer>
  );
};

export default Footer;