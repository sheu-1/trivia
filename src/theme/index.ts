export const theme = {
  colors: {
    // Non-white light background palette tailored to pair with vibrant blue buttons
    background: '#E8EFF8', // Soft powdered sky / ice-mist tone (distinct non-white, highly cohesive with blue buttons)
    surface: '#FFFFFF', // Crisp white floating cards & modules
    surfaceSubtle: '#DFE7F4', // Slightly deeper tinted fill for secondary blocks
    surfaceHover: '#D4E0F0',
    border: '#CAD7E8', // Tinted border with clear definition
    borderLight: '#DCE5F2',
    borderActive: '#2563EB',

    // Backward compatible aliases
    cardBackground: '#FFFFFF',
    cardBorder: '#CAD7E8',
    cardElevated: '#FFFFFF',

    // Accents & Brand (Cohesive vibrant blue & cobalt palette)
    primary: '#2563EB', // Vibrant cobalt / electric blue (high energy & contrast)
    primaryHover: '#1D4ED8',
    primarySubtle: '#DBEAFE', // Soft sky blue pill/badge fill
    accent: '#3B82F6', // Lighter sky blue highlight
    accentSubtle: '#EFF6FF',
    gold: '#D97706', // High-contrast amber/gold for streaks and prizes
    goldSubtle: '#FEF3C7',

    // States
    success: '#059669',
    successBg: '#ECFDF5',
    successBorder: '#A7F3D0',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    warning: '#D97706',
    warningBg: '#FFFBEB',

    // Text hierarchy (Ultra-sharp contrast on light backgrounds)
    textPrimary: '#0F172A', // Slate 900
    textSecondary: '#334155', // Slate 700
    textMuted: '#64748B', // Slate 500
    textFaint: '#94A3B8', // Slate 400
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 36,
    xxl: 56,
  },
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    full: 9999,
  },
};
