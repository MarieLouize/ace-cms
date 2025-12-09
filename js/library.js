// --- 4. LIBRARY MODULE ---
const Library = {
  fetch: async (manualCode) => {
      const code = manualCode || document.getElementById('searchCourse').value;
      if(!code) return App.toast('Enter course code', 'error');
      
      const grid = document.getElementById('libraryGrid');
      // Show Skeletons
      grid.innerHTML = Array(6).fill(App.getSkeleton('card')).join('');

      try {
          const res = await fetch(`${CONFIG.api}?course=${code}`);
          
          if (!res.ok) throw new Error(`Server returned ${res.status}`);

          const data = await res.json();

          // Robust data checking
          if (Array.isArray(data)) {
              State.chapters = data;
          } else if (data && Array.isArray(data.data)) {
              State.chapters = data.data;
          } else {
              State.chapters = [];
              console.warn("API returned unexpected format:", data);
          }

          Library.render();
      } catch(e) { 
          console.error("Library Fetch Error:", e);
          App.alert('Connection Error', 'Failed to fetch content. Ensure backend is running.', '⚠️');
          grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--danger);">Error loading content.</div>';
      }
  },
  
  copySource: (id) => {
      const ch = State.chapters.find(c => c.id === id);
      if(ch && ch.raw_content) {
          App.copy(ch.raw_content);
      } else {
          App.toast("No content found", "error");
      }
  },
  
  render: () => {
      const grid = document.getElementById('libraryGrid');
      grid.innerHTML = '';
      
      if(!State.chapters || State.chapters.length === 0) {
          grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No chapters found. Ingest some content first.</div>';
          return;
      }

      State.chapters.forEach(ch => {
          // 1. Status Checks (Visual Indicators)
          const sCheat = ch.cheatsheets ? 'done' : '';
          const sProb = ch.problem_sheets ? 'done' : '';
          const sRefined = ch.refined_content ? 'done' : ''; 
          
          // JSON Checks
          let sQuiz = '';
          let sFlash = '';
          try {
              const qData = typeof ch.quizzes === 'string' ? JSON.parse(ch.quizzes) : ch.quizzes;
              const fData = typeof ch.flashcards === 'string' ? JSON.parse(ch.flashcards) : ch.flashcards;
              
              if (Array.isArray(qData) && qData.length > 0) sQuiz = 'done';
              else if (qData && qData.questions && qData.questions.length > 0) sQuiz = 'done';

              if (Array.isArray(fData) && fData.length > 0) sFlash = 'done';
              else if (fData && fData.cards && fData.cards.length > 0) sFlash = 'done';
          } catch(e) {}

          // Topic Check
          const sTopic = (ch.topic_modules && ch.topic_modules.length > 0) ? 'done' : ''; 

          const rawPreview = ch.raw_content 
              ? ch.raw_content.replace(/</g, "&lt;").replace(/>/g, "&gt;").substring(0, 100) 
              : "";

          grid.innerHTML += `
              <div class="chapter-card">
                  <div class="card-head">
                      <div style="font-weight:600;">${ch.title}</div>
                      <div style="font-size:11px; color:var(--text-muted);">${ch.arr || ''}</div>
                  </div>
                  <div class="card-body">
                      <div class="meta-tag">RAW PREVIEW</div>
                      <div style="font-size:11px; color:var(--text-muted); height:40px; overflow:hidden; margin-bottom:15px; line-height: 1.4;">
                          ${rawPreview}...
                      </div>
                      <div class="flex gap-2">
                          <button class="btn btn-ghost" style="padding:4px 8px; font-size:11px;" onclick="Library.copySource('${ch.id}')">Copy Source</button>
                      </div>
                  </div>
                  <div class="card-foot" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:5px;">
                      <button class="btn btn-ghost" title="Refined Content" onclick="Studio.open('${ch.id}', 'refined')">
                          <span class="status-dot ${sRefined}"></span> Refined
                      </button>
                      <button class="btn btn-ghost" title="Cheatsheet" onclick="Studio.open('${ch.id}', 'cheatsheet')">
                          <span class="status-dot ${sCheat}"></span> Sheet
                      </button>
                      <button class="btn btn-ghost" title="Problem Sheet" onclick="Studio.open('${ch.id}', 'problem')">
                          <span class="status-dot ${sProb}"></span> Problem
                      </button>
                      
                      <button class="btn btn-ghost" title="Quiz" onclick="Studio.open('${ch.id}', 'quiz')">
                          <span class="status-dot ${sQuiz}"></span> Quiz
                      </button>
                      <button class="btn btn-ghost" title="Flashcards" onclick="Studio.open('${ch.id}', 'flashcard')">
                          <span class="status-dot ${sFlash}"></span> Card
                      </button>
                      <button class="btn btn-ghost" title="Topics" onclick="Studio.open('${ch.id}', 'topic')">
                          <span class="status-dot ${sTopic}"></span> Topic
                      </button>
                  </div>
              </div>
          `;
      });
  }
};