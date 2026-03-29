import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRoastMetadata,
  ROAST_NOT_FOUND_DESCRIPTION,
  ROAST_NOT_FOUND_TITLE,
} from "./roast-og-metadata";

describe("buildRoastMetadata", () => {
  const roastId = "6d46d321-cf76-4df1-9d90-0f2c8052cc2f";
  const baseOrigin = "https://devroast.app";

  it("returns roast-aware title and description for a valid roast", () => {
    const metadata = buildRoastMetadata({
      roastId,
      baseOrigin,
      roast: {
        score: 2,
        language: "typescript",
        roastQuote: "this code uses 7 nested loops",
      },
    });

    assert.equal(metadata.title, "Roast 2/10 in typescript - DevRoast");
    assert.equal(metadata.description, "this code uses 7 nested loops");
  });

  it("returns exact fallback copy for missing roast", () => {
    const metadata = buildRoastMetadata({
      roastId,
      baseOrigin,
      roast: null,
    });

    assert.equal(metadata.title, ROAST_NOT_FOUND_TITLE);
    assert.equal(metadata.description, ROAST_NOT_FOUND_DESCRIPTION);
    assert.equal(metadata.title, "Roast not found - DevRoast");
    assert.equal(
      metadata.description,
      "This roast link is invalid or no longer available."
    );
  });

  it("builds OpenGraph image URL from provided origin and roast id", () => {
    const metadata = buildRoastMetadata({
      roastId,
      baseOrigin,
      roast: null,
    });

    assert.deepEqual(metadata.openGraph?.images, [
      "https://devroast.app/roast/6d46d321-cf76-4df1-9d90-0f2c8052cc2f/opengraph-image",
    ]);
  });

  it("keeps OpenGraph and Twitter image URLs aligned", () => {
    const metadata = buildRoastMetadata({
      roastId,
      baseOrigin,
      roast: {
        score: 7,
        language: "javascript",
        roastQuote: null,
      },
    });

    assert.deepEqual(metadata.twitter?.images, metadata.openGraph?.images);
  });

  it("falls back to default roast description for whitespace-only quote", () => {
    const metadata = buildRoastMetadata({
      roastId,
      baseOrigin,
      roast: {
        score: 8,
        language: "typescript",
        roastQuote: "   \n\t  ",
      },
    });

    assert.equal(
      metadata.description,
      "See why this typescript snippet scored 8/10 on DevRoast."
    );
  });

  it("normalizes trailing slash in baseOrigin for generated image URL", () => {
    const metadata = buildRoastMetadata({
      roastId,
      baseOrigin: "https://devroast.app/",
      roast: null,
    });

    assert.deepEqual(metadata.openGraph?.images, [
      "https://devroast.app/roast/6d46d321-cf76-4df1-9d90-0f2c8052cc2f/opengraph-image",
    ]);
  });
});
