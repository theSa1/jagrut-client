/**
 * Cloudflare Pages Function - API Proxy for /get/* routes
 * Proxies to jagrutawaazapi.classx.co.in
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

  // Build target URL
  const pathSegments = params.path || [];
  const targetPath = pathSegments.join("/");
  const targetUrl = `${TARGET_API}/get/${targetPath}${url.search}`;

  try {
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.blob()
          : null,
    });

    const response = await fetch(proxyRequest);

    const proxyResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    proxyResponse.headers.set("Access-Control-Allow-Origin", "*");
    proxyResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    proxyResponse.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Auth-Key, Device-Type, Client-Service, Source",
    );

    return proxyResponse;
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Proxy Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
