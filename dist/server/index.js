export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;

    if (env.ASSETS) {
      const assetUrl = new URL(pathname, url.origin);
      const assetRequest = new Request(assetUrl, request);
      const response = await env.ASSETS.fetch(assetRequest);
      if (response.status !== 404) {
        return response;
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
