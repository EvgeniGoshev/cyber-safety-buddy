const passwordBox = document.getElementById("passwordBox");
const showPassword = document.getElementById("showPassword");
const passwordMessage = document.getElementById("passwordMessage");
const passwordReason = document.getElementById("passwordReason");
const strengthFill = document.getElementById("strengthFill");

const bigLetterCheck = document.getElementById("bigLetterCheck");
const numberCheck = document.getElementById("numberCheck");
const symbolCheck = document.getElementById("symbolCheck");
const leakedCheck = document.getElementById("leakedCheck");

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december"
];

const yearsAfter2000 = [];

for (let year = 2000; year <= 2035; year++) {
  yearsAfter2000.push(String(year));
}

const commonPasswords = [
  "password",
  "123456",
  "123456789",
  "qwerty",
  "111111",
  "abc123",
  "admin",
  "letmein",
  "iloveyou",
  "welcome",
  ...monthNames,
  ...yearsAfter2000
];

showPassword.addEventListener("change", function () {
  passwordBox.type = showPassword.checked ? "text" : "password";
});

passwordBox.addEventListener("input", checkPassword);

function hasSequentialNumbers(password) {
  const sequences = ["123", "321", "12345", "54321", "45", "54"];

  return sequences.some(function (sequence) {
    return password.includes(sequence);
  });
}

function checkPassword() {
  const password = passwordBox.value;
  const lowerPassword = password.toLowerCase();

  const hasBigLetter = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasRepeatedLetters = /([a-zA-Z])\1/.test(password);
  const hasSequence = hasSequentialNumbers(password);

  const isCommonPassword = commonPasswords.some(function (badPassword) {
    return lowerPassword.includes(badPassword);
  });

  updateCheck(bigLetterCheck, hasBigLetter);
  updateCheck(numberCheck, hasNumber);
  updateCheck(symbolCheck, hasSymbol);
  updateCheck(leakedCheck, !isCommonPassword);

  let score = 0;
  const reasons = [];

  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (hasBigLetter) score += 1;
  if (hasNumber) score += 1;
  if (hasSymbol) score += 1;
  if (!isCommonPassword) score += 1;

  if (password.length > 0 && password.length < 8) {
    score -= 3;
    reasons.push("It is too short.");
  }

  if (hasRepeatedLetters) {
    score -= 3;
    reasons.push("It has repeated letters like aa or bb.");
  }

  if (hasSequence) {
    score -= 3;
    reasons.push("It uses a predictable number sequence.");
  }

  if (isCommonPassword) {
    score -= 4;
    reasons.push("It contains a common or leaked-looking password.");
  }

  if (!hasBigLetter && password.length > 0) reasons.push("Add an uppercase letter.");
  if (!hasNumber && password.length > 0) reasons.push("Add a number.");
  if (!hasSymbol && password.length > 0) reasons.push("Add a special symbol.");

  if (password.length === 0) {
    passwordMessage.textContent = "Password strength: Not checked";
    passwordMessage.className = "password-message";
    passwordReason.textContent = "Start typing to see what makes the password weak or strong.";
    strengthFill.className = "strength-fill";
  } else if (score <= 2) {
    passwordMessage.textContent = "Weak try harder";
    passwordMessage.className = "password-message weak";
    passwordReason.textContent = reasons.join(" ");
    strengthFill.className = "strength-fill weak";
  } else if (score <= 5) {
    passwordMessage.textContent = "Okey but can be better";
    passwordMessage.className = "password-message okey";
    passwordReason.textContent = reasons.length ? reasons.join(" ") : "Good start, but a longer password would be safer.";
    strengthFill.className = "strength-fill okey";
  } else {
    passwordMessage.textContent = "Strong like a rock";
    passwordMessage.className = "password-message strong";
    passwordReason.textContent = "Nice. This password is longer, mixed, and avoids obvious patterns.";
    strengthFill.className = "strength-fill strong";
  }
}

function updateCheck(item, passed) {
  const status = item.querySelector("strong");

  if (passed) {
    item.className = "passed";
    status.textContent = "Passed";
  } else {
    item.className = "failed";
    status.textContent = "Missing";
  }
}

checkPassword();

const trainingModal = document.getElementById("trainingModal");
const trainingInputs = document.querySelectorAll(".training-input");
const trainingWarning = document.getElementById("trainingWarning");
const trainingEnter = document.getElementById("trainingEnter");
const trainingFakeClose = document.getElementById("trainingFakeClose");

let trainingExplained = false;

function showTrainingWarning(title, message, points) {
  const listItems = points.map(function (point) {
    return "<li>" + point + "</li>";
  }).join("");

  trainingWarning.classList.add("is-visible");
  trainingWarning.innerHTML = `
    <strong>${title}</strong>
    <span>${message}</span>
    <ul>${listItems}</ul>
  `;
}

trainingInputs.forEach(function (input) {
  input.addEventListener("input", function () {
    trainingExplained = true;
  });
});

trainingFakeClose.addEventListener("click", function () {
  showTrainingWarning(
    "Careful with close buttons.",
    "On a scam website, a fake X button can open another page, start a download, or hide a tracking link.",
    [
      "A close button is still clickable.",
      "A fake X can be used as a trap.",
      "If a page looks suspicious, close the browser tab instead."
    ]
  );
});

