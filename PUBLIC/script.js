
// ============================
// COURSE DATA
// ============================
const COURSES = [
  { id:1, title:"Python Masterclass 2025", instructor:"Dr. Sarah Chen", category:"development", emoji:"🐍", bg:"#1a3a2a", rating:4.9, students:12400, price:49.99, level:"Beginner", duration:"42h", lectures:180, desc:"Complete Python bootcamp from beginner to expert. Covers OOP, file handling, APIs, data structures and real-world projects.", curriculum:["Python Basics & Syntax","Functions & OOP","File Handling","APIs & Requests","Mini Projects"] },
  { id:2, title:"React & Next.js Complete Guide", instructor:"Mark Thompson", category:"development", emoji:"⚛️", bg:"#0d2a3a", rating:4.8, students:8200, price:59.99, level:"Intermediate", duration:"38h", lectures:155, desc:"Master React 18 and Next.js 14 with hooks, server components, and real-world app deployment.", curriculum:["React Fundamentals","Hooks Deep Dive","Next.js App Router","State Management","Deployment"] },
  { id:3, title:"UI/UX Design Fundamentals", instructor:"Emily Rodriguez", category:"design", emoji:"🎨", bg:"#2a1a3a", rating:4.9, students:6100, price:39.99, level:"Beginner", duration:"28h", lectures:110, desc:"Learn Figma, design principles, user research, and create stunning interfaces from scratch.", curriculum:["Design Principles","Figma Basics","User Research","Wireframing","Prototyping"] },
  { id:4, title:"Machine Learning with Python", instructor:"Prof. James Liu", category:"data", emoji:"🤖", bg:"#1a2a3a", rating:4.7, students:9800, price:69.99, level:"Advanced", duration:"52h", lectures:220, desc:"End-to-end ML pipeline using scikit-learn, TensorFlow, and deployment on cloud platforms.", curriculum:["ML Fundamentals","Supervised Learning","Neural Networks","Model Deployment","Projects"] },
  { id:5, title:"Digital Marketing Mastery", instructor:"Sophie Williams", category:"marketing", emoji:"📢", bg:"#2a1a1a", rating:4.6, students:5400, price:44.99, level:"Beginner", duration:"22h", lectures:90, desc:"SEO, social media, paid ads, email marketing, and analytics — everything to grow your brand online.", curriculum:["SEO Basics","Social Media Strategy","Google Ads","Email Marketing","Analytics"] },
  { id:6, title:"Ethical Hacking & Cybersecurity", instructor:"Alex Turner", category:"security", emoji:"🔐", bg:"#1a2a1a", rating:4.8, students:7300, price:54.99, level:"Intermediate", duration:"45h", lectures:190, desc:"Learn penetration testing, network security, ethical hacking tools, and how to protect systems.", curriculum:["Networking Basics","Kali Linux","Penetration Testing","Web App Security","CTF Practice"] },
  { id:7, title:"Business Strategy & Leadership", instructor:"Dr. Michael Park", category:"business", emoji:"💼", bg:"#2a2a1a", rating:4.5, students:3200, price:0, level:"Beginner", duration:"15h", lectures:60, desc:"Free course! Strategic thinking, leadership frameworks, and business model canvas for aspiring entrepreneurs.", curriculum:["Business Models","SWOT Analysis","Leadership Skills","Negotiation","Case Studies"] },
  { id:8, title:"Advanced CSS & Animations", instructor:"Lena Müller", category:"design", emoji:"💅", bg:"#1f1a2a", rating:4.7, students:4100, price:34.99, level:"Intermediate", duration:"20h", lectures:85, desc:"Master CSS Grid, Flexbox, custom properties, and create jaw-dropping animations and 3D effects.", curriculum:["CSS Grid Mastery","Flexbox","Keyframe Animations","3D Transforms","GSAP Basics"] },
  { id:9, title:"SQL & Database Design", instructor:"Chris Johnson", category:"development", emoji:"🗄️", bg:"#1a2a2a", rating:4.8, students:11200, price:44.99, level:"Beginner", duration:"30h", lectures:120, desc:"From basic queries to advanced stored procedures — everything you need to master relational databases.", curriculum:["SQL Fundamentals","Joins & Subqueries","Database Design","Stored Procedures","Performance Tuning"] },
];

let currentUser = null;
let enrolledCourses = [];

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', () => {
  renderCourses(COURSES);
  checkSession();
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').style.boxShadow = window.scrollY > 20 ? '0 4px 30px rgba(0,0,0,.4)' : 'none';
  });
});

