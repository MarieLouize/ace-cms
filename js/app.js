const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const CONFIG = {
    // If on localhost, use local backend. Otherwise, use Render.
    api: isLocal 
        ? 'http://localhost:3000/content' 
        : 'https://acepadi.onrender.com/content'
};

// Console log to verify connection source
console.log(`🚀 App running in ${isLocal ? 'Local' : 'Production'} mode. Connected to: ${CONFIG.api}`);

// --- 1. CORE STATE MANAGER ---
const State = {
  chapters: [],
  activeChapterId: null,
  activeMode: null, // 'cheatsheet', 'problem', 'quiz', 'flashcard', 'topic'
  dirty: false
};

// --- 2. APP CONTROLLER ---
const App = {
  PASSCODE: '5173', 

    init: () => {
        // 1. Check if already unlocked
        const isUnlocked = localStorage.getItem('ace_unlocked') === 'true';
        
        if (isUnlocked) {
            document.getElementById('lockScreen').classList.add('hidden');
            // Start the actual app logic
            Ingest.init();
        } else {
            // Keep locked, focus input
            document.getElementById('passcodeInput').focus();
        }
    },

    unlock: () => {
        const input = document.getElementById('passcodeInput');
        const val = input.value;
        const msg = document.getElementById('lockMsg');

        if (val === App.PASSCODE) {
            // SUCCESS
            localStorage.setItem('ace_unlocked', 'true');
            
            // Fade out lock screen
            document.getElementById('lockScreen').classList.add('hidden');
            
            // Initialize App
            Ingest.init();
            App.toast('Welcome back!', 'success');
        } else {
            // FAILURE
            msg.innerText = "Incorrect Passcode";
            input.value = '';
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 400);
        }
    },
  // Navigation
  nav: (viewName) => {
      if (document.startViewTransition) {
          document.startViewTransition(() => App._switchView(viewName));
      } else {
          App._switchView(viewName);
      }
  },

  _switchView: (viewName) => {
      document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
      document.getElementById(`view-${viewName}`).classList.add('active');
      
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      const idx = viewName === 'ingest' ? 0 : 1;
      const navItems = document.querySelectorAll('.nav-item');
      if(navItems[idx]) navItems[idx].classList.add('active');
  },

  // Toast Notification
  toast: (msg, type='success') => {
      const div = document.createElement('div');
      div.className = 'toast';
      div.style.borderLeftColor = type === 'error' ? 'var(--danger)' : 'var(--success)';
      div.innerText = msg;
      document.getElementById('toast-container').appendChild(div);
      setTimeout(() => div.remove(), 3500);
  },

  // Clipboard
  copy: (text) => {
      navigator.clipboard.writeText(text);
      App.toast('Copied to clipboard');
  },

  // --- NEW: MODAL SYSTEM ---
  modalResolve: null,

  alert: (title, msg, icon='✨') => {
      return App._showModal(title, msg, icon, false);
  },

  confirm: (title, msg, icon='❓') => {
      return App._showModal(title, msg, icon, true);
  },

  _showModal: (title, msg, icon, isConfirm) => {
      return new Promise((resolve) => {
          // 1. Store the resolve function globally so the button can find it
          App.modalResolve = resolve;
          
          const overlay = document.getElementById('app-modal');
          if(!overlay) {
              console.error("Modal container #app-modal missing in HTML");
              return resolve(false);
          }

          const btns = isConfirm 
              ? `<button class="btn btn-ghost" onclick="App._closeModal(false)">Cancel</button>
                 <button class="btn btn-primary" onclick="App._closeModal(true)">Confirm</button>`
              : `<button class="btn btn-primary" onclick="App._closeModal(true)">Okay</button>`;

          overlay.innerHTML = `
              <div class="modal-box">
                  <div class="modal-icon">${icon}</div>
                  <div class="modal-title">${title}</div>
                  <div class="modal-msg">${msg}</div>
                  <div class="modal-actions">${btns}</div>
              </div>
          `;
          
          requestAnimationFrame(() => {
              overlay.classList.add('active');
          });
      });
  },

  _closeModal: (result) => {
      const overlay = document.getElementById('app-modal');
      overlay.classList.remove('active');
      
      if (App.modalResolve) {
          App.modalResolve(result);
          App.modalResolve = null;
      }
      
      setTimeout(() => {
          overlay.innerHTML = '';
      }, 300);
  },

  // --- NEW: SKELETON HELPERS ---
  getSkeleton: (type) => {
      if(type === 'card') {
          return `
          <div class="chapter-card skeleton-wrapper">
              <div class="card-head"><div class="skeleton sk-title"></div></div>
              <div class="card-body">
                  <div class="skeleton sk-text"></div>
                  <div class="skeleton sk-text sk-w-75"></div>
                  <div class="skeleton sk-text sk-w-50"></div>
              </div>
              <div class="card-foot"></div>
          </div>`;
      }
      if(type === 'preview') {
          return `
          <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
              <div class="skeleton sk-title" style="height: 40px; margin: 0 auto 30px auto;"></div>
              <div class="skeleton sk-card" style="margin-bottom: 20px;"></div>
              <div class="skeleton sk-card" style="margin-bottom: 20px;"></div>
              <div class="skeleton sk-card" style="margin-bottom: 20px;"></div>
          </div>`;
      }
      return '';
  }
};