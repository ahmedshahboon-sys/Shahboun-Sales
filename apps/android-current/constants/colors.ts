/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#10213F',
    tint: '#13B87A',
    background: '#F3F7FB',
    foreground: '#10213F',
    card: '#FFFFFF',
    cardForeground: '#10213F',
    primary: '#0D1B3E',
    primaryForeground: '#FFFFFF',
    secondary: '#EAF4F0',
    secondaryForeground: '#087A52',
    muted: '#E8EEF5',
    mutedForeground: '#718096',
    accent: '#13B87A',
    accentForeground: '#FFFFFF',
    destructive: '#E85D5D',
    destructiveForeground: '#FFFFFF',
    border: '#DCE5EF',
    input: '#E5ECF3',
    warning: '#D8912E',
    gold: '#D4A84E',
    success: '#13B87A',
    navySoft: '#1B315C',
  },
  dark: {
    text: '#F3F7FB',
    tint: '#3AD49A',
    background: '#0A1329',
    foreground: '#F3F7FB',
    card: '#121F39',
    cardForeground: '#F3F7FB',
    primary: '#17305F',
    primaryForeground: '#FFFFFF',
    secondary: '#15372F',
    secondaryForeground: '#62E0B0',
    muted: '#1C2A46',
    mutedForeground: '#9AAAC2',
    accent: '#2CC98F',
    accentForeground: '#061B15',
    destructive: '#F07C7C',
    destructiveForeground: '#FFFFFF',
    border: '#243654',
    input: '#1B2B49',
    warning: '#E3A44B',
    gold: '#E4C271',
    success: '#2CC98F',
    navySoft: '#203C70',
  },
  radius: 18,
};

export default colors;
