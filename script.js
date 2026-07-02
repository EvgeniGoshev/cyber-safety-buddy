const passwordBox = document.getElementById("passwordBox");
const showPassword = document.getElementById("showPassword");
const passwordMessage = document.getElementById("passwordMessage");

const lengthCheck = document.getElementById("lengthCheck");
const bigLetterCheck = document.getElementById("bigLetterCheck");
const numberCheck = document.getElementById("numberCheck");
const symbolCheck = document.getElementById("symbolCheck");

const badPasswordParts = [
  "123456",
  "123456789",
  "987654321",
  "password",
  "qwerty",
  "111111",
  "abc123",
  "admin",
  "letmein"
];

showPassword.addEventListener("change", function () {
  passwordBox.type = showPassword.checked ? "text" : "password";
});

passwordBox.addEventListener("input", checkPassword);

function checkPassword() {
  const password = passwordBox.value;
  const lowerPassword = password.toLowerCase();

  const hasEnoughLength = password.length >= 12;
  const hasBigLetter = /[A-Z]/.test(password);
  const hasSmallLetter = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasRepeatedLetters = /([a-zA-Z])\1/.test(password);
  const startsWithA = lowerPassword.startsWith("a");

  const hasBadPart = badPasswordParts.some(function (badPart) {
    return lowerPassword.includes(badPart);
  });

  const simplePattern = /^[A-Z][a-z][0-9]{5}[^A-Za-z0-9]$/.test(password);
  const looksLeaked = hasBadPart || simplePattern;

  updateCheck(lengthCheck, hasEnoughLength);
  updateCheck(bigLetterCheck, hasBigLetter);
  updateCheck(numberCheck, hasNumber);
  updateCheck(symbolCheck, hasSymbol);

  let score = 0;

  if (hasEnoughLength) score += 2;
  if (password.length >= 16) score += 1;
  if (hasBigLetter) score += 1;
  if (hasSmallLetter) score += 1;
  if (hasNumber) score += 1;
  if (hasSymbol) score += 1;

  if (looksLeaked) score -= 4;
  if (hasRepeatedLetters) score -= 2;
  if (startsWithA) score -= 2;
  if (simplePattern) score -= 4;
  if (password.length < 10) score -= 3;

  if (password.length === 0) {
    passwordMessage.textContent = "Start typing to check it.";
    passwordMessage.className = "password-message";
  } else if (score <= 2) {
    passwordMessage.textContent = "Weak";
    passwordMessage.className = "password-message weak";
  } else if (score <= 5) {
    passwordMessage.textContent = "Okey";
    passwordMessage.className = "password-message okey";
  } else {
    passwordMessage.textContent = "Strong";
    passwordMessage.className = "password-message strong";
  }
}

function updateCheck(item, passed) {
  const status = item.querySelector("strong");

  if (passed) {
    item.className = "passed";
    status.textContent = "отговаря";
  } else {
    item.className = "failed";
    status.textContent = "не отговаря на изискванията";
  }
}

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
    sender: "Bank Security",
    title: "Account locked",
    body: "Your account closes today. Verify now.",
    link: "bank-login-security-now.ru",
    answer: "Scam"
  },
  {
    level: "Easy",
    sender: "School Portal",
    title: "Homework update",
    body: "New homework is available in your official school account.",
    link: "school.edu/homework",
    answer: "Safe"
  },
  {
    level: "Normal",
    sender: "Netflx Billing",
    title: "Payment failed",
    body: "Update your card to keep watching.",
    link: "netflx-payment-help.com",
    answer: "Scam"
  },
  {
    level: "Normal",
    sender: "Game Account",
    title: "New login",
    body: "Open the official app to review your recent login.",
    link: "official game app",
    answer: "Safe"
  },
  {
    level: "Hard",
    sender: "IT Support",
    title: "Fast account repair",
    body: "Send your password so we can fix your account faster.",
    link: "reply with password",
    answer: "Scam"
  },
  {
    level: "Hard",
    sender: "Delivery Tracking",
    title: "Package delayed",
    body: "Use the tracking number on the official delivery website.",
    link: "official delivery website",
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
    <div class="fake-message">
      <div class="fake-message-header">${currentQuestion.sender}</div>
      <div class="fake-message-body">
        <h4>${currentQuestion.title}</h4>
        <p>${currentQuestion.body}</p>
        <span class="fake-link">${currentQuestion.link}</span>
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
