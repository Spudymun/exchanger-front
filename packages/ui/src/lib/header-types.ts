export interface HeaderContextValue {
  isMenuOpen?: boolean;
  currentLocale?: string;
  isAuthenticated?: boolean;
  userName?: string;
  onToggleMenu?: () => void;
  onLocaleChange?: (locale: string) => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  labels?: {
    signIn?: string;
    signOut?: string;
    signInShort?: string;
    signOutShort?: string;
  };
}

export interface HeaderCompoundProps {
  children?: React.ReactNode;
  className?: string;
}
