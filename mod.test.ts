import { assertEquals } from "jsr:@std/assert@^1.0.12/equals";
import stripRtf from "@sigma/striprtf";

Deno.test("intergation test", () => {
  const stats = { failed: 0, passed: 0 };
  const maybeTestName = Deno.args[0];
  for (const rtfFile of Deno.readDirSync("striprtf/tests/rtf")) {
    if (maybeTestName && maybeTestName !== rtfFile.name) {
      continue;
    }
    console.log("Testing file:", rtfFile.name);
    const rtfPath = `striprtf/tests/rtf/${rtfFile.name}`;
    const rtfContentBytes = Deno.readFileSync(rtfPath);
    const rtfContent = new TextDecoder("latin1").decode(rtfContentBytes);
    const strippedContent = stripRtf(rtfContent);
    let expectedContent;
    try {
      expectedContent = Deno.readTextFileSync(
        `striprtf/tests/text/${rtfFile.name.replace(/\.rtf$/, ".txt")}`,
      );
    } catch {
      continue;
    }
    try {
      assertEquals(strippedContent.trim(), expectedContent.trim());
      console.log(`%cTest passed`, "color: green");
      stats.passed++;
    } catch (e) {
      console.log(`%cTest failed`, "color: red");
      stats.failed++;
      if (maybeTestName) {
        console.log(e);
      }
    }
  }
  console.log(`Tests passed: ${stats.passed}, failed: ${stats.failed}`);
  if (stats.failed > 0) {
    throw new Error("Tests failed");
  }
});
