import { deepEqual, equal, ok, throws } from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createBackup, validateBackup } from "../shared/card-format.js";
import { openLibrary, StaleCardError } from "./database.js";

const legacy = {
  id: "reference-atlas-legacy-note",
  type: "reference",
  title: "以前收藏的词条",
  note: "旧版笔记的内容\n保留第二行",
  recipe: "我的复用说明",
  source: "https://example.org/atlas",
  time: "01:02",
  tags: ["配色", "镜头"],
  image: "data:image/png;base64,iVBORw0KGgo=",
  updated: 1730000000000,
};

test("SQLite migration backs up original records, keeps edits and handles retry", () => {
  const directory = mkdtempSync(join(tmpdir(), "visual-library-test-"));
  let store = openLibrary(directory);
  try {
    const backup = createBackup([legacy]);
    equal(store.merge(validateBackup(backup), "indexeddb", backup).count, 1);
    deepEqual(store.read().find((card) => card.id === legacy.id), legacy);
    const archive = join(directory, "迁移备份");
    const [snapshot] = readdirSync(archive);
    deepEqual(JSON.parse(readFileSync(join(archive, snapshot), "utf8")), backup);
    equal(store.merge(validateBackup(backup), "indexeddb", backup).count, 0);

    const edited = store.save({ ...legacy, note: "新版笔记" }, legacy.updated);
    throws(() => store.save(legacy, legacy.updated), StaleCardError);
    equal(store.merge(validateBackup(backup), "import", backup).count, 0);
    equal(store.read().find((card) => card.id === legacy.id).note, edited.note);
    const installation = store.installationId;
    store.close();
    store = openLibrary(directory);
    equal(store.installationId, installation);
    ok(store.read().some((card) => card.id === legacy.id && card.image === legacy.image));

    store.remove(legacy.id, edited.updated);
    const newBrowser = createBackup([{ ...legacy, note: "另一个浏览器的旧副本" }]);
    equal(store.merge(validateBackup(newBrowser), "indexeddb", newBrowser).count, 0);
    ok(!store.read().some((card) => card.id === legacy.id));
    equal(store.merge(validateBackup(backup), "import", backup).count, 1);
    deepEqual(store.read().find((card) => card.id === legacy.id), legacy);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
