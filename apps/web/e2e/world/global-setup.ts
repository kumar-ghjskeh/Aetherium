import { request, type FullConfig } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const API_BASE_URL = "http://localhost:8000";
const WEB_ORIGIN = "http://localhost:3000";
const STORAGE_STATE_PATH = resolve("artifacts/playwright/auth/visual-user.json");

export default async function globalSetup(_: FullConfig): Promise<void> {
  await mkdir(dirname(STORAGE_STATE_PATH), { recursive: true });
  const api = await request.newContext({
    baseURL: API_BASE_URL,
    extraHTTPHeaders: { Origin: WEB_ORIGIN }
  });

  const registration = await api.post("/api/v1/auth/register", {
    data: {
      displayName: "Aetherium Visual Learner",
      email: "visual-world@example.com",
      password: "StrongPass123!"
    }
  });
  if (registration.status() !== 201) {
    throw new Error(
      `Visual account registration failed with ${registration.status()}: ${await registration.text()}`
    );
  }

  const seed = await api.post("/__aetherium_visual/seed", {
    headers: { "x-aetherium-visual-seed": "aetherium-visual-seed" }
  });
  if (!seed.ok()) {
    throw new Error(`Visual account seed failed with ${seed.status()}: ${await seed.text()}`);
  }

  await api.storageState({ path: STORAGE_STATE_PATH });
  await api.dispose();
}
