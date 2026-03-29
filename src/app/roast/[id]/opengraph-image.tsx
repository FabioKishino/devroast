import { ImageResponse } from "@takumi-rs/image-response";
import { buildRoastOgCacheControlHeader } from "@/server/og/roast-og-cache";
import {
  buildRoastOgModel,
  buildRoastOgNotFoundModel,
  buildRoastOgRenderErrorModel,
  type RoastOgModel,
} from "@/server/og/roast-og-view-model";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RoastOgRouteDeps = {
  fetchRoastById: (id: string) => Promise<{
    score: number;
    language: string;
    linesCount: number;
    roastQuote: string | null;
  } | null>;
  renderModel: (model: RoastOgModel) => Promise<Response>;
};

function getDefaultDeps(): RoastOgRouteDeps {
  return {
    fetchRoastById: async (id) => {
      const { caller } = await import("@/trpc/server");
      return caller.roast.byId({ id });
    },
    renderModel: async (model) => renderRoastOgImage(model),
  };
}

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function withCacheHeaders(response: Response): Response {
  response.headers.set("cache-control", buildRoastOgCacheControlHeader());
  return response;
}

async function renderRoastOgImage(model: RoastOgModel): Promise<Response> {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 48,
        backgroundColor: "#0a0a0a",
        color: "#f7f7f7",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "#9ca3af",
          fontSize: 22,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <span>devroast</span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 28,
          gap: 14,
        }}
      >
        <span
          style={{
            fontSize: 116,
            lineHeight: 1,
            fontWeight: 700,
          }}
        >
          {model.scoreText}
        </span>

        <span
          style={{
            fontSize: 34,
            lineHeight: 1.2,
            textTransform: "lowercase",
            color: "#86efac",
          }}
        >
          verdict: {model.verdictLabel}
        </span>

        <span
          style={{
            fontSize: 22,
            color: "#a1a1aa",
          }}
        >
          {model.metadataText}
        </span>
      </div>

      <div
        style={{
          marginTop: 30,
          display: "flex",
          flexDirection: "column",
          borderTop: "1px solid #262626",
          paddingTop: 26,
        }}
      >
        <span
          style={{
            fontSize: 30,
            lineHeight: 1.35,
            color: "#d4d4d8",
          }}
        >
          "{model.quoteText}"
        </span>
      </div>
    </div>,
    {
      width: size.width,
      height: size.height,
      format: "png",
      headers: {
        "content-type": "image/png",
        "cache-control": buildRoastOgCacheControlHeader(),
      },
    }
  );
}

async function renderNotFoundFallback(
  deps: RoastOgRouteDeps
): Promise<Response> {
  return withCacheHeaders(await deps.renderModel(buildRoastOgNotFoundModel()));
}

async function renderErrorFallback(deps: RoastOgRouteDeps): Promise<Response> {
  const response = await deps.renderModel(buildRoastOgRenderErrorModel());

  response.headers.set("content-type", "image/png");

  return withCacheHeaders(response);
}

export async function getRoastOgImageResponse(
  id: string,
  deps: RoastOgRouteDeps = getDefaultDeps()
): Promise<Response> {
  if (!isUuid(id)) {
    return renderNotFoundFallback(deps);
  }

  try {
    const roast = await deps.fetchRoastById(id);

    if (!roast) {
      return renderNotFoundFallback(deps);
    }

    const model = buildRoastOgModel({
      score: roast.score,
      language: roast.language,
      linesCount: roast.linesCount,
      roastQuote: roast.roastQuote,
    });

    const response = await deps.renderModel(model);

    return withCacheHeaders(response);
  } catch {
    return renderErrorFallback(deps);
  }
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return getRoastOgImageResponse(id);
}
