// ─────────────────────────────────────────────
//  auth.js — HZ Invest Firebase Auth Module
//  Modern ES module syntax (Firebase v12+)
// ─────────────────────────────────────────────

import { initializeApp }                              from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut,
         signInWithEmailAndPassword,
         createUserWithEmailAndPassword,
         signInWithPopup, GoogleAuthProvider,
         sendPasswordResetEmail, updateProfile }      from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc }         from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ── YOUR FIREBASE CONFIG ──────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDwRn6qhFWCKf2wyMg7zxyfDb3GuaB6xtM",
  authDomain:        "hz-invest.firebaseapp.com",
  projectId:         "hz-invest",
  storageBucket:     "hz-invest.firebasestorage.app",
  messagingSenderId: "893853976523",
  appId:             "1:893853976523:web:c15a571601c9d05fd7584e",
  measurementId:     "G-JNJQ4ED1KG"
};

// ── INIT ─────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── EXPORTS ──────────────────────────────────
export { auth, db, onAuthStateChanged, signOut,
         signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signInWithPopup, GoogleAuthProvider,
         sendPasswordResetEmail, updateProfile,
         doc, setDoc, getDoc };

// ─────────────────────────────────────────────
//  SHARED HELPERS
// ─────────────────────────────────────────────

/** Redirect to login if not signed in */
export function requireAuth() {
  onAuthStateChanged(auth, user => {
    if (!user) {
      sessionStorage.setItem('hz_redirect', window.location.pathname);
      window.location.href = 'login.html';
    }
  });
}

/** Renders name + logout OR "Entrar" inside #nav-user-pill */
export function bindNavUser() {
  onAuthStateChanged(auth, user => {
    const pill = document.getElementById('nav-user-pill');
    if (!pill) return;
    if (user) {
      const name = user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0];
      pill.innerHTML = `
        <span class="nav-user-name">Olá, ${name}</span>
        <button class="nav-signout" id="btn-signout">Sair</button>
      `;
      pill.style.display = 'flex';
      document.getElementById('btn-signout').addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = 'index.html');
      });
    } else {
      pill.innerHTML = `<a href="login.html" class="nav-login-btn">Entrar / Cadastrar</a>`;
      pill.style.display = 'flex';
    }
  });
}

/** Mark a lesson complete → save to Firestore + update bar */
export async function markLessonComplete(courseId, lessonId) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, 'progress', user.uid, 'courses', courseId);
  await setDoc(ref, { [lessonId]: true }, { merge: true });
  _renderProgress(courseId, user.uid);
  const el = document.querySelector(`.lesson[data-id="${lessonId}"]`);
  if (el) el.classList.add('completed');
}

/** Load progress on page open */
export async function loadProgress(courseId) {
  onAuthStateChanged(auth, user => {
    if (user) _renderProgress(courseId, user.uid);
  });
}

async function _renderProgress(courseId, uid) {
  const ref  = doc(db, 'progress', uid, 'courses', courseId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const total     = document.querySelectorAll('.lesson[data-id]').length;
  const completed = Object.keys(data).filter(k => data[k]).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const fill  = document.getElementById('progressFill');
  const label = document.getElementById('progressPct');
  if (fill)  fill.style.width  = pct + '%';
  if (label) label.textContent = pct + '%';
  Object.keys(data).forEach(id => {
    const el = document.querySelector(`.lesson[data-id="${id}"]`);
    if (el) el.classList.add('completed');
  });
}
