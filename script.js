const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  });
}, { threshold: 0.18 });

revealItems.forEach((item) => revealObserver.observe(item));

const appPages = document.querySelectorAll(".app-page");
const pageLinks = document.querySelectorAll("[data-page-link]");
const pageNames = ["home", "tools", "email-leak", "link-checker", "safety-game"];
const toolSelect = document.getElementById("toolSelect");
const toolPanels = document.querySelectorAll("[data-tool-panel]");
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

const TRACK_EVENT_API_URL = "/api/trackEvent";

function canUseBackend() {
  return window.location.protocol === "http:" || window.location.protocol === "https:";
}

function getSessionId() {
  const key = "cyberSafetySessionId";
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

const anonymousSessionId = getSessionId();

function getVisitorId() {
  const key = "cyberSafetyVisitorId";
  let visitorId = localStorage.getItem(key);

  if (!visitorId) {
    visitorId = `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, visitorId);
  }

  return visitorId;
}

const anonymousVisitorId = getVisitorId();
let currentPageName = null;
let currentPageStartedAt = Date.now();
let trainingLessonTracked = false;

function getReferrerHost() {
  try {
    return document.referrer ? new URL(document.referrer).host : "";
  } catch (error) {
    return "";
  }
}

function trackEvent(eventName, details = {}) {
  if (!canUseBackend()) {
    return;
  }

  const payload = {
    eventName,
    page: pageFromHash(),
    sessionId: anonymousSessionId,
    visitorId: anonymousVisitorId,
    details,
    browser: {
      language: navigator.language || "unknown",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      referrerHost: getReferrerHost()
    },
    timestamp: new Date().toISOString()
  };

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(TRACK_EVENT_API_URL, blob);
      return;
    }

    fetch(TRACK_EVENT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body,
      keepalive: true
    }).catch(() => {});
  } catch (error) {
    console.warn("Monitoring event skipped.", error);
  }
}

function openMenu() {
  sideMenu.classList.add("is-open");
  menuOverlay.classList.add("is-visible");
  trackEvent("menu_opened");
}

function closeMenu() {
  sideMenu.classList.remove("is-open");
  menuOverlay.classList.remove("is-visible");
}

function trackPageExit(reason = "navigation") {
  if (!currentPageName) {
    return;
  }

  trackEvent("page_exit", {
    page: currentPageName,
    reason,
    secondsOnPage: Math.round((Date.now() - currentPageStartedAt) / 1000)
  });
}

function showPage(pageName) {
  const safePage = pageNames.includes(pageName) ? pageName : "home";

  if (currentPageName && currentPageName !== safePage) {
    trackPageExit("navigation");
  }

  appPages.forEach((page) => {
    const isActive = page.dataset.page === safePage;
    page.classList.toggle("is-active", isActive);

    if (isActive) {
      page.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
    }
  });

  pageLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.pageLink === safePage);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
  trackEvent("page_view", { page: safePage });
  currentPageName = safePage;
  currentPageStartedAt = Date.now();
}

function pageFromHash() {
  return window.location.hash.replace("#", "") || "home";
}

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const pageName = link.dataset.pageLink;
    history.pushState(null, "", `#${pageName}`);
    showPage(pageName);
    closeMenu();
  });
});

window.addEventListener("popstate", () => {
  showPage(pageFromHash());
});

showPage(pageFromHash());

menuToggle.addEventListener("click", openMenu);
menuClose.addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", closeMenu);

function showTool(toolName) {
  toolPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.toolPanel === toolName);
  });
}

if (toolSelect) {
  toolSelect.addEventListener("change", () => {
    showTool(toolSelect.value);
    trackEvent("tool_change", { selectedTool: toolSelect.value });
  });

  showTool(toolSelect.value);
}

const trainingModal = document.getElementById("trainingModal");
const fakeClose = document.getElementById("fakeClose");
const trainingSubmit = document.getElementById("trainingSubmit");
const trainingWarning = document.getElementById("trainingWarning");
const xWarning = document.getElementById("xWarning");
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const trainingEmail = document.getElementById("trainingEmail");

let trainingStep = 0;
let xWarningStep = 0;

if (localStorage.getItem("trainingCompleted") === "yes") {
  trainingModal.classList.add("is-hidden");
}

fakeClose.addEventListener("click", () => {
  if (xWarningStep === 0) {
    xWarning.classList.add("is-visible");
    xWarningStep = 1;
    trackEvent("training_fake_x_clicked");
    return;
  }

  localStorage.setItem("trainingCompleted", "yes");
  trainingModal.classList.add("is-hidden");
  trackEvent("training_modal_closed_with_x");
});

function showTrainingLesson() {
  if (trainingStep === 0) {
    trainingWarning.innerHTML = `
      <strong>Stop. This was a safety test.</strong>
      <p>You started typing private information into a form before checking if the page was trustworthy.</p>
      <p>It asked for personal data before proving it was trustworthy.</p>
      <p>It did not clearly explain why it needed the data.</p>
      <p>A fake X button can hide a dangerous link on real scam pages.</p>
    `;
    trainingWarning.classList.add("is-visible");
    trainingSubmit.textContent = "Continue";
    trainingStep = 1;

    if (!trainingLessonTracked) {
      trainingLessonTracked = true;
      trackEvent("training_private_info_started");
    }
  }
}

function watchTrainingInput(input) {
  ["focus", "input", "keydown", "paste", "change"].forEach((eventName) => {
    input.addEventListener(eventName, showTrainingLesson, { once: true });
  });
}

[firstName, lastName, trainingEmail].forEach(watchTrainingInput);

setTimeout(() => {
  const hasTypedData = [firstName, lastName, trainingEmail].some((input) => input.value.trim());

  if (hasTypedData) {
    showTrainingLesson();
  }
}, 300);

