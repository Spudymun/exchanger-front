// UI Components
export { Button, buttonVariants } from './ui/button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
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

// Compound Components
export { DataTable, type DataTableProps, type Column } from './data-table';
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
  Arrow as ExchangeFormArrow,
  ActionArea as ExchangeFormActionArea,
  type ExchangeFormProps,
  type ContainerProps as ExchangeFormContainerProps,
  type CardPairProps as ExchangeFormCardPairProps,
  type ExchangeCardProps,
  type FieldWrapperProps as ExchangeFormFieldWrapperProps,
  type ArrowProps as ExchangeFormArrowProps,
  type ActionAreaProps as ExchangeFormActionAreaProps,
  useExchangeFormContext,
} from './exchange-form';

// New Data Table Compound Components
export {
  DataTableCompound as DataTableNew,
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
