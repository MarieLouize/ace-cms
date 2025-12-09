// --- PROBLEM SHEET MAKER (MATH ENHANCED) ---
const ProblemSheetMaker = {
  questionCounter: 1,
  
  // NEW: Text Formatter for Math & Styles
  formatInline: (text) => {
      if (!text) return '';
      let formatted = text;

      // 1. Math Mode: $...$ -> <span class="math-inline">...</span>
      formatted = formatted.replace(/\$(.*?)\$/g, (match, inner) => {
          let html = inner
              // Basic Symbols
              .replace(/\\times/g, '&times;')
              .replace(/\\div/g, '&divide;')
              .replace(/<=/g, '&le;')
              .replace(/>=/g, '&ge;')
              
              // Fractions: \frac{num}{den} -> <sup>num</sup>&frasl;<sub>den</sub>
              .replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '<sup>$1</sup>&frasl;<sub>$2</sub>')
              
              // Permutation/Combination: ^nC_r -> <sup>n</sup>C<sub>r</sub>
              .replace(/\^([a-zA-Z0-9]+)/g, '<sup>$1</sup>')
              .replace(/_\{?([a-zA-Z0-9\-\(\)]+)\}?/g, '<sub>$1</sub>');

          return `<span class="math-inline">${html}</span>`;
      });

      // 2. Bold: **text** -> <strong>text</strong>
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      return formatted;
  },

  parseToBlocks: (text) => {
      ProblemSheetMaker.questionCounter = 1;
      const parsedData = ProblemSheetMaker.parseContent(text);
      const htmlBlocks = [];

      for (let block of parsedData) {
          try {
              // Helper to reduce repetition
              const fmt = ProblemSheetMaker.formatInline;

              // --- HEADER / SECTIONS ---
              if (block.type === 'header') {
                  htmlBlocks.push(`
                      <div class="header">
                          <h1>${fmt(block.title || 'Practice Sheet')}</h1>
                          <p>${fmt(block.subtitle || 'Test your knowledge!')}</p>
                      </div>`);
              } 
              else if (block.type === 'section') {
                  htmlBlocks.push(`<div class="section-title-wrapper"><h2 class="section-title">${fmt(block.title)}</h2></div>`);
              } 
              
              // --- MCQ ---
              else if (block.type === 'mcq') {
                  const opts = Array.isArray(block.options) ? block.options : [];
                  htmlBlocks.push(`
                      <div class="question-wrapper">
                          <div class="question">
                              <p class="question-text"><strong>${ProblemSheetMaker.questionCounter}.</strong> ${fmt(block.question)}</p>
                              <div class="options">
                                  ${opts.map(opt => `
                                      <div class="option">
                                          <div class="custom-checkbox"></div>
                                          <label>${fmt(opt.replace(/^[A-Z]\)\s*/, ''))}</label>
                                      </div>
                                  `).join('')}
                              </div>
                          </div>
                      </div>`);
                  ProblemSheetMaker.questionCounter++;
              } 
              
              // --- TRUE/FALSE ---
              else if (block.type === 'truefalse') {
                  htmlBlocks.push(`
                      <div class="question-wrapper">
                          <div class="tf-question">
                              <div class="tf-text"><strong>${ProblemSheetMaker.questionCounter}.</strong> ${fmt(block.question)}</div>
                              <div class="tf-options"><div class="tf-box">T</div><div class="tf-box">F</div></div>
                          </div>
                      </div>`);
                  ProblemSheetMaker.questionCounter++;
              }

              // --- FILL IN BLANKS ---
              else if (block.type === 'fill') {
                  // Format the question text FIRST, then replace underscores
                  let qText = fmt(block.question || 'Fill in the blanks...');
                  const formattedQ = qText.replace(/___+/g, '<input class="blank-input" type="text" disabled>');
                  
                  htmlBlocks.push(`
                      <div class="question-wrapper">
                          <div class="question">
                              <p class="question-text"><strong>${ProblemSheetMaker.questionCounter}.</strong> ${formattedQ}</p>
                          </div>
                      </div>`);
                  ProblemSheetMaker.questionCounter++;
              }

              // --- MATCHING ---
              else if (block.type === 'match') {
                  const leftItems = Array.isArray(block.left) ? block.left : [];
                  const rightItems = Array.isArray(block.right) ? block.right : [];
                  
                  htmlBlocks.push(`
                      <div class="question-wrapper">
                          <div class="question">
                              <p class="question-text"><strong>${ProblemSheetMaker.questionCounter}.</strong> ${fmt(block.title || 'Match the items:')}</p>
                              <div class="matching-container">
                                  <div class="matching-column">
                                      ${leftItems.map(item => `
                                          <div class="matching-item">
                                              <div class="match-letter">${item.charAt(0)}</div>
                                              <span>${fmt(item.substring(2).trim())}</span>
                                          </div>
                                      `).join('')}
                                  </div>
                                  <div class="matching-column">
                                      ${rightItems.map(item => `
                                          <div class="matching-item">
                                              <div class="answer-line"></div>
                                              <span>${fmt(item.replace(/^\d+\)\s*/, ''))}</span>
                                          </div>
                                      `).join('')}
                                  </div>
                              </div>
                          </div>
                      </div>`);
                  ProblemSheetMaker.questionCounter++;
              }

              // --- RANKING ---
              else if (block.type === 'rank') {
                  const items = Array.isArray(block.items) ? block.items : [];
                  htmlBlocks.push(`
                      <div class="question-wrapper">
                          <div class="question">
                              <p class="question-text"><strong>${ProblemSheetMaker.questionCounter}.</strong> ${fmt(block.question || 'Rank these:')}</p>
                              <div class="ranking-items">
                                  ${items.map(item => `
                                      <div class="ranking-item">
                                          <div class="rank-box"></div>
                                          <span>${fmt(item.replace(/^-\s*/, ''))}</span>
                                      </div>
                                  `).join('')}
                              </div>
                          </div>
                      </div>`);
                  ProblemSheetMaker.questionCounter++;
              }

              // --- CODE ---
              else if (block.type === 'code') {
                  htmlBlocks.push(`
                      <div class="question-wrapper">
                          <div class="question">
                              <p class="question-text"><strong>${ProblemSheetMaker.questionCounter}.</strong> ${fmt(block.question)}</p>
                              <div class="code-question"><pre>${block.code || '// No code provided'}</pre></div>
                          </div>
                      </div>`);
                  ProblemSheetMaker.questionCounter++;
              }
          } catch (err) {
              console.error("Error rendering block:", block, err);
          }
      }
      return htmlBlocks;
  },

  parseContent: (text) => {
      const blocks = [];
      if (!text) return blocks;
      
      const lines = text.split('\n');
      let currentBlock = null;

      for (let i = 0; i < lines.length; i++) {
          const line = lines[i]; 
          const trimLine = line.trim();

          if (trimLine.startsWith('[') && trimLine.endsWith(']')) {
              if (currentBlock) blocks.push(currentBlock);
              const blockType = trimLine.slice(1, -1).toLowerCase();
              
              currentBlock = { type: blockType };
              
              if (blockType === 'mcq') currentBlock.options = [];
              else if (blockType === 'match') { currentBlock.left = []; currentBlock.right = []; currentBlock.onRight = false; }
              else if (blockType === 'rank') currentBlock.items = [];
              else if (blockType === 'code') currentBlock.code = '';
              
          } else if (currentBlock) {
              if (trimLine.startsWith('Title:')) currentBlock.title = trimLine.substring(6).trim();
              else if (trimLine.startsWith('Subtitle:')) currentBlock.subtitle = trimLine.substring(9).trim();
              else if (trimLine.startsWith('Question:')) currentBlock.question = trimLine.substring(9).trim();
              
              else if (currentBlock.type === 'mcq' && trimLine.match(/^[A-E]\)/)) {
                  currentBlock.options.push(trimLine);
              }
              else if (currentBlock.type === 'rank' && (trimLine.startsWith('-') || trimLine.startsWith('$'))) { 
                  // Accept $ for math lines as list items too
                  currentBlock.items.push(trimLine);
              }
              else if (currentBlock.type === 'match') {
                  if (trimLine === '---') currentBlock.onRight = true;
                  else if (trimLine.length > 0) {
                      if (currentBlock.onRight) currentBlock.right.push(trimLine);
                      else currentBlock.left.push(trimLine);
                  }
              }
              else if (currentBlock.type === 'code') {
                  if (!trimLine.startsWith('Code:')) {
                      currentBlock.code += line + '\n';
                  }
              }
          }
      }
      if (currentBlock) blocks.push(currentBlock);
      return blocks;
  }
};