trainingSubmit.addEventListener("click", () => {
  if (trainingStep === 0) {
    showTrainingLesson();
    return;
  }

  localStorage.setItem("trainingCompleted", "yes");
  trainingModal.classList.add("is-hidden");
  trackEvent("training_modal_completed");
});

const passwordInput = document.getElementById("passwordInput");
const showPassword = document.getElementById("showPassword");
const passwordMessage = document.getElementById("passwordMessage");
const passwordReason = document.getElementById("passwordReason");
const strengthFill = document.getElementById("strengthFill");

const checkUpper = document.getElementById("checkUpper");
const checkNumber = document.getElementById("checkNumber");
const checkSymbol = document.getElementById("checkSymbol");
const checkLeaked = document.getElementById("checkLeaked");

const monthNames = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

const yearsAfter2000 = [];

for (let year = 2000; year <= 2035; year++) {
  yearsAfter2000.push(String(year));
}

const commonPasswords = [
  "password", "123456", "123456789", "qwerty", "111111", "abc123",
  "admin", "letmein", "iloveyou", "welcome", "monkey", "dragon",
  ...monthNames,
  ...yearsAfter2000
];

const badSequences = [
  "123", "321", "1234", "4321", "12345", "54321",
  "45", "54", "987", "789", "987654321"
];

showPassword.addEventListener("change", () => {
  passwordInput.type = showPassword.checked ? "text" : "password";
});

passwordInput.addEventListener("input", checkPassword);

function setCheck(element, ok) {
  element.classList.toggle("ok", ok);
}

function checkPassword() {
  const value = passwordInput.value;
  const lower = value.toLowerCase();

  if (!value) {
    passwordMessage.textContent = "Start typing to check it.";
    passwordReason.textContent = "";
    strengthFill.style.width = "0";
    setCheck(checkUpper, false);
    setCheck(checkNumber, false);
    setCheck(checkSymbol, false);
    setCheck(checkLeaked, false);
    return;
  }

  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const isLong = value.length >= 12;
  const hasRepeatedLetters = /([a-zA-Z])\1/.test(value);
  const hasSequence = badSequences.some((part) => lower.includes(part));
  const hasCommon = commonPasswords.some((part) => lower.includes(part));
  const startsWithA = lower.startsWith("a");
  const leakedOk = !hasCommon && !hasSequence && !hasRepeatedLetters && !startsWithA;

  setCheck(checkUpper, hasUpper);
  setCheck(checkNumber, hasNumber);
  setCheck(checkSymbol, hasSymbol);
  setCheck(checkLeaked, leakedOk);

  let score = 0;
  if (isLong) score++;
  if (hasUpper) score++;
  if (hasNumber) score++;
  if (hasSymbol) score++;
  if (leakedOk) score++;

  let reason = [];

  if (!isLong) reason.push("Use at least 12 characters.");
  if (!hasUpper) reason.push("Add an uppercase letter.");
  if (!hasNumber) reason.push("Add a number.");
  if (!hasSymbol) reason.push("Add a special symbol.");
  if (hasCommon) reason.push("Avoid common passwords, months, and years after 2000.");
  if (hasSequence) reason.push("Avoid number sequences like 123, 321, 45, or 54.");
  if (hasRepeatedLetters) reason.push("Avoid repeated letters like aa or bb.");
  if (startsWithA) reason.push("Do not start with a predictable first letter like a.");

  if (score <= 2) {
    passwordMessage.textContent = "Weak try harder";
    passwordMessage.style.color = "var(--bad)";
    strengthFill.style.width = "32%";
    strengthFill.style.background = "var(--bad)";
  } else if (score <= 4) {
    passwordMessage.textContent = "Okey but can be better";
    passwordMessage.style.color = "var(--warn)";
    strengthFill.style.width = "68%";
    strengthFill.style.background = "var(--warn)";
  } else {
    passwordMessage.textContent = "Strong like a rock";
    passwordMessage.style.color = "var(--good)";
    strengthFill.style.width = "100%";
    strengthFill.style.background = "var(--good)";
  }

  passwordReason.textContent = reason.join(" ");
}

const linkTrapBuddy = document.getElementById("linkTrapBuddy");
const trapLink = document.getElementById("trapLink");
const buddyText = document.getElementById("buddyText");

const buddyObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      linkTrapBuddy.classList.add("is-visible");
    }
  });
}, { threshold: 0.35 });

buddyObserver.observe(document.getElementById("tips"));

trapLink.addEventListener("click", () => {
  trackEvent("suspicious_link_trap_clicked");
  linkTrapBuddy.classList.add("is-angry");
  trapLink.style.display = "none";
  buddyText.textContent = "No! That was a suspicious link. Do not click random prize links, strange domains, or urgent messages.";

  setTimeout(() => {
    buddyText.textContent = "Good lesson. Always check the link before clicking.";
  }, 3500);

  setTimeout(() => {
    linkTrapBuddy.classList.add("is-leaving");
  }, 6500);

  setTimeout(() => {
    linkTrapBuddy.style.display = "none";
  }, 7400);
});

const newsletterModal = document.getElementById("newsletterModal");
const newsletterEmail = document.getElementById("newsletterEmail");
const newsletterSubmit = document.getElementById("newsletterSubmit");
const newsletterClose = document.getElementById("newsletterClose");
const newsletterWarning = document.getElementById("newsletterWarning");

setTimeout(() => {
  newsletterModal.classList.add("is-visible");
}, 60000);

