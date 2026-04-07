# AvoidRain - 3D Endless Runner
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)   

A 3D browser game where you run under balconies to avoid the rain!

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

### Production Build

```bash
# Create an optimized build
npm run build

# Preview the production build
npm run preview
```

## 🛠️ Tech Stack

- **Three.js** - 3D rendering
- **Vite** - Build tool and dev server
- **Vanilla JavaScript** - No UI framework

## 🎨 Procedural Assets

All assets are generated procedurally:
- Low-poly character (box + sphere + cylinder)
- Buildings with windows and balconies
- Cars with random colors
- Sounds via Web Audio API (no external audio files)

## 🎯 Features

- ✅ Infinite procedural world
- ✅ Rain system with particles
- ✅ Asymmetric balconies (LEFT/RIGHT/BOTH/NEITHER)
- ✅ Cars with collision
- ✅ Wet meter with fill/drain
- ✅ Progressive difficulty
- ✅ Score (time + distance + dry bonus)
- ✅ Procedural sounds
- ✅ Responsive UI
- ✅ Keyboard + touch controls

## 📝 Credits

Built with **OpenCode** using **Regolo.AI** models.
