const TopicRenderer = {
  // Entry point: Handles the top-level Course object
  renderCourse: (courseData) => {
      if (!courseData) return '<div class="error-state">No data provided</div>';

      // Adaptability: Handle if user pasted a full Course OR just a single Module
      const modules = courseData.modules 
          ? courseData.modules 
          : (courseData.sections ? [courseData] : []);

      const title = courseData.title || "Untitled Course";

      return `
          <div class="course-wrapper">
              <div class="course-hero">
                  <div class="course-badge">${courseData.id || 'COURSE'}</div>
                  <h1>${title}</h1>
              </div>
              <div class="course-modules">
                  ${modules.map((mod, i) => TopicRenderer.renderModule(mod, i + 1)).join('')}
              </div>
          </div>
      `;
  },

  // Renders a single Module (The collapsible/block unit)
  renderModule: (mod, num) => {
      return `
          <div class="module-block">
              <div class="module-header-strip">
                  <span class="module-number">MODULE ${num}</span>
                  <h2>${mod.title}</h2>
              </div>
              <div class="module-content">
                  ${(mod.sections || []).map(sec => TopicRenderer.renderSection(sec)).join('')}
              </div>
          </div>
      `;
  },

  // Router: Decides which visual component to use based on 'type'
  renderSection: (sec) => {
      let innerHTML = '';
      
      switch (sec.type) {
          case 'intro': innerHTML = TopicRenderer.components.intro(sec); break;
          case 'section': innerHTML = TopicRenderer.components.content(sec); break;
          case 'quiz': innerHTML = TopicRenderer.components.quiz(sec); break;
          case 'summary': innerHTML = TopicRenderer.components.summary(sec); break;
          default: innerHTML = `<div class="unknown-block">Unknown Block Type: ${sec.type}</div>`;
      }

      return `
          <div class="topic-section ${sec.type}-section" id="${sec.id || ''}">
              ${innerHTML}
          </div>
      `;
  },

  // --- COMPONENT LIBRARY ---
  components: {
      
      // 1. INTRO COMPONENT
      intro: (data) => `
          <div class="intro-card">
              <div class="intro-header">
                  <h3>${data.title} 🚀</h3>
                  <p>${data.subtitle || ''}</p>
              </div>
              <div class="intro-grid">
                  <div class="intro-col">
                      <h4>🎯 Objectives</h4>
                      <ul>
                          ${(data.objectives || []).map(o => `<li>${o}</li>`).join('')}
                      </ul>
                  </div>
                  <div class="intro-col">
                      <h4>📋 Prerequisites</h4>
                      <ul>
                          ${(data.prerequisites || []).map(p => `<li>${p}</li>`).join('')}
                      </ul>
                  </div>
              </div>
              <div class="intro-meta">
                  <span>⏱ ${data.estimatedReadingTime || '5'} min</span>
                  <span>📚 ${data.level || 'Beginner'}</span>
              </div>
          </div>
      `,

      // 2. STANDARD CONTENT COMPONENT
      content: (data) => {
          // Check if there is "Struggling Content" (The Analogy)
          const helpBlock = data.strugglingContent ? `
              <div class="struggle-toggle">
                  <details>
                      <summary>💡 Confused? Click for an Analogy</summary>
                      <div class="struggle-content">${data.strugglingContent}</div>
                  </details>
              </div>
          ` : '';

          return `
              <div class="content-card">
                  <div class="content-header">
                      <h3>${data.title}</h3>
                      ${data.estimatedReadingTime ? `<span class="read-time">${data.estimatedReadingTime}m read</span>` : ''}
                  </div>
                  <div class="content-body">
                      ${data.content || ''}
                  </div>
                  ${helpBlock}
              </div>
          `;
      },

      // 3. QUIZ COMPONENT (Adaptive)
      quiz: (data) => {
          const questionsHtml = (data.questions || []).map((q, i) => {
              let inputArea = '';

              // A. Multiple Choice
              if (data.quizType === 'multiple-choice' && q.options) {
                  inputArea = `
                      <div class="quiz-options">
                          ${q.options.map(opt => `
                              <div class="quiz-opt ${opt.isCorrect ? 'correct-mock' : ''}">
                                  <div class="opt-radio"></div>
                                  <span>${opt.text}</span>
                              </div>
                          `).join('')}
                      </div>`;
              }
              // B. Fill In Blank
              else if (data.quizType === 'fill-blank') {
                  inputArea = `
                      <div class="quiz-input-area">
                          <input type="text" placeholder="Type answer here..." disabled>
                          <span class="answer-reveal">Answer: ${q.correctAnswer}</span>
                      </div>`;
              }
              // C. Drag & Drop (Simplified Visual)
              else if (data.quizType === 'drag-drop' && q.options && q.options.pairs) {
                  inputArea = `
                      <div class="quiz-match-grid">
                          ${q.options.pairs.map(pair => `
                              <div class="match-row">
                                  <div class="match-card">${pair.item}</div>
                                  <div class="match-connector">➡</div>
                                  <div class="match-card target">${pair.match}</div>
                              </div>
                          `).join('')}
                      </div>`;
              }

              return `
                  <div class="question-block">
                      <p class="q-text"><strong>Q${i+1}:</strong> ${q.question}</p>
                      ${inputArea}
                      ${q.explanation ? `<div class="quiz-explanation">🎓 <strong>Why:</strong> ${q.explanation}</div>` : ''}
                  </div>
              `;
          }).join('');

          return `
              <div class="quiz-card">
                  <div class="quiz-header">
                      <h3>⚡ ${data.title}</h3>
                      <p>${data.description}</p>
                  </div>
                  <div class="quiz-body">
                      ${questionsHtml}
                  </div>
              </div>
          `;
      },

      // 4. SUMMARY COMPONENT
      summary: (data) => `
          <div class="summary-card">
              <h3>🏆 ${data.title}</h3>
              <div class="summary-intro">${data.content}</div>
              <div class="summary-points">
                  ${(data.points || []).map(p => `
                      <div class="summary-item">
                          <div class="check-icon">✓</div>
                          <div>
                              <strong>${p.title}</strong>
                              <p>${p.content}</p>
                          </div>
                      </div>
                  `).join('')}
              </div>
          </div>
      `
  }
};