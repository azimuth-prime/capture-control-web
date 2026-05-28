# Capture Control — Project Bible

All team members read this file. It is the single source of truth for the project.

## What This App Is

Capture Control is an internal ERP / order management system built on **AngularJS 1.8.2**. It manages the full lifecycle of a product-based business: purchasing from vendors, managing inventory, fulfilling sales orders, invoicing customers, CRM, warehouse operations (pick/pack/ship), and reporting.

Entry points: `control.html` (main app), `login.html`.
Auth: JWT Bearer tokens with OAuth2 refresh flow, handled by `app/auth/auth.service.js`.

## Current Tech Stack

- **Framework**: AngularJS 1.8.2 (EOL December 2021)
- **Routing**: ngRoute (hash-based, `#/path`)
- **UI**: Bootstrap 5, Font Awesome 5, ui-grid
- **Charts**: Google Charts + Chart.js
- **Rich text**: Quill 2
- **Build system**: None — 51 JS files loaded manually via `<script>` tags in `control.html`
- **Dependencies**: All via CDN, no package.json

## Module Inventory

| Module | JS Files | Templates | Complexity |
|---|---|---|---|
| auth | 1 service | — | Low |
| global (filters, directives, functions, data) | 4 | — | Low |
| admin (config, solr, app-settings) | 3 controllers, 2 services | config, app-config, app-search | Low |
| email | 1 service | — | Low |
| print | 1 controller, 1 service | — | Low |
| templates (email templates) | 1 controller, 1 service | — | Low |
| crm (orgs, users, contacts) | 2 controllers, 2 services | organizations, users, my-account | Medium |
| invoice | 1 controller, 1 service | invoices, invoice-details | Medium |
| rma | 1 controller, 1 service | rmas, rma-details | Medium |
| service orders | 1 controller, 1 service | service-orders, service-order-details | Medium |
| edgehub | 1 controller, 1 service | edgehubs, edgehub | Medium |
| products (products, skus, inventory, bundles, import) | 3 controllers, 3 services | products, product-details, sku-details, inventory-details, sku-bundle-details | High |
| purchase (POs, vendor price lists) | 1 controller, 1 service | pos, po-details, new-po, re-order, pricelists | High |
| order (sales orders, shipping) | 2 controllers, 2 services | orders, order-details, new-order | High |
| warehouse (pick, pack, ship, transfer) | 1 controller, 1 service | picking, packing, shipping, transfer | High |
| reporting (inventory + sales reports, charts) | 3 controllers, 3 services | 15+ report templates | High |

**Totals**: 51 JS files, 96 HTML templates, ~12K lines JS, ~28K lines HTML

## Migration Goal

Migrate from AngularJS 1.8.2 to a modern framework. **Framework not yet decided**:

- **Angular (TypeScript)**: More structured, DI/forms/router built-in, patterns map closer to AngularJS, ngUpgrade allows incremental migration
- **React**: Broader industry adoption, larger hiring pool, more ecosystem freedom, requires choosing router/state/form libraries separately

**Architect owns this decision.** All other roles should flag concerns but not block on it.

## Known Issues to Fix During Migration

1. **CRITICAL SECURITY**: Hardcoded OAuth client secret in `app/auth/auth.service.js:6` — must move server-side
2. Duplicate `/packing` route in `app/capture-control.module.js:60,64`
3. Duplicate `configService` injection in `app/order/order.controller.js:2`
4. No build system — 51 serial HTTP requests on load
5. jQuery DOM manipulation inside AngularJS controllers (anti-pattern)
6. `userController` wrapper on every template (96 templates) — should be a route guard/auth context
7. No loading states — API calls have no visual feedback
8. Search fires on every keystroke with no debounce
9. No user-facing error states — catch blocks only `console.log`
10. `console.log` debug statements scattered throughout production code

## API Backend

All HTTP calls go to `/capture/...` endpoints (same origin). Every service method chains through `authService.getConfig()` to attach the Bearer token before the `$http` call. This pattern must be preserved or replaced with an equivalent interceptor in the new framework.

## Team Roles

| Role | File | Responsibility |
|---|---|---|
| Project Manager | `.claude/team/pm.md` | Timelines, sprint planning, cross-role coordination |
| Architect | `.claude/team/architect.md` | Framework decision, component structure, migration strategy |
| Developer | `.claude/team/dev.md` | Implementation, module-by-module migration |
| QA Tester | `.claude/team/qa.md` | Test plans, review, regression checks |

## How to Launch Each Team Member

Open a new Claude Code window/terminal in this directory, then start with:

> "You are the [Role Name]. Read your role instructions from `.claude/team/[filename].md` and the project bible from `CLAUDE.md`."

Replace `[Role Name]` and `[filename]` with: `Project Manager / pm`, `Architect / architect`, `Developer / dev`, `QA Tester / qa`.
