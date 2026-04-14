# AvoidRain - 3D Endless Runner
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)   

**WIP**: A 3D browser game where you run under balconies to avoid the rain!

Plan: create a game with pure 100% code by AI and no human intervention in the code, including the assets and debug.

<img width="1862" height="1000" alt="Image" src="https://github.com/user-attachments/assets/42e696ee-2afb-4238-b2ad-1972fbdcb55d" />

## 🎮 How to Play

**Goal**: Survive as long as possible by staying dry under building balconies.

**Controls**:
- **Keyboard**: 
  - `A` / `Left Arrow` → Move left
  - `D` / `Right Arrow` → Move right
  - `Enter` / `Space` → Start/Restart game
- **Touch (mobile)**:
  - Swipe left/right → Move
  - Tap to start

**Mechanics**:
- Rain fills the **wet meter** (green/red bar in top-left)
- Under balconies, the wet meter drains
- If it reaches 100% → Game Over!
- Cars on the road push you back and increase wetness
- Difficulty increases over time (fewer balconies, more rain, more cars)

## 🏗️ Game World Characteristics

### Building Specifications
- **Height**: 8-20m (variance of 5-9m between buildings)
- **Balconies**: 
  - 70% chance per building
  - 1-2 balconies per building
  - Positioned at 40% building height
  - Minimum 3.5m clearance from ground
- **Windows**: 
  - Dimensions: 1.4-1.6m wide × 1.5-1.8m high
  - 50% random on/off state
- **Doors**: 
  - Height: 2.1m
  - Color: Brown (0x8B4513) with red (0x8B0000) handles
- **Street Lamps**: Positioned at sidewalk (x: ±3.5m)

### Object Dimensions
- **Car**: 4.5m × 1.7m × 1.4m (realistic sedan)
- **Player**: 0.5m height

### Material Constraints
- Maximum 15-20 unique `MeshStandardMaterial` instances
- GPU texture unit optimization required

## 🌧️ Environmental Systems

### Rain System
- Wind angle affects rainfall direction
- Wetness meter mechanics:
  - Fill rate: 8/s
  - Drain rate: 20/s
  - Game over at 100% wetness

### Visual Features
- Shadow people behind balcony windows
- Antenna blinking lights on buildings
- Drip lines from balconies during rain

## ⚙️ Technical Constraints

### Rendering
- Three.js 0.168.0 via CDN (no bundler)
- Shadows disabled for WebGL compatibility
- GPU texture unit limits (15-20 materials max)

### Level Generation
- Chunk-based infinite street generation
- Dynamic object spawning based on distance

## 🚀 Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or higher)
- npm (included with Node.js)

### Installation

```bash
# Clone the repository (if you haven't already)
cd avoidrain

# Install dependencies
npm install
```

### Start Development Server

```bash
# Start the development server
npm run dev
```

The game will be available at: **http://localhost:5173**

## 🛠️ Tech Stack

- **Three.js** - 3D rendering
- **Vanilla JavaScript** - No UI framework

## 📝 Credits

Built with **OpenCode** using **Regolo.AI** models.
