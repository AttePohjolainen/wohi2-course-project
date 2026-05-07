let currentPage = 1;
let currentKeyword = "";

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
    loadPosts();
  } else {
    alert("Login failed");
  }
}

async function loadPosts() {
  const token = getToken();

  const url =
    `${CONFIG.ROUTES.POSTS}?page=${currentPage}&limit=${CONFIG.POSTS_PER_PAGE}` +
    (currentKeyword ? `&keyword=${currentKeyword}` : "");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = "";

  if (!result.data) {
    postsDiv.innerHTML = `<p>${JSON.stringify(result)}</p>`;
    return;
  }

  result.data.forEach((post) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <h3>${post.title}</h3>
      <p><strong>Author:</strong> ${post.userName || "Unknown"}</p>
      <p>${post.content}</p>
      <p><strong>Date:</strong> ${post.date}</p>
      <p><strong>Keywords:</strong> ${post.keywords.join(", ")}</p>
      <p><strong>Likes:</strong> ${post.likeCount}</p>
      <p><strong>Liked:</strong> ${post.liked ? "Yes" : "No"}</p>
      ${
        post.imageUrl
          ? `<img src="${post.imageUrl}" alt="post image" style="max-width:300px;" />`
          : ""
      }
      <br />
      <button onclick="likePost(${post.id})">Like</button>
      <button onclick="unlikePost(${post.id})">Unlike</button>
    `;

    postsDiv.appendChild(div);
  });

  document.getElementById("pageInfo").textContent =
    `Page ${result.page} / ${result.totalPages}`;

  document.getElementById("prevBtn").disabled = result.page <= 1;
  document.getElementById("nextBtn").disabled = result.page >= result.totalPages;
}

async function createPost() {
  const token = getToken();

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("date", document.getElementById("date").value);
  formData.append("content", document.getElementById("content").value);
  formData.append("keywords", document.getElementById("keywords").value);

  const image = document.getElementById("image").files[0];
  if (image) {
    formData.append("image", image);
  }

  const res = await fetch(CONFIG.ROUTES.POSTS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  console.log(data);

  loadPosts();
}

async function likePost(id) {
  const token = getToken();

  await fetch(`${CONFIG.ROUTES.POSTS}/${id}/like`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  loadPosts();
}

async function unlikePost(id) {
  const token = getToken();

  await fetch(`${CONFIG.ROUTES.POSTS}/${id}/like`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  loadPosts();
}

document.getElementById("loginBtn").addEventListener("click", login);

document.getElementById("createBtn").addEventListener("click", createPost);

document.getElementById("searchBtn").addEventListener("click", () => {
  currentKeyword = document.getElementById("search").value;
  currentPage = 1;
  loadPosts();
});

document.getElementById("prevBtn").addEventListener("click", () => {
  currentPage--;
  loadPosts();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  currentPage++;
  loadPosts();
});