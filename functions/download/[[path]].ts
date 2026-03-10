/**
 * Cloudflare Pages Function - Download Proxy
 * Handles /download/* routes
 */

export async function onRequest(context: {
  request: Request;
  params: { path: string[] };
}) {
  const { request, params } = context;

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
      // ...Object.fromEntries(request.headers),
      Referer: "https://streamos.teachx.in/",
    },
  });

  const response = new Response(originResponse.body, {
    status: originResponse.status,
    headers: originResponse.headers,
  });

  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}