trainingEnter.addEventListener("click", function () {
  if (!trainingExplained) {
    showTrainingWarning(
      "Do not submit empty forms too quickly.",
      "Even a simple button can be part of a trick. Always check what a form is asking for before clicking.",
      [
        "Check who owns the page.",
        "Check why the form needs your information.",
        "Do not continue if the request feels unnecessary."
      ]
    );

    trainingExplained = true;
    trainingEnter.textContent = "Continue to the site";
    return;
  }

  showTrainingWarning(
    "Stop. This was a safety test.",
    "You were about to submit personal information before checking if the page was trustworthy. This demo does not save anything, but a real scam page could.",
    [
      "It asked for personal data before proving it was trustworthy.",
      "It did not clearly explain why it needed the data.",
      "Real scam pages can collect information as soon as you submit it."
    ]
  );

  trainingEnter.textContent = "Continue to the site";

  if (trainingEnter.dataset.ready === "yes") {
    trainingModal.classList.add("is-hidden");
  }

  trainingEnter.dataset.ready = "yes";
});

const quizCard = document.getElementById("quizCard");
const questionText = document.getElementById("questionText");
const scoreText = document.getElementById("scoreText");
const quizProgressFill = document.getElementById("quizProgressFill");
const quizScene = document.getElementById("quizScene");
const feedbackText = document.getElementById("feedbackText");
const scamButton = document.getElementById("scamButton");
const safeButton = document.getElementById("safeButton");
const nextButton = document.getElementById("nextButton");

const originalQuestions = [
  {
    from: "security-alert@paypa1-support.net",
    subject: "Your account will be locked",
    body: "We detected unusual activity. Confirm your password now to keep your account open.",
    link: "http://paypa1-secure-login.example.com",
    answer: "Scam",
    explanation: "The sender uses paypa1 instead of paypal, the link is not official, and the message creates panic."
  },
  {
    from: "notifications@school.edu",
    subject: "Homework reminder",
    body: "Your homework page has been updated. Please log in through the official school website.",
    link: "https://school.edu/homework",
    answer: "Safe",
    explanation: "This uses an official school domain and does not ask for passwords or payment details."
  },
  {
    from: "billing@netflx-payment-help.com",
    subject: "Payment failed",
    body: "Your subscription will stop today. Update your card immediately to continue watching.",
    link: "http://netflx-payment-help.com/update",
    answer: "Scam",
    explanation: "Netflix is misspelled as netflx, and the message pressures you to update payment details quickly."
  },
  {
    from: "no-reply@netflix.com",
    subject: "New sign-in to your account",
    body: "A new device signed in. If this was not you, open the official Netflix app and review your account.",
    link: "https://netflix.com/account",
    answer: "Safe",
    explanation: "This uses the real Netflix domain and sends you to official account settings."
  },
  {
    from: "it-support@gmail.com",
    subject: "Urgent password check",
    body: "We need your password to repair your account faster. Reply with it before the end of the day.",
    link: "Reply to this email",
    answer: "Scam",
    explanation: "Real support teams should never ask you to send your password by email."
  },
  {
    from: "support@github.com",
    subject: "Security alert",
    body: "A personal access token was added to your account. Review this from your GitHub security settings.",
    link: "https://github.com/settings/security",
    answer: "Safe",
    explanation: "This uses the real github.com domain and sends you to security settings."
  },
  {
    from: "delivery-update@fast-parcel-check.ru",
    subject: "Package waiting",
    body: "Your package cannot be delivered. Pay a small fee now to release it.",
    link: "http://fast-parcel-check.ru/pay",
    answer: "Scam",
    explanation: "It asks for payment through a strange delivery domain and uses pressure."
  },
  {
    from: "newsletters@ikea.com",
    subject: "New home ideas",
    body: "See new ideas for organizing your room and improving your home office.",
    link: "https://ikea.com",
    answer: "Safe",
    explanation: "This is a normal newsletter from the official IKEA domain and does not ask for private information."
  }
];

let questions = shuffleQuestions(originalQuestions);
let questionNumber = 0;
let quizScore = 0;
let answered = false;
let quizFinished = false;

function shuffleQuestions(list) {
  const copy = [...list];

  for (let i = copy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const current = copy[i];

    copy[i] = copy[randomIndex];
    copy[randomIndex] = current;
  }

  return copy;
}

function showQuestion() {
  const currentQuestion = questions[questionNumber];
  const progress = (questionNumber / questions.length) * 100;

  questionText.textContent = "Question " + (questionNumber + 1) + " of " + questions.length;
  scoreText.textContent = "Score: " + quizScore;
  quizProgressFill.style.width = progress + "%";

  quizScene.innerHTML = `
    <div class="email-card">
      <div class="email-top">
        <span>New Email</span>
        <span>Inbox</span>
      </div>
      <div class="email-row">
        <strong>From:</strong>
        <span>${currentQuestion.from}</span>
      </div>
      <div class="email-row">
        <strong>Subject:</strong>
        <span>${currentQuestion.subject}</span>
      </div>
      <div class="email-body">
        <p>${currentQuestion.body}</p>
        <a href="#" onclick="return false;">${currentQuestion.link}</a>
      </div>
    </div>
  `;

  feedbackText.textContent = "Choose Scam or Safe.";
  feedbackText.className = "feedback-text";

  scamButton.disabled = false;
  safeButton.disabled = false;
  scamButton.className = "";
  safeButton.className = "";

  nextButton.classList.remove("is-visible");
  nextButton.textContent = "Next Question";
  answered = false;
  quizFinished = false;
}

