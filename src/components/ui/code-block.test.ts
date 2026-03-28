import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as codeBlockModule from "./code-block";

describe("CodeBlock", () => {
  it("does not export internal language error helper", () => {
    assert.equal("isUnsupportedLanguageError" in codeBlockModule, false);
  });

  it("renders highlighted HTML for known language", async () => {
    const element = await codeBlockModule.CodeBlock({
      code: "const value = 1;",
      lang: "typescript",
      className: "test",
    });

    const html = element.props.dangerouslySetInnerHTML.__html as string;

    assert.match(html, /style=/);
    assert.doesNotMatch(html, /const value = 1;<\/code><\/pre>/);
  });

  it("falls back to plaintext for unsupported language", async () => {
    const element = await codeBlockModule.CodeBlock({
      code: "const value = 1;",
      lang: "totally-unknown-lang",
      className: "test",
    });

    const html = element.props.dangerouslySetInnerHTML.__html as string;

    assert.match(html, /<pre/);
    assert.match(html, /const value = 1;/);
  });
});
