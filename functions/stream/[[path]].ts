/**
 * Cloudflare Pages Function - Stream Proxy
 * Handles /stream/* routes
 */

const TARGET_API = "https://jagrutawaazapi.classx.co.in";

export async function onRequest(context: {
  request: Request;
  params: { path: string[] };
}) {
  const { request, params } = context;
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, Auth-Key, Device-Type, Client-Service, Source",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Get the encoded URL from the path
  const pathSegments = params.path || [];
  const encoded = pathSegments.join("/");

  if (!encoded) {
    return new Response("Missing encoded URL", { status: 400 });
  }

  const originUrl = atob(encoded);

  const originResponse = await fetch(originUrl, {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers),
      Referer: "https://streamos.teachx.in/",
    },
  });

  const contentType = originResponse.headers.get("content-type") || "";

  // Rewrite M3U8 playlists
  if (originUrl.endsWith(".m3u8") || contentType.includes("mpegurl")) {
    const base = new URL(originUrl);
    let playlist = await originResponse.text();
    const lines = playlist.split("\n");

    const rewritten = lines.map((line) => {
      if (!line || line.startsWith("#")) return line;
      const absolute = new URL(line, base).href;
      const encoded = btoa(absolute);
      return `/stream/${encoded}`;
    });

    return new Response(rewritten.join("\n"), {
      headers: {
        "content-type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Pass through other content
  const response = new Response(originResponse.body, {
    status: originResponse.status,
    headers: originResponse.headers,
  });

  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}
