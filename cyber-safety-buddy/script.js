const passwordBox = document.getElementById("passwordBox");
const showPassword = document.getElementById("showPassword");
const passwordMessage = document.getElementById("passwordMessage");

const predictablePasswords = [
  "123456789",
  "987654321",
  "123456",
  "password",
  "qwerty",
  "111111"
];

showPassword.addEventListener("change", function () {
  passwordBox.type = showPassword.checked ? "text" : "password";
});

passwordBox.addEventListener("input", function () {
  const password = passwordBox.value;
  const lowerPassword = password.toLowerCase();

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const isPredictable = predictablePasswords.some(function (badPassword) {
    return lowerPassword.includes(badPassword);
  });

  if (isPredictable) score = 0;

  if (password.length === 0) {
    passwordMessage.textContent = "Start typing to check it.";
    passwordMessage.className = "password-message";
  } else if (score <= 2) {
    passwordMessage.textContent = "Weak";
    passwordMessage.className = "password-message weak";
  } else if (score <= 4) {
    passwordMessage.textContent = "Okey";
    passwordMessage.className = "password-message okey";
  } else {
    passwordMessage.textContent = "Strong";
    passwordMessage.className = "password-message strong";
  }
});

const quizCard = document.getElementById("quizCard");
const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");
const quizMessage = document.getElementById("quizMessage");
const feedbackText = document.getElementById("feedbackText");
const scamButton = document.getElementById("scamButton");
const safeButton = document.getElementById("safeButton");
const nextButton = document.getElementById("nextButton");

const questions = [
  {
    level: "Easy",
    message: "Your bank account will close today. Click this strange link now: bank-login-security-now.ru",
    answer: "Scam",
    feedback: "Correct. Urgent warning plus a strange link is suspicious."
  },
  {
    level: "Easy",
    message: "Your teacher says: Please open the school website and check your homework page.",
    answer: "Safe",
    feedback: "Correct. This does not ask for private information."
  },
  {
    level: "Normal",
    message: "Netflix: Your payment failed. Update your card here: netflx-payment-help.com",
    answer: "Scam",
    feedback: "Correct. The website name is slightly wrong."
  },
  {
    level: "Normal",
    message: "Your game account has a new login. Open the official app to review it.",
    answer: "Safe",
    feedback: "Correct. It tells you to use the official app."
  },
  {
    level: "Hard",
    message: "Hi, this is IT support. Please send your password so we can fix your account faster.",
    answer: "Scam",
    feedback: "Correct. Real support should never ask for your password."
  },
  {
    level: "Hard",
    message: "Your package is delayed. Track it using the official delivery company website.",
    answer: "Safe",
    feedback: "Correct. It avoids a random link."
  }
];

let questionNumber = 0;
let quizScore = 0;
let answered = false;

function showQuestion() {
  const currentQuestion = questions[questionNumber];

  levelText.textContent = "Level: " + currentQuestion.level;
  scoreText.textContent = "Score: " + quizScore;
  quizMessage.textContent = currentQuestion.message;
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
    feedbackText.textContent = currentQuestion.feedback;
    feedbackText.className = "feedback-text correct";
    playAnimation("correct-animation");
  } else {
    feedbackText.textContent = "Not quite. This one was: " + currentQuestion.answer + ".";
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