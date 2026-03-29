import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ROAST_OG_CACHE_MAX_AGE_SECONDS,
  ROAST_OG_CACHE_STALE_WHILE_REVALIDATE_SECONDS,
  ROAST_OG_CACHE_S_MAXAGE_SECONDS,
  buildRoastOgCacheControlHeader,
} from "./roast-og-cache";

describe("roast OG cache policy", () => {
  it("exports locked numeric cache policy values", () => {
    assert.equal(ROAST_OG_CACHE_MAX_AGE_SECONDS, 60);
    assert.equal(ROAST_OG_CACHE_S_MAXAGE_SECONDS, 300);
    assert.equal(ROAST_OG_CACHE_STALE_WHILE_REVALIDATE_SECONDS, 600);
  });

  it("builds exact cache-control header for selected directives", () => {
    assert.equal(
      buildRoastOgCacheControlHeader(),
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    );
  });
});
