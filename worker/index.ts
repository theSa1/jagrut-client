/**
 * Cloudflare Worker - API Proxy
 * Proxies API requests to jagrutawaazapi.classx.co.in
 * Frontend is served separately via Cloudflare Pages
 */

export interface Env {
  // Add environment variables here if needed
  // Example: MY_VAR: string;
}

const TARGET_API = "https://jagrutawaazapi.classx.co.in";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

    if (url.pathname.startsWith("/stream/")) {
      const encoded = url.pathname.replace("/stream/", "");
      const originUrl = atob(encoded);

      const originResponse = await fetch(originUrl, {
        method: request.method,
        headers: {
          ...request.headers,
          Referer: "https://streamos.teachx.in/",
        },
      });

      const contentType = originResponse.headers.get("content-type") || "";

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
          },
        });
      }

      return new Response(originResponse.body, {
        status: originResponse.status,
        headers: originResponse.headers,
      });
    } else if (url.pathname.startsWith("/download/")) {
      const decoded = url.pathname.replace("/download/", "");
      const originUrl = atob(decoded);

      const originResponse = await fetch(originUrl, {
        method: request.method,
        headers: {
          ...request.headers,
          Referer: "https://streamos.teachx.in/",
        },
      });

      return new Response(originResponse.body, {
        status: originResponse.status,
        headers: originResponse.headers,
      });
    }

    // Proxy API requests
    const targetUrl = `${TARGET_API}${url.pathname}${url.search}`;

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.blob()
          : null,
    });

    try {
      // Forward the request to the target API
      const response = await fetch(proxyRequest);

      // Create a new response with CORS headers
      const proxyResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Add CORS headers to the response
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
  },
};
