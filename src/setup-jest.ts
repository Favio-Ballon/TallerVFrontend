// Use the preset environment setup provided by jest-preset-angular
const presetZone = require('jest-preset-angular/setup-env/zone');
if (presetZone && typeof presetZone.setupZoneTestEnv === 'function') {
  presetZone.setupZoneTestEnv();
}

// Global mocks commonly needed in Angular tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});
