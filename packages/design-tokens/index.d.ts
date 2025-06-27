// Type definitions for design tokens
export interface ColorScale {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
}

export interface Colors {
    primary: ColorScale;
    secondary: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    neutral: ColorScale;
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
