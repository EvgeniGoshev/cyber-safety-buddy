const suspiciousWords = [
  "login", "verify", "update", "secure", "security", "account", "wallet",
  "free", "prize", "winner", "gift", "claim", "urgent", "bonus", "download",
  "invoice", "payment", "reset", "confirm", "unlock", "limited", "suspended"
];

const shorteners = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
  "cutt.ly", "rebrand.ly", "shorturl.at"
];

const suspiciousTlds = [
  "ru", "cn", "tk", "top", "xyz", "zip", "mov", "click", "work", "rest"
];

const protectedBrands = [
  "paypal", "netflix", "microsoft", "google", "github", "amazon", "apple",
  "facebook", "instagram", "bank", "steam", "discord"
];

const dangerousExtensions = [
  ".exe", ".scr", ".bat", ".cmd", ".msi", ".vbs", ".js", ".jse", ".ps1",
  ".jar", ".apk", ".app", ".dmg", ".iso", ".reg"
];

const riskyDownloadExtensions = [
  ".zip", ".rar", ".7z", ".docm", ".xlsm", ".pptm", ".pdf"
];

const redirectParams = [
  "redirect", "redirect_uri", "return", "returnurl", "next", "url", "target",
  "continue", "dest", "destination"
];

function normalizeUrl(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "";
  if (/^(https?:|data:|javascript:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isIpAddress(hostname) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":");
}

function looksLikeBrandTrap(hostname) {
  return protectedBrands.some((brand) => {
    if (hostname === `${brand}.com` || hostname.endsWith(`.${brand}.com`)) {
      return false;
    }

    return hostname.includes(brand);
  });
}

function getVirusTotalUrlId(url) {
  return Buffer.from(url)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getVirusTotalReport(url, apiKey) {
  if (!apiKey) {
    return null;
  }

  const urlId = getVirusTotalUrlId(url);
  const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "x-apikey": apiKey
    }
  });

  if (response.status === 404) {
    return {
      found: false
    };
  }

  if (response.status === 429) {
    return {
      rateLimited: true
    };
  }

  if (!response.ok) {
    return {
      error: true,
      status: response.status
    };
  }

  const data = await response.json();
  const stats = data && data.data && data.data.attributes
    ? data.data.attributes.last_analysis_stats || {}
    : {};

  return {
    found: true,
    malicious: Number(stats.malicious || 0),
    suspicious: Number(stats.suspicious || 0),
    harmless: Number(stats.harmless || 0),
    undetected: Number(stats.undetected || 0)
  };
}

