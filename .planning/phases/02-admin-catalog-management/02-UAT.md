---
status: diagnosed
phase: 02-admin-catalog-management
source: 02-00-SUMMARY.md, 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md
started: 2026-03-09T14:35:00Z
updated: 2026-03-09T17:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev servers. Start the API and web app from scratch. The API server boots without errors, database schema is intact, and the web app loads the dashboard at http://localhost:5173 without console errors.
result: pass

### 2. Sidebar Navigation
expected: The left sidebar shows a "Manage" section that is collapsible. Clicking it expands to reveal sub-items: Brands, Categories, and Listings. Clicking any sub-item navigates to the corresponding /manage/* route. The Manage section auto-expands when you're on a /manage/* page.
result: pass

### 3. Create a Brand
expected: On /manage/brands, clicking "Add Brand" (or similar create button) opens a dialog with fields for brand name, company select (filtered to manufacturers), and logo image upload. Submitting the form creates the brand, shows a success toast, closes the dialog, and the new brand appears in the table.
result: issue
reported: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://undefined.r2.cloudflarestorage.com/images/... (Reason: CORS request did not succeed). Status code: (null)."
severity: blocker

### 4. Search and Sort Brands
expected: On /manage/brands, typing in the search input filters the brand list after a short debounce (~300ms). Clicking column headers (e.g., Name) toggles sort order. Pagination controls appear at the bottom of the table.
result: pass

### 5. Edit a Brand
expected: On /manage/brands, clicking the actions menu (three dots or similar) on a brand row and selecting "Edit" opens the dialog pre-populated with the brand's current name, company, and logo. Saving changes updates the brand in the table and shows a success toast.
result: pass
note: Same R2 CORS issue affects logo upload

### 6. Delete a Brand
expected: On /manage/brands, clicking the actions menu on a brand row and selecting "Delete" shows a confirmation dialog. Confirming performs a soft delete -- the brand disappears from the list. A success toast is shown.
result: pass

### 7. Create a Category
expected: On /manage/categories, clicking the create button opens a dialog with fields for category name, Lucide icon name, and display order. Submitting creates the category, shows a success toast, and the new category appears in the table.
result: pass

### 8. Edit a Category
expected: On /manage/categories, clicking edit on a category row opens the dialog pre-populated with current values. Saving updates the category and shows a success toast.
result: pass

### 9. Delete a Category
expected: On /manage/categories, clicking delete on a category row shows a confirmation dialog. Confirming soft-deletes the category and it disappears from the list.
result: pass

### 10. Listings Page with Filters
expected: Navigating to /manage/listings shows a data table with columns for listing name, brand, status (color-coded badge), SKU count, and categories. A search input and status filter dropdown are available above the table.
result: pass
note: Status filter default label shows "all" instead of "All Statuses" (cosmetic)

### 11. Create a Listing
expected: Clicking "New Listing" (or similar) on /manage/listings navigates to a create page with a form containing: basic info (name, description, brand select, status select), a category checkbox grid, an images section (up to 5, with reorder/set-primary), and an inline SKU editor. Submitting creates the listing with all nested data and navigates back to the listings table.
result: pass
note: Same R2 CORS issue affects image upload

### 12. Inline SKU Editor
expected: On the listing create/edit form, the SKU section allows adding new SKU rows with fields for SKU code, UPC, price, MSRP, quantity, and expiration date. Rows can be removed (with undo for existing SKUs on edit). Multiple SKUs can be added to a single listing.
result: pass
note: Image upload area height is too large and breaks out of the container border (cosmetic)

### 13. Edit a Listing
expected: On /manage/listings, clicking edit on a listing row navigates to the edit page. The form is pre-populated with the listing's current data including brand, status, selected categories, images, and existing SKUs. Changes can be saved and a success toast is shown.
result: pass

### 14. Delete a Listing
expected: On /manage/listings, clicking delete on a listing row shows a confirmation dialog. Confirming soft-deletes the listing (and cascades to its SKUs) and it disappears from the list.
result: pass

## Summary

total: 14
passed: 13
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Image upload works when creating/editing brands and listings"
  status: failed
  reason: "User reported: Cross-Origin Request Blocked at https://undefined.r2.cloudflarestorage.com — R2 account ID env var is undefined, causing CORS failure on presigned URL PUT"
  severity: blocker
  test: 3
  root_cause: "All 5 R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL) are missing from apps/api/.env. The endpoint template literal in uploads.ts interpolates undefined as the string 'undefined'."
  artifacts:
    - path: "apps/api/src/routes/uploads.ts"
      issue: "Line 10: endpoint uses process.env.R2_ACCOUNT_ID which is undefined"
    - path: "apps/api/.env"
      issue: "Missing all R2 credentials — only has DB, Clerk, and frontend vars"
  missing:
    - "Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL to apps/api/.env from Cloudflare dashboard"
  debug_session: ".planning/debug/r2-presigned-url-undefined.md"

## Cosmetic Notes

- Test 10: Status filter default label shows "all" instead of "All Statuses"
- Test 12: SKU image upload area height is too large and breaks out of the container border
