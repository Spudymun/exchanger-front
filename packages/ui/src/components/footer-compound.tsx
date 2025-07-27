'use client';

import * as React from 'react';

import { cn } from '../lib/utils';

import { Button } from './ui/button';

// ===== COMPOUND COMPONENTS ARCHITECTURE v2.0 =====
// Footer Compound Component following ExchangeForm pattern
// Context API + React.cloneElement for prop enhancement

// Footer Context
export interface FooterContextValue {
  theme?: 'light' | 'dark';
  currentYear?: number;
  companyName?: string;
  isCompact?: boolean;
}

const FooterContext = React.createContext<FooterContextValue | undefined>(undefined);

export const useFooterContext = () => {
  return React.useContext(FooterContext);
};

// ===== ROOT COMPONENT =====
export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  theme?: 'light' | 'dark';
  companyName?: string;
  isCompact?: boolean;
  children: React.ReactNode;
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, children, theme, companyName = 'ExchangeGO', isCompact, ...props }, ref) => {
    const contextValue: FooterContextValue = {
      theme,
      currentYear: new Date().getFullYear(),
      companyName,
      isCompact,
    };

    return (
      <FooterContext.Provider value={contextValue}>
        <footer
          ref={ref}
          className={cn('bg-background border-t border-border mt-auto', className)}
          role="contentinfo"
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </footer>
      </FooterContext.Provider>
    );
  }
);

Footer.displayName = 'Footer';

// ===== CONTAINER COMPONENT =====
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'grid' | 'flex' | 'simple';
  columns?: 'two' | 'three' | 'four' | 'five';
  children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, variant = 'grid', columns = 'four', children, ...props }, ref) => {
    const getColumnClass = (cols: string) => {
      switch (cols) {
        case 'two':
          return 'lg:grid-cols-2';
        case 'three':
          return 'lg:grid-cols-3';
        case 'four':
          return 'lg:grid-cols-4';
        case 'five':
          return 'lg:grid-cols-5';
        default:
          return 'lg:grid-cols-4';
      }
    };

    const getVariantClass = (v: 'grid' | 'flex' | 'simple', cols: string) => {
      switch (v) {
        case 'grid':
          return `grid grid-cols-1 md:grid-cols-2 ${getColumnClass(cols)} gap-8`;
        case 'flex':
          return 'flex flex-col md:flex-row justify-between gap-8';
        case 'simple':
          return 'space-y-6';
        default:
          return `grid grid-cols-1 md:grid-cols-2 ${getColumnClass(cols)} gap-8`;
      }
    };

    return (
      <div ref={ref} className={cn(getVariantClass(variant, columns), className)} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = 'Footer.Container';

// ===== SECTION COMPONENT =====
export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
}

const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ className, title, children, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-4', className)} {...props}>
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
      <div className="space-y-2">{children}</div>
    </div>
  )
);

Section.displayName = 'Footer.Section';

// ===== LINK COMPONENT =====
export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  external?: boolean;
  children: React.ReactNode;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, children, external = false, ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      className={cn(
        'text-muted-foreground hover:text-foreground transition-colors text-sm block',
        className
      )}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  )
);

Link.displayName = 'Footer.Link';

// ===== SOCIAL COMPONENT =====
export interface SocialProps extends React.HTMLAttributes<HTMLDivElement> {
  links?: Array<{
    name: string;
    href: string;
    icon: React.ReactNode;
  }>;
  children?: React.ReactNode;
}

const Social = React.forwardRef<HTMLDivElement, SocialProps>(
  ({ className, links = [], children, ...props }, ref) => (
    <div ref={ref} className={cn('flex space-x-4', className)} {...props}>
      {children || (
        <>
          {links.map((link, index) => (
            <Button key={index} variant="ghost" size="icon" asChild>
              <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.name}>
                {link.icon}
              </a>
            </Button>
          ))}
        </>
      )}
    </div>
  )
);

Social.displayName = 'Footer.Social';

// ===== COMPANY INFO COMPONENT =====
export interface CompanyInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  children?: React.ReactNode;
}

const CompanyInfo = React.forwardRef<HTMLDivElement, CompanyInfoProps>(
  ({ className, description, address, phone, email, children, ...props }, ref) => {
    const context = useFooterContext();
    const companyName = context?.companyName;

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {children || (
          <>
            {companyName && (
              <h4 className="text-base font-semibold text-foreground">{companyName}</h4>
            )}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {address && <p className="text-sm text-muted-foreground">{address}</p>}
            {phone && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Phone:</span> {phone}
              </p>
            )}
            {email && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Email:</span> {email}
              </p>
            )}
          </>
        )}
      </div>
    );
  }
);

CompanyInfo.displayName = 'Footer.CompanyInfo';

// ===== LEGAL COMPONENT =====
export interface LegalProps extends React.HTMLAttributes<HTMLDivElement> {
  links?: Array<{
    name: string;
    href: string;
  }>;
  children?: React.ReactNode;
}

const Legal = React.forwardRef<HTMLDivElement, LegalProps>(
  ({ className, links = [], children, ...props }, ref) => {
    const context = useFooterContext();
    const currentYear = context?.currentYear;
    const companyName = context?.companyName;

    return (
      <div
        ref={ref}
        className={cn(
          'border-t border-border pt-4 mt-8 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0',
          className
        )}
        {...props}
      >
        {children || (
          <>
            <p className="text-sm text-muted-foreground">
              © {currentYear} {companyName}. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {links.map((link, index) => (
                <Link key={index} href={link.href}>
                  {link.name}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
);

Legal.displayName = 'Footer.Legal';

// ===== ENHANCED CHILD COMPONENTS =====
// Following ExchangeForm pattern for prop enhancement

function addThemeProps(
  props: Record<string, unknown>,
  context: FooterContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (context?.theme && !childProps.theme) {
    props.theme = context.theme;
  }
  if (context?.isCompact !== undefined && !childProps.isCompact) {
    props.isCompact = context.isCompact;
  }
}

function addCompanyProps(
  props: Record<string, unknown>,
  context: FooterContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (context?.companyName && !childProps.companyName) {
    props.companyName = context.companyName;
  }
  if (context?.currentYear && !childProps.currentYear) {
    props.currentYear = context.currentYear;
  }
}

function createEnhancedProps(
  context: FooterContextValue | undefined,
  childProps: Record<string, unknown>
) {
  const enhancedProps: Record<string, unknown> = {};
  addThemeProps(enhancedProps, context, childProps);
  addCompanyProps(enhancedProps, context, childProps);
  return enhancedProps;
}

function _enhanceChildWithContext(child: React.ReactNode, context: FooterContextValue | undefined) {
  if (!React.isValidElement(child)) {
    return child;
  }

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps = createEnhancedProps(context, childProps);
  return React.cloneElement(child, enhancedProps);
}

// ===== FULL LAYOUT COMPONENT =====
export interface FullLayoutProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const FullLayout = React.forwardRef<HTMLElement, FullLayoutProps>(
  ({ className, children, ...props }, ref) => (
    <Footer ref={ref} className={className} {...props}>
      <Container variant="grid" columns="four">
        {children}
      </Container>
    </Footer>
  )
);

FullLayout.displayName = 'Footer.FullLayout';

// ===== COMPOUND COMPONENT EXPORT =====
export const FooterCompound = Object.assign(Footer, {
  Container,
  Section,
  Link,
  Social,
  CompanyInfo,
  Legal,
  FullLayout,
});

// ===== INDIVIDUAL EXPORTS =====
export { Footer as Root, Container, Section, Link, Social, CompanyInfo, Legal, FullLayout };

// Default export as compound component
export default FooterCompound;
