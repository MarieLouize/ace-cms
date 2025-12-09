// --- 7. STUDIO MODULE (FINAL) ---
const Studio = {
  TYPE_MAP: { 
      'topic': 'TOPIC', 
      'quiz': 'QUIZ', 
      'flashcard': 'FLASHCARD', 
      'cheatsheet': 'CHEATSHEET', 
      'problem': 'PROBLEM',
      'refined': 'REFINED' 
  },
  
  activeSlotIndex: 0,

  // --- AI PROMPTS ---
  PROMPTS: {
      flashcard: `Role: Expert Assessment Creator.\nTask: Generate flashcards from content.\nFormat JSON:\n{ "title": "...", "cards": [{ "front": "...", "back": "..." }] }`,
      quiz: `Role: Expert Assessment Creator.\nTask: Generate 75+ questions (Easy/Medium/Hard).\nFormat JSON:\n{ "title": "...", "questions": [{ "type": "mcq", "question": "...", "options": [], "answer": "...", "explanation": "..." }] }`,
      topic: `Role: Content Architect.\nTask: Structure Course Module.\nFormat JSON:\n{ "title": "...", "sections": [{ "type": "intro", ... }, { "type": "section", ... }, { "type": "quiz", ... }] }`,
      cheatsheet: `Role: Strict Content Compiler.\nTask: Create a Cheat Sheet.\nRules:\n1. Every [TAG] on a new line.\n2. "Title:" on line AFTER tag.\n[HEADER]\n[CARD]\n[TABLE]\n[TIMELINE]\n[COMPARISON]\n[FORMULA]`,
      problem: `Role: Strict Content Compiler.\nTask: Create a Problem Sheet.\nRules:\n1. Every [TAG] on a new line.\n[HEADER]\n[MCQ]\n[MATCH]\n[FILL]\n[CODE]`,
      refined: `Role: Content Editor.\nTask: Improve clarity, tone, and flow. Retain all key information but make it concise and engaging. Return plain text.`
  },

  open: async (id, type) => {
      // 1. SAFETY: Clear previous state before setting new one
      Studio.close(); 
      
      // 2. SET NEW STATE
      State.activeChapterId = id;
      State.activeMode = type;
      
      const ch = State.chapters.find(c => c.id === id);
      if (!ch) return App.toast("Chapter not found in memory", "error");
      
      document.getElementById('studio').classList.add('open');
      document.getElementById('stTitle').innerText = ch.title;
      document.getElementById('stBadge').innerText = type.toUpperCase();
      
      Studio.setupInterface(type, ch);
  },
  
  close: () => {
      document.getElementById('studio').classList.remove('open');
      document.getElementById('previewContainer').innerHTML = '';
      
      // 3. CLEANUP: Wipe ID so next save cannot overwrite this chapter
      State.activeChapterId = null;
      State.activeMode = null;
  },

  setupInterface: (type, ch) => {
      const tools = document.getElementById('editorTools');
      const editor = document.getElementById('codeEditor'); 
      const visualBuilder = document.getElementById('visualBuilder'); 
      const status = document.getElementById('jsonStatus');
      const controls = document.getElementById('stControls');
      
      tools.innerHTML = '';
      
      // Inject Prompt Button
      controls.innerHTML = `<button class="btn btn-ghost" onclick="Studio.copyPrompt('${type}')">🤖 AI Prompt</button>`;
      
      // === CASE A: TOPIC MODE (Visual Slots) ===
      if (type === 'topic') {
          editor.classList.add('hidden'); 
          visualBuilder.classList.remove('hidden'); 
          status.classList.add('hidden');

          let modules = ch.topic_modules || [];
          Studio.renderSlots(modules);

          tools.innerHTML = `
              <button class="btn btn-primary" onclick="Studio.addSlot()">+ Add Module</button>
              <button class="btn btn-ghost" onclick="Studio.refreshActivePreview()">🔄 Refresh View</button>
          `;
      } 
      // === CASE B: TEXT/JSON MODES ===
      else {
          editor.classList.remove('hidden');
          visualBuilder.classList.add('hidden');
          
          let content = '';
          
          // Sub-Case B1: JSON Data (Quiz/Flashcard)
          if(['quiz', 'flashcard'].includes(type)) {
               let data = type === 'quiz' ? ch.quizzes : ch.flashcards;
               content = JSON.stringify(data || [], null, 2);
               tools.innerHTML = `<button class="btn btn-ghost" onclick="Studio.validateAndRenderJSON('${type}')">Validate JSON</button>`;
          } 
          // Sub-Case B2: Text Content (Cheatsheet, Problem, Refined)
          else {
               if (type === 'cheatsheet') content = ch.cheatsheets;
               else if (type === 'problem') content = ch.problem_sheets;
               else if (type === 'refined') content = ch.refined_content;

               content = content || ''; 
               
               // RENDER BUTTON LOGIC
               if (type === 'refined') {
                   // Refined = No Render Button (Just text editing)
                   tools.innerHTML = `<span style="font-size:12px; color:#666;">Text Mode Only</span>`;
                   document.getElementById('previewContainer').innerHTML = `<div class="empty-state">Refined Content is text-only.<br>No visual preview available.</div>`;
               } else {
                   // Cheatsheet/Problem = Visual Render Button
                   tools.innerHTML = `<button class="btn btn-ghost" onclick="Studio.renderVisual('${type}')">Render Preview</button>`;
                   // Initial Render
                   if(content) Studio.renderVisual(type);
               }
          }
          editor.value = content;
          
          // Initial Validate for JSON types
          if(['quiz', 'flashcard'].includes(type)) Studio.validateAndRenderJSON(type);
      }
  },

  copyPrompt: (type) => {
      const promptText = Studio.PROMPTS[type] || "No prompt available.";
      App.copy(promptText);
      App.toast(`Copied ${type} prompt!`);
  },

  // --- SLOT LOGIC (FIXED: Passive & Robust) ---
  renderSlots: (modules) => {
      const container = document.getElementById('visualBuilder');
      container.innerHTML = '';

      if (!modules || !Array.isArray(modules) || modules.length === 0) {
          modules = [{ title: "New Module", sections: [] }];
      }

      modules.forEach((mod, index) => {
          // 1. Extract Data (Handle DB Wrapper)
          let data = mod;
          if (mod && mod.content) {
              data = mod.content; // Strip DB columns (id, created_at)
          }

          // 2. Handle Stringified JSON
          if (typeof data === 'string') {
              try { 
                  data = JSON.parse(data);
                  // Handle Double-Stringified (Supabase edge case)
                  if (typeof data === 'string') data = JSON.parse(data);
              } catch (e) {
                  console.warn("Parse Error", e);
                  data = { error: "Could not parse JSON", raw: data }; 
              }
          }

          // 3. Fallback Title (Visual only)
          const displayTitle = data.title || mod.title || "Untitled Module";

          // 4. PRETTY PRINT (Reformat logic)
          const jsonString = JSON.stringify(data, null, 2);

          const slot = document.createElement('div');
          slot.className = 'topic-block';
          slot.id = `slot-${index}`;
          slot.onclick = () => Studio.activateSlot(index);

          slot.innerHTML = `
              <div class="topic-block-header">
                  <span class="topic-count">Module ${index + 1}</span>
                  <div class="block-controls">
                      <button class="btn-mini" onclick="Studio.formatSlot(${index}); event.stopPropagation();">✨ Format</button>
                      <button class="btn-mini text-danger" onclick="Studio.deleteSlot(${index}); event.stopPropagation();">✕</button>
                  </div>
              </div>
              <div class="field-group">
                  <textarea id="slot-editor-${index}" class="builder-textarea" 
                            spellcheck="false"
                            placeholder="Paste JSON here..."
                            oninput="Studio.validateSlot(${index})">${jsonString}</textarea>
                  <div id="slot-msg-${index}" style="font-size:11px; margin-top:5px; color:#666;">Valid JSON required</div>
              </div>
          `;
          container.appendChild(slot);
      });
      
      if (modules.length > 0) Studio.activateSlot(0); 
  },
  
  activateSlot: (index) => {
      Studio.activeSlotIndex = index;
      document.querySelectorAll('.topic-block').forEach((el, idx) => {
          if (idx === index) el.classList.add('active');
          else el.classList.remove('active');
      });
      Studio.refreshActivePreview();
  },

  refreshActivePreview: () => {
      const index = Studio.activeSlotIndex;
      const editor = document.getElementById(`slot-editor-${index}`);
      if (!editor) return;

      try {
          const rawJSON = JSON.parse(editor.value);
          let courseData = {};

          // ADAPTIVE PREVIEW: Handle both Module and Course structures
          if (rawJSON.modules && Array.isArray(rawJSON.modules)) {
              courseData = rawJSON;
          } else {
              courseData = {
                  title: document.getElementById('stTitle').innerText,
                  modules: [rawJSON] 
              };
          }
          
          const html = TopicRenderer.renderCourse(courseData);
          document.getElementById('previewContainer').innerHTML = `<div class="interactive-preview">${html}</div>`;
      } catch (e) { }
  },

  addSlot: () => {
      const currentData = Studio.scrapeSlots();
      currentData.push({ title: "New Module", sections: [] });
      Studio.renderSlots(currentData);
      Studio.activateSlot(currentData.length - 1);
  },

  deleteSlot: (index) => {
      if(!confirm("Delete this module slot?")) return;
      const currentData = Studio.scrapeSlots();
      currentData.splice(index, 1);
      Studio.renderSlots(currentData);
      Studio.activateSlot(Math.max(0, index - 1));
  },

  formatSlot: (index) => {
      const area = document.getElementById(`slot-editor-${index}`);
      try { 
          const obj = JSON.parse(area.value);
          area.value = JSON.stringify(obj, null, 2); 
          Studio.validateSlot(index);
      } catch(e) { App.toast('Invalid JSON', 'error'); }
  },

  validateSlot: (index) => {
      const area = document.getElementById(`slot-editor-${index}`);
      const msg = document.getElementById(`slot-msg-${index}`);
      
      try {
          JSON.parse(area.value);
          msg.innerText = "✅ Valid JSON"; 
          msg.style.color = "var(--success)"; 
          area.style.borderColor = "var(--success)";
          
          if (index === Studio.activeSlotIndex) { 
              clearTimeout(Studio.autoSaveTimer); 
              Studio.autoSaveTimer = setTimeout(() => Studio.refreshActivePreview(), 800); 
          }
      } catch(e) { 
          msg.innerText = "❌ Invalid JSON syntax"; 
          msg.style.color = "var(--danger)"; 
          area.style.borderColor = "var(--danger)"; 
      }
  },

  scrapeSlots: () => {
      const container = document.getElementById('visualBuilder');
      const editors = container.querySelectorAll('textarea');
      const modules = [];
      editors.forEach(area => {
          try { modules.push(JSON.parse(area.value)); } 
          catch(e) { }
      });
      return modules;
  },

  // --- SAVE ---
  // --- SAVE ---
  save: async () => {
    const mode = State.activeMode;
    const backendType = Studio.TYPE_MAP[mode];
    
    if (!State.activeChapterId) return App.alert("Session Error", "Chapter ID lost. Please close and re-open.", "❌");

    let payload;

    if (mode === 'topic') {
        // 1. Scrape the slots exactly as they are
        const rawModules = Studio.scrapeSlots();
        if (rawModules.length === 0) return App.toast("No valid modules", "error");
        
        // === FIX: DO NOT UNWRAP ===
        // We send the array of slots exactly as the user defined them.
        // If Slot 1 contains a full Course Object { modules: [...] }, 
        // we send that object intact.
        payload = rawModules; 
        // ==========================

    } else {
        // (Text/JSON Logic for other modes)
        const rawValue = document.getElementById('codeEditor').value;
        if(['quiz','flashcard'].includes(mode)) {
            try { payload = JSON.parse(rawValue); }
            catch(e) { return App.alert("Error", "Invalid JSON", "❌"); }
        } else {
            payload = rawValue;
        }
    }

    try {
        App.toast(`Saving ${mode}...`);
        
        const res = await fetch(`${CONFIG.api}/process/${State.activeChapterId}`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ type: backendType, payload: payload })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Save Failed');
        }

        if (['cheatsheet', 'problem'].includes(mode)) {
            await Studio.triggerPdfUpload(payload, mode);
        }

        App.toast('Saved Successfully!', 'success');
        
        localStorage.removeItem(`ace_draft_${State.activeChapterId}_${mode}`);
        Studio.close();
        Library.fetch();

    } catch(e) {
        console.error(e);
        App.alert("Save Failed", e.message, "❌");
    }
},

  triggerPdfUpload: async (rawText, mode) => {
      try {
          App.toast('Generating PDF...', 'info');
          const pdfBlob = await StudySheetMaker.createPDFBlob(rawText, mode);
          const formData = new FormData();
          formData.append('file', pdfBlob, `${mode}.pdf`);
          
          const uploadRes = await fetch(`${CONFIG.api}/process/${State.activeChapterId}/upload-pdf?type=${mode}`, {
              method: 'POST',
              body: formData
          });

          if (!uploadRes.ok) throw new Error('Upload Failed');
          App.toast('PDF Uploaded!', 'success');
      } catch(e) { 
          console.error("PDF Workflow Failed:", e);
          throw e; 
      }
  },

  validateAndRenderJSON: (type) => {
      const editor = document.getElementById('codeEditor');
      try {
          const data = JSON.parse(editor.value);
          const container = document.getElementById('previewContainer');
          if(type === 'quiz') container.innerHTML = `<pre style="color:var(--success)">${JSON.stringify(data.questions || data, null, 2)}</pre>`;
          if(type === 'flashcard') container.innerHTML = FlashcardRenderer.renderFlashcards(data.cards || data);
      } catch(e) { /* silent fail */ }
  },

  renderVisual: (type) => {
      const raw = document.getElementById('codeEditor').value;
      const container = document.getElementById('previewContainer');
      container.innerHTML = StudySheetMaker.generatePrintPreview(raw, type);
  }
};