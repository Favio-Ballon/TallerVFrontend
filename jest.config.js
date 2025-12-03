module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.mjs'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html)$',
        processWithEsbuild: ['**/*.html'],
        useESM: true
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],
  transformIgnorePatterns: ['node_modules/(?!(?:@angular|rxjs|zone.js)/)'],

  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy"
  },
  roots: ['<rootDir>/src/tests/unit'],
  testMatch: ['**/?(*.)+(spec|test).+(ts)'],
  collectCoverage: true,
  coverageDirectory: 'coverage'
};