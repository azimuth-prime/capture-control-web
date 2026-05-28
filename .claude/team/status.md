# Migration Status

_Last updated: 2026-05-27_

---

## Current Sprint — Week of 2026-05-27

**Status: Pre-development / Awaiting Framework Decision**

- Architect is finalizing the framework decision (Angular vs React). Expected: 2026-05-28.
- Development is blocked until that decision is made — no implementation work can begin.
- PM has documented full sprint plan and milestone schedule (this file).
- QA role has been briefed; test planning can begin once framework is confirmed.

**This week's actions:**
- [ ] Architect delivers framework decision (due 2026-05-28)
- [ ] Developer sets up repo structure and Vite + npm build system (can start 2026-05-28)
- [ ] Developer begins OAuth client secret remediation in parallel with build setup

---

## Key Milestones

| Milestone | Target Date | Status |
|---|---|---|
| Framework decision | 2026-05-28 | PENDING — Architect |
| Build system live (Vite + npm) | 2026-06-05 | Not started |
| CRITICAL: OAuth secret moved server-side | 2026-06-12 | Not started |
| Auth + global modules done (Phase 1 complete) | 2026-07-02 | Not started |
| First low-complexity module shipped | 2026-07-17 | Not started |
| Phase 2 complete (all low-complexity modules) | 2026-08-07 | Not started |
| Halfway point (end of Phase 3) | 2026-10-16 | Not started |
| Phase 4 complete (all high-complexity modules) | 2027-03-05 | Not started |
| QA full regression begins | 2027-03-08 | Not started |
| Cutover / AngularJS decommissioned | 2027-04-25 | Not started |

---

## Sprint Schedule — Phase by Phase

> Assumes 1 developer, part-time ~20 hrs/week. Full-time estimates doubled.

### Phase 1 — Foundation
**2026-05-28 → 2026-07-02 (5 weeks)**

Blocks everything. Nothing else starts until auth and globals are signed off.

| Task | Owner | Target |
|---|---|---|
| Framework decision | Architect | 2026-05-28 |
| Vite + npm build system setup | Developer | 2026-06-05 |
| Fix CRITICAL: OAuth client secret server-side | Developer | 2026-06-12 |
| Auth module migration (JWT, route guards) | Developer | 2026-06-19 |
| Global module (filters, directives, utilities) | Developer | 2026-07-02 |
| QA sign-off: Phase 1 | QA | 2026-07-02 |

---

### Phase 2 — Low Complexity Modules
**2026-07-06 → 2026-08-07 (5 weeks)**

| Task | Owner | Target |
|---|---|---|
| Email service | Developer | 2026-07-17 |
| Print module | Developer | 2026-07-24 |
| Email templates module | Developer | 2026-07-31 |
| Admin (config, app-settings, Solr search) | Developer | 2026-08-07 |
| QA sign-off: Phase 2 | QA | 2026-08-07 |

---

### Phase 3 — Medium Complexity Modules
**2026-08-10 → 2026-10-16 (10 weeks)**

CRM first — it underpins org/user references in orders and invoices.

| Task | Owner | Target |
|---|---|---|
| CRM (organizations, users, my-account) | Developer | 2026-08-28 |
| Invoice | Developer | 2026-09-11 |
| RMA | Developer | 2026-09-25 |
| Service orders | Developer | 2026-10-09 |
| Edgehub | Developer | 2026-10-16 |
| QA sign-off: Phase 3 | QA | 2026-10-16 |

**Halfway point reached at end of Phase 3.**

---

### Phase 4 — High Complexity Modules
**2026-10-19 → 2027-03-05 (20 weeks)**

Warehouse last — depends on products and orders being stable.

| Task | Owner | Target |
|---|---|---|
| Products (products, SKUs, inventory, bundles, import) | Developer | 2026-11-20 |
| Purchase orders + vendor price lists | Developer | 2026-12-25 |
| Sales orders + shipping | Developer | 2027-01-29 |
| Warehouse (pick, pack, ship, transfer) | Developer | 2027-03-05 |
| QA sign-off: Phase 4 | QA | 2027-03-05 |

> Note: Dec 25 falls inside the PO phase — buffer that sprint accordingly.

---

### Phase 5 — Reporting and Cutover
**2027-03-08 → 2027-04-25 (7 weeks)**

| Task | Owner | Target |
|---|---|---|
| Reporting (inventory + sales reports, charts) | Developer | 2027-03-26 |
| Dashboard | Developer | 2027-04-04 |
| Full regression QA | QA | 2027-04-18 |
| Decommission AngularJS entry points | Developer | 2027-04-25 |
| **CUTOVER** | All | **2027-04-25** |

---

## Module Checklist

### Phase 1 — Foundation
- [ ] Framework decision (Architect)
- [ ] Build system: Vite + npm (Developer)
- [ ] Auth module — JWT handling, route guards (Developer)
- [ ] Global module — filters, directives, utility functions (Developer)
- [ ] CRITICAL: OAuth client secret moved server-side (Developer)

### Phase 2 — Low Complexity
- [ ] Email service
- [ ] Print module
- [ ] Email templates module
- [ ] Admin (config, app-settings, Solr search)

### Phase 3 — Medium Complexity
- [ ] CRM (organizations, users, my-account)
- [ ] Invoice
- [ ] RMA
- [ ] Service orders
- [ ] Edgehub

### Phase 4 — High Complexity
- [ ] Products (products, SKUs, inventory, bundles, import)
- [ ] Purchase orders + vendor price lists
- [ ] Sales orders + shipping
- [ ] Warehouse (pick, pack, ship, transfer)

### Phase 5 — Reporting and Cutover
- [ ] Reporting (15+ templates, charts)
- [ ] Dashboard
- [ ] Full regression QA
- [ ] Decommission AngularJS entry points

---

## Completed

_(none yet)_

---

## In Progress

- [ ] Framework decision — Architect (due 2026-05-28)

---

## Blocked

- **All development** — blocked on framework decision. Expected to unblock 2026-05-28.

---

## Up Next (once framework is decided)

1. Build system setup (Vite + npm) — Developer (start 2026-05-28)
2. OAuth client secret moved server-side — Developer, CRITICAL security fix
3. Auth module migration — Developer

---

## Known Issues Tracker

| # | Issue | Phase | Module | Status |
|---|---|---|---|---|
| 1 | CRITICAL: OAuth client secret hardcoded in `auth.service.js:6` | Phase 1 | Auth | Open |
| 2 | Duplicate `/packing` route in `capture-control.module.js:60,64` | Phase 4 | Warehouse | Open |
| 3 | Duplicate `configService` injection in `order.controller.js:2` | Phase 4 | Sales Orders | Open |
| 4 | No build system — 51 serial HTTP requests on load | Phase 1 | Foundation | Open |
| 5 | jQuery DOM manipulation inside controllers | All | All | Open |
| 6 | `userController` wrapper on all 96 templates | Phase 1 | Auth/Global | Open |
| 7 | No loading states on any API calls | All | All | Open |
| 8 | Search fires on every keystroke — no debounce | Phase 3-4 | CRM, Products, Orders | Open |
| 9 | No user-facing error states — only `console.log` | All | All | Open |
| 10 | `console.log` debug statements in production code | All | All | Open |
