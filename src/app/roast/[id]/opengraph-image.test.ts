import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRoastOgCacheControlHeader } from "@/server/og/roast-og-cache";
import { getRoastOgImageResponse } from "./opengraph-image";

const VALID_ID = "11111111-1111-4111-8111-111111111111";

const ROAST_FIXTURE = {
  score: 7,
  language: "typescript",
  linesCount: 87,
  roastQuote: "clean enough to ship",
};

describe("roast/[id]/opengraph-image", () => {
  it("valid id returns content-type containing image/png", async () => {
    const response = await getRoastOgImageResponse(VALID_ID, {
      fetchRoastById: async () => ROAST_FIXTURE,
      renderModel: async () =>
        new Response("png", {
          headers: {
            "content-type": "image/png",
            "cache-control": buildRoastOgCacheControlHeader(),
          },
        }),
    });

    assert.equal(
      response.headers.get("content-type")?.includes("image/png"),
      true
    );
    assert.equal(
      response.headers.get("cache-control"),
      buildRoastOgCacheControlHeader()
    );
  });

  it("invalid UUID returns fallback PNG response", async () => {
    const response = await getRoastOgImageResponse("not-a-uuid", {
      fetchRoastById: async () => {
        throw new Error("must not fetch for invalid id");
      },
      renderModel: async () =>
        new Response("png", {
          headers: {
            "content-type": "image/png",
            "cache-control": buildRoastOgCacheControlHeader(),
          },
        }),
    });

    assert.equal(
      response.headers.get("content-type")?.includes("image/png"),
      true
    );
    assert.equal(
      response.headers.get("cache-control"),
      buildRoastOgCacheControlHeader()
    );
  });

  it("missing roast returns fallback PNG response", async () => {
    const response = await getRoastOgImageResponse(VALID_ID, {
      fetchRoastById: async () => null,
      renderModel: async () =>
        new Response("png", {
          headers: {
            "content-type": "image/png",
            "cache-control": buildRoastOgCacheControlHeader(),
          },
        }),
    });

    assert.equal(
      response.headers.get("content-type")?.includes("image/png"),
      true
    );
    assert.equal(
      response.headers.get("cache-control"),
      buildRoastOgCacheControlHeader()
    );
  });

  it("renderer failure path returns fallback PNG response", async () => {
    let renderAttempts = 0;

    const response = await getRoastOgImageResponse(VALID_ID, {
      fetchRoastById: async () => ROAST_FIXTURE,
      renderModel: async () => {
        renderAttempts += 1;

        if (renderAttempts === 1) {
          throw new Error("renderer exploded");
        }

        return new Response("png", {
          headers: {
            "content-type": "image/png",
            "cache-control": buildRoastOgCacheControlHeader(),
          },
        });
      },
    });

    assert.equal(
      response.headers.get("content-type")?.includes("image/png"),
      true
    );
    assert.equal(
      response.headers.get("cache-control"),
      buildRoastOgCacheControlHeader()
    );
    assert.equal(renderAttempts, 2);
  });
});
