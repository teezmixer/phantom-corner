import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals are off, so Testing Library's auto-cleanup does not register itself; unmount explicitly.
afterEach(() => cleanup());
