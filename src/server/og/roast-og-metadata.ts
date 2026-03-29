import type { Metadata } from "next";

export const ROAST_NOT_FOUND_TITLE = "Roast not found - DevRoast";
export const ROAST_NOT_FOUND_DESCRIPTION =
  "This roast link is invalid or no longer available.";

type RoastMetadataRoast = {
  score: number;
  language: string;
  roastQuote: string | null;
};

type BuildRoastMetadataInput = {
  roastId: string;
  baseOrigin: string;
  roast: RoastMetadataRoast | null;
};

function buildRoastAwareTitle(roast: RoastMetadataRoast): string {
  return `Roast ${roast.score}/10 in ${roast.language} - DevRoast`;
}

function buildRoastAwareDescription(roast: RoastMetadataRoast): string {
  const quote = roast.roastQuote?.trim();

  if (quote) {
    return quote;
  }

  return `See why this ${roast.language} snippet scored ${roast.score}/10 on DevRoast.`;
}

function normalizeBaseOrigin(baseOrigin: string): string {
  return baseOrigin.replace(/\/+$/, "");
}

function buildRoastOgImageUrl(baseOrigin: string, roastId: string): string {
  return `${normalizeBaseOrigin(baseOrigin)}/roast/${roastId}/opengraph-image`;
}

export function buildRoastMetadata(input: BuildRoastMetadataInput): Metadata {
  const title = input.roast
    ? buildRoastAwareTitle(input.roast)
    : ROAST_NOT_FOUND_TITLE;
  const description = input.roast
    ? buildRoastAwareDescription(input.roast)
    : ROAST_NOT_FOUND_DESCRIPTION;
  const imageUrl = buildRoastOgImageUrl(input.baseOrigin, input.roastId);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
