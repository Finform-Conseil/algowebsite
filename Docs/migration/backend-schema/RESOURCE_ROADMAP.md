# Backend API Migration Roadmap

**Backend:** `Algo DataBase API v1` (Django REST Framework + drf-yasg)

**Base URL:** `http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/api/v1`

**Total Resources:** 35 groups, 205 endpoints, 96 models

**Critical Pattern:** All paths require trailing slash (`/`) — Django `APPEND_SLASH=True`

---

## Migration Strategy

1. **Interface First (Domain Contracts)**: Write TypeScript interfaces in `core/domain/` matching exact backend schemas
2. **Infrastructure Implementation**: Create RTK Query API slices in `core/infra/store/api/` with trailing-slash enforcement
3. **Presenter Layer**: Hook consumption in components via `core/presenter/`
4. **Incremental Migration**: Start with high-traffic resources (`actions`, `cours`, `societies`), then expand
5. **Archive Pattern**: Once migrated and stable, rename legacy to `_Old` (never delete immediately)

---

## Resource Inventory

### `actionnariats` (4 endpoints)

**Endpoints:**

- `/actionnariats/` — GET, POST
- `/actionnariats/bulk-import/` — POST
- `/actionnariats/import-history/` — GET
- `/actionnariats/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Actionnariat, ActionnariatDetail, ActionnariatImportJob

### `actions` (6 endpoints)

**Endpoints:**

- `/actions/` — GET, POST
- `/actions/bulk-import/` — POST
- `/actions/ordering-fields/` — GET
- `/actions/ticker/` — GET
- `/actions/{id}/` — GET, PUT, PATCH, DELETE
- `/actions/{id}/restore/` — POST

**Models:** Action, ActionDetails

### `activities` (4 endpoints)

**Endpoints:**

- `/activities/` — GET, POST
- `/activities/bulk-import/` — POST
- `/activities/{id}/` — GET, PUT, PATCH, DELETE
- `/activities/{id}/restore/` — POST

**Models:** Activity, ActivityDetails

### `bourses` (5 endpoints)

**Endpoints:**

- `/bourses/` — GET, POST
- `/bourses/bulk-import/` — POST
- `/bourses/deleted/` — GET
- `/bourses/{id}/` — GET, PUT, PATCH, DELETE
- `/bourses/{id}/restore/` — POST

**Models:** Bourse, BourseDetails

### `countries` (4 endpoints)

**Endpoints:**

- `/countries/` — GET, POST
- `/countries/bulk-import/` — POST
- `/countries/{id}/` — GET, PUT, PATCH, DELETE
- `/countries/{id}/restore/` — POST

**Models:** Country, CountryDetails

### `cours` (3 endpoints)

**Endpoints:**

- `/cours/` — GET, POST
- `/cours/bulk-import/` — POST
- `/cours/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Cours, CoursDetails

### `cours-imports` (7 endpoints)

**Endpoints:**

- `/cours-imports/` — GET
- `/cours-imports/active/` — GET
- `/cours-imports/history/` — GET
- `/cours-imports/upload/` — POST
- `/cours-imports/{id}/` — GET
- `/cours-imports/{id}/cancel/` — POST
- `/cours-imports/{id}/status/` — GET

**Models:** ImportJob

### `currencies` (4 endpoints)

**Endpoints:**

- `/currencies/` — GET, POST
- `/currencies/bulk-import/` — POST
- `/currencies/{id}/` — GET, PUT, PATCH, DELETE
- `/currencies/{id}/restore/` — POST

**Models:** Currency

### `dividends` (4 endpoints)

**Endpoints:**

