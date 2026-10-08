import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  emptyWorkspace,
  encodeBackup,
  decodeBackup,
} from "../src/lib/workspace-codec";
import { createScenario, newProfile } from "../src/domain/sandbox";
class MemoryStorage {
  data = new Map<string, string>();
  failWrites = false;
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error("Quota");
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}
let storage: MemoryStorage;
beforeEach(() => {
  vi.resetModules();
  storage = new MemoryStorage();
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("localStorage", storage);
});
afterEach(() => vi.unstubAllGlobals());
describe("local persistence boundaries", () => {
  it("merges the same backup without duplicating items or training counts", async () => {
    const store = await import("../src/lib/store");
    store.saveScenario({ ...createScenario(), id: "scenario-1" });
    store.recordTraining(true, "coverage");
    const backup = store.exportWorkspace();
    store.restoreWorkspace(backup);
    store.restoreWorkspace(backup);
    const result = decodeBackup(store.exportWorkspace());
    expect(result.scenarios).toHaveLength(1);
    expect(result.progress.training).toEqual({
      attempts: 1,
      correct: 1,
      coverageCorrect: 1,
      conflictCorrect: 0,
    });
  });
  it("retains independently earned milestones when merging a backup", async () => {
    const store = await import("../src/lib/store");
    store.markLesson("smash", { quiz: true });
    const imported = emptyWorkspace();
    imported.progress.lessons.smash = {
      completed: true,
      quiz: false,
      recognition: false,
      understanding: false,
      interaction: false,
      qbReads: false,
    };
    store.restoreWorkspace(encodeBackup(imported));
    const progress = decodeBackup(store.exportWorkspace()).progress.lessons
      .smash;
    expect(progress.quiz).toBe(true);
    expect(progress.completed).toBe(true);
  });
  it("keeps quota-limited changes available for export without claiming durable storage", async () => {
    const store = await import("../src/lib/store");
    storage.failWrites = true;
    store.saveScenario({ ...createScenario(), id: "memory-scenario" });
    expect(decodeBackup(store.exportWorkspace()).scenarios[0].id).toBe(
      "memory-scenario",
    );
    expect(storage.getItem("fieldwork:v2")).toBeNull();
  });
  it("does not overwrite corrupted stored data during ordinary edits", async () => {
    const original = "{broken";
    storage.setItem("fieldwork:v2", original);
    const store = await import("../src/lib/store");
    store.markLesson("smash", { completed: true });
    expect(storage.getItem("fieldwork:v2")).toBe(original);
    expect(
      decodeBackup(store.exportWorkspace()).progress.lessons.smash.completed,
    ).toBe(true);
    store.restoreWorkspace(encodeBackup(emptyWorkspace()), "replace");
    expect(() => decodeBackup(storage.getItem("fieldwork:v2")!)).not.toThrow();
  });
  it("blocks deletion of profiles referenced by a saved scenario", async () => {
    const store = await import("../src/lib/store");
    store.saveProfile(newProfile("low", "opponent-1"));
    store.saveScenario({
      ...createScenario(),
      id: "scenario-1",
      profileId: "opponent-1",
    });
    expect(() => store.deleteProfile("opponent-1")).toThrow(
      "used by a saved scenario",
    );
    store.deleteScenario("scenario-1");
    expect(() => store.deleteProfile("opponent-1")).not.toThrow();
  });
  it("rejects invalid imports without changing the current workspace", async () => {
    const store = await import("../src/lib/store");
    store.saveScenario({ ...createScenario(), id: "scenario-1" });
    const before = store.exportWorkspace();
    expect(() => store.restoreWorkspace("{not json")).toThrow();
    expect(store.exportWorkspace()).toBe(before);
  });
});
