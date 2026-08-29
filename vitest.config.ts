import { defineConfig } from 'vitest/config'

// Workspace-level runner: package tests and the release-consistency gate
// (added with v0.1.0) run under one command.
export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
  },
})
