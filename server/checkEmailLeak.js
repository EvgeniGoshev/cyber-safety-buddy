const LEAKCHECK_URL = "https://leakcheck.io/api/public";

module.exports = async function (context, req) {
  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    context.res = json(400, {
      error: "Please send a valid email address."
    });
    return;
  }

  try {
    const leakResponse = await fetch(`${LEAKCHECK_URL}?check=${encodeURIComponent(email)}`);

    if (!leakResponse.ok) {
      throw new Error(`LeakCheck returned ${leakResponse.status}`);
    }

    const leakData = await leakResponse.json();
    const found = Number(leakData.found || 0);
    const sources = Array.isArray(leakData.sources) ? leakData.sources : [];
    const riskLevel = getRiskLevel(found);
    context.res = json(200, {
      success: true,
      found,
      riskLevel,
      sources,
      stored: false,
      privacy: "The email is sent to LeakCheck for lookup and is not saved by this app."
    });
  } catch (error) {
    context.log.error(error);

    context.res = json(502, {
      error: "Could not check the email right now. Try again later."
    });
  }
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getRiskLevel(found) {
  if (found === 0) return "Low";
  if (found <= 2) return "Medium";
  return "High";
}

function json(status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/json"
    },
    body
  };
}
