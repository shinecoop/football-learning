import { test, expect } from "@playwright/test";
test("three primary tabs, player assignments, standard reset, and saved game snapshots", async ({
  page,
}) => {
  await page.goto("/sandbox");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }).getByRole("link"),
  ).toHaveText(["Learn", "Sandbox", "Glossary"]);
  await page
    .getByRole("button", { name: "Game & player setup", exact: true })
    .click();
  await page.getByLabel("Player name", { exact: true }).fill("Avery");
  await page.getByLabel("Player Top speed", { exact: true }).fill("90");
  await page.getByRole("button", { name: "Save player", exact: true }).click();
  await page
    .getByLabel("Assign profile to X", { exact: true })
    .selectOption({ label: "Avery" });
  await expect(page.getByLabel("Assign profile to X")).toContainText(
    "Avery · applied",
  );
  await page.getByLabel("Game name", { exact: true }).fill("Friday vs North");
  await page.getByLabel("Opponent", { exact: true }).fill("North");
  await page.getByRole("button", { name: "Save game", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("fieldwork:v2")!).games[0].scenario
            .receivers.X.speed,
      ),
    )
    .toBe(90);
  await page.getByRole("button", { name: "Standard", exact: true }).click();
  await expect(page.getByLabel("Assign profile to X")).not.toContainText(
    "Avery · applied",
  );
  await page
    .getByRole("button", { name: "Save scenario", exact: true })
    .click();
  const standard = await page.evaluate(
    () => JSON.parse(localStorage.getItem("fieldwork:v2")!).scenarios[0],
  );
  expect(standard.receivers.X.speed).toBe(50);
  expect(
    Object.values(
      standard.defenders as Record<string, { ratings: Record<string, number> }>,
    ).every((d: { ratings: Record<string, number> }) =>
      Object.values(d.ratings).every((v) => v === 50),
    ),
  ).toBe(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Game & player setup", exact: true })
    .click();
  await page.getByRole("button", { name: "Load game", exact: true }).click();
  await expect(page.getByLabel("Assign profile to X")).toContainText(
    "Avery · applied",
  );
  await page.getByRole("button", { name: "Update game", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("fieldwork:v2")!).games.length,
      ),
    )
    .toBe(1);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export players", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("fieldwork-players.json");
});
test("native clip uploads persist, cameras sync, timed highlights save, and missing files relink", async ({
  page,
}) => {
  await page.goto("/lesson/smash");
  await page.getByRole("tab", { name: "Game clips", exact: true }).click();
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext("2d")!;
    const stream = canvas.captureStream(20);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise<Blob>(
      (resolve) =>
        (recorder.onstop = () =>
          resolve(new Blob(chunks, { type: "video/webm" }))),
    );
    recorder.start();
    const started = performance.now();
    await new Promise<void>((resolve) => {
      function draw() {
        context.fillStyle = "#103c23";
        context.fillRect(0, 0, 320, 180);
        context.fillStyle = "#b2efc4";
        context.fillRect((performance.now() - started) / 15, 80, 15, 15);
        if (performance.now() - started > 1800) {
          recorder.stop();
          stream.getTracks().forEach((t) => t.stop());
          resolve();
        } else requestAnimationFrame(draw);
      }
      draw();
    });
    return Array.from(new Uint8Array(await (await done).arrayBuffer()));
  });
  const clip = {
    name: "test-camera.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(bytes),
  };
  await page
    .getByLabel("Upload game clip", { exact: true })
    .setInputFiles(clip);
  await expect(page.locator("video")).toHaveCount(1);
  await expect
    .poll(() =>
      page.locator("video").evaluate((v: HTMLVideoElement) => v.readyState),
    )
    .toBeGreaterThanOrEqual(2);
  await page.getByLabel("View name", { exact: true }).fill("End zone");
  await page
    .getByLabel("Upload game clip", { exact: true })
    .setInputFiles(clip);
  await expect(page.getByLabel("Camera view")).toContainText("End zone");
  await page.getByLabel("Camera offset (seconds)", { exact: true }).fill("0.1");
  await page.locator("video").evaluate((v: HTMLVideoElement) => {
    v.currentTime = 0.3;
    v.dispatchEvent(new Event("timeupdate"));
  });
  await page
    .getByRole("button", { name: "Place timed highlight", exact: true })
    .click();
  const place = page.getByRole("button", {
    name: "Place focus highlight on video",
  });
  const bounds = await place.boundingBox();
  await place.click({
    position: { x: bounds!.width * 0.4, y: bounds!.height * 0.45 },
  });
  await expect(page.locator(".film-highlight")).toHaveText("Focus receiver");
  const views = await page
    .getByLabel("Camera view")
    .locator("option")
    .evaluateAll((elements) =>
      elements.map((e) => (e as HTMLOptionElement).value).filter(Boolean),
    );
  await page.getByLabel("Camera view").selectOption(views[0]);
  await expect
    .poll(() =>
      page.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeCloseTo(0.2, 1);
  await page.reload();
  await page.getByRole("tab", { name: "Game clips", exact: true }).click();
  await expect(page.locator("video")).toHaveCount(1);
  await page.getByLabel("Camera view").selectOption(views[1]);
  await expect
    .poll(() =>
      page.locator("video").evaluate((v: HTMLVideoElement) => v.readyState),
    )
    .toBeGreaterThanOrEqual(2);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fieldwork:v2")!),
  );
  expect(saved.films[0].cameras[1].focus).toHaveLength(1);
  expect(JSON.stringify(saved)).not.toContain("blob:");
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("fieldwork-media", 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("clips", "readwrite");
          tx.objectStore("clips").clear();
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.reload();
  await page.getByRole("tab", { name: "Game clips", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("missing");
  await page
    .getByLabel("Relink camera file", { exact: true })
    .setInputFiles(clip);
  await expect(page.locator("video")).toHaveCount(1);
});