newsletterSubmit.addEventListener("click", () => {
  trackEvent("newsletter_test_triggered");
  newsletterWarning.innerHTML = `
    <div class="angry-buddy">
      <div class="buddy-face">
        <span></span>
        <span></span>
        <div></div>
      </div>

      <div class="angry-message">
        <strong>Stop! This was another safety test.</strong>
        <p>
          Do not type your email into every pop-up you see. Scammers can use your email
          for spam, phishing messages, fake login pages, password reset attacks, and tricks
          that look personal.
        </p>
        <p>
          Before subscribing anywhere, check who owns the site, why they need your email,
          and whether the page looks trustworthy.
        </p>
      </div>
    </div>
  `;

  newsletterEmail.value = "";
});

newsletterClose.addEventListener("click", () => {
  newsletterModal.classList.remove("is-visible");
});

const quizCard = document.getElementById("quizCard");
const emailCard = document.getElementById("emailCard");
const scamBtn = document.getElementById("scamBtn");
const safeBtn = document.getElementById("safeBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const quizFeedback = document.getElementById("quizFeedback");
const scoreText = document.getElementById("score");
const questionCount = document.getElementById("questionCount");
const quizProgressFill = document.getElementById("quizProgressFill");

const quizQuestions = [
  {
    from: "no-reply@netflix.com",
    subject: "New sign-in to your account",
    body: "A new device signed in. If this was not you, open the official Netflix app and review your account.",
    link: "https://netflix.com/account",
    answer: "Safe",
    explanation: "This uses the real Netflix domain and gives a normal account security message.",
    fromTip: "The sender uses netflix.com, which matches the real company domain.",
    subjectTip: "Security alerts can be normal, but you should still check the sender and link.",
    linkTip: "The link goes to netflix.com, the same official domain as the company. That is usually a safe sign."
  },
  {
    from: "delivery-update@fast-parcel-check.ru",
    subject: "Package waiting",
    body: "Your package cannot be delivered. Pay a small fee now to release it.",
    link: "http://fast-parcel-check.ru/pay",
    answer: "Scam",
    explanation: "It asks for payment through a strange delivery domain and uses pressure.",
    fromTip: "The sender domain is not a known delivery company.",
    subjectTip: "The subject creates pressure about a package.",
    linkTip: "The link uses a strange domain and http instead of https."
  },
  {
    from: "support@github.com",
    subject: "Your recovery codes were viewed",
    body: "If this was you, no action is needed. If not, visit GitHub directly and review your security settings.",
    link: "https://github.com/settings/security",
    answer: "Safe",
    explanation: "The sender and link use the real GitHub domain.",
    fromTip: "The sender domain matches github.com.",
    subjectTip: "The subject is serious, but not asking you to panic or pay.",
    linkTip: "The link goes to github.com, the official domain."
  },
  {
    from: "billing@paypa1-security.net",
    subject: "Action required: account limited",
    body: "Your account will be permanently disabled. Confirm your information now.",
    link: "http://paypa1-security.net/login",
    answer: "Scam",
    explanation: "The domain uses paypa1 with the number 1 and tries to scare you.",
    fromTip: "The domain is not paypal.com. It uses a lookalike trick.",
    subjectTip: "The subject uses fear and urgency.",
    linkTip: "The link is not the official PayPal domain."
  },
  {
    from: "news@bbc.com",
    subject: "Your daily news update",
    body: "Here are the top stories selected for your region today.",
    link: "https://bbc.com/news",
    answer: "Safe",
    explanation: "The sender and link match the real BBC domain.",
    fromTip: "The sender uses bbc.com, matching the official website.",
    subjectTip: "The subject is normal and does not pressure you.",
    linkTip: "The link uses the official bbc.com domain."
  },
  {
    from: "security@bank-login-now.info",
    subject: "Your bank account will close today",
    body: "Verify your login immediately or your money will be blocked.",
    link: "http://bank-login-now.info/verify",
    answer: "Scam",
    explanation: "A real bank would not use a random domain or threaten you like this.",
    fromTip: "The sender does not show a real bank domain.",
    subjectTip: "The subject creates panic to make you act quickly.",
    linkTip: "The link is a random domain, not a real bank site."
  },
  {
    from: "orders@ikea.com",
    subject: "Your order receipt",
    body: "Thank you for your order. You can review your order details in your account.",
    link: "https://ikea.com/orders",
    answer: "Safe",
    explanation: "The sender and link use the official IKEA domain.",
    fromTip: "The sender domain matches ikea.com.",
    subjectTip: "The subject is normal for a receipt.",
    linkTip: "The link uses ikea.com, the same official domain."
  },
  {
    from: "prize@winner-gift-card.ru",
    subject: "You won a free phone",
    body: "Click now and enter your details before the offer expires.",
    link: "http://winner-gift-card.ru/claim",
    answer: "Scam",
    explanation: "Free prize messages with strange links and urgency are classic scams.",
    fromTip: "The sender domain looks random and unrelated to a real company.",
    subjectTip: "The subject promises a prize to make you click.",
    linkTip: "The link uses a suspicious prize domain."
  }
];

let shuffledQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answered = false;

function shuffleQuestions() {
  shuffledQuestions = [...quizQuestions].sort(() => Math.random() - 0.5);
}

function flag(text, tip) {
  return `
    <span class="phish-highlight">
      ${text}
      <span class="phish-flag" data-tip="${tip}">!</span>
    </span>
  `;
}

function showQuestion() {
  const question = shuffledQuestions[currentQuestionIndex];

  answered = false;
  quizCard.classList.remove("show-flags");
  scamBtn.classList.remove("is-selected", "is-dimmed");
  safeBtn.classList.remove("is-selected", "is-dimmed");
  nextBtn.classList.remove("is-visible");
  restartBtn.classList.remove("is-visible");

  questionCount.textContent = `Question ${currentQuestionIndex + 1} of ${shuffledQuestions.length}`;
  quizProgressFill.style.width = `${(currentQuestionIndex / shuffledQuestions.length) * 100}%`;

  emailCard.innerHTML = `
    <div class="email-window">
      <div class="email-title">
        <span>New Email</span>
        <span>Inbox</span>
      </div>

      <div class="email-row">
        <strong>From:</strong>
        <span>${flag(question.from, question.fromTip)}</span>
      </div>

      <div class="email-row">
        <strong>Subject:</strong>
        <span>${flag(question.subject, question.subjectTip)}</span>
      </div>

      <div class="email-body">
        <p>${question.body}</p>
        <p class="email-link">${flag(question.link, question.linkTip)}</p>
      </div>
    </div>
  `;

  quizFeedback.textContent = "Choose Scam or Safe.";
  quizFeedback.className = "quiz-feedback";
}

function checkAnswer(choice) {
  if (answered) return;

  answered = true;
  quizCard.classList.add("show-flags");

  const question = shuffledQuestions[currentQuestionIndex];
  const correct = choice === question.answer;

  if (choice === "Scam") {
    scamBtn.classList.add("is-selected");
    safeBtn.classList.add("is-dimmed");
  } else {
    safeBtn.classList.add("is-selected");
    scamBtn.classList.add("is-dimmed");
  }

  if (correct) {
    score++;
    scoreText.textContent = score;
    quizFeedback.textContent = `Correct. ${question.explanation}`;
    quizFeedback.className = "quiz-feedback correct";
  } else {
    quizFeedback.textContent = `Wrong. ${question.explanation}`;
    quizFeedback.className = "quiz-feedback wrong";
  }

  trackEvent("quiz_answer", {
    choice,
    correct,
    answer: question.answer,
    questionNumber: currentQuestionIndex + 1
  });

  if (currentQuestionIndex === shuffledQuestions.length - 1) {
    finishQuiz();
  } else {
    nextBtn.classList.add("is-visible");
  }
}

function finishQuiz() {
  quizProgressFill.style.width = "100%";

  if (score === shuffledQuestions.length) {
    quizFeedback.innerHTML = `
      <span class="final-success">Perfect score: ${score}/8. Great job! You spotted every message correctly.</span>
    `;
  } else {
    quizFeedback.textContent = `Finished. Your score is ${score}/8. Try again and look closely at the sender, subject, and link flags.`;
  }

  restartBtn.classList.add("is-visible");
}

function restartQuiz() {
  score = 0;
  currentQuestionIndex = 0;
  scoreText.textContent = "0";
  shuffleQuestions();
  showQuestion();
}

scamBtn.addEventListener("click", () => checkAnswer("Scam"));
safeBtn.addEventListener("click", () => checkAnswer("Safe"));

nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  showQuestion();
});

