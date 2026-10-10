import { test, expect } from "@playwright/test";
import { getLesson } from "../../src/domain/curriculum";
test("curriculum is the home page and wrong answers have explicit error feedback", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/learn$/);
  await expect(
    page.getByRole("navigation", { name: "Workspace tools" }),
  ).not.toContainText("Overview");
  await page.goto("/lesson/mesh");
  await expect(page.locator(".lesson-reading section").first()).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await page.getByRole("tab", { name: "Knowledge check" }).click();
  const quiz = getLesson("mesh")!.quiz!;
  const wrong = (quiz.answer + 1) % quiz.options.length;
  await page.locator(".quiz-options button").nth(wrong).click();
  await expect(page.locator(".quiz-feedback.error")).toContainText("Not quite");
  await expect(page.locator(".quiz-feedback.error h3")).toHaveCSS(
    "color",
    "rgb(255, 178, 188)",
  );
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.locator(".quiz-options button").nth(quiz.answer).click();
  await expect(page.locator(".quiz-feedback.success")).toContainText(
    "Correct.",
  );
  await page.goto("/training");
  await page.locator(".training-answers button").first().click();
  await expect(page.locator(".training-feedback.error")).toContainText(
    "INCORRECT",
  );
  await expect(page.locator(".training-feedback.error .eyebrow")).toHaveCSS(
    "color",
    "rgb(255, 178, 188)",
  );
});
test("two-way players keep grouped skill ratings through lineup saves and player imports", async ({
  page,
}) => {
  await page.goto("/sandbox");
  await page
    .getByRole("button", { name: "Game & player setup", exact: true })
    .click();
  await page.getByLabel("Player name", { exact: true }).fill("Jordan");
  await page.getByLabel("Plays on", { exact: true }).selectOption("both");
  await page.getByLabel("Positions", { exact: true }).fill("WR / CB");
  await page.getByLabel("Player Catching", { exact: true }).fill("82");
  await page.getByLabel("Player Tackling", { exact: true }).fill("73");
  await page.getByLabel("Player Acceleration", { exact: true }).fill("69");
  await page.getByRole("button", { name: "Save player", exact: true }).click();
  await page
    .getByLabel("Assign profile to X", { exact: true })
    .selectOption({ label: "Jordan" });
  await page
    .getByLabel("Assign profile to CBL", { exact: true })
    .selectOption({ label: "Jordan" });
  await page.getByRole("button", { name: "Save game", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Game & player setup", exact: true })
    .click();
  await page.getByRole("button", { name: "Load game", exact: true }).click();
  await expect(page.getByLabel("Assign profile to X")).toContainText(
    "Jordan · applied",
  );
  await expect(page.getByLabel("Assign profile to CBL")).toContainText(
    "Jordan · applied",
  );
  const profiles = await page.evaluate(
    () => JSON.parse(localStorage.getItem("fieldwork:v2")!).playerProfiles,
  );
  expect(profiles[0].attributes.catching).toBe(82);
  expect(profiles[0].attributes.tackling).toBe(73);
  expect(profiles[0].ratings.acceleration).toBe(69);
  expect(profiles[0].positions).toBe("WR / CB");
  await page.getByRole("button", { name: "Delete player Jordan" }).click();
  await page
    .getByLabel("Import player data", { exact: true })
    .setInputFiles({
      name: "players.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(profiles)),
    });
  await expect(
    page.getByRole("status").filter({ hasText: "Player library imported." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Player Catching", { exact: true })).toHaveValue(
    "82",
  );
  await expect(page.getByLabel("Player Tackling", { exact: true })).toHaveValue(
    "73",
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
