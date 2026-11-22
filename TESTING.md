# Testing

Tests make changes to the interactive homepage safer by checking behavior before deployment.

## Framework

The project uses Vitest with jsdom. jsdom provides the browser-like DOM needed to test the tab and hover interactions without opening a real browser.

## Commands

- `npm test` runs the test suite once.
- `npm run test:watch` runs tests while files change.
- `npm run build` verifies the production Webpack build.

## Test layers

- Unit tests live in `test/` and use the `*.test.js` suffix.
- Interaction tests cover DOM state changes and animation callbacks.
- Production smoke testing is performed by `npm run build` in CI.
- Browser-level performance and visual checks remain manual until an end-to-end suite is added.

## Conventions

- Build the smallest DOM fixture that represents the real component contract.
- Mock only animation timing, not the resulting active-state behavior.
- Assert user-visible state such as the selected content and visual.
- Add a regression test when fixing an interaction bug.
