---
title: 'Using Google Stitch to Create Multi-Tenant UI Architecture in a Next.js Project'
description: 'AI tool to reduce the design-to-code gap in multi-tenant SaaS development'
pubDate: 'April 21 2026'
heroImage: '/Build_the_web_you_want.png'
---

## Introduction

### What Is Google Stitch?
AI-powered UI design tool from Google Labs (launched at Google I/O 2025)
Built on Gemini 2.5 Pro — generates UI from natural language prompts or image inputs
Exports clean HTML/CSS, Tailwind CSS, React/JSX code, and Figma-compatible files
Supports multi-screen design flows with consistent design tokens

### What Is Multi-Tenant Architecture?
A single application instance serving multiple customers (tenants) from one codebase
Each tenant gets unique branding, configurations, data isolation, and user management
Common in SaaS platforms (e.g., Shopify, Slack, Notion)

### Why Combine Stitch + Next.js for Multi-Tenancy?
Stitch accelerates UI prototyping and design system creation
Next.js provides robust routing, middleware, and server-side rendering for tenant resolution
Together they reduce the design-to-code gap in multi-tenant SaaS development

## Planning Your Multi-Tenant Strategy

### Tenant Isolation Models
Path-based: ```/app/[tenant]/dashboard``` — simplest to implement
Subdomain-based: tenant1.yourapp.com — more professional, requires DNS/middleware config
Custom domain-based: tenant1.com — enterprise-grade, most complex

### UI Customization Scope Per Tenant
Branding (logos, colors, typography)
Layout variations (sidebar vs. top-nav, feature visibility)
Theme tokens (light/dark, accent colors, border radius)
Feature flags and role-based UI differences

### Shared vs. Tenant-Specific Components
Identify which UI components are universal (navigation shells, form elements, data tables)
Identify which components need per-tenant customization (dashboards, landing pages, onboarding flows)

## Designing the Multi-Tenant UI in Google Stitch

### Setting Up Your Stitch Workspace
Access Stitch at stitch.withgoogle.com
Choose between Standard Mode (Gemini 2.5 Flash, 350 generations/month) and Experimental Mode (Gemini 2.5 Pro, 50 generations/month)

### Designing the Base/Shared UI Layer
Prompt Stitch to generate the core application shell (navigation, sidebar, header, footer)
Design shared screens: login, registration, settings, user profile
Establish a consistent design token set (colors, spacing, typography, border-radius)
Use the URL extraction feature to match an existing brand or style guide

### Designing Tenant-Specific Variants
Create separate Stitch projects or screens for each tenant theme variant
Prompt examples:
"Dashboard for a healthcare SaaS with blue/white theme, sidebar navigation"
"Same dashboard layout but with dark theme and orange accents for a fintech tenant"
Use Stitch's theme customization panel to quickly swap color palettes and fonts
Generate tenant-specific landing pages, onboarding flows, and branded email templates

### Building a Design System in Stitch
Use URL extraction to pull design tokens from an existing site or brand guide
Generate multiple screen types with consistent tokens across the project
Export the full design system for developer handoff

## Exporting Stitch Designs for Next.js

### Export Options
HTML/CSS — static markup with Tailwind CSS utility classes
React/JSX — component-structured code with JSX and inline or companion styles
Figma — editable layers with auto-layout (for further design refinement)
AI Studio — direct export for adding Gemini API logic and interactivity

### Preparing Exports for Next.js Integration
Export as React/JSX for the closest alignment with Next.js component architecture
Review and rename generated components to match your project conventions
Extract design tokens into a shared tokens.ts or tailwind.config.ts file
Identify reusable components vs. page-level layouts

### Using Third-Party Tools for Conversion
HolyStitch — MCP tool that compiles Stitch exports into a full Next.js app (splits screens into named React components, extracts Tailwind themes, deduplicates shared components)
stitch-to-react — converts Stitch HTML/PNG pairs into production-ready React components
Manual conversion: copy Stitch HTML into JSX, replace class with className, add 'use client' directives as needed

## Implementing Multi-Tenant Architecture in Next.js

