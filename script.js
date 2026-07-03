const passwordBox = document.getElementById("passwordBox");
const showPassword = document.getElementById("showPassword");
const passwordMessage = document.getElementById("passwordMessage");
const strengthFill = document.getElementById("strengthFill");

const bigLetterCheck = document.getElementById("bigLetterCheck");
const numberCheck = document.getElementById("numberCheck");
const symbolCheck = document.getElementById("symbolCheck");
const leakedCheck = document.getElementById("leakedCheck");

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
  "welcome"
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

  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (hasBigLetter) score += 1;
  if (hasNumber) score += 1;
  if (hasSymbol) score += 1;
  if (!isCommonPassword) score += 1;

  if (hasRepeatedLetters) score -= 3;
  if (hasSequence) score -= 3;
  if (isCommonPassword) score -= 4;
  if (password.length < 8) score -= 3;

  if (password.length === 0) {
    passwordMessage.textContent = "Password strength: Not checked";
    passwordMessage.className = "password-message";
    strengthFill.className = "strength-fill";
  } else if (score <= 2) {
    passwordMessage.textContent = "Weak try harder";
    passwordMessage.className = "password-message weak";
    strengthFill.className = "strength-fill weak";
  } else if (score <= 5) {
    passwordMessage.textContent = "Okey but can be better";
    passwordMessage.className = "password-message okey";
    strengthFill.className = "strength-fill okey";
  } else {
    passwordMessage.textContent = "Strong like a rock";
    passwordMessage.className = "password-message strong";
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
const trainingClose = document.getElementById("trainingClose");

trainingInputs.forEach(function (input) {
  input.addEventListener("input", function () {
    input.value = "";
    trainingWarning.classList.add("is-visible");
  });
});

trainingClose.addEventListener("click", function () {
  trainingModal.classList.add("is-hidden");
});

const quizCard = document.getElementById("quizCard");
const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");
const quizScene = document.getElementById("quizScene");
const feedbackText = document.getElementById("feedbackText");
const scamButton = document.getElementById("scamButton");
const safeButton = document.getElementById("safeButton");
const nextButton = document.getElementById("nextButton");

const questions = [
  {
    level: "Easy",
    from: "security-alert@paypa1-support.net",
    subject: "Your account will be locked",
    body: "We detected unusual activity. Confirm your password now to keep your account open.",
    link: "http://paypa1-secure-login.example.com",
    answer: "Scam"
  },
  {
    level: "Easy",
    from: "notifications@school.edu",
    subject: "Homework reminder",
    body: "Your homework page has been updated. Please log in through the official school website.",
    link: "https://school.edu/homework",
    answer: "Safe"
  },
  {
    level: "Normal",
    from: "billing@netflx-payment-help.com",
    subject: "Payment failed",
    body: "Your subscription will stop today. Update your card immediately to continue watching.",
    link: "http://netflx-payment-help.com/update",
    answer: "Scam"
  },
  {
    level: "Normal",
    from: "no-reply@netflix.com",
    subject: "New sign-in to your account",
    body: "A new device signed in. If this was not you, open the official Netflix app and review your account.",
    link: "https://netflix.com/account",
    answer: "Safe"
  },
  {
    level: "Hard",
    from: "it-support@gmail.com",
    subject: "Urgent password check",
    body: "We need your password to repair your account faster. Reply with it before the end of the day.",
    link: "Reply to this email",
    answer: "Scam"
  },
  {
    level: "Hard",
    from: "support@github.com",
    subject: "Security alert",
    body: "A personal access token was added to your account. Review this from your GitHub security settings.",
    link: "https://github.com/settings/security",
    answer: "Safe"
  },
  {
    level: "Normal",
    from: "delivery-update@fast-parcel-check.ru",
    subject: "Package waiting",
    body: "Your package cannot be delivered. Pay a small fee now to release it.",
    link: "http://fast-parcel-check.ru/pay",
    answer: "Scam"
  },
  {
    level: "Easy",
    from: "newsletters@ikea.com",
    subject: "New home ideas",
    body: "See new ideas for organizing your room and improving your home office.",
    link: "https://ikea.com",
    answer: "Safe"
  }
];

let questionNumber = 0;
let quizScore = 0;
let answered = false;

function showQuestion() {
  const currentQuestion = questions[questionNumber];

  levelText.textContent = "Level: " + currentQuestion.level;
  scoreText.textContent = "Score: " + quizScore;

  quizScene.innerHTML = `
    <div class="email-card">
      <div class="email-top">
        <span>New Email</span>
        <span>${currentQuestion.level}</span>
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
  nextButton.style.display = "none";
  answered = false;
}

function checkAnswer(choice) {
  if (answered) return;

  answered = true;

  const currentQuestion = questions[questionNumber];
  const isCorrect = choice === currentQuestion.answer;

  scamButton.disabled = true;
  safeButton.disabled = true;

  if (isCorrect) {
    quizScore++;
    scoreText.textContent = "Score: " + quizScore;
    scoreText.classList.remove("score-pop");

    setTimeout(function () {
      scoreText.classList.add("score-pop");
    }, 10);

    feedbackText.textContent = "Correct";
    feedbackText.className = "feedback-text correct";
    playAnimation("correct-animation");
  } else {
    feedbackText.textContent = "Wrong";
    feedbackText.className = "feedback-text wrong";
    playAnimation("wrong-animation");
  }

  nextButton.textContent = questionNumber === questions.length - 1
    ? "Restart Quiz"
    : "Next Question";

  nextButton.style.display = "block";
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
  if (questionNumber === questions.length - 1) {
    questionNumber = 0;
    quizScore = 0;
  } else {
    questionNumber++;
  }

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