- `/dividends/` — GET, POST
- `/dividends/bulk-import/` — POST
- `/dividends/import-history/` — GET
- `/dividends/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Dividend, DividendDetail, DividendImportJob

### `documents` (7 endpoints)

**Endpoints:**

- `/documents/` — GET, POST
- `/documents/{id}/` — GET, PUT, PATCH, DELETE
- `/documents/{id}/autosave/` — PATCH
- `/documents/{id}/comments/` — GET
- `/documents/{id}/duplicate/` — POST
- `/documents/{id}/publish/` — POST
- `/documents/{id}/versions/` — GET

**Models:** Document, DocumentDetail

### `events` (5 endpoints)

**Endpoints:**

- `/events/` — GET, POST
- `/events/bulk-import/` — POST
- `/events/import-history/` — GET
- `/events/import-status/` — GET
- `/events/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Event, EventDetails

### `files` (2 endpoints)

**Endpoints:**

- `/files/` — GET, POST
- `/files/{id}/` — GET, PUT, PATCH, DELETE

**Models:** File

### `financial-items` (5 endpoints)

**Endpoints:**

- `/financial-items/` — GET, POST
- `/financial-items/tree/` — GET
- `/financial-items/{id}/` — GET, PUT, PATCH, DELETE
- `/financial-items/{id}/children/` — GET
- `/financial-items/{id}/descendants/` — GET

**Models:** FinancialItem

### `financial-statements` (2 endpoints)

**Endpoints:**

- `/financial-statements/` — GET, POST
- `/financial-statements/{id}/` — GET, PUT, PATCH, DELETE

**Models:** FinancialStatement

### `financial-values` (5 endpoints)

**Endpoints:**

- `/financial-values/` — GET, POST
- `/financial-values/bulk-import/` — POST
- `/financial-values/import-history/` — GET
- `/financial-values/import-status/` — GET
- `/financial-values/{id}/` — GET, PUT, PATCH, DELETE

**Models:** FinancialValue, FinancialValueDetails

### `fixed-income` (17 endpoints)

**Endpoints:**

- `/fixed-income/bond-cashflows/` — GET, POST
- `/fixed-income/bond-cashflows/recalculate/` — POST
- `/fixed-income/bond-cashflows/{id}/` — GET, PUT, PATCH, DELETE
- `/fixed-income/bond-issue-lots/` — GET, POST
- `/fixed-income/bond-issue-lots/{id}/` — GET, PUT, PATCH, DELETE
- `/fixed-income/bond-securities/` — GET, POST
- `/fixed-income/bond-securities/bulk-import/` — POST
- `/fixed-income/bond-securities/import-jobs/` — GET
- `/fixed-income/bond-securities/import-jobs/{job_id}/` — GET
- `/fixed-income/bond-securities/{id}/` — GET, PUT, PATCH, DELETE
- `/fixed-income/issuers/` — GET, POST
- `/fixed-income/issuers/{id}/` — GET, PUT, PATCH, DELETE
- `/fixed-income/secondary/` — GET, POST
- `/fixed-income/secondary/bulk-import/` — POST
- `/fixed-income/secondary/import-jobs/` — GET
- `/fixed-income/secondary/import-jobs/{job_id}/` — GET
- `/fixed-income/secondary/{id}/` — GET, PUT, PATCH, DELETE

**Models:** BondCashflow, BondCashflowDetail, BondIssueLot, BondSecurity, BondSecurityDetail, Issuer, Secondary, SecondaryDetail

### `indices` (9 endpoints)

**Endpoints:**

- `/indices/` — GET, POST
- `/indices/bulk-import/` — POST
- `/indices/cours-import-jobs/` — GET
- `/indices/cours-import-jobs/{job_id}/` — GET
- `/indices/cours-import/` — POST
- `/indices/import-jobs/` — GET
- `/indices/import-jobs/{job_id}/` — GET
- `/indices/{id}/` — GET, PUT, PATCH, DELETE
- `/indices/{id}/cours/` — GET

**Models:** Indice, IndiceCours, IndiceDetails

### `industries` (4 endpoints)

**Endpoints:**

