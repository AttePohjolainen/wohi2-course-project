let currentPage = 1;
let currentKeyword = "";
let currentDifficulty = "";

function getToken() {
  return localStorage.getItem(CONFIG.STORAGE_KEY);
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(CONFIG.ROUTES.LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem(CONFIG.STORAGE_KEY, data.token);
    alert("Login successful");
    loadQuestions();
  } else {
    alert("Login failed");
  }
}

async function loadQuestions() {
  const token = getToken();

  const url =
  `${CONFIG.ROUTES.QUESTIONS}?page=${currentPage}&limit=${CONFIG.POSTS_PER_PAGE}` +
  (currentKeyword ? `&keyword=${currentKeyword}` : "") +
  (currentDifficulty ? `&difficulty=${currentDifficulty}` : "");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = "";

  const questions = Array.isArray(result) ? result : result.data;

  if (!questions) {
    postsDiv.innerHTML = `<p>${JSON.stringify(result)}</p>`;
    return;
  }

  questions.forEach((question) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <h3>${question.question}</h3>
      <p><strong>Author:</strong> ${question.userName || "Unknown"}</p>
      <p><strong>Date:</strong> ${question.date}</p>
      <p><strong>Keywords:</strong> ${question.keywords.join(", ")}</p>
      <p><strong>Difficulty:</strong> ${question.difficulty || "easy"}</p>
      <p><strong>Solved:</strong> ${question.solved ? "Yes ✅" : "No ❌"}</p>

      ${
        question.imageUrl
          ? `<img src="${question.imageUrl}" alt="question image" style="max-width:300px;" />`
          : ""
      }

      <br /><br />

      <input id="answer-${question.id}" placeholder="Your answer" />
      <button onclick="playQuestion(${question.id})">Submit answer</button>

      <p id="result-${question.id}"></p>
    `;

    postsDiv.appendChild(div);
  });

  if (result.page) {
    document.getElementById("pageInfo").textContent =
      `Page ${result.page} / ${result.totalPages}`;

    document.getElementById("prevBtn").disabled = result.page <= 1;
    document.getElementById("nextBtn").disabled =
      result.page >= result.totalPages;
  } else {
    document.getElementById("pageInfo").textContent = "";
    document.getElementById("prevBtn").disabled = true;
    document.getElementById("nextBtn").disabled = true;
  }
}

async function createQuestion() {
  const token = getToken();

  const formData = new FormData();
  formData.append("question", document.getElementById("question").value);
  formData.append("answer", document.getElementById("answer").value);
  formData.append("date", document.getElementById("date").value);
  formData.append("keywords", document.getElementById("keywords").value);
  formData.append("difficulty", document.getElementById("difficulty").value);

  const image = document.getElementById("image").files[0];
  if (image) {
    formData.append("image", image);
  }

  const res = await fetch(CONFIG.ROUTES.QUESTIONS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  console.log(data);

  loadQuestions();
}

async function playQuestion(id) {
  const token = getToken();
  const submittedAnswer = document.getElementById(`answer-${id}`).value;

  const res = await fetch(`${CONFIG.ROUTES.QUESTIONS}/${id}/play`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ submittedAnswer }),
  });

  const data = await res.json();

  const result = document.getElementById(`result-${id}`);

  if (data.correct) {
    result.textContent = "Correct ✅";
  } else {
    result.textContent = `Wrong ❌ Correct answer: ${data.correctAnswer}`;
  }

  loadQuestions();
}

async function loadRandomQuiz() {
  const token = getToken();

  const res = await fetch(`${CONFIG.ROUTES.QUESTIONS}/quiz/random`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const questions = await res.json();

  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = "<h2>Random Quiz Questions</h2>";

  questions.forEach((question) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <h3>${question.question}</h3>
      <p><strong>Author:</strong> ${question.userName || "Unknown"}</p>
      <p><strong>Date:</strong> ${question.date}</p>
      <p><strong>Keywords:</strong> ${question.keywords.join(", ")}</p>
      <p><strong>Difficulty:</strong> ${question.difficulty || "easy"}</p>
      <p><strong>Solved:</strong> ${question.solved ? "Yes ✅" : "No ❌"}</p>

      <input id="answer-${question.id}" placeholder="Your answer" />
      <button onclick="playQuestion(${question.id})">Submit answer</button>
      <p id="result-${question.id}"></p>
    `;

    postsDiv.appendChild(div);
  });
}

async function loadLeaderboard() {
  const token = getToken();

  const res = await fetch("/api/leaderboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const leaderboard = await res.json();

  const leaderboardDiv = document.getElementById("leaderboard");

  leaderboardDiv.innerHTML = "<h3>Leaderboard - Top 5 users</h3>";

  if (!Array.isArray(leaderboard) || leaderboard.length === 0) {
    leaderboardDiv.innerHTML += "<p>No correct answers yet.</p>";
    return;
  }

  const list = document.createElement("ol");

  leaderboard.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${entry.name} - ${entry.correctAnswers} correct answers`;
    list.appendChild(item);
  });

  leaderboardDiv.appendChild(list);
}

document.getElementById("loginBtn").addEventListener("click", login);

document.getElementById("createBtn").addEventListener("click", createQuestion);

document
  .getElementById("randomQuizBtn")
  .addEventListener("click", loadRandomQuiz);

document
  .getElementById("leaderboardBtn")
  .addEventListener("click", loadLeaderboard);

document.getElementById("difficultyFilterBtn").addEventListener("click", () => {
  currentDifficulty = document.getElementById("difficultyFilter").value;
  currentPage = 1;
  loadQuestions();
});

document.getElementById("searchBtn").addEventListener("click", () => {
  currentKeyword = document.getElementById("search").value;
  currentPage = 1;
  loadQuestions();
});

document.getElementById("prevBtn").addEventListener("click", () => {
  currentPage--;
  loadQuestions();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  currentPage++;
  loadQuestions();
});
