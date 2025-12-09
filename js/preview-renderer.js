// --- CENTRALIZED RENDER & PRINT LOGIC ---
const StudySheetMaker = {
  
  // Config Defaults
  config: { fontSize: 11, gap: 20, scale: 100 },

  // SAFE HEIGHT: 750px.
  // A4 (1122px) - Header(132) - Footer(95) - Padding(75) = 820px
  // We use 750px to provide a huge safety buffer for footers.
  SAFE_HEIGHT: 750, 

  triggerNativePrint: () => {
      const previewContent = document.getElementById('printPreviewContent').innerHTML;
      let portal = document.getElementById('printable-area');
      if (!portal) {
          portal = document.createElement('div');
          portal.id = 'printable-area';
          document.body.appendChild(portal);
      }
      portal.innerHTML = previewContent;
      window.print();
      setTimeout(() => { portal.innerHTML = ''; }, 1000);
  },

  updateSetting: (key, value) => {
      StudySheetMaker.config[key] = parseFloat(value);
      const activeType = document.getElementById('stBadge').innerText.toLowerCase();
      if(['cheatsheet', 'problem'].includes(activeType)) {
          Studio.renderVisual(activeType);
      }
  },

  paginateAndRender: (blocks, type) => {
      const { fontSize, gap, scale } = StudySheetMaker.config;
      const containerId = type === 'cheatsheet' ? 'cheatsheet-container' : 'problems-container';

      // 1. Measure Deck (Attached to BODY to ensure visibility)
      const measureDeck = document.createElement('div');
      
      // Exact width of the print content area (180mm = 210mm - 30mm margins)
      const contentWidthMM = 180 * (scale/100);
      
      measureDeck.style.cssText = `
          width: ${contentWidthMM}mm; 
          position: fixed; top: 0; left: -10000px; opacity: 0; pointer-events: none;
          --dynamic-font: ${fontSize}pt; 
          --dynamic-gap: ${gap}px;
          z-index: -1;
      `;
      measureDeck.className = containerId;
      
      // CRITICAL FIX: Append to BODY, not previewContainer. 
      // This ensures measurements work even if the Preview Tab is hidden.
      document.body.appendChild(measureDeck);

      const pages = [];
      let currentPageContent = [];
      let currentHeight = 0;

      // 2. Measure & Split Logic
      blocks.forEach((blockHTML) => {
          const wrapper = document.createElement('div');
          wrapper.style.paddingBottom = `${gap}px`; 
          wrapper.innerHTML = blockHTML;
          measureDeck.appendChild(wrapper);
          
          const elementHeight = wrapper.getBoundingClientRect().height;

          // If height is 0, something is wrong (hidden?), treat as small to avoid inf loop
          const safeElementHeight = elementHeight > 0 ? elementHeight : 50;

          if (currentHeight + safeElementHeight < StudySheetMaker.SAFE_HEIGHT) {
              // FITS
              currentPageContent.push(wrapper.outerHTML); 
              currentHeight += safeElementHeight;
          } else {
              // OVERFLOW -> NEW PAGE
              
              // Header Orphan Protection
              const lastItem = currentPageContent[currentPageContent.length - 1];
              const isTitle = lastItem && (lastItem.includes('class="section-title"') || lastItem.includes('h2') || lastItem.includes('h1'));
              
              if (isTitle && currentPageContent.length > 1) {
                  currentPageContent.pop(); 
                  pages.push(currentPageContent); 
                  currentPageContent = [lastItem, wrapper.outerHTML];
                  currentHeight = safeElementHeight + 60; 
              } else {
                  pages.push(currentPageContent);
                  currentPageContent = [wrapper.outerHTML];
                  currentHeight = safeElementHeight;
              }
          }
      });

      if (currentPageContent.length > 0) pages.push(currentPageContent);
      
      // Cleanup
      document.body.removeChild(measureDeck);

      return pages.map((pageContent, i) => StudySheetMaker.renderPage(pageContent.join(''), i + 1, pages.length, type)).join('');
  },

  renderPage: (contentHtml, pageNum, totalPages, type) => {
      const dateStr = new Date().toLocaleDateString();
      const { fontSize, gap, scale } = StudySheetMaker.config;
      const containerClass = type === 'cheatsheet' ? 'cheatsheet-container' : 'problems-container';
      const styleVars = `style="--dynamic-font: ${fontSize}pt; --dynamic-gap: ${gap}px;"`;

      return `
      <div class="a4-page" ${styleVars}>
          <div class="pdf-header">
              <div class="pdf-brand-group">
                  <div class="pdf-logo"><span>⚡ Ace</span> Revision Resource</div>
                  <div class="pdf-tagline">Last-Minute Essentials · Smarter notes for smarter learners.</div>
              </div>
              <div class="pdf-meta">
                  <div class="pdf-page-badge">Page ${pageNum} of ${totalPages}</div>
                  <span class="pdf-course-id">${dateStr}</span>
              </div>
          </div>

          <div class="pdf-content-area">
              <div class="${containerClass}" style="width: ${scale}%; margin: 0 auto;">
                  ${contentHtml}
              </div>
          </div>

          <div class="pdf-footer">
              <div class="footer-left">
                  <div class="footer-brand">powered by Axara</div>
                  <div class="footer-sub">The reliable way to understand anything.</div>
              </div>
              <div class="footer-cta">
                  <div class="footer-cta-text">Start learning now at <strong>acepadi.com</strong></div>
              </div>
          </div>
          
          <div class="pdf-watermark">AcePadi</div>
      </div>
      `;
  },

  generatePrintPreview: (rawText, type) => {
      let blocks = [];
      if (type === 'cheatsheet') blocks = CheatsheetMaker.parseToBlocks(rawText);
      else if (type === 'problem') blocks = ProblemSheetMaker.parseToBlocks(rawText);

      const pagedHtml = StudySheetMaker.paginateAndRender(blocks, type);
      const pageCount = (pagedHtml.match(/class="a4-page"/g) || []).length;
      
      return `
          <div class="print-preview">
              <div class="print-controls">
                  <div class="flex flex-col gap-4">
                      <div class="flex justify-between items-center border-b pb-3" style="border-color:#eee;">
                           <button class="btn btn-primary" onclick="StudySheetMaker.triggerNativePrint()">
                              🖨️ Print / Save PDF
                          </button>
                          <span style="color: var(--text-dark); font-size: 13px; font-weight:600;">
                              ${pageCount} Pages Ready
                          </span>
                      </div>
                      <div class="flex gap-6" style="color: #333; font-size: 12px;">
                          <div class="flex flex-col gap-1 flex-1">
                              <label>Text Size</label>
                              <input type="range" min="8" max="16" step="0.5" 
                                  value="${StudySheetMaker.config.fontSize}" 
                                  oninput="StudySheetMaker.updateSetting('fontSize', this.value)">
                          </div>
                          <div class="flex flex-col gap-1 flex-1">
                              <label>Item Spacing</label>
                              <input type="range" min="0" max="60" step="5" 
                                  value="${StudySheetMaker.config.gap}" 
                                  oninput="StudySheetMaker.updateSetting('gap', this.value)">
                          </div>
                          <div class="flex flex-col gap-1 flex-1">
                              <label>Content Width</label>
                              <input type="range" min="50" max="100" step="5" 
                                  value="${StudySheetMaker.config.scale}" 
                                  oninput="StudySheetMaker.updateSetting('scale', this.value)">
                          </div>
                      </div>
                  </div>
              </div>
              
              <div id="printPreviewContent">
                  ${pagedHtml}
              </div>
          </div>
      `;
  },

  createPDFBlob: async (rawText, type) => {
      // Robust Lib Check
      const jsPDFConstructor = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
      if (!jsPDFConstructor) throw new Error("jsPDF library not found.");
      
      // 1. Generate HTML (Will work now because measureDeck is on body)
      let blocks = [];
      if (type === 'cheatsheet') blocks = CheatsheetMaker.parseToBlocks(rawText);
      else if (type === 'problem') blocks = ProblemSheetMaker.parseToBlocks(rawText);

      const html = StudySheetMaker.paginateAndRender(blocks, type);

      // 2. Create Render Container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm'; 
      container.innerHTML = html;
      document.body.appendChild(container);

      // 3. Capture
      const pdf = new jsPDFConstructor('p', 'mm', 'a4');
      const pages = container.querySelectorAll('.a4-page');

      for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          
          // Wait for images
          const images = page.querySelectorAll('img');
          await Promise.all(Array.from(images).map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
          }));

          const canvas = await html2canvas(page, {
              scale: 2, 
              useCORS: true,
              logging: false
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          const imgWidth = 210; 
          const pageHeight = 297; 
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }

      document.body.removeChild(container);
      return pdf.output('blob');
  }
};