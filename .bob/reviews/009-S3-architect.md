# Architect S3
- ui/ and lib/ have no imports from app/ or components feature modules; no cycles.
- components/navItems.ts: appropriate (shared by Navigation and Footer, no React).
- Mechanical fix: removed unused isLoading from useFooterData() destructure in Footer.tsx.
- Verdict: ok. jest 754 pass, tsc clean.
