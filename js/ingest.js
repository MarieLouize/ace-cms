// --- 3. INGESTION MODULE (BATCHED UPLOAD) ---
const Ingest = {
    // ... (Keep init, reset, paste, sanitize, handleFile, clean, analyze, toggleAccordion, removeSection) ...
    // COPY THE PREVIOUS FUNCTIONS HERE
    init: () => {
        document.getElementById('fileIn').addEventListener('change', Ingest.handleFile);
    },
    
    reset: () => {
        document.getElementById('rawMode').classList.remove('hidden');
        document.getElementById('stagedMode').classList.add('hidden');
        document.getElementById('uploadAction').classList.add('hidden');
        document.getElementById('accordionContainer').innerHTML = '';
        document.getElementById('headerPattern').value = ''; 
        App.toast('Ingestion reset');
    },

    paste: async () => {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('rawText').value = Ingest.sanitize(text); 
            App.toast('Text pasted');
        } catch (err) { App.toast('Clipboard error', 'error'); }
    },

    sanitize: (text) => {
        if (!text) return "";
        return text
            .replace(/\r\n/g, '\n')       
            .replace(/\r/g, '\n')         
            .replace(/\t/g, ' ')          
            .replace(/\u00A0/g, ' ')      
            .replace(/[\u200B-\u200D\uFEFF]/g, '') 
            .replace(/[ \t]+$/gm, '')     
            .trim();
    },
    
    handleFile: async (e) => {
        const f = e.target.files[0];
        if(!f) return;
        e.target.value = ''; 
        
        try {
            document.getElementById('rawText').value = "⏳ Parsing...";
            let text = "";
            
            if(f.name.endsWith('.pdf')) {
                if (window.pdfjsLib) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
                    const pdf = await pdfjsLib.getDocument(await f.arrayBuffer()).promise;
                    for(let i=1; i<=pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const pageText = content.items.map(item => item.str).join(' ');
                        text += pageText + '\n\n'; 
                    }
                }
            } else if(f.name.endsWith('.docx')) {
                if (window.mammoth) {
                    const result = await mammoth.extractRawText({arrayBuffer: await f.arrayBuffer()});
                    text = result.value;
                }
            }
            const cleanText = Ingest.sanitize(text);
            document.getElementById('rawText').value = cleanText;
            App.toast('File parsed & cleaned');
        } catch(err) { 
            console.error(err); 
            App.toast('Parsing failed', 'error'); 
            document.getElementById('rawText').value = "";
        }
    },
  
    clean: () => {
        let t = document.getElementById('rawText').value;
        document.getElementById('rawText').value = Ingest.sanitize(t);
        App.toast('Text cleaned');
    },
  
    analyze: () => {
        const patternInput = document.getElementById('headerPattern').value;
        const text = document.getElementById('rawText').value;
        
        if(!text) return App.toast("No text content found", "error");
        if(!patternInput) return App.toast("Please paste the first header example", "error");

        const pattern = Ingest.sanitize(patternInput);
        let safePattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const numberRegex = /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|i|ii|iii|iv|v|vi|vii|viii|ix|x)(?!\w)/i;
        const numberMatch = safePattern.match(numberRegex);
        let regexString = "";

        if (numberMatch) {
            const numberPart = numberMatch[0];
            const parts = safePattern.split(numberPart);
            const prefix = parts[0].replace(/\s+/g, '\\s+');
            const suffix = parts.slice(1).join(numberPart).replace(/\s+/g, '\\s+');
            regexString = `(?:^|\\n)\\s*${prefix}([\\d\\w\\.]+)\\s*${suffix}(.*)`;
        } else {
            const cleaned = safePattern.replace(/\s+/g, '\\s+');
            regexString = `(?:^|\\n)\\s*(${cleaned})(.*)`;
        }

        const regex = new RegExp(regexString, 'gi');
        const matches = [...text.matchAll(regex)];

        if(matches.length === 0) {
            return App.toast(`Could not find headers. Try simplifying your pattern.`, "error");
        }

        const sections = [];
        for (let i = 0; i < matches.length; i++) {
            const currentMatch = matches[i];
            const nextMatch = matches[i + 1];

            let fullTitle = currentMatch[0].trim().replace(/^\n/, '').trim();
            const startIndex = currentMatch.index + currentMatch[0].length;
            const endIndex = nextMatch ? nextMatch.index : text.length;
            let content = text.substring(startIndex, endIndex).trim();

            const capturedRest = currentMatch[currentMatch.length-1];
            if (capturedRest && capturedRest.trim().length < 3) {
                const contentLines = content.split('\n');
                if (contentLines.length > 0) {
                    const potentialTitle = contentLines[0].trim();
                    if (potentialTitle.length > 0 && potentialTitle.length < 100) {
                        fullTitle += " " + potentialTitle;
                        content = contentLines.slice(1).join('\n').trim();
                    }
                }
            }
            sections.push({
                fullTitle: fullTitle.replace(/\s+/g, ' '), 
                content: content
            });
        }

        document.getElementById('rawMode').classList.add('hidden');
        document.getElementById('stagedMode').classList.remove('hidden');
        document.getElementById('uploadAction').classList.remove('hidden');
        document.getElementById('stageCount').innerText = sections.length;

        const container = document.getElementById('accordionContainer');
        container.innerHTML = sections.map((sec, i) => `
            <div class="accordion-item" id="stage-${i}">
                <div class="accordion-header" onclick="Ingest.toggleAccordion('stage-${i}')">
                    <div class="accordion-title-display">
                        <span class="badge-count">#${i + 1}</span>
                        <span id="title-display-${i}" style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:250px;">
                            ${sec.fullTitle}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                         <span class="text-muted" style="font-size: 11px;">${sec.content.length} chars</span>
                         <span class="accordion-icon">▼</span>
                    </div>
                </div>
                <div class="accordion-body">
                    <div class="accordion-content">
                        <div>
                            <label class="meta-tag">Section Title</label>
                            <input type="text" class="input-field stage-title" 
                                value="${sec.fullTitle.replace(/"/g, '&quot;')}" 
                                oninput="document.getElementById('title-display-${i}').innerText = this.value">
                        </div>
                        <div>
                            <label class="meta-tag">Content</label>
                            <textarea class="input-field stage-content" style="height: 300px; font-family:monospace; line-height:1.5;">${sec.content}</textarea>
                        </div>
                        <div class="accordion-actions">
                            <button class="btn btn-danger" onclick="Ingest.removeSection('stage-${i}')">🗑️ Remove Section</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        App.toast(`Extracted ${sections.length} chapters!`);
    },

    toggleAccordion: (id) => {
        const el = document.getElementById(id);
        const wasActive = el.classList.contains('active');
        document.querySelectorAll('.accordion-item').forEach(item => item.classList.remove('active'));
        if(!wasActive) el.classList.add('active');
    },

    removeSection: (id) => {
        document.getElementById(id).remove();
        const remaining = document.querySelectorAll('.accordion-item').length;
        document.getElementById('stageCount').innerText = remaining;
    },
  
    // --- UPDATED: BATCHED UPLOAD LOGIC ---
    upload: async () => {
        const code = document.getElementById('metaCourse').value;
        if(!code) return App.toast('Course code required', 'error');

        const items = document.querySelectorAll('.accordion-item');
        if(items.length === 0) return App.toast("No sections to upload", "error");

        const allChapters = Array.from(items).map((el, index) => ({
            title: el.querySelector('.stage-title').value,
            raw_content: el.querySelector('.stage-content').value,
            course_code: code,
            arr: `${index + 1}/${items.length}`
        }));

        // CRITICAL CHANGE: Reduced to 1 for maximum safety with large content
        const BATCH_SIZE = 1; 
        const totalBatches = Math.ceil(allChapters.length / BATCH_SIZE);
        
        try {
            App.toast(`Starting upload of ${allChapters.length} chapters...`, 'success');
            
            for (let i = 0; i < totalBatches; i++) {
                const start = i * BATCH_SIZE;
                const end = start + BATCH_SIZE;
                const batch = allChapters.slice(start, end);
                
                // UX: Show progress
                App.toast(`Uploading chapter ${i + 1}/${allChapters.length}...`);
                
                const res = await fetch(`${CONFIG.api}/ingest`, {
                    method: 'POST', 
                    headers: {'Content-Type':'application/json'}, 
                    body: JSON.stringify({ chapters: batch })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(`Chapter ${i+1} failed: ${err.message}`);
                }
                
                // Tiny delay to prevent server choking
                await new Promise(r => setTimeout(r, 100));
            }

            App.alert('Ingestion Complete', `Successfully uploaded ${allChapters.length} chapters.`, '🚀');
            App.nav('library');
            Library.fetch(code); 
            Ingest.reset();

        } catch(e) { 
            App.alert('Upload Interrupted', e.message, '❌');
            console.error(e);
        }
    }
};