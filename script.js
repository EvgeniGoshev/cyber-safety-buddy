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

const trapBanner = document.getElementById("privacyTrap");
const trapInputs = document.querySelectorAll(".trap-input");
const trapWarning = document.getElementById("trapWarning");
const trapClose = document.getElementById("trapClose");

trapInputs.forEach(function (input) {
  input.addEventListener("input", function () {
    input.value = "";
    trapWarning.classList.add("is-visible");
  });
});

trapClose.addEventListener("click", function () {
  trapBanner.classList.add("is-hidden");
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
  { level: "Easy", image: "assets/scam-1.png", answer: "Scam" },
  { level: "Normal", image: "assets/real-3.png", answer: "Safe" },
  { level: "Hard", image: "assets/scam-4.png", answer: "Scam" },
  { level: "Easy", image: "assets/real-1.png", answer: "Safe" },
  { level: "Normal", image: "assets/scam-2.png", answer: "Scam" },
  { level: "Hard", image: "assets/real-4.png", answer: "Safe" },
  { level: "Normal", image: "assets/scam-3.png", answer: "Scam" },
  { level: "Easy", image: "assets/real-2.png", answer: "Safe" }
];

let questionNumber = 0;
let quizScore = 0;
let answered = false;

function showQuestion() {
  const currentQuestion = questions[questionNumber];

  levelText.textContent = "Level: " + currentQuestion.level;
  scoreText.textContent = "Score: " + quizScore;

  quizScene.innerHTML = `
    <img class="quiz-image" src="${currentQuestion.image}" alt="Phishing challenge example">
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
