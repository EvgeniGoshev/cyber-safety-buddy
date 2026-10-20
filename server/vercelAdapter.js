module.exports = function createVercelHandler(azureHandler) {
  return {
    async fetch(request) {
      if (request.method !== "POST") {
        return Response.json({ error: "Use POST for this endpoint." }, {
          status: 405,
          headers: { Allow: "POST" }
        });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
      }

      const log = (...args) => console.log(...args);
      log.error = (...args) => console.error(...args);
      log.warn = (...args) => console.warn(...args);

      const context = { log, res: undefined };
      const req = {
        body,
        headers: Object.fromEntries(request.headers.entries())
      };

      await azureHandler(context, req);
      const result = context.res || {
        status: 500,
        body: { error: "The API did not return a response." }
      };

      return Response.json(result.body, {
        status: result.status || 200,
        headers: result.headers || {}
      });
    }
  };
};