module.exports = async function (context, req) {
  const rawUrl = req.body && req.body.url;
  const virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY;
  const normalized = normalizeUrl(rawUrl);
  const flags = [];
  let score = 0;
  let parsed;

  try {
    parsed = new URL(normalized);
  } catch (error) {
    context.res = {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        riskLevel: "error",
        title: "Invalid link",
        message: "The link could not be read. Paste a full URL like https://example.com.",
        flags: ["The URL format is not valid."]
      }
    };
    return;
  }

  if (parsed.protocol === "javascript:" || parsed.protocol === "data:") {
    context.res = {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        riskLevel: "high",
        title: "High risk link",
        message: "This is not a normal website link. It can run code or hide data, so do not click it in messages or pop-ups.",
        flags: ["The link uses a script/data format instead of a normal https:// website."],
        hostname: "no normal domain"
      }
    };
    return;
  }

  const hostname = parsed.hostname.toLowerCase();
  const full = parsed.href.toLowerCase();
  const parts = hostname.split(".");
  const tld = parts[parts.length - 1] || "";
  const path = decodeURIComponent(parsed.pathname.toLowerCase());
  const search = parsed.search.toLowerCase();
  const filename = path.split("/").pop() || "";

  if (parsed.protocol !== "https:") {
    score += 2;
    flags.push("The link does not use HTTPS. Login or payment pages should use HTTPS.");
  }

  if (hostname.includes("@") || normalized.includes("@")) {
    score += 2;
    flags.push("The link contains @, which can hide the real destination.");
  }

  if (isIpAddress(hostname)) {
    score += 2;
    flags.push("The link uses an IP address instead of a clear domain name.");
  }

  if (hostname.startsWith("xn--") || hostname.includes(".xn--")) {
    score += 3;
    flags.push("The domain uses punycode characters. This can hide fake lookalike letters.");
  }

  if (shorteners.includes(hostname)) {
    score += 2;
    flags.push("The link uses a shortener, so the final destination is hidden.");
  }

  if (suspiciousTlds.includes(tld)) {
    score += 1;
    flags.push(`The domain ending .${tld} is often seen in suspicious links. It is not proof, but it is a warning sign.`);
  }

  if (looksLikeBrandTrap(hostname)) {
    score += 2;
    flags.push("The domain includes a known brand name but is not the official brand domain.");
  }

  if (hostname.length > 35) {
    score += 1;
    flags.push("The domain is unusually long, which can make fake domains harder to read.");
  }

  if ((hostname.match(/-/g) || []).length >= 2) {
    score += 1;
    flags.push("The domain uses many hyphens, a common trick in fake security or login pages.");
  }

  if (parts.length >= 4) {
    score += 1;
    flags.push("The link has many subdomains. Scammers use this to hide the real domain at the end.");
  }

  if (suspiciousWords.some((word) => full.includes(word))) {
    score += 1;
    flags.push("The link contains words often used in scam messages, like login, verify, secure, prize, or urgent.");
  }

  if (dangerousExtensions.some((ext) => filename.endsWith(ext))) {
    score += 4;
    flags.push("The link points to a file type that can run code or install software. Do not download it unless you fully trust the source.");
  }

  if (riskyDownloadExtensions.some((ext) => filename.endsWith(ext))) {
    score += 2;
    flags.push("The link points to a downloadable file. Attachments and downloads are common malware delivery methods.");
  }

  if (redirectParams.some((param) => parsed.searchParams.has(param))) {
    score += 2;
    flags.push("The link contains a redirect parameter. It may send you somewhere different after you click.");
  }

  if (search.includes("%2f%2f") || search.includes("http%3a") || search.includes("https%3a")) {
    score += 2;
    flags.push("The link hides another URL inside the query text. This can be used for redirect tricks.");
  }

  if (/login|signin|verify|password|payment|checkout/.test(full) && looksLikeBrandTrap(hostname)) {
    score += 2;
    flags.push("The link looks like a login/payment page for a known brand, but the domain is not the official one.");
  }

  let virusTotal = null;

  try {
    virusTotal = await getVirusTotalReport(parsed.href, virusTotalApiKey);
  } catch (error) {
    virusTotal = {
      error: true
    };
  }

  if (!virusTotalApiKey) {
    flags.push("VirusTotal is not connected yet. Add VIRUSTOTAL_API_KEY in Azure to include live threat intelligence.");
  } else if (virusTotal && virusTotal.rateLimited) {
    flags.push("VirusTotal rate limit was reached. Try again later.");
  } else if (virusTotal && virusTotal.error) {
    flags.push("VirusTotal could not be checked right now. The local safety checks still ran.");
  } else if (virusTotal && virusTotal.found === false) {
    flags.push("VirusTotal does not have a report for this exact URL yet.");
  } else if (virusTotal && virusTotal.found) {
    if (virusTotal.malicious > 0) {
      score += 5;
      flags.push(`${virusTotal.malicious} VirusTotal security vendor${virusTotal.malicious === 1 ? "" : "s"} marked this URL as malicious.`);
    }

    if (virusTotal.suspicious > 0) {
      score += 3;
      flags.push(`${virusTotal.suspicious} VirusTotal security vendor${virusTotal.suspicious === 1 ? "" : "s"} marked this URL as suspicious.`);
    }

    if (virusTotal.malicious === 0 && virusTotal.suspicious === 0) {
      flags.push("VirusTotal did not report malicious or suspicious detections for this exact URL.");
    }
  }

  let riskLevel = "low";
  let title = "Looks lower risk";
  let message = "No major warning signs were found. Still, only enter private information on websites you trust.";

  if (score >= 5) {
    riskLevel = "high";
    title = "High risk link";
    message = "This link has multiple warning signs. Do not open it, do not download from it, and verify the real website manually.";
  } else if (score >= 2) {
    riskLevel = "medium";
    title = "Be careful";
    message = "This link has some warning signs. Check the sender, the real domain, and avoid entering private information.";
  }

  context.log(JSON.stringify({
    type: "link-check",
    hostname,
    riskLevel,
    score,
    flagCount: flags.length
  }));

  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      riskLevel,
      title,
      message,
      flags,
      hostname,
      virusTotal
    }
  };
};
