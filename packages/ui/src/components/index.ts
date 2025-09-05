// UI Components
export { Button, buttonVariants } from './ui/button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
export { Checkbox } from './ui/checkbox';
export { CopyButton, type CopyButtonProps } from './ui/copy-button';
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
  DialogClose,
} from './ui/dialog';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
} from './ui/dropdown-menu';
export { Input } from './ui/input';
export { MathCaptcha, type MathCaptchaProps } from './ui/math-captcha';
export { Label } from './ui/label';
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './ui/select';
export { Textarea } from './ui/textarea';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
export { Notification, notificationVariants } from './ui/notification';
export {
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  formLabelVariants,
  formMessageVariants,
} from './ui/form';
export {
  Spinner,
  SpinnerOverlay,
  InlineSpinner,
  spinnerVariants,
  overlayVariants,
  inlineSpinnerVariants,
} from './ui/spinner';

// Compound Components (Primary exports)
export { FloatingActionButton, type FloatingActionButtonProps } from './floating-action-button';
export { TreeView, type TreeViewProps, type TreeNode } from './tree-view';
export { ThemeToggle } from './theme-toggle';

// Exchange Form Components
export {
  ExchangeFormCompound as ExchangeForm,
  Root as ExchangeFormRoot,
  Container as ExchangeFormContainer,
  CardPair as ExchangeFormCardPair,
  ExchangeCard,
  FieldWrapper as ExchangeFormFieldWrapper,
  FieldLabel as ExchangeFormFieldLabel,
  Arrow as ExchangeFormArrow,
  ActionArea as ExchangeFormActionArea,
  type ExchangeFormProps,
  type ContainerProps as ExchangeFormContainerProps,
  type CardPairProps as ExchangeFormCardPairProps,
  type ExchangeCardProps,
  type FieldWrapperProps as ExchangeFormFieldWrapperProps,
  type FieldLabelProps as ExchangeFormFieldLabelProps,
  type ArrowProps as ExchangeFormArrowProps,
  type ActionAreaProps as ExchangeFormActionAreaProps,
  useExchangeFormContext,
} from './exchange-form';

// Exchange Components
export { TokenStandardSelector } from './exchange/TokenStandardSelector';
export { CryptoCurrencySelector } from './exchange/CryptoCurrencySelector';
export { ExchangeBankSelector } from './exchange/ExchangeBankSelector';
export { CryptoAmountInput } from './exchange/CryptoAmountInput';
export { CardNumberInput } from './exchange/CardNumberInput';
export { FiatCurrencySelector } from './exchange/FiatCurrencySelector';
export { SendingInfo } from './exchange/SendingInfo';
export { ReceivingInfo } from './exchange/ReceivingInfo';

// Data Table Compound Components (Primary export)
export {
  DataTableCompound as DataTable,
  Root as DataTableRoot,
  Container as DataTableContainer,
  Header as DataTableHeader,
  Filters as DataTableFilters,
  Content as DataTableContent,
  TableWrapper as DataTableTableWrapper,
  Pagination as DataTablePagination,
  CellWrapper as DataTableCellWrapper,
  useDataTableContext,
} from './data-table-compound';

// Admin Panel Compound Components
export {
  AdminPanelCompound as AdminPanel,
  Root as AdminPanelRoot,
  Layout as AdminPanelLayout,
  Header as AdminPanelHeader,
  Sidebar as AdminPanelSidebar,
  Main as AdminPanelMain,
  StatsGrid as AdminPanelStatsGrid,
  StatsCard as AdminPanelStatsCard,
  ContentSection as AdminPanelContentSection,
  useAdminPanelContext,
} from './admin-panel-compound';

// Layout Components - PageLayout
export * from './page-layout';
export * from './standard-page-layout';
export * from './centered-page-layout';
export * from './section-layout';