- `/industries/` — GET, POST
- `/industries/bulk-import/` — POST
- `/industries/{id}/` — GET, PUT, PATCH, DELETE
- `/industries/{id}/restore/` — POST

**Models:** Industry, IndustryDetails

### `instruments` (2 endpoints)

**Endpoints:**

- `/instruments/` — GET, POST
- `/instruments/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Instrument

### `macro` (40 endpoints)

**Endpoints:**

- `/macro/sector-finances/items/` — GET, POST
- `/macro/sector-finances/items/{id}/` — GET, PUT, PATCH, DELETE
- `/macro/sector-finances/items/{id}/ancestors/` — GET
- `/macro/sector-finances/items/{id}/children/` — GET
- `/macro/sector-finances/items/{id}/descendants/` — GET
- `/macro/sector-finances/values/` — GET, POST
- `/macro/sector-finances/values/bulk-import/` — POST
- `/macro/sector-finances/values/import-jobs/` — GET
- `/macro/sector-finances/values/import-jobs/{job_id}/` — GET
- `/macro/sector-finances/values/{id}/` — GET, PUT, PATCH, DELETE
- `/macro/sector-foreign/items/` — GET, POST
- `/macro/sector-foreign/items/{id}/` — GET, PUT, PATCH, DELETE
- `/macro/sector-foreign/items/{id}/ancestors/` — GET
- `/macro/sector-foreign/items/{id}/children/` — GET
- `/macro/sector-foreign/items/{id}/descendants/` — GET
- `/macro/sector-foreign/values/` — GET, POST
- `/macro/sector-foreign/values/bulk-import/` — POST
- `/macro/sector-foreign/values/import-jobs/` — GET
- `/macro/sector-foreign/values/import-jobs/{job_id}/` — GET
- `/macro/sector-foreign/values/{id}/` — GET, PUT, PATCH, DELETE
- `/macro/sector-monetary/items/` — GET, POST
- `/macro/sector-monetary/items/{id}/` — GET, PUT, PATCH, DELETE
- `/macro/sector-monetary/items/{id}/ancestors/` — GET
- `/macro/sector-monetary/items/{id}/children/` — GET
- `/macro/sector-monetary/items/{id}/descendants/` — GET
- `/macro/sector-monetary/values/` — GET, POST
- `/macro/sector-monetary/values/bulk-import/` — POST
- `/macro/sector-monetary/values/import-jobs/` — GET
- `/macro/sector-monetary/values/import-jobs/{job_id}/` — GET
- `/macro/sector-monetary/values/{id}/` — GET, PUT, PATCH, DELETE
- `/macro/sector-real/items/` — GET, POST
- `/macro/sector-real/items/{id}/` — GET, PUT, PATCH, DELETE
- `/macro/sector-real/items/{id}/ancestors/` — GET
- `/macro/sector-real/items/{id}/children/` — GET
- `/macro/sector-real/items/{id}/descendants/` — GET
- `/macro/sector-real/values/` — GET, POST
- `/macro/sector-real/values/bulk-import/` — POST
- `/macro/sector-real/values/import-jobs/` — GET
- `/macro/sector-real/values/import-jobs/{job_id}/` — GET
- `/macro/sector-real/values/{id}/` — GET, PUT, PATCH, DELETE

**Models:** SectorFinancesItem, SectorFinancesValue, SectorForeignItem, SectorForeignValue, SectorMonetaryItem, SectorMonetaryValue, SectorRealItem, SectorRealValue

### `notifications` (2 endpoints)

**Endpoints:**

- `/notifications/` — GET, POST
- `/notifications/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Notification

### `opcvm-metrics` (5 endpoints)

**Endpoints:**

- `/opcvm-metrics/` — GET, POST
- `/opcvm-metrics/bulk-import/` — POST
- `/opcvm-metrics/import-jobs/` — GET
- `/opcvm-metrics/import-jobs/{job_id}/` — GET
- `/opcvm-metrics/{id}/` — GET, PUT, PATCH, DELETE