restartBtn.addEventListener("click", restartQuiz);

shuffleQuestions();
showQuestion();

const leakEmailInput = document.getElementById("leakEmailInput");
const leakCheckBtn = document.getElementById("leakCheckBtn");
const leakResult = document.getElementById("leakResult");

const EMAIL_LEAK_API_URL = "/api/checkEmailLeak";

function setLeakResult(type, title, message, sources = []) {
  leakResult.className = `leak-result ${type}`;
  const sourceList = sources.length
    ? `<ul class="leak-sources">${sources.map((source) => `<li>${source}</li>`).join("")}</ul>`
    : "";

  leakResult.innerHTML = `
    <strong>${title}</strong>
    <span>${message}</span>
    ${sourceList}
  `;
}

function getRisk(foundCount) {
  if (foundCount === 0) {
    return {
      type: "low",
      title: "Low risk",
      message: "No public breach sources were found for this email."
    };
  }

  if (foundCount <= 2) {
    return {
      type: "medium",
      title: "Medium risk",
      message: "This email appears in a small number of public breach sources. Change reused passwords and enable two-factor login."
    };
  }

  return {
    type: "high",
    title: "High risk",
    message: "This email appears in multiple public breach sources. Change passwords, use unique passwords, and enable two-factor login."
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

leakCheckBtn.addEventListener("click", async () => {
  const email = leakEmailInput.value.trim().toLowerCase();

  if (!isValidEmail(email)) {
    setLeakResult("error", "Check the email", "Please enter a valid email address first.");
    return;
  }

  leakCheckBtn.disabled = true;
  leakCheckBtn.textContent = "Checking...";
  trackEvent("email_leak_check_started");
  setLeakResult("", "Checking safely", "Your browser is asking the backend to check this email. The frontend does not call the leak API directly.");

  try {
    const response = await fetch(EMAIL_LEAK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error("Backend is not ready yet.");
    }

    const data = await response.json();
    const foundCount = Number(data.found || 0);
    const risk = getRisk(foundCount);
    const sources = Array.isArray(data.sources)
      ? data.sources.slice(0, 5).map((source) => `${source.name || "Unknown source"}${source.date ? ` (${source.date})` : ""}`)
      : [];

    setLeakResult(risk.type, `${risk.title}: ${foundCount} source${foundCount === 1 ? "" : "s"} found`, risk.message, sources);
    trackEvent("email_leak_check_finished", {
      foundCount,
      riskLevel: risk.type
    });
  } catch (error) {
    setLeakResult(
      "error",
      "Backend not connected yet",
      "The frontend design is ready. Next we need to deploy the Azure Function backend at /api/checkEmailLeak."
    );
  } finally {
    leakCheckBtn.disabled = false;
    leakCheckBtn.textContent = "Check email";
  }
});

const linkInput = document.getElementById("linkInput");
const linkCheckBtn = document.getElementById("linkCheckBtn");
const linkResult = document.getElementById("linkResult");

const LINK_CHECK_API_URL = "/api/checkLink";

function setLinkResult(type, title, message, flags = []) {
  linkResult.className = `link-result ${type}`;
  const flagList = flags.length
    ? `<ul>${flags.map((flagItem) => `<li>${flagItem}</li>`).join("")}</ul>`
    : "";

  linkResult.innerHTML = `
    <strong>${title}</strong>
    <span>${message}</span>
    ${flagList}
  `;
}

if (linkCheckBtn) {
  linkCheckBtn.addEventListener("click", async () => {
    const url = linkInput.value.trim();

    if (!url) {
      setLinkResult("error", "Paste a link first", "Add a full link like https://example.com/login.");
      return;
    }

    linkCheckBtn.disabled = true;
    linkCheckBtn.textContent = "Checking...";
    setLinkResult("", "Checking", "The backend is inspecting the URL pattern.");
    trackEvent("link_check_started");

    try {
      const response = await fetch(LINK_CHECK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error("Link checker backend is not ready.");
      }

      const data = await response.json();
      setLinkResult(data.riskLevel, data.title, data.message, data.flags || []);
      trackEvent("link_check_finished", {
        riskLevel: data.riskLevel,
        flagCount: Array.isArray(data.flags) ? data.flags.length : 0
      });
    } catch (error) {
      setLinkResult(
        "error",
        "Backend not connected yet",
        "The design is ready. Deploy the Azure Function backend at /api/checkLink to use this tool."
      );
    } finally {
      linkCheckBtn.disabled = false;
      linkCheckBtn.textContent = "Check link";
    }
  });
}

const dinoGame = document.getElementById("dinoGame");
const dinoPlayer = document.getElementById("dinoPlayer");
const dinoScore = document.getElementById("dinoScore");
const dinoBest = document.getElementById("dinoBest");
const dinoStartBtn = document.getElementById("dinoStartBtn");
const dinoJumpBtn = document.getElementById("dinoJumpBtn");
const dinoRestartBtn = document.getElementById("dinoRestartBtn");
const gameMessage = document.getElementById("gameMessage");
const gameLesson = document.getElementById("gameLesson");
const dinoCheckpoint = document.getElementById("dinoCheckpoint");
const gameCheckpointQuiz = document.getElementById("gameCheckpointQuiz");
const checkpointFlag = document.getElementById("checkpointFlag");
const checkpointFlagLabel = document.getElementById("checkpointFlagLabel");

const obstacleTypes = [
  {
    kind: "danger",
    label: "HACKER",
    className: "hacker",
    lesson: "Hackers often use tricks, pressure, and fake pages to steal accounts. Slow down and check the source."
  },
  {
    kind: "danger",
    label: "FAKE ADMIN",
    className: "villain",
    lesson: "Fake login forms try to steal passwords. Open the real website yourself before signing in."
  },
  {
    kind: "danger",
    label: "MALWARE BOT",
    className: "bot",
    lesson: "Unexpected downloads can be dangerous. Only download files from websites you trust."
  },
  {
    kind: "danger",
    label: "PHISHING WIZARD",
    className: "wizard",
    lesson: "Phishing tricks can look official. Check the sender, the domain, and whether the message creates panic."
  },
  {
    kind: "danger",
    label: "PASSWORD THIEF",
    className: "password",
    lesson: "Password thieves love weak or reused passwords. Use long, unique passwords for important accounts."
  }
];

const pickupTypes = [
  {
    kind: "good",
    label: "2FA SHIELD",
    className: "scanner shield",
    points: 120,
    lesson: "Two-factor login is a strong safety boost because a stolen password is not enough by itself."
  },
  {
    kind: "good",
    label: "PATCH KIT",
    className: "scanner patch",
    points: 90,
    lesson: "Updates fix known security holes. Keeping apps updated makes attacks harder."
  },
  {
    kind: "good",
    label: "LINK SCANNER",
    className: "scanner link-scan",
    points: 100,
    lesson: "Checking the real domain before clicking is a smart habit."
  },
  {
    kind: "good",
    label: "PASSWORD VAULT",
    className: "scanner vault",
    points: 110,
    lesson: "A password manager helps you use strong, unique passwords without memorizing all of them."
  },
  {
    kind: "bad",
    label: "CURSED POPUP",
    className: "bad-pickup popup",
    points: -90,
    lesson: "Fake ads can lead to scam pages. Slow down and check before tapping."
  },
  {
    kind: "bad",
    label: "SPY TRACKER",
    className: "bad-pickup tracker",
    points: -70,
    lesson: "Unknown trackers and shady short links can collect information about you."
  },
  {
    kind: "bad",
    label: "DATA LEAK",
    className: "bad-pickup leak",
    points: -100,
    lesson: "A data leak means private information may already be exposed. Change passwords and enable 2FA."
  }
];

const checkpointQuestions = [
  {
    question: "You receive an email from security@netflix-support-login.com saying your Netflix account is locked. What is the biggest warning sign?",
    answers: [
      { text: "The sender domain is not netflix.com", correct: true },
      { text: "The email mentions security", correct: false },
      { text: "The message has a logo", correct: false }
    ],
    lesson: "A real logo does not prove a message is safe. The sender domain and link destination matter more."
  },
  {
    question: "A login page asks for your password and then asks for your 2FA code again after an error. What should you suspect?",
    answers: [
      { text: "It may be stealing both password and 2FA code", correct: true },
      { text: "2FA always means the page is safe", correct: false },
      { text: "Errors are proof the site is official", correct: false }
    ],
    lesson: "Attackers can build fake pages that collect 2FA codes in real time. If the page feels wrong, stop and open the official site yourself."
  },
  {
    question: "Which password has a serious weakness even though it has uppercase, numbers, and a symbol?",
    answers: [
      { text: "Aa12345!", correct: true },
      { text: "Blue!River72#Lamp", correct: false },
      { text: "Cloud!Stone91#Desk", correct: false }
    ],
    lesson: "Complexity alone is not enough. Predictable patterns like Aa12345! are still weak."
  },
  {
    question: "A coworker sends a QR code saying it is for a company login. What should you do before scanning?",
    answers: [
      { text: "Confirm through an official company channel", correct: true },
      { text: "Scan it because QR codes cannot be phishing", correct: false },
      { text: "Forward it to friends to test it", correct: false }
    ],
    lesson: "QR codes can hide dangerous links. Treat them like normal links and verify before opening."
  },
  {
    question: "You get an invoice attachment from a company you know, but you were not expecting it. What is the safest first step?",
    answers: [
      { text: "Verify with the company through a trusted contact", correct: true },
      { text: "Open it because you know the brand", correct: false },
      { text: "Disable antivirus so the file opens", correct: false }
    ],
    lesson: "Known company names can be impersonated. Unexpected attachments should be verified before opening."
  },
  {
    question: "A site uses HTTPS and has a lock icon, but the domain is paypa1-security.net. What does HTTPS prove?",
    answers: [
      { text: "Only that the connection is encrypted", correct: true },
      { text: "That the company is definitely PayPal", correct: false },
      { text: "That the site cannot steal data", correct: false }
    ],
    lesson: "HTTPS protects the connection, not your judgment. A scam site can also have HTTPS."
  },
  {
    question: "You reused one password on games, email, and shopping. One small game site gets breached. What is the main risk?",
    answers: [
      { text: "Attackers may try the same password on your important accounts", correct: true },
      { text: "Only the game account is affected", correct: false },
      { text: "Changing the username fixes it", correct: false }
    ],
    lesson: "Password reuse turns one weak site into a risk for many accounts. Use unique passwords."
  },
  {
    question: "A message says: 'Do not tell anyone, I am from IT. Send me your login code now.' What is the best response?",
    answers: [
      { text: "Refuse and report it through the official support channel", correct: true },
      { text: "Send the code because IT is trusted", correct: false },
      { text: "Ask them to promise they are real", correct: false }
    ],
    lesson: "Real support should not ask for your login codes. Codes are proof of access, so protect them."
  },
  {
    question: "A link checker says a link has no major warnings. What should you remember?",
    answers: [
      { text: "It lowers risk but does not guarantee the site is safe", correct: true },
      { text: "It proves the site is safe forever", correct: false },
      { text: "You can enter passwords without checking anything else", correct: false }
    ],
    lesson: "Security tools help, but they are not magic. Always combine tools with domain checks and common sense."
  },
  {
    question: "Which detail is most important before entering personal data into a website?",
    answers: [
      { text: "The exact domain and why the site needs the data", correct: true },
      { text: "The page has nice colors", correct: false },
      { text: "The form appears quickly", correct: false }
    ],
    lesson: "Before sharing private data, check who is asking, why they need it, and whether the domain is correct."
  }
];

const CHECKPOINT_INTERVAL = 2500;

let gameRunning = false;
let gameOver = false;
let checkpointActive = false;
let dinoY = 0;
let dinoVelocity = 0;
let scoreValue = 0;
let checkpointScore = 0;
let nextCheckpointScore = CHECKPOINT_INTERVAL;
let gameSpeed = 5;
let lastFrameTime = 0;
let nextObstacleTime = 0;
let nextPickupTime = 0;
let gameStartTime = 0;
let animationId = null;
let gameObjects = [];

function stopGameLoop() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function getBestScore() {
  return Number(localStorage.getItem("cyberDinoBest") || 0);
}

function getSavedCheckpoint() {
  return Number(localStorage.getItem("cyberDinoCheckpoint") || 0);
}

function setSavedCheckpoint(score) {
  checkpointScore = Math.max(getSavedCheckpoint(), score);
  localStorage.setItem("cyberDinoCheckpoint", String(checkpointScore));

  if (dinoCheckpoint) {
    dinoCheckpoint.textContent = checkpointScore;
  }
}

function setBestScore(score) {
  const bestScore = Math.max(getBestScore(), score);
  localStorage.setItem("cyberDinoBest", String(bestScore));
  dinoBest.textContent = bestScore;
}

function getNextCheckpoint(score) {
  return Math.floor(score / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL + CHECKPOINT_INTERVAL;
}

function setGameMessage(title, text, visible = true) {
  if (!gameMessage) {
    return;
  }

  gameMessage.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  gameMessage.classList.toggle("is-hidden", !visible);
}

function setGameLesson(text) {
  if (!gameLesson) {
    return;
  }

  gameLesson.innerHTML = `<strong>Safety lesson</strong><span>${text}</span>`;
}

function hideCheckpointQuiz() {
  checkpointActive = false;

  if (gameCheckpointQuiz) {
    gameCheckpointQuiz.classList.add("is-hidden");
    gameCheckpointQuiz.innerHTML = "";
  }
}

function clearObstacles() {
  gameObjects.forEach((gameObject) => gameObject.element.remove());
  gameObjects = [];
}

function updateCheckpointFlag() {
  if (!checkpointFlag || !dinoGame) {
    return;
  }

  const intervalStart = nextCheckpointScore - CHECKPOINT_INTERVAL;
  const progress = Math.min(1, Math.max(0, (scoreValue - intervalStart) / CHECKPOINT_INTERVAL));
  const startX = dinoGame.clientWidth + 160;
  const targetX = dinoGame.clientWidth < 620 ? 150 : 210;
  const currentX = startX - (startX - targetX) * progress;

  checkpointFlag.style.left = `${currentX}px`;
  checkpointFlag.classList.toggle("is-close", progress > 0.78);

  if (checkpointFlagLabel) {
    checkpointFlagLabel.textContent = String(nextCheckpointScore);
  }
}

function spawnObstacle() {
  const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  const obstacleElement = document.createElement("div");
  const startX = dinoGame.clientWidth + 520;
  obstacleElement.className = `game-object scam-obstacle ${obstacleType.className}`;
  obstacleElement.textContent = obstacleType.label;
  obstacleElement.style.left = `${startX}px`;
  obstacleElement.style.transform = "none";
  dinoGame.appendChild(obstacleElement);

  gameObjects.push({
    element: obstacleElement,
    kind: obstacleType.kind,
    x: startX,
    collected: false,
    lesson: obstacleType.lesson
  });
}

function spawnPickup() {
  const pickupType = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
  const pickupElement = document.createElement("div");
  const startX = dinoGame.clientWidth + 360;
  pickupElement.className = `game-object pickup-item ${pickupType.className}`;
  pickupElement.textContent = pickupType.label;
  pickupElement.style.left = `${startX}px`;
  pickupElement.style.transform = "none";
  dinoGame.appendChild(pickupElement);

  gameObjects.push({
    element: pickupElement,
    kind: pickupType.kind,
    points: pickupType.points,
    x: startX,
    collected: false,
    lesson: pickupType.lesson
  });
}

function updateDinoPosition(delta) {
  const seconds = delta / 1000;
  dinoVelocity -= 2350 * seconds;
  dinoY += dinoVelocity * seconds;

  if (dinoY < 0) {
    dinoY = 0;
    dinoVelocity = 0;
  }

  dinoPlayer.classList.toggle("is-jumping", dinoY > 0);
  dinoPlayer.style.transform = `translateY(${-dinoY}px)`;
}

function jumpDino() {
  if (!dinoGame) {
    return;
  }

  if (checkpointActive) {
    return;
  }

  if (!gameRunning) {
    startGame();
    return;
  }

  if (dinoY === 0 && !gameOver) {
    dinoVelocity = 780;
  }
}

function didCollide(gameObject) {
  if (performance.now() - gameStartTime < 3000 && gameObject.kind === "danger") {
    return false;
  }

  const dinoRect = dinoPlayer.getBoundingClientRect();
  const obstacleRect = gameObject.element.getBoundingClientRect();
  const dinoBox = {
    left: dinoRect.left + 55,
    right: dinoRect.right - 28,
    top: dinoRect.top + 32,
    bottom: dinoRect.bottom - 16
  };
  const objectPadding = gameObject.kind === "danger" ? 28 : 10;
  const objectBox = {
    left: obstacleRect.left + objectPadding,
    right: obstacleRect.right - objectPadding,
    top: obstacleRect.top + objectPadding,
    bottom: obstacleRect.bottom - objectPadding
  };

  return !(
    dinoBox.right < objectBox.left ||
    dinoBox.left > objectBox.right ||
    dinoBox.bottom < objectBox.top ||
    dinoBox.top > objectBox.bottom
  );
}

function endGame(lesson) {
  gameRunning = false;
  gameOver = true;
  checkpointActive = false;
  dinoGame.classList.remove("is-running");
  dinoGame.classList.add("is-hit");
  setTimeout(() => dinoGame.classList.remove("is-hit"), 380);
  if (checkpointFlag) {
    checkpointFlag.classList.add("is-hidden");
    checkpointFlag.classList.remove("is-close", "is-reached");
  }
  stopGameLoop();
  setBestScore(scoreValue);
  dinoStartBtn.disabled = false;
  setGameMessage("Scam hit!", "Press Restart or Space to try again.", true);
  setGameLesson(`${lesson} Your last saved checkpoint is ${getSavedCheckpoint()} points.`);
  trackEvent("safety_game_finished", { score: scoreValue });
}

function showScorePop(text, bad = false) {
  const pop = document.createElement("div");
  pop.className = `score-pop${bad ? " bad" : ""}`;
  pop.textContent = text;
  dinoGame.appendChild(pop);
  setTimeout(() => pop.remove(), 780);
}

function collectPickup(gameObject) {
  if (gameObject.collected) {
    return;
  }

  const label = gameObject.element.textContent;
  gameObject.collected = true;
  gameObject.element.remove();
  scoreValue = Math.max(0, scoreValue + gameObject.points);
  dinoScore.textContent = scoreValue;

  if (gameObject.kind === "good") {
    showScorePop(`+${gameObject.points}`);
    setGameLesson(gameObject.lesson);
    trackEvent("safety_game_pickup", { kind: "good", label });
    return;
  }

  showScorePop(String(gameObject.points), true);
  setGameLesson(gameObject.lesson);
  dinoGame.classList.add("is-hit");
  setTimeout(() => dinoGame.classList.remove("is-hit"), 280);
  trackEvent("safety_game_pickup", { kind: "bad", label });
}

function showCheckpointQuestion() {
  if (!gameCheckpointQuiz) {
    return;
  }

  checkpointActive = true;
  gameRunning = false;
  dinoGame.classList.remove("is-running");
  stopGameLoop();
  updateCheckpointFlag();
  if (checkpointFlag) {
    checkpointFlag.classList.add("is-reached");
  }

  const checkpointNumber = Math.floor(scoreValue / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
  const question = checkpointQuestions[Math.floor(Math.random() * checkpointQuestions.length)];
  const shuffledAnswers = [...question.answers].sort(() => Math.random() - 0.5);

  gameCheckpointQuiz.innerHTML = `
    <div class="checkpoint-card">
      <strong>Checkpoint ${checkpointNumber}</strong>
      <h3>Answer to save progress</h3>
      <p>${question.question}</p>
      <div class="checkpoint-answers">
        ${shuffledAnswers
          .map((answer, index) => `<button type="button" data-correct="${answer.correct}" data-answer-index="${index}">${answer.text}</button>`)
          .join("")}
      </div>
    </div>
  `;
  gameCheckpointQuiz.classList.remove("is-hidden");

  gameCheckpointQuiz.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const correct = button.dataset.correct === "true";

      if (!correct) {
        hideCheckpointQuiz();
        endGame(`Wrong checkpoint answer. ${question.lesson}`);
        trackEvent("safety_game_checkpoint_failed", { score: scoreValue });
        return;
      }

      setSavedCheckpoint(checkpointNumber);
      nextCheckpointScore = checkpointNumber + CHECKPOINT_INTERVAL;
      hideCheckpointQuiz();
      clearObstacles();
      if (checkpointFlag) {
        checkpointFlag.classList.remove("is-reached", "is-close", "is-hidden");
      }
      updateCheckpointFlag();
      setGameLesson(`Checkpoint saved at ${checkpointNumber}. ${question.lesson}`);
      showScorePop("SAVED");
      gameOver = false;
      gameRunning = true;
      dinoGame.classList.add("is-running");
      dinoStartBtn.disabled = true;
      lastFrameTime = performance.now();
      gameStartTime = lastFrameTime;
      nextObstacleTime = 3600;
      nextPickupTime = 900;
      trackEvent("safety_game_checkpoint_saved", { checkpoint: checkpointNumber });
      animationId = requestAnimationFrame(updateGame);
    });
  });
}

