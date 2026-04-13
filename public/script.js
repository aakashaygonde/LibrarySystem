const API = 'http://localhost:3000';

// Global State
let currentUser = null;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  const storedUser = localStorage.getItem('libraryUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateNav();
    navigate('books-view');
  } else {
    navigate('auth-view');
  }
});

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Navigation & Auth State
function navigate(viewId) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  
  if (viewId === 'books-view') loadBooks();
  if (viewId === 'profile-view') loadProfile();
  if (viewId === 'staff-view') loadAdminBooks();
}

function updateNav() {
  const navLinks = document.getElementById('nav-links');
  const navStaff = document.getElementById('nav-staff');
  
  if (currentUser) {
    navLinks.style.display = 'flex';
    navStaff.style.display = currentUser.role === 'staff' ? 'block' : 'none';
  } else {
    navLinks.style.display = 'none';
  }
}

function toggleAuth(mode) {
  document.querySelectorAll('.auth-tabs .tab').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
  
  if (mode === 'login') {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
  } else {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
  }
}

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      currentUser = { userId: data._id, name: data.name, email: data.email, role: data.role };
      localStorage.setItem('libraryUser', JSON.stringify(currentUser));
      updateNav();
      navigate('books-view');
      showToast('Welcome back, ' + currentUser.name);
    } else {
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function register() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  
  try {
    const res = await fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast('Registration successful! Please login.');
      toggleAuth('login');
      document.querySelectorAll('.auth-tabs .tab')[0].classList.add('active');
      document.querySelectorAll('.auth-tabs .tab')[1].classList.remove('active');
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('libraryUser');
  updateNav();
  navigate('auth-view');
  showToast('Logged out securely');
}

// Books Logic
async function loadBooks(query = '') {
  try {
    const url = query ? `${API}/search/${query}` : `${API}/books`;
    const res = await fetch(url);
    const books = await res.json();
    
    const container = document.getElementById('books-list');
    container.innerHTML = '';
    
    books.forEach(b => {
      const card = document.createElement('div');
      card.className = 'book-card';
      const isAvail = b.quantity > 0;
      card.innerHTML = `
        <h4 class="book-title">${b.title}</h4>
        <p class="book-author">by ${b.author}</p>
        <p class="book-status ${isAvail ? 'status-available' : 'status-unavailable'}">
          ${isAvail ? b.quantity + ' Available' : 'Out of Stock'}
        </p>
        <button class="primary-btn" ${!isAvail ? 'disabled' : ''} style="${!isAvail ? 'opacity: 0.5; cursor: not-allowed;' : ''}" onclick="issueBook('${b._id}')">
          ${isAvail ? 'Issue Book' : 'Not Available'}
        </button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    showToast('Failed to load books', 'error');
  }
}

let searchTimeout;
function searchBooks() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = document.getElementById('search-input').value;
    loadBooks(query);
  }, 300);
}

async function issueBook(bookId) {
  if (!currentUser) return showToast('Please login first', 'error');
  
  try {
    const res = await fetch(API + '/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, bookId })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast('Book issued successfully!');
      loadBooks();
    } else {
      showToast(data.error || 'Failed to issue', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

// Profile Logic
async function loadProfile() {
  if (!currentUser) return;
  
  document.getElementById('profile-name').innerText = currentUser.name || 'N/A';
  document.getElementById('profile-email').innerText = currentUser.email || 'Please re-login to sync';
  document.getElementById('profile-role').innerText = currentUser.role || 'N/A';
  
  try {
    const [profileRes, booksRes] = await Promise.all([
      fetch(API + '/profile/' + currentUser.userId),
      fetch(API + '/books')
    ]);
    
    const issues = await profileRes.json();
    const books = await booksRes.json();
    const tbody = document.getElementById('profile-issues');
    tbody.innerHTML = '';
    
    const booksMap = {};
    books.forEach(b => booksMap[b._id] = b.title);
    
    issues.forEach(i => {
      const tr = document.createElement('tr');
      const isReturned = !!i.returnDate;
      const title = booksMap[i.bookId] || 'Unknown Book';
      
      tr.innerHTML = `
        <td>${title}</td>
        <td>${new Date(i.issueDate).toLocaleDateString()}</td>
        <td>${isReturned ? new Date(i.returnDate).toLocaleDateString() : 'Not Returned'}</td>
        <td>Rs ${i.fine || 0}</td>
        <td>
          ${!isReturned ? `<button class="small-btn" onclick="returnBook('${i.bookId}')">Return</button>` : 'Completed'}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load profile', 'error');
  }
}

async function returnBook(bookId) {
  try {
    const res = await fetch(API + '/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.userId, bookId })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast(data.message || 'Book returned!');
      loadProfile(); // refresh page
    } else {
      showToast(data.error || 'Failed to return', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

// Admin Logic
async function loadAdminBooks() {
  try {
    const res = await fetch(API + '/books');
    const books = await res.json();
    
    const ul = document.getElementById('admin-books-list');
    ul.innerHTML = '';
    
    books.forEach(b => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span><b>${b.title}</b> (${b.author})</span>
        <button class="small-btn danger" onclick="deleteBook('${b._id}')">Delete</button>
      `;
      ul.appendChild(li);
    });
  } catch (err) {
    showToast('Failed to load admin books', 'error');
  }
}

async function addBook() {
  const title = document.getElementById('add-title').value;
  const author = document.getElementById('add-author').value;
  const quantity = document.getElementById('add-quantity').value;
  
  if (!title || !author || !quantity) return showToast('Please fill all fields', 'error');
  
  try {
    const res = await fetch(API + '/addBook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, quantity: parseInt(quantity) })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast('Book added successfully');
      document.getElementById('add-title').value = '';
      document.getElementById('add-author').value = '';
      document.getElementById('add-quantity').value = '1';
      loadAdminBooks();
    } else {
      showToast(data.error || 'Failed to add', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function deleteBook(id) {
  try {
    const res = await fetch(API + '/delete/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast('Book deleted');
      loadAdminBooks();
    } else {
      showToast(data.error || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}
