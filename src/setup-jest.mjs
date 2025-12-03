// ESM entry for Jest setup to initialize Angular TestBed (zone) without requiring CJS preset
import 'zone.js';
import 'zone.js/testing';

// Polyfill TextEncoder/TextDecoder if needed (from jest-preset-angular utils)
import { TextDecoder, TextEncoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Dynamically import Angular testing modules (use import() to load ESM)
try {
  const ngCore = await import('@angular/core');
  const ngCoreTesting = await import('@angular/core/testing');
  const { COMPILER_OPTIONS, VERSION } = ngCore;
  const { getTestBed } = ngCoreTesting;

  if (Number(VERSION.major) >= 20) {
    const platformBrowserTesting = await import('@angular/platform-browser/testing');
    const { BrowserTestingModule, platformBrowserTesting: platformBrowserTestingFactory } = platformBrowserTesting;
    getTestBed().initTestEnvironment(
      [BrowserTestingModule],
      platformBrowserTestingFactory([
        {
          provide: COMPILER_OPTIONS,
          useValue: {},
          multi: true,
        },
      ]),
    );
  } else {
    const platformBrowserDynamicTesting = await import('@angular/platform-browser-dynamic/testing');
    const { BrowserDynamicTestingModule, platformBrowserDynamicTesting: platformBrowserDynamicTestingFactory } =
      platformBrowserDynamicTesting;
    getTestBed().initTestEnvironment([BrowserDynamicTestingModule], platformBrowserDynamicTestingFactory());
  }
} catch (e) {
  // If initialization fails, rethrow so Jest surfaces the error
  // eslint-disable-next-line no-console
  console.error('Error initializing Angular TestBed in setup-jest.mjs', e);
  throw e;
}

// Global mocks commonly needed in Angular tests
globalThis.matchMedia = globalThis.matchMedia || function () {
  return {
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
};