function checkAnswer(choice) {
  if (answered) return;

  answered = true;

  const currentQuestion = questions[questionNumber];
  const isCorrect = choice === currentQuestion.answer;

  scamButton.disabled = true;
  safeButton.disabled = true;

  if (choice === "Scam") {
    scamButton.classList.add("is-selected");
    safeButton.classList.add("is-dimmed");
  } else {
    safeButton.classList.add("is-selected");
    scamButton.classList.add("is-dimmed");
  }

  if (isCorrect) {
    quizScore++;
    scoreText.textContent = "Score: " + quizScore;
    scoreText.classList.remove("score-pop");

    setTimeout(function () {
      scoreText.classList.add("score-pop");
    }, 10);

    feedbackText.textContent = "Correct. " + currentQuestion.explanation;
    feedbackText.className = "feedback-text correct";
    playAnimation("correct-animation");
  } else {
    feedbackText.textContent = "Wrong. " + currentQuestion.explanation;
    feedbackText.className = "feedback-text wrong";
    playAnimation("wrong-animation");
  }

  if (questionNumber === questions.length - 1) {
    finishQuiz();
  } else {
    nextButton.textContent = "Next Question";
    nextButton.classList.add("is-visible");
  }
}

function finishQuiz() {
  quizFinished = true;
  quizProgressFill.style.width = "100%";
  nextButton.textContent = "Try Again";
  nextButton.classList.add("is-visible");

  if (quizScore === questions.length) {
    feedbackText.textContent = "Perfect score: 8 of 8. Congratulations, you passed the phishing challenge.";
    feedbackText.className = "feedback-text perfect";
  } else {
    feedbackText.textContent += " Final score: " + quizScore + " of 8. Do you want to try again?";
  }
}

function playAnimation(animationName) {
  quizCard.classList.remove("correct-animation");
  quizCard.classList.remove("wrong-animation");

  setTimeout(function () {
    quizCard.classList.add(animationName);
  }, 10);
}

scamButton.addEventListener("click", function () {
  checkAnswer("Scam");
});

safeButton.addEventListener("click", function () {
  checkAnswer("Safe");
});

nextButton.addEventListener("click", function () {
  if (quizFinished) {
    questions = shuffleQuestions(originalQuestions);
    questionNumber = 0;
    quizScore = 0;
    showQuestion();
    return;
  }

  questionNumber++;
  showQuestion();
});

showQuestion();

const revealItems = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  });
}, {
  threshold: 0.15
});

revealItems.forEach(function (item) {
  observer.observe(item);
});

const linkTrapBuddy = document.getElementById("linkTrapBuddy");
const suspiciousLink = document.getElementById("suspiciousLink");
const buddyText = document.getElementById("buddyText");

let buddyHasAppeared = false;

const buddyObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting && !buddyHasAppeared) {
      buddyHasAppeared = true;
      linkTrapBuddy.classList.add("is-visible");
    }
  });
}, {
  threshold: 0.4
});

const tipsSection = document.querySelector(".tips-section");
buddyObserver.observe(tipsSection);

suspiciousLink.addEventListener("click", function () {
  linkTrapBuddy.classList.add("is-angry");
  suspiciousLink.style.display = "none";

  buddyText.textContent = "No! That was a suspicious link. Never click strange links just because they look urgent, exciting, or important. Always check the sender and the website first.";

  setTimeout(function () {
    buddyText.textContent = "Good lesson. I am leaving now, but remember: stop, think, check the link.";
  }, 3500);

  setTimeout(function () {
    linkTrapBuddy.classList.remove("is-angry");
    linkTrapBuddy.classList.add("is-leaving");
  }, 6500);

  setTimeout(function () {
    linkTrapBuddy.style.display = "none";
  }, 7400);
});

const newsletterModal = document.getElementById("newsletterModal");
const newsletterEmail = document.getElementById("newsletterEmail");
const newsletterButton = document.getElementById("newsletterButton");
const newsletterWarning = document.getElementById("newsletterWarning");
const newsletterClose = document.getElementById("newsletterClose");

setTimeout(function () {
  newsletterModal.classList.add("is-visible");
}, 120000);

newsletterButton.addEventListener("click", function () {
  newsletterEmail.value = "";
  newsletterWarning.classList.add("is-visible");
  newsletterClose.classList.add("is-visible");
  newsletterButton.textContent = "Email was not saved";
  newsletterButton.disabled = true;
});

newsletterClose.addEventListener("click", function () {
  newsletterModal.classList.remove("is-visible");
});