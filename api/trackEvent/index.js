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
  const timestamp = String(body.timestamp || new Date().toISOString()).slice(0, 80);
  const details = body.details && typeof body.details === "object" ? body.details : {};

  const safeDetails = {};
  for (const [key, value] of Object.entries(details)) {
    const safeKey = String(key).slice(0, 50);
    const safeValue = typeof value === "string"
      ? value.slice(0, 120)
      : value;
    safeDetails[safeKey] = safeValue;
  }

  context.log(JSON.stringify({
    type: "cyber-safety-event",
    eventName,
    page,
    sessionId,
    timestamp,
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
