# Image Annotation Builder

A responsive web application for annotating images with polygons and directional arrows. This tool allows users to upload images and create annotations that can be used for marking regions of interest within images, creating structured data for training machine learning models, and highlighting areas of interest to humans and AI models.

## Features

- **Basic Image Upload**: Upload images via file input
- **Annotation Modes**:
  - **Polygon Mode**: Create closed polygons by clicking multiple points on the image
  - **Arrow Mode**: Define directional arrows by selecting start and end points
  - **Select Mode**: Select, move and edit existing annotations
- **Scaling and Aspect Ratio Independence**: Annotations scale correctly when the image is resized
- **Interactive Features**:
  - Edit annotations by dragging points
  - Move entire annotations by selecting and dragging
  - Delete annotations with delete key or delete button
  - Highlight selected annotations
- **Responsive Design**: Fully responsive for both desktop and mobile devices
- **Export Options**:
  - Export annotations as JSON with Cartesian coordinates
  - Export as an annotated image with annotations applied

## Tech Stack

- **React**: UI library for building the application
- **TypeScript**: Type-safe JavaScript
- **HTML5 Canvas**: Used for drawing and manipulating annotations
- **CSS3**: Styling with responsive design
- **Vite**: Build tool for fast development and optimal production build

## Running the Application

### Prerequisites

- Node.js (v16.0.0 or later)
- Yarn (v1.22.0 or later)

### Installation

1. Clone the repository

```bash
git clone [repository-url]
cd [repository-name]
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

1. **Upload an Image**: Click the "Upload Image" button and select an image from your device.

2. **Choose an Annotation Mode**:

   - **Polygon**: Click multiple points on the image to create a polygon. To complete the polygon, click near the first point.
   - **Arrow**: Click to set the starting point, then click again to set the end point and create the arrow.
   - **Select**: Click on annotations or their control points to select and edit them.

3. **Edit Annotations**:

   - Move individual points by selecting and dragging them
   - Move entire annotations by selecting and dragging the annotation
   - Delete annotations by selecting them and pressing Delete key or clicking the Delete button

4. **Export Annotations**:
   - Choose JSON format to get structured data representation
   - Choose Image format to get a static image with annotations applied
   - Click "Download" to save the exported file to your device

## Implementation Details

### Polygon Annotation

Polygon annotations are created by clicking multiple points on the image to define a closed shape. The points are stored as coordinates relative to the image dimensions, allowing the annotations to scale correctly when the image is resized.

### Arrow (Direction) Annotation

Arrow annotations consist of two points: a start point and an end point. The direction is indicated by an arrow head drawn at the end point. Like polygons, arrow annotations scale with the image.

### Coordinate System

All annotations use a Cartesian coordinate system where:

- The origin (0,0) is at the top-left corner of the image
- X increases from left to right
- Y increases from top to bottom

When exporting annotations, coordinates are provided both in pixels (relative to the current view) and in normalized form (0-1 range relative to image dimensions) for compatibility with different image sizes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
