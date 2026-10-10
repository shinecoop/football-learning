import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function fieldPoint(page: Page, x: number, y: number) {
  const field = page.getByRole("group", {
    name: "Seven-on-seven scenario field",
    exact: true,
  });
  await field.scrollIntoViewIfNeeded();
  const screen = await field.evaluate(
    (element, point) => {
      const matrix = (element as SVGSVGElement).getScreenCTM()!;
      const value = new DOMPoint(point.x, point.y).matrixTransform(matrix);
      return { x: value.x, y: value.y };
    },
    { x, y },
  );
  await page.mouse.click(screen.x, screen.y);
}
async function openSavedScenario(page: Page, name: string) {
  await page.getByText(/^Saved scenarios \(/).click();
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
}
test("draw, undo, replay, save, and reload a route", async ({ page }) => {
  await page.goto("/sandbox");
  await page
    .getByLabel("Scenario name", { exact: true })
    .fill("Browser route case");
  await page
    .getByRole("button", { name: "Draw new route", exact: true })
    .click();
  await fieldPoint(page, 64, 51);
  await fieldPoint(page, 90, 31);
  const clickedX = await page
    .getByLabel("Waypoint 2 X", { exact: true })
    .inputValue();
  expect(Math.abs(Number(clickedX) - 90)).toBeLessThan(0.3);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("Waypoint 2 X", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.getByLabel("Waypoint 2 X", { exact: true })).toHaveValue(
    clickedX,
  );
  await page.getByRole("button", { name: "Finish route", exact: true }).click();
  await page
    .getByRole("button", { name: "Play animation", exact: true })
    .click();
  await expect
    .poll(async () =>
      Number(
        await page.getByLabel("Play timeline", { exact: true }).inputValue(),
      ),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pause play", exact: true }).click();
  await page.getByRole("button", { name: "Restart play", exact: true }).click();
  await expect(page.getByLabel("Play timeline", { exact: true })).toHaveValue(
    "0",
  );
  await page
    .getByRole("button", { name: "Save scenario", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Scenario saved");
  await page.reload();
  await openSavedScenario(page, "Browser route case");
  await expect(page.getByLabel("Waypoint 2 X", { exact: true })).toHaveValue(
    clickedX,
  );
  await expect(page.getByLabel("Scenario name", { exact: true })).toHaveValue(
    "Browser route case",
  );
});
test("defender rules, cushion, timing, and pressure deadline affect the scenario", async ({
  page,
}) => {
  await page.goto("/sandbox");
  await page.getByRole("tab", { name: "Defense", exact: true }).click();
  await page
    .getByLabel("Defender assignment", { exact: true })
    .selectOption("man");
  await page
    .getByLabel("Man responsibility", { exact: true })
    .selectOption("H");
  await page.getByLabel("Defender cushion", { exact: true }).fill("4");
  await page.getByRole("tab", { name: "Rules", exact: true }).click();
  await expect(page.getByText("Man on H", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Timing", exact: true }).click();
  await page
    .getByLabel("Quarterback release time", { exact: true })
    .fill("3.7");
  await page
    .getByLabel("Hypothetical pressure deadline", { exact: true })
    .fill("3");
  await page.getByLabel("H release delay", { exact: true }).fill(".7");
  await page
    .getByRole("button", { name: "Show release snapshot", exact: true })
    .click();
  await expect(page.locator(".replay-clock")).toContainText("3.70s");
  await expect(page.locator(".deadline-warning")).toContainText("at or after");
  await page.getByRole("button", { name: "Restart play", exact: true }).click();
  await page.getByRole("tab", { name: "Defense", exact: true }).click();
  await page
    .getByLabel("Defender assignment", { exact: true })
    .selectOption("zone");
  await page.getByLabel("Zone width", { exact: true }).fill("18");
  await expect(page.getByLabel("Zone width", { exact: true })).toHaveValue(
    "18",
  );
});
test("film profiles persist and saved scenarios retain the original rating snapshot", async ({
  page,
}) => {
  await page.goto("/profiles");
  await page
    .getByRole("button", { name: "Create opponent profile", exact: true })
    .click();
  await page
    .getByLabel("Opponent profile name", { exact: true })
    .fill("Film profile case");
  await page
    .getByLabel("Evidence confidence", { exact: true })
    .selectOption("low");
  await page
    .getByLabel("Profile coaching notes", { exact: true })
    .fill("Watch the seam carry and the first step after the route break.");
  await page
    .getByRole("button", { name: "Add observation", exact: true })
    .click();
  await page.getByLabel(/^Observation label /).fill("Seam carry");
  await page.getByLabel(/^Observation timestamp /).fill("Q2 04:12");
  await page
    .getByLabel(/^Observation URL /)
    .fill("https://example.com/permitted-film");
  await page
    .getByLabel(/^Observation notes /)
    .fill("Receiver gained inside leverage before the safety widened.");
  await page
    .getByRole("button", { name: "Save profile", exact: true })
    .last()
    .click();
  await page.reload();
  await page
    .locator(".profile-library-row")
    .filter({ hasText: "Film profile case" })
    .getByRole("button")
    .first()
    .click();
  await expect(
    page.getByLabel("Profile coaching notes", { exact: true }),
  ).toContainText("seam carry");
  await page.goto("/sandbox");
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  await page
    .getByLabel("Sandbox opponent profile", { exact: true })
    .selectOption({ label: "Film profile case" });
  await page.getByLabel("Top speed", { exact: true }).press("End");
  await expect(page.getByLabel("Top speed", { exact: true })).toHaveValue(
    "100",
  );
  await page.getByLabel("Scenario name", { exact: true }).fill("Snapshot case");
  await page
    .getByRole("button", { name: "Save scenario", exact: true })
    .click();
  await page.goto("/profiles");
  await page
    .locator(".profile-library-row")
    .filter({ hasText: "Film profile case" })
    .getByRole("button")
    .first()
    .click();
  await expect(
    page.getByRole("button", {
      name: "Delete profile Film profile case",
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByLabel("Top speed", { exact: true }).press("Home");
  await page
    .getByRole("button", { name: "Save profile", exact: true })
    .last()
    .click();
  await page.goto("/sandbox");
  await openSavedScenario(page, "Snapshot case");
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  await expect(page.getByLabel("Top speed", { exact: true })).toHaveValue(
    "100",
  );
  await expect(
    page.getByText("Using scenario assumptions", { exact: true }),
  ).toBeVisible();
});
test("backup export, invalid import, and repeated merge are safe", async ({
  page,
}) => {
  await page.goto("/sandbox");
  await page.getByLabel("Scenario name", { exact: true }).fill("Portable case");
  await page
    .getByRole("button", { name: "Save scenario", exact: true })
    .click();
  await page.goto("/workspace");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export workspace", exact: true }).click(),
  ]);
  const raw = await readFile((await download.path())!, "utf8");
  const data = JSON.parse(raw);
  expect(data.version).toBe(2);
  expect(data.scenarios).toHaveLength(1);
  await page.getByLabel("Import JSON", { exact: true }).fill("{broken");
  await page
    .getByRole("button", { name: "Validate import", exact: true })
    .click();
  await expect(page.locator(".error-message[role=alert]")).toContainText(
    "not valid JSON",
  );
  for (let i = 0; i < 2; i++) {
    await page.getByLabel("Import JSON", { exact: true }).fill(raw);
    await page
      .getByRole("button", { name: "Validate import", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Import workspace", exact: true })
      .click();
  }
  await expect(
    page
      .locator(".workspace-stats>div")
      .filter({ hasText: "Saved scenarios" })
      .locator("strong"),
  ).toHaveText("1");
  await expect(page.locator(".error-message[role=alert]")).toHaveCount(0);
});
test("designer handoff keeps routes and creates a real seven-on-seven field", async ({
  page,
}) => {
  await page.goto("/designer");
  await page.getByLabel("Play name", { exact: true }).fill("Designer handoff");
  await page.getByRole("button", { name: "go", exact: true }).click();
  await page
    .getByRole("button", { name: "Save & test in 7-on-7", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sandbox\?play=/);
  await expect(page.getByLabel("Scenario name", { exact: true })).toHaveValue(
    "Designer handoff",
  );
  const field = page.getByRole("group", {
    name: "Seven-on-seven scenario field",
    exact: true,
  });
  await expect(field.getByRole("button", { name: /, offense$/ })).toHaveCount(
    7,
  );
  await expect(field.getByRole("button", { name: /, defense$/ })).toHaveCount(
    7,
  );
});
test("v1 progress survives migration and new scenario saves", async ({
  page,
}) => {
  const old = {
    progress: {
      version: 1,
      lessons: {
        smash: {
          completed: true,
          recognition: true,
          understanding: true,
          interaction: true,
          qbReads: true,
          quiz: true,
        },
      },
      recent: ["smash"],
      training: {
        attempts: 4,
        correct: 3,
        coverageCorrect: 2,
        conflictCorrect: 1,
      },
    },
    plays: [],
  };
  await page.addInitScript((value) => {
    if (location.hostname === "localhost")
      localStorage.setItem("fieldwork:v1", JSON.stringify(value));
  }, old);
  await page.goto("/lesson/smash");
  await expect(
    page.getByRole("button", { name: "Completed · undo", exact: true }),
  ).toBeVisible();
  await page.goto("/sandbox");
  await page
    .getByRole("button", { name: "Save scenario", exact: true })
    .click();
  await page.goto("/lesson/smash");
  await expect(
    page.getByRole("button", { name: "Completed · undo", exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fieldwork:v2")!),
  );
  expect(saved.progress.training).toEqual(old.progress.training);
  expect(saved.progress.lessons.smash.completed).toBe(true);
});
test("major routes render without errors or horizontal overflow", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of [
    "/",
    "/sandbox",
    "/profiles",
    "/workspace",
    "/learn",
    "/training",
    "/glossary",
    "/simulator",
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(
      widths.document,
      `${path} should fit ${testInfo.project.name}`,
    ).toBeLessThanOrEqual(widths.viewport + 1);
  }
  expect(errors).toEqual([]);
});

test("waypoint and defender drags are undoable as one edit", async ({
  page,
}) => {
  await page.goto("/sandbox");
  const waypoint = page.getByRole("button", {
    name: "Route waypoint 1",
    exact: true,
  });
  await waypoint.scrollIntoViewIfNeeded();
  const start = await waypoint.boundingBox();
  if (!start) throw new Error("Waypoint is not rendered.");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    start.x + start.width / 2 + 25,
    start.y + start.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();
  const moved = await page
    .getByLabel("Waypoint 1 X", { exact: true })
    .inputValue();
  expect(Number(moved)).toBeGreaterThan(72);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByLabel("Waypoint 1 X", { exact: true })).toHaveValue(
    "72",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.getByLabel("Waypoint 1 X", { exact: true })).toHaveValue(
    moved,
  );
  await page.getByRole("tab", { name: "Defense", exact: true }).click();
  const defender = page.getByRole("button", {
    name: "A, DB, defense",
    exact: true,
  });
  await defender.scrollIntoViewIfNeeded();
  const box = await defender.boundingBox();
  if (!box) throw new Error("Defender is not rendered.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 25, box.y + box.height / 2, {
    steps: 6,
  });
  await page.mouse.up();
  expect(
    Number(
      await page
        .getByLabel("Defender X alignment", { exact: true })
        .inputValue(),
    ),
  ).toBeGreaterThan(72);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByLabel("Defender X alignment", { exact: true }),
  ).toHaveValue("72");
});

test("rapid concept and coverage selections retain both choices", async ({
  page,
}) => {
  await page.goto("/sandbox");
  await page
    .getByLabel("Starting concept", { exact: true })
    .selectOption("mesh");
  await page
    .getByLabel("Sandbox coverage preset", { exact: true })
    .selectOption("cover1");
  await expect(
    page.getByLabel("Starting concept", { exact: true }),
  ).toHaveValue("mesh");
  await expect(page.getByLabel("Scenario name", { exact: true })).toHaveValue(
    "Mesh exploration",
  );
  await expect(
    page.getByLabel("Sandbox coverage preset", { exact: true }),
  ).toHaveValue("cover1");
  await page
    .getByRole("button", { name: "Draw new route", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByLabel("Starting concept", { exact: true }),
  ).toHaveValue("mesh");
});