function updateGame(timestamp) {
  if (!gameRunning) {
    return;
  }

  const delta = Math.min(timestamp - lastFrameTime, 32) || 16;
  lastFrameTime = timestamp;

  scoreValue += Math.round(delta / 16);
  const warmup = Math.min(1, (timestamp - gameStartTime) / 2600);
  gameSpeed = Math.min(12, 5 + (scoreValue / 650) * warmup);
  dinoScore.textContent = scoreValue;
  updateDinoPosition(delta);
  updateCheckpointFlag();

  if (scoreValue >= nextCheckpointScore) {
    showCheckpointQuestion();
    return;
  }

  nextObstacleTime -= delta;
  if (nextObstacleTime <= 0) {
    spawnObstacle();
    nextObstacleTime = Math.max(1100, 1900 - scoreValue * 0.35) + Math.random() * 850;
  }

  nextPickupTime -= delta;
  if (nextPickupTime <= 0) {
    spawnPickup();
    nextPickupTime = Math.max(1500, 3000 - scoreValue * 0.22) + Math.random() * 1200;
  }

  gameObjects.forEach((gameObject) => {
    gameObject.x -= gameSpeed * (delta / 16);
    gameObject.element.style.left = `${gameObject.x}px`;

    if (didCollide(gameObject)) {
      if (gameObject.kind === "danger") {
        endGame(gameObject.lesson);
        return;
      }

      collectPickup(gameObject);
    }
  });

  gameObjects = gameObjects.filter((gameObject) => {
    if (gameObject.collected) {
      return false;
    }

    if (gameObject.x < -150) {
      gameObject.element.remove();
      return false;
    }

    return true;
  });

  if (gameRunning) {
    animationId = requestAnimationFrame(updateGame);
  }
}

