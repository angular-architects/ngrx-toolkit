# 🔄 ngrx-toolkit – Branching, Versioning & Contribution Strategy

This document describes how we manage Angular version compatibility, branching, npm publishing, and contributor workflow for `ngrx-toolkit`.

---

## ✅ Overview

We support multiple Angular versions in parallel using **versioned branches** and **matching npm major versions**:

| Git Branch | Angular Version Support | npm Version | npm Tag     | Purpose                           |
| ---------- | ----------------------- | ----------- | ----------- | --------------------------------- |
| `main`     | Angular 20+             | `20.x`      | `latest`    | Active development                |
| `v19`      | Angular 15–19           | `19.x`      | `angular19` | Maintenance only                  |
| `v20`      | Angular 20              | `20.x`      | (optional)  | Frozen once `main` moves to v21   |
| `v21`      | Angular 21 (future)     | `21.x`      | `latest`    | Active once Angular 21 is current |

---

## 🧱 Codebase Structure

```
src/
  core/ ← shared logic for all versions
  angular/
    v20/ ← Angular 20+ only features
    v21/ ← Angular 21+ only features (future)
```

- `core/` holds reusable code shared across all versions
- `angular/vXX/` contains version-specific logic, only exported in compatible branches

---

## 📦 `public-api.ts` per Branch

Control what is exported in each branch:

### In `main` (Angular 20):

```ts
export * from './src/core';
export * from './src/angular/v20/http-resource-feature';
```

### In `v19`:

```ts
export * from './src/core';
// Do not export v20 or v21 features
```

---

## 🔁 npm Publishing Commands

### From `v19`:

```bash
git checkout v19
npm version 19.x.y
npm publish --tag angular19
git push origin v19 --tags
```

### From `main` (Angular 20):

```bash
git checkout main
npm version 20.x.y
npm publish
git push origin main --tags
```

### When Angular 21 is released:

```bash
git checkout main
git checkout -b v20 # Freeze Angular 20
git push origin v20

# Upgrade Angular in main, then:
npm version 21.0.0
npm publish # This becomes new `latest`
```

---

## ❌ Deprecated or Obsolete Features

- If a feature becomes redundant (e.g. `signalFromObservable` now built into Angular):
  - **Keep** it in `v19`
  - In `main`:
    - **Option 1:** Re-export from Angular
    - **Option 2:** Mark as `@deprecated`
    - **Option 3:** Remove entirely
- No need to move old features to a `legacy/` folder - just delete them per branch. Git history preserves them.

---

## 🧪 CI Recommendations

Use a GitHub Actions matrix to test:

- `v19` with Angular 19
- `main` with Angular 20
- (future) `main` with Angular 21

Each job should:

- Verify `peerDependencies`
- Run build, lint, test

---

## 📥 Contributor Workflow

- All **new development** goes into `main`
- If a feature is **backportable** to Angular 19:
  - Cherry-pick into `v19`
  - Avoid Angular 20+ APIs in `v19` (like `httpResource`, `linkedSignal`)
- Clearly document breaking changes in changelog
- Update `public-api.ts` carefully in each branch

---

## 📦 Installation Matrix

```bash
# Angular 20+ projects
npm install ngrx-toolkit

# Angular 15–19 projects
npm install ngrx-toolkit@angular19
```

---

## 📌 Best Practices

- Each Angular version gets its own major npm version and branch
- `main` always tracks the latest Angular
- Features are removed from branches where they're no longer needed
- Avoid unnecessary abstraction: Git + clean exports are all you need

---

For questions or proposals, please open a discussion or issue. Happy contributing! 🚀
