# 3D Rubik's Cube Interactive Simulator

A modern, interactive 3D Rubik's Cube web application built with TypeScript, Three.js, and Vite. This application allows users to interact with a virtual Rubik's Cube, practice solving techniques, track statistics, and more.

![3D Rubik's Cube](https://via.placeholder.com/800x400?text=3D+Rubik's+Cube+Screenshot)

## Features

- **Fully Interactive 3D Cube**: Rotate faces, layers, and the entire cube in 3D space
- **Multiple Control Methods**: Mouse drag, keyboard shortcuts, and touch support
- **Solve Tracking**:
  - Move counter
  - Timer mode
  - Statistics tracking (best time, average, history)
- **Practice Tools**:
  - Scramble function
  - Undo/Redo moves
  - Reset cube
  - Animation speed control
- **User Experience**:
  - Light/Dark theme toggle
  - Customizable color themes
  - Sound effects (with mute option)
  - Responsive design for mobile and desktop
  - Blindfold mode for advanced practice
- **Visual Aids**:
  - 2D net view of the cube state
  - Reset camera view
  - Hide/show UI elements

## Tech Stack

- **Frontend**: TypeScript, HTML5, CSS3
- **3D Rendering**: Three.js
- **Build Tool**: Vite
- **Module Bundler**: ES Modules

## Project Structure

```
├── public/              # Static assets
├── src/
│   ├── config/          # Application constants and configuration
│   ├── controllers/     # Input and UI controllers
│   ├── core/            # Core cube logic and 3D scene management
│   ├── services/        # State management and persistence
│   ├── utils/           # Helper utilities
│   ├── main.ts          # Application entry point
│   └── style.css        # Global styles
└── index.html           # Main HTML entry
```

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Eggplant203/3D-Rubik-s-Cube-Interactive-Simulator.git
   cd rubik-3d
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory, ready for deployment.

## How to Use

### Basic Controls

- **Rotate a face**: Click and drag on any face
- **Rotate the entire cube**: Right-click and drag or use middle mouse button
- **Zoom**: Scroll wheel
- **Reset view**: Middle-click or use the reset view button

### Keyboard Shortcuts

- **F**: Rotate front face clockwise
- **B**: Rotate back face clockwise
- **R**: Rotate right face clockwise
- **L**: Rotate left face clockwise
- **U**: Rotate up face clockwise
- **D**: Rotate down face clockwise
- **Hold Shift + any face key**: Rotate counterclockwise
- **M**: Rotate middle layer
- **E**: Rotate equator layer
- **S**: Rotate standing layer
- **X/Y/Z**: Rotate entire cube along X/Y/Z axis

## Customization

The cube's appearance, colors, and animation speeds can be customized through the settings panel.

## Performance Optimization

The application uses efficient rendering techniques and optimized Three.js implementations to ensure smooth performance even on lower-end devices.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Three.js for 3D rendering
- Vite for fast development and building
- Font Awesome for UI icons

## Author

© 2025 - Developed by Eggplant203 🍆

---

_For detailed technical documentation and advanced options, see the source code comments and mode-specific help tooltips in the application._
