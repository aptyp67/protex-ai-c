# Image Annotation Builder

A responsive web application for annotating images with polygons and directional arrows. This tool allows users to upload images and create annotations that mark regions of interest within images. These annotations create structured data that can be used for training machine learning models in computer vision tasks or highlighting areas of interest to humans and AI models.

## Project Overview

The Image Annotation Builder was built to provide a simple yet powerful interface for creating pixel-precise annotations on images. The application follows a component-based architecture using React and TypeScript, with a focus on maintaining proper coordinate transformations across different screen resolutions and zoom levels.

### Architecture

- **Core Logic**: Separated into custom React hooks (`useAnnotation`) that handle the complex state management and coordinate transformations
- **Component Structure**: UI components are organized by functionality (header, image handling, export controls)
- **Rendering Layer**: Uses HTML5 Canvas for efficient rendering of annotations as an overlay on top of images
- **Persistence**: Annotations are automatically saved to browser localStorage, allowing users to return to their work

## Features

- **Image Upload**: Upload images via file input or drag-and-drop interface
- **Annotation Modes**:
  - **Polygon Mode**: Create closed polygons by clicking multiple points on the image
  - **Arrow Mode**: Define directional arrows by selecting start and end points
  - **Select Mode**: Select, move and edit existing annotations
- **Advanced Editing**:
  - Edit annotations by dragging control points
  - Move entire annotations by selecting and dragging
  - Delete annotations or individual points with delete key or buttons
  - Highlight selected annotations for easy identification
- **Zoom & Pan**: Zoom in/out for detailed annotations with keyboard shortcuts and UI controls
- **Responsive Design**: Fully responsive for both desktop and mobile devices
- **Export Options**:
  - Export annotations as JSON with both pixel and normalized coordinates
  - Export as an annotated image with annotations visually applied

## Tech Stack

- **React 19**: UI library for building the application
- **TypeScript**: Type-safe JavaScript for better development experience
- **HTML5 Canvas**: Used for drawing and manipulating annotations
- **CSS3**: Styling with responsive design
- **Vite**: Modern build tool for fast development and optimal production bundles

## Running the Application

### Prerequisites

- Node.js (v16.0.0 or later)
- Yarn (v1.22.0 or later)

### Installation

1. Clone the repository

```bash
git clone https://github.com/aptyp67/protex-ai-c.git
cd protex-ai-c
```

2. Install dependencies

```bash
yarn install
```

3. Start the development server

```bash
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
yarn build
```

The build artifacts will be located in the `dist` directory.

## How to Use

1. **Upload an Image**: Click the "Upload Image" button and select an image from your device, or drag and drop an image onto the application.

2. **Choose an Annotation Mode**:

   - **Polygon**: Click multiple points on the image to create a polygon. To complete the polygon, click near the first point or press the Enter key.
   - **Arrow**: Click to set the starting point, then click again to set the end point and create the arrow.
   - **Select**: Click on annotations or their control points to select and edit them.

3. **Edit Annotations**:

   - Move individual points by selecting and dragging them
   - Move entire annotations by selecting and dragging the annotation
   - Delete annotations by selecting them and pressing Delete key or clicking the Delete button
   - Delete individual polygon points by selecting a point and pressing Delete (minimum 3 points required)
   - Use keyboard shortcuts (Ctrl+Z/Ctrl+Y) for undo/redo

4. **Zoom and Navigate**:
   - Use the zoom controls or Ctrl+Mouse wheel to zoom in and out
   - Ctrl+0 resets zoom to 100%

5. **Export Annotations**:
   - Choose JSON format to get structured data representation with both pixel and normalized coordinates
   - Choose Image format to get a static image with annotations applied
   - Click "Download" to save the exported file to your device

## Implementation Details

### Coordinate System and Scaling

All annotations use a Cartesian coordinate system with the origin (0,0) at the top-left corner of the image. When exporting, coordinates are provided in two formats:
- Pixel coordinates relative to the original image dimensions
- Normalized coordinates (0-1 range) to make annotations usable on different image resolutions

The application maintains proper scaling of annotations when:
- The browser window is resized
- The image is viewed on different screen sizes
- The zoom level is changed

### Local Storage Persistence

The application automatically saves annotations to the browser's localStorage, indexed by a unique key generated from the image name and dimensions. This allows users to return to their work even after closing the browser.

## License

This project is licensed under the MIT License.