// ============================
// RENDER COURSES
// ============================
function renderCourses(list) {
  const grid = document.getElementById('coursesGrid');
  if (!list.length) { grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:3rem">No courses found.</div>`; return; }
  grid.innerHTML = list.map(c => `
    <div class="course-card" onclick="openCourseDetail(${c.id})">
      <div class="course-thumb" style="background:${c.bg}">${c.emoji}</div>
      <div class="course-body">
        <span class="course-category">${c.category}</span>
        <h3 class="course-title">${c.title}</h3>
        <p class="course-instructor"><i class="fas fa-user-tie" style="color:var(--primary);margin-right:.3rem"></i>${c.instructor}</p>
        <div class="course-meta">
          <span class="course-rating">⭐ ${c.rating} <span style="color:var(--muted);font-weight:400">(${(c.students/1000).toFixed(1)}k)</span></span>
          <span class="course-students">${c.level}</span>
        </div>
        <div class="course-footer">
          <span class="course-price ${c.price===0?'free':''}">${c.price===0?'FREE':'$'+c.price}</span>
          <button class="btn btn-primary enroll-btn" onclick="event.stopPropagation();enrollCourse(${c.id})">
            ${isEnrolled(c.id)?'<i class="fas fa-check"></i> Enrolled':'Enroll Now'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterCourses(cat, btn) {
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }
  const filtered = cat==='all' ? COURSES : COURSES.filter(c=>c.category===cat);
  renderCourses(filtered);
  document.getElementById('courses').scrollIntoView({behavior:'smooth'});
}

// ============================
// COURSE DETAIL
// ============================
function openCourseDetail(id) {
  const c = COURSES.find(x=>x.id===id);
  if (!c) return;
  const enrolled = isEnrolled(id);
  document.getElementById('courseModalContent').innerHTML = `
    <div class="detail-header">
      <div class="detail-thumb" style="background:${c.bg}">${c.emoji}</div>
      <div class="detail-meta">
        <h2>${c.title}</h2>
        <div class="badge-row">
          <span class="badge badge-cat">${c.category}</span>
          <span class="badge badge-level">${c.level}</span>
        </div>
        <p style="color:var(--muted);font-size:.9rem"><i class="fas fa-user-tie" style="color:var(--primary)"></i> ${c.instructor}</p>
        <p style="color:var(--muted);font-size:.85rem;margin-top:.3rem">⭐ ${c.rating} &nbsp;•&nbsp; ${c.students.toLocaleString()} students &nbsp;•&nbsp; ${c.duration} &nbsp;•&nbsp; ${c.lectures} lectures</p>
      </div>
    </div>
    <div class="detail-section">
      <h3>About This Course</h3>
      <p>${c.desc}</p>
    </div>
    <div class="detail-section">
      <h3>Curriculum</h3>
      <ul class="curriculum-list">
        ${c.curriculum.map(item=>`<li><i class="fas fa-play-circle"></i>${item}</li>`).join('')}
      </ul>
    </div>
    <div class="detail-actions">
      <span class="detail-price ${c.price===0?'free':''}">${c.price===0?'FREE':'$'+c.price}</span>
      <button class="btn btn-primary btn-lg" onclick="enrollCourse(${c.id})">
        ${enrolled?'<i class="fas fa-check"></i> Already Enrolled':'<i class="fas fa-bolt"></i> Enroll Now'}
      </button>
    </div>
  `;
  openModal('courseModal');
}

// ============================
// AUTH – SESSION CHECK
// ============================
function checkSession() {
  const user = JSON.parse(sessionStorage.getItem('skillUser') || 'null');
  if (user) {
    currentUser = user;
    enrolledCourses = JSON.parse(sessionStorage.getItem('enrolled_'+user.id) || '[]');
    setLoggedIn(user);
  }
}

function setLoggedIn(user) {
  document.getElementById('navAuth').classList.add('hidden');
  document.getElementById('navUser').classList.remove('hidden');
  document.getElementById('welcomeUser').textContent = `👋 ${user.name.split(' ')[0]}`;
  document.getElementById('dashboard').classList.remove('hidden');
  updateDashboard();
  renderCourses(COURSES);
}

function logout() {
  sessionStorage.removeItem('skillUser');
  currentUser = null;
  enrolledCourses = [];
  document.getElementById('navAuth').classList.remove('hidden');
  document.getElementById('navUser').classList.add('hidden');
  document.getElementById('dashboard').classList.add('hidden');
  showToast('Logged out successfully', 'success');
  renderCourses(COURSES);
}

// ============================
// AUTH – HANDLERS
// ============================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    const data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      sessionStorage.setItem('skillUser', JSON.stringify(data.user));
      enrolledCourses = JSON.parse(sessionStorage.getItem('enrolled_'+data.user.id)||'[]');
      closeModal('loginModal');
      setLoggedIn(data.user);
      showToast(`Welcome back, ${data.user.name.split(' ')[0]}! 🎉`, 'success');
    } else {
      showAlert('loginAlert', data.message || 'Invalid credentials', 'error');
    }
  } catch {
    // fallback: demo mode
    if (email && password.length >= 6) {
      const user = { id: Date.now(), name: email.split('@')[0], email };
      currentUser = user;
      sessionStorage.setItem('skillUser', JSON.stringify(user));
      enrolledCourses = [];
      closeModal('loginModal');
      setLoggedIn(user);
      showToast(`Welcome back! (Demo mode) 🎉`, 'success');
    } else {
      showAlert('loginAlert', 'Invalid credentials', 'error');
    }
  }
  btn.innerHTML = 'Login <i class="fas fa-arrow-right"></i>';
  btn.disabled = false;
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const btn = document.getElementById('registerBtn');

  if (password !== confirm) { showAlert('registerAlert','Passwords do not match','error'); return; }
  if (password.length < 8) { showAlert('registerAlert','Password must be at least 8 characters','error'); return; }

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/auth/register', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name, email, password})
    });
    const data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      sessionStorage.setItem('skillUser', JSON.stringify(data.user));
      enrolledCourses = [];
      closeModal('registerModal');
      setLoggedIn(data.user);
      showToast(`Account created! Welcome, ${name.split(' ')[0]}! 🚀`, 'success');
    } else {
      showAlert('registerAlert', data.message || 'Registration failed', 'error');
    }
  } catch {
    // fallback: demo mode
    const user = { id: Date.now(), name, email };
    currentUser = user;
    sessionStorage.setItem('skillUser', JSON.stringify(user));
    enrolledCourses = [];
    closeModal('registerModal');
    setLoggedIn(user);
    showToast(`Welcome, ${name.split(' ')[0]}! 🚀`, 'success');
  }
  btn.innerHTML = 'Create Account <i class="fas fa-arrow-right"></i>';
  btn.disabled = false;
}

// ============================
// ENROLL
// ============================
function enrollCourse(id) {
  if (!currentUser) {
    showToast('Please login to enroll in courses', 'error');
    openModal('loginModal');
    return;
  }
  if (isEnrolled(id)) { showToast('Already enrolled!', 'success'); return; }
  enrolledCourses.push(id);
  sessionStorage.setItem('enrolled_'+currentUser.id, JSON.stringify(enrolledCourses));

  // Attempt server enrollment
  fetch('/api/enroll', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({userId: currentUser.id, courseId: id})
  }).catch(()=>{});

  updateDashboard();
  renderCourses(COURSES);
  const c = COURSES.find(x=>x.id===id);
  showToast(`Enrolled in "${c.title}"! 🎉`, 'success');
  closeModal('courseModal');
}

function isEnrolled(id) { return enrolledCourses.includes(id); }

function updateDashboard() {
  document.getElementById('enrolledCount').textContent = enrolledCourses.length;
  document.getElementById('hoursLearned').textContent = enrolledCourses.length * 12;
  document.getElementById('certCount').textContent = Math.floor(enrolledCourses.length / 2);
  const list = document.getElementById('enrolledList');
  const myCourses = COURSES.filter(c=>enrolledCourses.includes(c.id));
  list.innerHTML = myCourses.length ? myCourses.map(c=>`
    <div class="course-card" onclick="openCourseDetail(${c.id})">
      <div class="course-thumb" style="background:${c.bg}">${c.emoji}</div>
      <div class="course-body">
        <span class="course-category">${c.category}</span>
        <h3 class="course-title">${c.title}</h3>
        <p class="course-instructor">${c.instructor}</p>
        <div class="course-footer" style="padding-top:.8rem;border-top:1px solid var(--border)">
          <span style="color:#22c55e;font-weight:600"><i class="fas fa-check-circle"></i> Enrolled</span>
          <span style="color:var(--muted);font-size:.85rem">${c.duration}</span>
        </div>
      </div>
    </div>`).join('') : `<p style="color:var(--muted)">No courses enrolled yet.</p>`;
}

// ============================
// MODAL HELPERS
// ============================
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
function switchModal(from, to) { closeModal(from); openModal(to); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
});
document.addEventListener('keydown', e => { if (e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>closeModal(m.id)); });

// ============================
// UI HELPERS
// ============================
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
function togglePw(id, icon) {
  const el = document.getElementById(id);
  const show = el.type === 'password';
  el.type = show ? 'text' : 'password';
  icon.classList.toggle('fa-eye', !show);
  icon.classList.toggle('fa-eye-slash', show);
}
function checkStrength(val) {
  const bar = document.getElementById('pwBar');
  const lbl = document.getElementById('pwLabel');
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const colors = ['#ef4444','#f97316','#f59e0b','#22c55e'];
  const labels = ['Weak','Fair','Good','Strong'];
  bar.style.width = (score*25)+'%';
  bar.style.background = colors[score-1]||'#ef4444';
  lbl.textContent = score > 0 ? labels[score-1] : '';
}
function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  el.className = `alert alert-${type}`;
  el.innerHTML = `<i class="fas fa-${type==='error'?'exclamation-circle':'check-circle'}"></i> ${msg}`;
  el.classList.remove('hidden');
  setTimeout(()=>el.classList.add('hidden'), 4000);
}
let toastTimer;
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 3500);
}