// Layout Components - Main Header (compound pattern)
export {
  HeaderCompound as Header,
  Root,
  Container as HeaderContainer,
  Logo as HeaderLogo,
  Navigation as HeaderNavigation,
  Actions as HeaderActions,
  MobileMenu as HeaderMobileMenu,
  LanguageSwitcher as HeaderLanguageSwitcher,
  UserMenu as HeaderUserMenu,
  WithTheme as HeaderWithTheme,
  type HeaderProps,
  type ContainerProps as HeaderContainerProps,
  type LogoProps as HeaderLogoProps,
  type NavigationProps as HeaderNavigationProps,
  type ActionsProps as HeaderActionsProps,
  type MobileMenuProps as HeaderMobileMenuProps,
  type LanguageSwitcherProps as HeaderLanguageSwitcherProps,
  type UserMenuProps as HeaderUserMenuProps,
  type WithThemeProps as HeaderWithThemeProps,
  useHeaderContext,
} from './header-compound';

export {
  FooterCompound as Footer,
  Root as FooterRoot,
  Container as FooterContainer,
  Section as FooterSection,
  Link as FooterLink,
  Social as FooterSocial,
  CompanyInfo as FooterCompanyInfo,
  Legal as FooterLegal,
  FullLayout as FooterLayout,
  type FooterProps,
  type ContainerProps as FooterContainerProps,
  type SectionProps as FooterSectionProps,
  type LinkProps as FooterLinkProps,
  type SocialProps as FooterSocialProps,
  type CompanyInfoProps as FooterCompanyInfoProps,
  type LegalProps as FooterLegalProps,
  type FullLayoutProps as FooterFullLayoutProps,
  useFooterContext,
} from './footer-compound';

// Auth Components
export { AuthForm } from './auth';

export {
  AuthPasswordField,
  AuthConfirmPasswordField,
  AuthSubmitButton,
  AuthSwitchButton,
  AuthFormLayout,
} from './auth';

// Auth Types - Enhanced with new AuthSubmitButton props
export type { AuthSubmitButtonProps } from './auth/AuthSubmitButton';

// ===== SUBMIT BUTTON (SEMANTIC NAMING) =====
export { SubmitButton, type SubmitButtonProps } from './forms/SubmitButton';

// LEGACY aliases для унификации согласно плану
export { AuthSubmitButton as SubmitButtonLegacy } from './auth';
export { AuthSubmitButton as ExchangeSubmitButton } from './auth';
export { AuthSubmitButton as HeroSubmitButton } from './auth';

// Type exports для полной совместимости
export type {
  AuthSubmitButtonProps as ExchangeSubmitButtonProps,
  AuthSubmitButtonProps as HeroSubmitButtonProps,
} from './auth/AuthSubmitButton';

// Utils
export { cn } from '../lib/utils';

// === Adaptive Container System ===
export {
  AdaptiveContainer,
  useAdaptiveContainer,
  useAdaptivePreset,
  createAdaptiveStyles,
  adaptivePresets,
  adaptiveContainerCSS,
  type AdaptiveWidthProps,
  type AdaptiveContainerProps,
} from './adaptive-container';

// Error Boundaries
export {
  ExchangeErrorBoundary,
  BaseErrorBoundary,
  LayoutErrorBoundary,
  type ExchangeErrorBoundaryProps,
  type BaseErrorBoundaryProps,
  type LayoutErrorBoundaryProps,
} from './error-boundaries';

// Form Fields - Universal components
export { FormEmailField, FormCaptchaField } from './form-fields';
export type { EmailFormFields, CaptchaFormFields } from './form-fields';

// Order Components - ДОБАВЛЕНО: Новые компоненты для работы с заявками
export { OrderStatus } from './order/OrderStatus';
export { NetworkDisplay } from './order/NetworkDisplay';
export {
  OrderPriorityInfo,
  OrderMetadataInfo,
  OrderCryptoInfo,
  OrderFinancialInfo,
  OrderBasicInfo,
  AmountDisplayWithCopy,
  TechnicalDetailsCollapsible,
  OrderAdditionalInfo,
} from './order/helpers/OrderStatusHelpers';

// Dev Tools - ДОБАВЛЕНО: Инструменты разработки
export { OrderDevTools, type PublicOrderData } from './dev/OrderDevTools';

// === LEGACY EXPORTS REMOVED ===
// Legacy components have been successfully removed and migrated to compound versions
// All legacy exports have been cleaned up
