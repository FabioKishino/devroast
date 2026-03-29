export const ROAST_OG_CACHE_MAX_AGE_SECONDS = 60;
export const ROAST_OG_CACHE_S_MAXAGE_SECONDS = 300;
export const ROAST_OG_CACHE_STALE_WHILE_REVALIDATE_SECONDS = 600;

export function buildRoastOgCacheControlHeader(): string {
  return `public, max-age=${ROAST_OG_CACHE_MAX_AGE_SECONDS}, s-maxage=${ROAST_OG_CACHE_S_MAXAGE_SECONDS}, stale-while-revalidate=${ROAST_OG_CACHE_STALE_WHILE_REVALIDATE_SECONDS}`;
}
