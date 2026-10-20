module.exports = async function (context, req) {
  let body = req.body || {};

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (error) {
      body = {};
    }
  }

  const eventName = String(body.eventName || "unknown_event").slice(0, 80);
  const page = String(body.page || "unknown_page").slice(0, 80);
  const sessionId = String(body.sessionId || "anonymous").slice(0, 120);
  const visitorId = String(body.visitorId || "anonymous").slice(0, 120);
  const timestamp = String(body.timestamp || new Date().toISOString()).slice(0, 80);
  const details = body.details && typeof body.details === "object" ? body.details : {};
  const browser = body.browser && typeof body.browser === "object" ? body.browser : {};

  const safeDetails = {};
  for (const [key, value] of Object.entries(details)) {
    const safeKey = String(key).slice(0, 50);
    const safeValue = typeof value === "string"
      ? value.slice(0, 160)
      : typeof value === "number" || typeof value === "boolean"
        ? value
        : JSON.stringify(value).slice(0, 160);
    safeDetails[safeKey] = safeValue;
  }

  const safeBrowser = {
    language: String(browser.language || "").slice(0, 40),
    viewport: String(browser.viewport || "").slice(0, 40),
    referrerHost: String(browser.referrerHost || "").slice(0, 120),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 180)
  };

  context.log(JSON.stringify({
    type: "cyber-safety-event",
    eventName,
    page,
    sessionId,
    visitorId,
    timestamp,
    serverReceivedAt: new Date().toISOString(),
    browser: safeBrowser,
    details: safeDetails
  }));

  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      ok: true
    }
  };
};
