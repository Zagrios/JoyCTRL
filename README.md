> [!WARNING]  
> Under development. Not ready for use.

# JoyCTRL

Transform your game controller into a PC remote control. JoyCTRL lets you create custom button mappings and automate everything on your computer using any compatible gamepad.

## Early preview (Will change)

## 🎮 Features

### **Comprehensive Controller Support**
- **Wide Compatibility**: Support for most standard game controllers
- **Visual Interface**: Interactive controller diagrams with real-time feedback
- **Auto-Detection**: Automatic recognition and configuration of connected controllers

### **Advanced Action System**
- 🖱️ **Mouse Control**: Precise cursor movement both in absolute or relative mode and clicking (left, middle, right buttons)
- ⌨️ **Keyboard Control**: Record and replay complex key combinations
- 📜 **Scrolling**: Directional scrolling with stick or button control
- 🎯 **Precision Control**: Dynamic mouse sensitivity adjustment
- 🎵 **Media Controls**:  Playback controls (play/pause, stop, previous/next track)
- 🚀 **System Actions**: Open files, launch websites, Volume control (mute, up, down)
- ⏸️ **App Control**: Pause/resume JoyCTRL mappings, update settings
- Probably more to come...

### **Smart Conditional Logic**
- **Button Combinations**: Create actions that trigger only when specific button combinations are held
- **Boolean Logic**: Support for AND/OR conditions between button states

### **Flexible Mapping Types**
- **Button Press**: Instant actions triggered by button presses
- **Axis Triggers**: Actions based on trigger pressure thresholds
- **Stick Controls**: Analog stick movements mapped to mouse movement

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Rust](https://www.rust-lang.org/) with [Tauri 2.0](https://tauri.app/)
- **Real-time Updates**: [RxJS](https://rxjs.dev/) for reactive state management
- **Build Tool**: [Vite](https://vitejs.dev/) for fast development and building

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 22.16.0 or later (Highly recommended to use [Volta](https://volta.sh/) to synchronize your node version with the project)
- [Rust toolchain](https://rustup.rs/)
- Compatible game controller (Xbox, DualShock, DualSense, etc.)


### Installation & Development

```bash
# Clone the repository
git clone https://github.com/your-username/JoyCTRL.git
cd JoyCTRL

# Install dependencies
npm install

# Start the project
npm start

# Generate TypeScript bindings (should only be needed if you've made changes to the backend)
npm run build-ts
```

### Bundle the project

```bash
# Bundle the project
npm run tauri build

# The built application will be available in the `src-tauri/target/release/bundle/` folder
```

## 🤝 Contributing

This project is under active development. Contributions, bug reports, and feature requests are welcome!

### **Current TODOs**
- [ ] Default mappings on first start
- [ ] Axis mapping
- [ ] Sticks mapping
- [ ] Virtual keyboard window
- [ ] Translations


