# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Photograd-IA is a React Native application built with Expo that serves as a starter base featuring a modern UI component system. The project uses NativeWind v4 for styling with Tailwind CSS, includes comprehensive dark/light mode support, and provides a collection of reusable UI components.

## Development Commands

### Core Development
- `npm run dev` - Start development server with cache clearing
- `npm run dev:web` - Start web development server
- `npm run dev:android` - Start Android development server
- `npm run dev:ios` - Start iOS development server

### Platform-specific Commands
- `npm run android` - Launch Android development
- `npm run ios` - Launch iOS development  
- `npm run web` - Launch web development

### Maintenance
- `npm run clean` - Clean .expo and node_modules directories
- `npm run postinstall` - Generate NativeWind CSS (runs automatically after install)

## Architecture

### Project Structure
- `/app` - File-based routing with Expo Router
  - `_layout.tsx` - Root layout with theme provider and navigation setup
  - `index.tsx` - Main screen with component demonstrations
  - `+not-found.tsx` - 404 error handling
- `/components` - Reusable UI components
  - `/ui` - Core UI primitives (avatar, button, card, progress, text, tooltip)
  - `ThemeToggle.tsx` - Theme switching component
- `/lib` - Utilities and shared logic
  - `/icons` - Custom icon components using lucide-react-native
  - `useColorScheme.tsx` - Color scheme management hook
  - `constants.ts` - Navigation theme constants
  - `utils.ts` - Utility functions (cn function for class merging)
  - `android-navigation-bar.ts` - Android-specific navigation bar styling

### Key Technologies
- **React Native 0.79.5** with **React 19.0.0**
- **Expo SDK 53** with file-based routing
- **NativeWind v4** for Tailwind CSS styling
- **React Native Reanimated** for animations
- **TypeScript** with strict mode enabled
- **@rn-primitives** for accessible UI components

### Theme System
The app implements a comprehensive theming system:
- CSS variables defined in `global.css` for color tokens
- Light/dark theme switching with persistent storage
- Platform-specific optimizations (Android navigation bar matching)
- Navigation theme integration with React Navigation

### Styling Approach
- Uses NativeWind v4 with Tailwind CSS classes
- CSS variables for consistent theming across platforms
- Custom color palette with semantic naming
- Platform-specific styles using `Platform.select()`

## Code Conventions

### Component Structure
- Use functional components with TypeScript
- Follow the existing pattern of UI components in `/components/ui`
- Use the `cn()` utility for conditional class merging
- Import paths use `~/` alias for root directory

### Styling
- Use NativeWind classes following Tailwind CSS conventions
- Leverage CSS variables for theme-aware colors
- Use semantic color names (primary, secondary, muted, etc.)
- Platform-specific styles should use `Platform.select()` or conditional classes

### File Organization
- UI components in `/components/ui` with consistent naming
- Custom hooks in `/lib` directory
- Icons organized in `/lib/icons`
- Shared utilities in `/lib/utils.ts`

## Testing and Quality

The project includes a comprehensive PR template requiring:
- Platform testing (iOS, Android, Web)
- Unit and integration test coverage
- Manual testing verification
- Code style compliance
- Self-review completion

When adding new features, ensure cross-platform compatibility and follow the established component patterns using @rn-primitives for accessibility.