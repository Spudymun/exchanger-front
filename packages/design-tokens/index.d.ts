// Type definitions for design tokens
import { COLOR_SCALE_KEYS } from '@repo/constants';

export interface ColorScale {
  [COLOR_SCALE_KEYS.LIGHTEST]: string;
  [COLOR_SCALE_KEYS.LIGHTER]: string;
  [COLOR_SCALE_KEYS.LIGHT]: string;
  [COLOR_SCALE_KEYS.LIGHT_MEDIUM]: string;
  [COLOR_SCALE_KEYS.MEDIUM]: string;
  [COLOR_SCALE_KEYS.MEDIUM_DARK]: string;
  [COLOR_SCALE_KEYS.DARK]: string;
  [COLOR_SCALE_KEYS.DARKER]: string;
  [COLOR_SCALE_KEYS.DARKEST]: string;
  [COLOR_SCALE_KEYS.EXTRA_DARK]: string;
  [COLOR_SCALE_KEYS.DEEPEST]: string;
}

export interface Colors {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  gray: ColorScale;
  bitcoin: Partial<ColorScale>;
  ethereum: Partial<ColorScale>;
  usdt: Partial<ColorScale>;
  litecoin: Partial<ColorScale>;
  gradients: {
    primary: string;
    secondary: string;
    success: string;
    crypto: string;
  };
  white: string;
  black: string;
  transparent: string;
  current: string;
}

export interface Typography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: Record<string, [string, { lineHeight: string }]>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
}

export interface Spacing {
  spacing: Record<string | number, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
}

export interface DesignTokens extends Spacing {
  colors: Colors;
  typography: Typography;
}

export declare const colors: Colors;
export declare const typography: Typography;
export declare const spacing: Record<string | number, string>;
export declare const borderRadius: Record<string, string>;
export declare const boxShadow: Record<string, string>;

declare const designTokens: DesignTokens;
export default designTokens;
