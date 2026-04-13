# AvoidRain - 3D Endless Runner
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)   

**WIP**: A 3D browser game where you run under balconies to avoid the rain!

Plan: create a game with pure 100% code by AI and no human intervention in the code, including the assets and debug.

<img width="1832" height="993" alt="Image" src="https://github.com/user-attachments/assets/1c621f12-8132-4a7e-b9a8-d55a8ab269fb" />

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

## 🛠️ Tech Stack

- **Three.js** - 3D rendering
- **Vanilla JavaScript** - No UI framework

## 📝 Credits

Built with **OpenCode** using **Regolo.AI** models.
