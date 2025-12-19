// Use XMLHttpRequest for all data, login and post operations
const registerSection = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const boardSection = document.getElementById('board-section');

const registerBtn = document.getElementById('register-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const postBtn = document.getElementById('post-btn');
const resetBtn = document.getElementById('reset-btn');

const registerMsg = document.getElementById('register-msg');
const loginMsg = document.getElementById('login-msg');

let currentUser = null; // username when logged in

function xhrPost(path, body, cb) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', path, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) cb(xhr);
  };
  xhr.send(body);
}

function xhrGet(path, cb) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', path, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) cb(xhr);
  };
  xhr.send();
}

// Register
registerBtn.addEventListener('click', () => {
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  registerMsg.textContent = '';
  registerMsg.className = '';
  if (!username) { registerMsg.textContent = 'Username required'; registerMsg.className = 'error'; return }
  if (!password || password.length < 3) { registerMsg.textContent = 'Password must be at least 3 characters'; registerMsg.className = 'error'; return }

  const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  xhrPost('/register', body, (xhr) => {
    if (xhr.status !== 200) { registerMsg.textContent = 'Server error'; registerMsg.className = 'error'; return }
    const resp = xhr.responseText.trim();
    if (resp === 'OK') {
      registerMsg.textContent = 'Registered — please login'; registerMsg.className = 'info';
      document.getElementById('login-username').value = username;
      setTimeout(() => { registerSection.classList.add('hidden'); loginSection.classList.remove('hidden'); }, 400);
    } else if (resp === 'EXISTS') {
      registerMsg.textContent = 'Username already exists'; registerMsg.className = 'error';
    } else {
      registerMsg.textContent = 'Unexpected response: ' + resp; registerMsg.className = 'error';
    }
  });
});

// Login
loginBtn.addEventListener('click', () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  loginMsg.textContent = '';
  loginMsg.className = '';
  const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  xhrPost('/login', body, (xhr) => {
    if (xhr.status !== 200) { loginMsg.textContent = 'Server error'; loginMsg.className = 'error'; return }
    const resp = xhr.responseText.trim();
    if (resp === 'OK') {
      currentUser = username;
      loginSection.classList.add('hidden');
      boardSection.classList.remove('hidden');
      loginMsg.textContent = '';
      loadMessages();
    } else {
      loginMsg.textContent = 'Invalid credentials'; loginMsg.className = 'error';
    }
  });
});

// Load messages from server
function loadMessages() {
  xhrGet('/messages', (xhr) => {
    if (xhr.status !== 200) return;
    const body = xhr.responseText || '';
    const container = document.getElementById('messages');
    container.innerHTML = '';
    const lines = body.split('\n').filter(l=>l.trim().length>0);
    for (const ln of lines) {
      const parts = ln.split('|');
      const u = parts[0] || 'anon';
      const t = parts[1] || '';
      const d = document.createElement('div');
      d.textContent = `${u}: ${t}`;
      container.appendChild(d);
    }
  });
}

// Post a new message
postBtn.addEventListener('click', () => {
  const txt = document.getElementById('new-message').value.trim();
  if (!txt || !currentUser) return;
  const body = `username=${encodeURIComponent(currentUser)}&text=${encodeURIComponent(txt)}`;
  xhrPost('/post', body, (xhr) => {
    if (xhr.status === 200 && xhr.responseText.trim() === 'OK') {
      document.getElementById('new-message').value = '';
      loadMessages();
    }
  });
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  boardSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  loginMsg.className = 'info';
  loginMsg.textContent = 'You have been logged out.';
  document.getElementById('login-password').value = '';
});

// Reset (client-side) — clears any client UI state and shows register form
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    currentUser = null;
    registerSection.classList.remove('hidden');
    loginSection.classList.add('hidden');
    registerMsg.className = 'info';
    registerMsg.textContent = 'Local UI reset — register a new account.';
    document.getElementById('register-username').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
  });
}

// On load, show register form by default
registerSection.classList.remove('hidden');
loginSection.classList.add('hidden');
boardSection.classList.add('hidden');
