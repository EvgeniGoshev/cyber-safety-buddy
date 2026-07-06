const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  });
}, { threshold: 0.18 });

revealItems.forEach((item) => revealObserver.observe(item));

const trainingModal = document.getElementById("trainingModal");
const fakeClose = document.getElementById("fakeClose");
const trainingSubmit = document.getElementById("trainingSubmit");
const trainingWarning = document.getElementById("trainingWarning");
const xWarning = document.getElementById("xWarning");
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const trainingEmail = document.getElementById("trainingEmail");

let trainingStep = 0;

if (localStorage.getItem("trainingCompleted") === "yes") {
  trainingModal.classList.add("is-hidden");
}

fakeClose.addEventListener("click", () => {
  xWarning.classList.add("is-visible");
});

trainingSubmit.addEventListener("click", () => {
  const hasInfo = firstName.value.trim() && lastName.value.trim() && trainingEmail.value.trim();

  if (!hasInfo) {
    trainingWarning.innerHTML = `
      <strong>Careful.</strong>
      <p>This form is asking for personal data before explaining why it needs it.</p>
    `;
    trainingWarning.classList.add("is-visible");
    return;
  }

  if (trainingStep === 0) {
    trainingWarning.innerHTML = `
      <strong>Stop. This was a safety test.</strong>
      <p>It asked for personal data before proving it was trustworthy.</p>
      <p>It did not clearly explain why it needed the data.</p>
      <p>A fake X button can hide a dangerous link on real scam pages.</p>
    `;
    trainingWarning.classList.add("is-visible");
    trainingSubmit.textContent = "Continue";
    trainingStep = 1;
    return;
  }

  localStorage.setItem("trainingCompleted", "yes");
  trainingModal.classList.add("is-hidden");
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