**Models:** OPCVMMetric

### `opcvms` (6 endpoints)

**Endpoints:**

- `/opcvms/` — GET, POST
- `/opcvms/bulk-import/` — POST
- `/opcvms/import-jobs/` — GET
- `/opcvms/import-jobs/{job_id}/` — GET
- `/opcvms/topflop/` — GET
- `/opcvms/{id}/` — GET, PUT, PATCH, DELETE

**Models:** OPCVM, OPCVMDetails

### `pages` (3 endpoints)

**Endpoints:**

- `/pages/` — GET, POST
- `/pages/reorder/` — POST
- `/pages/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Page

### `periods` (2 endpoints)

**Endpoints:**

- `/periods/` — GET, POST
- `/periods/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Period

### `rates` (5 endpoints)

**Endpoints:**

- `/rates/` — GET, POST
- `/rates/bulk-import/` — POST
- `/rates/import-jobs/` — GET
- `/rates/import-jobs/{job_id}/` — GET
- `/rates/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Rate, RateDetails

### `result-metrics` (2 endpoints)

**Endpoints:**

- `/result-metrics/` — GET, POST
- `/result-metrics/{id}/` — GET, PUT, PATCH, DELETE

**Models:** ResultMetric

### `results` (5 endpoints)

**Endpoints:**

- `/results/` — GET, POST
- `/results/bulk-import/` — POST
- `/results/import-history/` — GET
- `/results/import-status/` — GET
- `/results/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Result, ResultDetail

### `sectors` (3 endpoints)

**Endpoints:**

- `/sectors/` — GET, POST
- `/sectors/bulk-import/` — POST
- `/sectors/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Sector

### `sgis` (2 endpoints)

**Endpoints:**

- `/sgis/` — GET, POST
- `/sgis/{id}/` — GET, PUT, PATCH, DELETE

**Models:** SGI

### `sgos` (5 endpoints)

**Endpoints:**

- `/sgos/` — GET, POST
- `/sgos/bulk-import/` — POST
- `/sgos/import-jobs/` — GET
- `/sgos/import-jobs/{job_id}/` — GET
- `/sgos/{id}/` — GET, PUT, PATCH, DELETE

**Models:** SGO, SGODetails

### `sheets` (5 endpoints)

**Endpoints:**

- `/sheets/` — GET, POST
- `/sheets/bulk-import/` — POST
- `/sheets/import-history/` — GET
- `/sheets/import-status/` — GET
- `/sheets/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Sheet, SheetDetails

### `societies` (5 endpoints)

**Endpoints:**

- `/societies/` — GET, POST
- `/societies/bulk-import/` — POST
- `/societies/parents/` — GET
- `/societies/subsidiaires/{parent_id}/` — GET
- `/societies/{id}/` — GET, PUT, PATCH, DELETE

**Models:** Society, SocietyDetails

### `templates` (3 endpoints)

**Endpoints:**

- `/templates/` — GET
- `/templates/{id}/` — GET
- `/templates/{id}/create_document/` — POST

**Models:** Template

### `users` (13 endpoints)

**Endpoints:**

- `/users/` — GET, POST
- `/users/change-password/` — POST
- `/users/login/` — POST
- `/users/logout/` — POST
- `/users/me/` — GET
- `/users/refresh-token/` — POST
- `/users/register/` — POST
- `/users/reset-email-request/` — POST
- `/users/reset-password-confirm/{uidb64}/{token}/` — GET
- `/users/reset-password-request/` — POST
- `/users/set-new-password/` — POST
- `/users/verify-email/{uidb64}/{token}/` — GET
- `/users/{id}/` — GET, PUT, PATCH, DELETE

**Models:** ChangeEmailRequest, ChangePassword, Login, LogoutUser, Register, ResetPasswordRequest, SetNewPassword, TokenRefresh, User

