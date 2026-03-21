# Photo Timestamp App

A privacy-first web application that automatically reads EXIF metadata from your photos, reverse-geocodes GPS coordinates, and overlays beautiful timestamps on your images — all processed entirely in your browser with zero server uploads.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)

## ✨ Features

- **🔒 Privacy-First**: All processing happens client-side. Your photos never leave your device.
- **📅 EXIF Metadata Reading**: Automatically extracts date, time, GPS coordinates, and camera information from your photos.
- **🌍 GPS Reverse Geocoding**: Converts GPS coordinates to human-readable location names (city, state, country) using OpenStreetMap Nominatim API.
- **🎨 Customizable Timestamp Overlays**: Add professional-looking timestamps to your photos with extensive customization options:
  - Position (top-left, top-right, bottom-left, bottom-right)
  - Display options (date, time, location, GPS coordinates)
  - Font size (small, medium, large)
  - Opacity control
  - Custom text and background colors
  - Date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
  - Time format (12h or 24h)
- **📦 Batch Processing**: Upload and process multiple photos at once.
- **💾 Flexible Downloads**: Download individual photos or export all processed images as a ZIP file.
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices.
- **🎯 Clean "Precision Lens" UI**: Camera-inspired interface with viewfinder corners, circular progress indicators, and teal accent colors.

## 🚀 How It Works

1. **Upload**: Drag and drop photos or click to upload. The app reads EXIF metadata including date/time and GPS coordinates.
2. **Geocode**: GPS coordinates are automatically reverse-geocoded to location names using OpenStreetMap (with rate limiting and caching to respect API terms).
3. **Overlay**: A customizable timestamp is drawn onto each image using HTML5 Canvas.
4. **Download**: Save individual processed photos or download all as a ZIP file.

## 🛠️ Technology Stack

### Frontend
- **React 19.2** with TypeScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first styling with animations
- **Framer Motion** - Smooth animations
- **Radix UI** (shadcn/ui) - Accessible component primitives
- **Wouter** - Lightweight routing
- **Exifr** - EXIF metadata extraction
- **JSZip** - ZIP file generation
- **file-saver** - Client-side file downloads

### Backend
- **Express.js** - Simple Node.js server
- **ESBuild** - Fast bundling

### Development
- **pnpm** - Fast, disk space efficient package manager
- **TypeScript 5.6** - Type safety
- **Prettier** - Code formatting
- **Vitest** - Unit testing

## 📋 Prerequisites

- **Node.js** 18 or higher
- **pnpm** (recommended) or npm

## 🏁 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ohdaveed/photo-timestamp-app.git
cd photo-timestamp-app
```

2. Install dependencies:
```bash
pnpm install
```

### Development

Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
pnpm build
```

This command:
- Builds the frontend with Vite
- Bundles the backend server with ESBuild
- Outputs everything to the `dist/` directory

### Running in Production

```bash
pnpm start
```

### Other Commands

- **Type checking**: `pnpm check`
- **Code formatting**: `pnpm format`
- **Preview production build**: `pnpm preview`

## 📖 Usage

### Upload Photos

1. Click the upload zone or drag and drop photos directly onto the page
2. Multiple photos can be uploaded simultaneously
3. Supported formats: JPEG, PNG (any format with EXIF metadata)

### Customize Timestamp

Click the "Stamp Settings" panel to configure:

- **Position**: Choose where the timestamp appears on your photo
- **Display Options**: Toggle date, time, location, and GPS coordinates
- **Font Size**: Small, medium, or large
- **Colors**: Customize text and background colors
- **Opacity**: Adjust transparency of the overlay
- **Date Format**: Choose your preferred date format
- **Time Format**: Switch between 12-hour and 24-hour time

### Download

- **Individual Download**: Click the download button on any photo card
- **Bulk Download**: Click "Download All" to export all processed photos as a ZIP file

## 🗂️ Project Structure

```
photo-timestamp-app/
├── client/                 # Frontend React application
│   └── src/
│       ├── pages/          # Page components (Home)
│       ├── components/     # Reusable UI components
│       │   ├── PhotoCard.tsx
│       │   ├── PhotoGrid.tsx
│       │   ├── UploadZone.tsx
│       │   ├── StampSettings.tsx
│       │   └── ...
│       ├── lib/            # Core business logic
│       │   └── photoProcessor.ts
│       ├── hooks/          # Custom React hooks
│       │   └── usePhotoProcessor.ts
│       └── contexts/       # React contexts
├── server/                 # Express backend
│   └── index.ts
├── shared/                 # Shared types and utilities
└── dist/                   # Production build output
```

## 🔐 Privacy & Security

- **100% Client-Side Processing**: All image processing happens in your browser. Photos are never uploaded to any server.
- **No Data Storage**: Images are only stored temporarily in browser memory during processing.
- **Third-Party API**: The app uses OpenStreetMap's Nominatim API for reverse geocoding GPS coordinates. Only GPS coordinates (latitude/longitude) are sent to this service — never your actual photos.

## 🎨 Design Philosophy

The app follows a **"Precision Lens"** design aesthetic inspired by camera interfaces:

- **Clean and Airy**: Generous whitespace with sharp edges
- **Photography-Centric**: Photos are the hero; UI elements recede
- **Technical Precision**: Rounded data chips, clear hierarchy
- **Camera-Inspired Elements**:
  - Viewfinder-style corners on photo cards
  - Circular progress indicators (like camera shutters)
  - Monospace typography for metadata
  - Electric teal accent color for actions

## 🌐 API Attribution

This app uses the [OpenStreetMap Nominatim API](https://nominatim.openstreetmap.org/) for reverse geocoding. The API is used according to the [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/):
- Rate limited to 1 request per second
- Results are cached to minimize API calls
- User agent identification included in requests

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for the Nominatim geocoding service
- [Exifr](https://github.com/MikeKovarik/exifr) for EXIF metadata extraction
- [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- All the open-source libraries that make this project possible

## 📧 Contact

For questions, issues, or suggestions, please [open an issue](https://github.com/ohdaveed/photo-timestamp-app/issues) on GitHub.

---

Made with ❤️ for photography enthusiasts who value their privacy.
