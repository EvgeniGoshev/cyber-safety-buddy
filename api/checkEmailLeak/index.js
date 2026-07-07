const crypto = require("crypto");
const { TableClient } = require("@azure/data-tables");

const LEAKCHECK_URL = "https://leakcheck.io/api/public";
const TABLE_NAME = "EmailLeakScans";

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
    const emailHash = hashEmail(email);
    const checkedAt = new Date().toISOString();
    const stored = await saveScanSummary({
      emailHash,
      checkedAt,
      found,
      riskLevel,
      sources
    });

    context.res = json(200, {
      success: true,
      found,
      riskLevel,
      sources,
      stored,
      privacy: "Raw email was checked but not stored. Only a hash/summary should be stored."
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

function hashEmail(email) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

function getRiskLevel(found) {
  if (found === 0) return "Low";
  if (found <= 2) return "Medium";
  return "High";
}

async function saveScanSummary(scan) {
  const connectionString = process.env.SCAN_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    return false;
  }

  const tableClient = TableClient.fromConnectionString(connectionString, TABLE_NAME);

  try {
    await tableClient.createTable();
  } catch (error) {
    if (error.statusCode !== 409) {
      throw error;
    }
  }

  await tableClient.createEntity({
    partitionKey: "emailLeakScan",
    rowKey: `${Date.now()}-${scan.emailHash.slice(0, 12)}`,
    emailHash: scan.emailHash,
    checkedAt: scan.checkedAt,
    foundCount: scan.found,
    riskLevel: scan.riskLevel,
    sources: JSON.stringify(scan.sources.slice(0, 10))
  });

  return true;
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