function startGame() {
  if (!dinoGame || !dinoPlayer) {
    return;
  }

  stopGameLoop();
  clearObstacles();
  hideCheckpointQuiz();
  gameRunning = true;
  gameOver = false;
  dinoY = 0;
  dinoVelocity = 0;
  checkpointScore = getSavedCheckpoint();
  scoreValue = checkpointScore;
  nextCheckpointScore = getNextCheckpoint(scoreValue);
  gameSpeed = 5;
  lastFrameTime = performance.now();
  gameStartTime = lastFrameTime;
  nextObstacleTime = 4200;
  nextPickupTime = 900;
  dinoScore.textContent = String(scoreValue);
  if (dinoCheckpoint) {
    dinoCheckpoint.textContent = String(checkpointScore);
  }
  if (checkpointFlag) {
    checkpointFlag.classList.remove("is-hidden", "is-close", "is-reached");
  }
  updateCheckpointFlag();
  dinoPlayer.style.transform = "translateY(0)";
  dinoGame.classList.remove("is-hit");
  dinoGame.classList.add("is-running");
  dinoStartBtn.disabled = true;
  setGameMessage("", "", false);
  setGameLesson(
    checkpointScore > 0
      ? `Loaded your saved checkpoint at ${checkpointScore}. Reach ${nextCheckpointScore} for the next safety question.`
      : "Jump over scams, collect green boosts, and answer checkpoint questions to save your progress."
  );
  dinoGame.focus();
  trackEvent("safety_game_started");
  animationId = requestAnimationFrame(updateGame);
}

function restartGame() {
  localStorage.removeItem("cyberDinoCheckpoint");
  checkpointScore = 0;
  nextCheckpointScore = CHECKPOINT_INTERVAL;
  if (dinoCheckpoint) {
    dinoCheckpoint.textContent = "0";
  }
  dinoStartBtn.disabled = false;
  startGame();
}

if (dinoGame) {
  dinoBest.textContent = getBestScore();
  if (dinoCheckpoint) {
    dinoCheckpoint.textContent = getSavedCheckpoint();
  }
  dinoStartBtn.addEventListener("click", () => {
    if (gameRunning || checkpointActive) {
      return;
    }

    startGame();
  });
  dinoRestartBtn.addEventListener("click", restartGame);
  dinoJumpBtn.addEventListener("click", jumpDino);

  document.addEventListener("keydown", (event) => {
    if (pageFromHash() !== "safety-game") {
      return;
    }

    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      jumpDino();
    }
  });

  dinoGame.addEventListener("pointerdown", jumpDino);
}

window.addEventListener("beforeunload", () => {
  trackPageExit("window_close");
});
