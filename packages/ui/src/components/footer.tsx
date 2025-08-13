import React from 'react';

import { cn } from '../lib/utils';

import { Button } from './ui/button';

export interface FooterProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FooterSectionProps {
  className?: string;
  title?: string;
  children?: React.ReactNode;
}

export interface FooterLinkProps {
  className?: string;
  href?: string;
  children?: React.ReactNode;
  external?: boolean;
}

export interface FooterSocialProps {
  className?: string;
  links?: Array<{
    name: string;
    href: string;
    icon: React.ReactNode;
  }>;
}

export interface FooterCompanyInfoProps {
  className?: string;
  companyName?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface FooterLegalProps {
  className?: string;
  links?: Array<{
    name: string;
    href: string;
  }>;
}

// Main Footer Component
export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, children, ...props }, ref) => {
    // Deprecation warning
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ Footer is deprecated. Use FooterCompound (compound component) instead.\n' +
          'Migration guide: docs/COMPOUND_COMPONENTS_MIGRATION_GUIDE.md\n' +
          'New usage: import { Footer } from "@repo/ui" (already uses compound version)'
      );
    }

    return (
      <footer
        ref={ref}
        className={cn('bg-background border-t border-gray-200 mt-auto', className)}
        role="contentinfo"
        {...props}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </footer>
    );
  }
);
Footer.displayName = 'Footer';

// Footer Section Component
export const FooterSection = React.forwardRef<HTMLDivElement, FooterSectionProps>(
  ({ className, title, children, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-4', className)} {...props}>
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
      <div className="space-y-2">{children}</div>
    </div>
  )
);
FooterSection.displayName = 'FooterSection';

// Footer Link Component
export const FooterLink = React.forwardRef<HTMLAnchorElement, FooterLinkProps>(
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
FooterLink.displayName = 'FooterLink';

// Footer Social Component
export const FooterSocial = React.forwardRef<HTMLDivElement, FooterSocialProps>(
  ({ className, links = [], ...props }, ref) => (
    <div ref={ref} className={cn('flex space-x-4', className)} {...props}>
      {links.map((link, index) => (
        <Button key={index} variant="ghost" size="icon" asChild>
          <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.name}>
            {link.icon}
          </a>
        </Button>
      ))}
    </div>
  )
);
FooterSocial.displayName = 'FooterSocial';

// Footer Company Info Component
export const FooterCompanyInfo = React.forwardRef<HTMLDivElement, FooterCompanyInfoProps>(
  ({ className, companyName, description, address, phone, email, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      {companyName && <h4 className="text-base font-semibold text-foreground">{companyName}</h4>}
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
    </div>
  )
);
FooterCompanyInfo.displayName = 'FooterCompanyInfo';

// Footer Legal Component
export const FooterLegal = React.forwardRef<HTMLDivElement, FooterLegalProps>(
  ({ className, links = [], ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'border-t border-border pt-4 mt-8 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0',
        className
      )}
      {...props}
    >
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} ExchangeGO. All rights reserved.
      </p>
      <div className="flex space-x-6">
        {links.map((link, index) => (
          <FooterLink key={index} href={link.href}>
            {link.name}
          </FooterLink>
        ))}
      </div>
    </div>
  )
);
FooterLegal.displayName = 'FooterLegal';

// Complete Footer Layout
export const FooterLayout = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, children, ...props }, ref) => (
    <Footer ref={ref} className={className} {...props}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">{children}</div>
    </Footer>
  )
);
FooterLayout.displayName = 'FooterLayout';
