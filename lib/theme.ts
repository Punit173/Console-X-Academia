/**
 * Centralized Theme Configuration
 * Change colors here to update the entire app's color scheme
 */

export const theme = {
  // Primary Colors - Gaming Console Theme
  colors: {
    // Main brand colors based on logo
    primary: {
      orange: "#FF9500", // Bright orange from logo
      black: "#0F0F0F",  // Deep black
      white: "#FFFFFF",  // Clean white
    },
    
    // Secondary colors for variety
    secondary: {
      darkGray: "#1A1A1A",
      mediumGray: "#2D2D2D",
      lightGray: "#3F3F3F",
    },
    
    // Status/Action colors
    status: {
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
      info: "#3B82F6",
    },
    
    // Background colors
    backgrounds: {
      dark: "#0F0F0F",
      card: "#1A1A1A",
      hover: "#2D2D2D",
      border: "#3F3F3F",
    },
    
    // Text colors
    text: {
      primary: "#FFFFFF",
      secondary: "#A0AEC0",
      muted: "#718096",
    },
  },

  // Tailwind class mappings for easy use
  tailwind: {
    // Button variants
    buttonPrimary: "bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105",
    buttonSecondary: "bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200",
    buttonOutline: "border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200",
    
    // Card variants
    cardDark: "bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-lg hover:shadow-orange-500/20 transition-all duration-200",
    cardHover: "bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-lg hover:border-orange-500 hover:shadow-orange-500/30 transition-all duration-200",
    
    // Input variants
    inputDark: "bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200",
    
    // Badge variants
    badgePrimary: "bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-xs font-medium",
    badgeSuccess: "bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium",
    badgeWarning: "bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-medium",
    badgeDanger: "bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-medium",
  },
};

export type ThemeConfig = typeof theme;
