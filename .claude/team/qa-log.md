# QA Log

---

## Bugs Found in AngularJS Source (pre-migration)

These are defects in the **current** codebase discovered during test plan research. Fix during migration.

| # | Bug | File | Severity |
|---|---|---|---|
| B1 | `sendEmail()` clears `$scope.email` before reading its type for the success toast — toast always reads "undefined Email Sent" | `order.controller.js` | Medium |
| B2 | `findOrderByKeyword()` has no `.catch()` block — API failures are completely silent | `order.controller.js` | Medium |
| B3 | `barcodeScanner` directive binds `jQuery(document).keypress` globally and never unbinds — memory leak in SPA navigation | `global/directives.js` | Medium |
| B4 | `configService` injected twice in `orderController` | `order.controller.js` | Low |
| B5 | Duplicate `/packing` route | `capture-control.module.js` | Low |

---

## Phase 1 Test Plans

---

### Auth Module Test Plan

**Source reviewed**: `app/auth/auth.service.js`

**Key behaviors to verify**:
- Tokens currently stored in `localStorage` — migration must change this to httpOnly cookies or in-memory (per Architect decision). Tests must verify the NEW storage mechanism.
- Concurrent refresh deduplication: multiple simultaneous 401s must trigger only one refresh call.
- Hardcoded client secret (B-level security issue) must be gone before this module passes QA.

#### Happy Path
- [ ] Login with valid credentials stores access token, refresh token, and `expires_on`
- [ ] All subsequent API calls include `Authorization: Bearer <token>` header
- [ ] Navigating to any authenticated route while logged in succeeds
- [ ] After access token expires, next API call silently refreshes the token and retries
- [ ] After silent refresh, the queued API call completes successfully (user sees no interruption)
- [ ] Logging out clears all token storage and redirects to login

#### Edge Cases
- [ ] Two API calls fire simultaneously with an expired token — only ONE refresh request hits the server (deduplication)
- [ ] Refresh token is also expired — user is redirected to login, not shown a broken page
- [ ] No token at all (fresh browser, cleared storage) — navigating to any protected route redirects to login immediately
- [ ] Login with wrong credentials — user sees an error message (not a blank page or console error)
- [ ] Network is offline during token refresh — user sees a meaningful error, not an infinite spinner

#### Security Verification
- [ ] OAuth client secret does NOT appear anywhere in frontend JS bundles (grep for `!!ghftyx2t9` and `web_client`)
- [ ] Token is NOT stored in `localStorage` (verify in browser DevTools → Application → Local Storage)
- [ ] Token IS stored in the mechanism defined by the Architect (httpOnly cookie or in-memory)
- [ ] Login page is accessible without authentication
- [ ] All other routes redirect to login when unauthenticated

---

### Global / Shared Module Test Plan

**Source reviewed**: `app/global/directives.js`, `app/global/filters.js`

#### `fileModel` Directive
- [ ] Attaching to a file input: selecting a file sets the bound model to the `File` object
- [ ] Selecting a different file updates the model
- [ ] No file selected: model remains unchanged

#### `barcodeScanner` Directive
- [ ] Rapid keypress sequence (3+ chars + Enter within 300ms) fires the callback with the scanned string
- [ ] Slow typing (human speed) does NOT fire the callback
- [ ] Sequence without trailing Enter does NOT fire the callback
- [ ] Sequence shorter than 3 chars does NOT fire the callback
- [ ] **Memory leak fix**: navigating away from a page with the directive and back does NOT register duplicate event listeners (verify by scanning — 2nd scan should fire callback once, not twice)

#### `valueMatches` Directive (password confirmation)
- [ ] Two matching inputs: form field is valid
- [ ] Mismatched inputs: form field is invalid, form cannot be submitted
- [ ] Changing the first field to match the second: field becomes valid
- [ ] Changing the second field to mismatch: field becomes invalid

#### `supercurrency` Filter
- [ ] `1234.56` renders as `$1,234.<sup>56</sup>` (cents in superscript)
- [ ] `0` renders correctly
- [ ] Negative values render correctly
- [ ] The rendered HTML is safe (sanitized — not a raw `innerHTML` injection)

#### `tel` Filter
- [ ] 10-digit number formats as `(XXX) XXX-XXXX`
- [ ] Non-numeric input does not throw, returns input unchanged

---

## Phase 4 Test Plans (pre-written for high-complexity modules)

---

### Sales Orders Test Plan

**Source reviewed**: `app/order/order.controller.js`, `include/order/orders.html`

#### List View (`/order`)
##### Happy Path
- [ ] Page loads, search fires with `*` wildcard, results appear within 2 seconds
- [ ] Keyword search: type "ACME" — results filter to orders with "ACME" in customer/order fields
- [ ] Search input has 300ms debounce — rapid typing fires one request, not one per character
- [ ] Result count badge updates with each search
- [ ] Clicking a row navigates to `/order/:id`
- [ ] "New Sales Order" button navigates to `/new-order`
- [ ] Pagination: Next/Prev buttons work; direct page buttons work; current page button is disabled
- [ ] Maximum 20 pages displayed regardless of total result count
- [ ] Sorting by each column header (id, customerName, submittedDate, shippedDate, warehouseName, state) reloads with correct sort; direction toggles on second click

##### Edge Cases
- [ ] Search with no results: empty state shown (not a blank table or JS error)
- [ ] Search API fails: user sees an error message (not silent failure — fix for Bug B2)
- [ ] Single result: pagination is hidden or shows 1 page
- [ ] Keyword cleared: list resets to wildcard results

##### Known Issue Verification
- [ ] Search debounce present — confirm with Network tab: one request per completed word, not per character
- [ ] Loading spinner/skeleton shown while results load
- [ ] Error message shown if API returns 500

---

#### Invoice Button Logic (`showInvoiceButton`)

This is the most complex conditional in the order module. Test all branches:

| Condition | Expected |
|---|---|
| `order.invoice` exists | Button hidden |
| State = `QUOTE` | Button hidden |
| State = `CANCELLED` | Button hidden |
| State = `COMPLETE` | Button hidden |
| State = `SHIPPED`, no invoice, paymentTerm = `PREPAID` | **Button shown** |
| State = `INVOICED`, no invoice, paymentTerm = `PREPAID` | **Button shown** |
| State = `RETURNED`, no invoice, paymentTerm = `PREPAID` | **Button shown** |
| State = `SHIPPED`, no invoice, paymentTerm = `NET30` | Button hidden |
| State = `SHIPPED`, invoice present, paymentTerm = `PREPAID` | Button hidden |

- [ ] All rows in the table above verified in the migrated app

---

#### Email Sending (Bug B1 Fix Verification)
- [ ] Send an email from an order detail page
- [ ] Success toast reads the correct email type (e.g., "Order Confirmation Email Sent") — NOT "undefined Email Sent"
- [ ] `$scope.email` / email state is only cleared AFTER the type has been read for the toast

---

#### Order Detail View (`/order/:id`)
- [ ] All order fields render correctly (customer, addresses, items, totals, state, dates)
- [ ] Bill-to and ship-to address edit forms save correctly
- [ ] Order items table shows all line items with quantities and prices
- [ ] State change actions (approve, ship, cancel, etc.) update the displayed state
- [ ] Back navigation returns to the orders list

---

## QA Sign-off Log

_(Entries added here after each module passes testing)_

Format:
```
## [Module] — [Date]
**Status**: PASS / FAIL / PARTIAL

### Passed
- [item]

### Failed / Bugs
- [description] — repro: [steps]

### Sign-off: [APPROVED / NEEDS FIXES]
```
