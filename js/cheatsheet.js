// --- CHEATSHEET MAKER (MATH & FORMATTING SUPPORT) ---
const CheatsheetMaker = {
  
  parseToBlocks: (text) => {
      const parsedData = CheatsheetMaker.parseContent(text);
      const htmlBlocks = [];

      for (let block of parsedData) {
          // 1. HEADER
          if (block.type === 'header') {
              htmlBlocks.push(`
                  <div class="header">
                      <h1>${CheatsheetMaker.formatText(block.title || 'Cheatsheet')} <span class="sparkle">💚</span></h1>
                      <p>${CheatsheetMaker.formatText(block.subtitle || '')}</p>
                  </div>`);
          } 
          // 2. CARD
          else if (block.type === 'card') {
              htmlBlocks.push(`
                  <div class="card">
                      <h2>${CheatsheetMaker.formatText(block.title)}</h2>
                      <ul>
                          ${block.items.map(item => `<li>${CheatsheetMaker.formatText(item)}</li>`).join('')}
                      </ul>
                  </div>`);
          } 
          // 3. NOTE
          else if (block.type === 'note') {
              htmlBlocks.push(`
                  <div class="sticky-note">
                      <h3>${CheatsheetMaker.formatText(block.title)}</h3>
                      <div class="note-content">${CheatsheetMaker.formatText(block.content, true)}</div>
                  </div>`);
          } 
          // 4. TABLE
          else if (block.type === 'table') {
              htmlBlocks.push(`
                  <div class="table-box">
                      <h3 style="padding:15px; border-bottom:1px solid #eee;">${CheatsheetMaker.formatText(block.title)}</h3>
                      <table>
                          <thead>
                              <tr>${block.headers.map(h => `<th>${CheatsheetMaker.formatText(h)}</th>`).join('')}</tr>
                          </thead>
                          <tbody>
                              ${block.rows.map(row => `<tr>${row.map(cell => `<td>${CheatsheetMaker.formatText(cell)}</td>`).join('')}</tr>`).join('')}
                          </tbody>
                      </table>
                  </div>`);
          } 
          // 5. CODE (No formatting, strictly monospace)
          else if (block.type === 'code') {
              htmlBlocks.push(`<div class="code-box"><pre>${block.content}</pre></div>`);
          }
          // 6. COMPARISON
          else if (block.type === 'comparison') {
              htmlBlocks.push(`
                  <div class="comparison-box">
                      <h3>${CheatsheetMaker.formatText(block.title)}</h3>
                      <div class="comparison-grid">
                          ${block.items.map(item => `
                              <div class="comparison-item">
                                  <h4>${CheatsheetMaker.formatText(item.label)}</h4>
                                  <p>${CheatsheetMaker.formatText(item.desc)}</p>
                              </div>
                          `).join('')}
                      </div>
                  </div>`);
          }
          // 7. TIMELINE
          else if (block.type === 'timeline') {
              htmlBlocks.push(`
                  <div class="timeline-box">
                      ${block.title ? `<h3 style="margin-bottom:20px; color:var(--theme-primary);">${CheatsheetMaker.formatText(block.title)}</h3>` : ''}
                      ${block.steps.map((step, i) => `
                          <div class="timeline-item">
                              <div class="timeline-marker">${i+1}</div>
                              <div class="timeline-content">
                                  <h4>${CheatsheetMaker.formatText(step.label)}</h4>
                                  <p>${CheatsheetMaker.formatText(step.desc)}</p>
                              </div>
                          </div>
                      `).join('')}
                  </div>`);
          }
          // 8. CALLOUT
          else if (block.type === 'callout') {
              htmlBlocks.push(`
                  <div class="callout-box">
                      <h3>${CheatsheetMaker.formatText(block.title)}</h3>
                      <p>${CheatsheetMaker.formatText(block.content, true)}</p>
                  </div>`);
          }
          // 9. FORMULA (Special Math Block)
          else if (block.type === 'formula') {
              htmlBlocks.push(`
                  <div class="formula-box">
                      <div class="description"><strong>${CheatsheetMaker.formatText(block.title)}</strong></div>
                      <div class="formula">${CheatsheetMaker.formatMath(block.formula)}</div>
                      <div class="description">${CheatsheetMaker.formatText(block.desc)}</div>
                  </div>`);
          }
      }
      return htmlBlocks;
  },

  // --- TEXT FORMATTING ENGINE ---
  formatText: (text, allowNewlines = false) => {
      if (!text) return '';
      
      let formatted = text;

      // 1. Handle Newlines (if allowed, e.g. Notes)
      if (allowNewlines) {
          formatted = formatted.replace(/\n/g, '<br>');
      }

      // 2. Auto-Bold "Term: Definition"
      // Looks for "Word:" or "Two Words:" at start of string or new line
      formatted = formatted.replace(/(^|<br>)([^:]+):/g, '$1<strong>$2:</strong>');

      // 3. Inline Math Parsing ($...$)
      formatted = formatted.replace(/\$([^\$]+)\$/g, (match, mathContent) => {
          return `<span class="math-inline">${CheatsheetMaker.formatMath(mathContent)}</span>`;
      });

      return formatted;
  },

  // --- MATH SYMBOL PARSER ---
  formatMath: (latex) => {
      let m = latex;
      // Basic Replacements
      m = m.replace(/\\times/g, '&times;'); // \times -> ×
      m = m.replace(/\\dots/g, '…');       // \dots -> …
      m = m.replace(/\\approx/g, '≈');     // \approx -> ≈
      m = m.replace(/\\neq/g, '≠');        // \neq -> ≠
      m = m.replace(/\\leq/g, '≤');        // \leq -> ≤
      m = m.replace(/\\geq/g, '≥');        // \geq -> ≥
      m = m.replace(/\\rightarrow/g, '→'); // \rightarrow -> →
      
      // Subscripts: U_1 -> U<sub>1</sub> or U_{total} -> U<sub>total</sub>
      m = m.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
      m = m.replace(/_([a-zA-Z0-9]+)/g, '<sub>$1</sub>');
      
      // Superscripts: n^2 -> n<sup>2</sup>
      m = m.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
      m = m.replace(/\^([a-zA-Z0-9]+)/g, '<sup>$1</sup>');

      return m;
  },

  parseContent: (text) => {
      // (Keep existing parseContent logic exactly as is)
      const blocks = [];
      if(!text) return blocks;
      const lines = text.split('\n');
      let currentBlock = null;

      for (let line of lines) {
          const trimLine = line.trim();
          if (trimLine.startsWith('[') && trimLine.endsWith(']')) {
              if (currentBlock) blocks.push(currentBlock);
              const blockType = trimLine.slice(1, -1).toLowerCase();
              currentBlock = { type: blockType };
              
              if (blockType === 'header') { currentBlock.title = ''; currentBlock.subtitle = ''; }
              else if (blockType === 'card') { currentBlock.title = ''; currentBlock.items = []; }
              else if (blockType === 'table') { currentBlock.title = ''; currentBlock.headers = []; currentBlock.rows = []; }
              else if (['note','code','callout'].includes(blockType)) { currentBlock.title = ''; currentBlock.content = ''; }
              else if (blockType === 'comparison') { currentBlock.title = ''; currentBlock.items = []; }
              else if (blockType === 'timeline') { currentBlock.title = ''; currentBlock.steps = []; }
              else if (blockType === 'formula') { currentBlock.title = ''; currentBlock.formula = ''; currentBlock.desc = ''; }
          }
          else if (currentBlock) {
              if (trimLine.startsWith('Title:')) currentBlock.title = trimLine.substring(6).trim();
              else if (trimLine.startsWith('Subtitle:')) currentBlock.subtitle = trimLine.substring(9).trim();
              
              else if (currentBlock.type === 'card' && (trimLine.startsWith('-') || trimLine.startsWith('•'))) {
                  currentBlock.items.push(trimLine.substring(1).trim());
              }
              // Card fallback for plain lines (Definition style)
              else if (currentBlock.type === 'card' && trimLine) {
                  currentBlock.items.push(trimLine);
              }
              else if (currentBlock.type === 'table' && trimLine.includes('|')) {
                  const cells = trimLine.split('|').map(c => c.trim());
                  if (currentBlock.headers.length === 0) currentBlock.headers = cells;
                  else currentBlock.rows.push(cells);
              }
              else if (['note','callout'].includes(currentBlock.type)) {
                  if (currentBlock.content) currentBlock.content += '\n';
                  currentBlock.content += line; 
              }
              else if (currentBlock.type === 'code') {
                  currentBlock.content += line + '\n';
              }
              else if (['comparison','timeline'].includes(currentBlock.type) && trimLine.includes(':')) {
                  const firstColon = trimLine.indexOf(':');
                  const label = trimLine.substring(0, firstColon).trim();
                  const desc = trimLine.substring(firstColon + 1).trim();
                  if(currentBlock.type === 'comparison') currentBlock.items.push({label, desc});
                  else currentBlock.steps.push({label, desc});
              }
              else if (currentBlock.type === 'formula') {
                  if (trimLine.startsWith('Formula:')) currentBlock.formula = trimLine.substring(8).trim();
                  else if (trimLine.startsWith('Description:')) currentBlock.desc = trimLine.substring(12).trim();
              }
          }
      }
      if (currentBlock) blocks.push(currentBlock);
      return blocks;
  },
  formatInline: (text) => {
    if (!text) return '';
    
    // Helper to process internal math symbols
    const processSymbols = (str) => {
        let s = str;
        
        // 1. Clean basic symbols
        s = s.replace(/\\times/g, '&times;')
             .replace(/\\div/g, '&divide;')
             .replace(/\\dots/g, '...')
             .replace(/\\le/g, '&le;')
             .replace(/\\ge/g, '&ge;');

        // 2. Fractions: \frac{num}{den}
        // Matches \frac{...}{...} non-greedily
        s = s.replace(/\\frac\{(.+?)\}\{(.+?)\}/g, 
            '<span class="fraction"><span class="num">$1</span><span class="den">$2</span></span>');

        // 3. Permutation/Combination specific fix: ^nC_r -> <sup>n</sup>C<sub>r</sub>
        // We handle this explicitly to ensure it renders nicely
        s = s.replace(/\^([a-zA-Z0-9]+)([PC])_([a-zA-Z0-9]+)/g, '<sup>$1</sup>$2<sub>$3</sub>');

        // 4. General Superscripts (e.g. ^n or ^{...})
        s = s.replace(/\^\{?([a-zA-Z0-9]+)\}?/g, '<sup>$1</sup>');

        // 5. General Subscripts (e.g. _r or _{...} or _(n-r))
        // Added \(\) to allowed chars to capture (n-r)
        s = s.replace(/_\{?([a-zA-Z0-9\-\(\)]+)\}?/g, '<sub>$1</sub>');

        return s;
    };

    let formatted = text;

    // STEP 1: BLOCK MATH $$ ... $$
    // Use [\s\S]*? to match across newlines (critical for some editors)
    formatted = formatted.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
        return `<div class="math-block">${processSymbols(inner)}</div>`;
    });

    // STEP 2: INLINE MATH $ ... $
    // Exclude $ to prevent matching across multiple inline blocks
    formatted = formatted.replace(/\$([^\$]+?)\$/g, (match, inner) => {
        return `<span class="math-inline">${processSymbols(inner)}</span>`;
    });

    // STEP 3: Bold & Definitions
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/(^|<br>)([^:<>\n]+):/g, '$1<strong style="color:var(--theme-primary-dark)">$2:</strong>');
    
    return formatted;
},

};