### Project Structure
```
/app
  /[tenant]
    /dashboard
    /settings
    /profile
    layout.tsx          # Tenant-aware layout wrapper
  /api
    /tenant
/components
  /shared              # Base components (from Stitch shared layer)
  /tenant-overrides    # Per-tenant component variants
/lib
  tenant.ts            # Tenant resolution utilities
  theme.ts             # Theme/token mapping per tenant
/styles
  /themes
    default.css
    tenant-a.css
    tenant-b.css
```

### Tenant Resolution via Middleware
Use Next.js middleware.ts to detect tenant from subdomain, path, or custom domain
Inject tenant context into request headers or cookies
Redirect unknown tenants to a default or error page

### Dynamic Theming with Stitch-Generated Tokens
Map Stitch design tokens to CSS custom properties per tenant
Load the correct theme file or token set based on resolved tenant
Use a ThemeProvider context to make tokens available to all components

### Tenant-Aware Layout Components
Wrap Stitch-exported layouts in a TenantLayout component that reads tenant config
Conditionally render navigation items, logos, and feature sections based on tenant
Use Next.js dynamic imports to lazy-load tenant-specific component overrides

### Data Isolation and API Layer
Filter all API queries by tenant_id (verified server-side, never trust client input)
Use shared database with tenant ID column or schema-per-tenant depending on scale
Validate tenant membership on every request via middleware or API route guards

## Theming and Branding Pipeline

### Creating the Token-Based Theme System
Extract color palettes, font stacks, spacing scales, and border-radius values from Stitch exports
Store as a tenant configuration object (JSON or database-driven)
Apply at runtime via CSS custom properties or Tailwind config

### Onboarding New Tenants
Use Stitch to rapidly generate a new tenant's branded UI by prompting with their brand colors and style
Export, convert to React components, and register as a new theme variant
Automate with a tenant onboarding pipeline: brand input → Stitch generation → code export → deploy

### White-Label Considerations
Allow tenants to upload logos and set primary/secondary colors via a settings UI
Store tenant brand assets in cloud storage, reference dynamically in layouts
Use Stitch to prototype what each brand configuration will look like before shipping

## Deployment and Scaling

### Vercel Deployment for Multi-Tenancy
Use Vercel's wildcard domain support (*.yourapp.com)
Configure custom domains per tenant via Vercel's Platforms feature
Automatic SSL certificate management for all tenant domains

### Caching Strategies
Cache tenant-agnostic pages globally (marketing, docs, shared assets)
Use per-tenant cache keys for personalized dashboards and data views
Leverage ISR (Incremental Static Regeneration) for tenant content pages

### Performance Optimization
Lazy-load tenant-specific theme CSS and component overrides
Use Next.js server components for tenant-aware data fetching
Code-split per-tenant customizations to keep the shared bundle lean

## Workflow Summary
Step
Tool
Output
1. Design base UI shell
Google Stitch
Multi-screen prototype + design tokens
2. Design tenant variants
Google Stitch
Themed screen variations per tenant
3. Export code
Stitch → React/JSX
Component files + Tailwind styles
4. Convert & integrate
HolyStitch / manual
Next.js components in project structure
5. Implement tenant routing
Next.js middleware
Subdomain/path-based resolution
6. Apply dynamic theming
CSS custom properties
Per-tenant branding at runtime
7. Isolate data
API route guards
Tenant-scoped queries and auth
8. Deploy
Vercel
Wildcard domains + custom domain support


## Limitations and Considerations
Stitch exports are prototyping starting points, not production-ready code — developer review and refactoring is required
Stitch may produce similar-looking designs across tenants; manual refinement adds differentiation
Complex interactive behaviors (modals, real-time updates, auth flows) must be built separately
Stitch is still in Google Labs — features and availability may change
Multi-tenant security (data isolation, RBAC) is entirely a backend concern and outside Stitch's scope

## Resources
Google Stitch — Official tool
Next.js Multi-Tenant Guide — Official docs
Vercel Platforms Starter Kit — Production-ready multi-tenant Next.js example
Stitch MCP Server & SDK — For programmatic integration
HolyStitch — Stitch-to-Next.js compiler

