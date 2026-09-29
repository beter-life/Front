import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { projects: [
    { extends: true, test: { name: 'unit', environment: 'jsdom', setupFiles: ['./tests/setup.ts'], include: ['tests/unit/**/*.test.{ts,tsx}'] } },
    { extends: true, test: { name: 'integration', environment: 'jsdom', setupFiles: ['./tests/setup.ts'], include: ['tests/integration/**/*.test.{ts,tsx}'] } },
  ] },
});
