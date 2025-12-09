// --- FLASHCARDS MODULE ---
const FlashcardRenderer = {
  renderFlashcards: (data) => {
      // 1. Data Normalization
      // The AI Prompt returns { title: "...", cards: [...] }
      // The Database might store just [...]
      let flashcards = [];
      
      if (data && Array.isArray(data)) {
          flashcards = data;
      } else if (data && data.cards && Array.isArray(data.cards)) {
          flashcards = data.cards;
      }

      if (flashcards.length === 0) {
          return '<div class="empty-state">No flashcards found. Check JSON format.</div>';
      }
      
      let html = `
          <div class="flashcards-preview">
              <div class="flashcards-header">
                  <h3>Flashcards (${flashcards.length} cards)</h3>
                  <p>Click on cards to flip them</p>
              </div>
              <div class="flashcards-grid">
      `;
      
      flashcards.forEach((card, index) => {
          html += `
              <div class="flashcard" onclick="this.classList.toggle('flipped')">
                  <div class="flashcard-inner">
                      <div class="flashcard-front">
                          <div class="card-number">${index + 1}</div>
                          <div class="card-content">
                              ${card.front || 'No Front Text'}
                          </div>
                          <div class="card-hint">Click to flip</div>
                      </div>
                      <div class="flashcard-back">
                          <div class="card-number">${index + 1}</div>
                          <div class="card-content">
                              ${card.back || 'No Back Text'}
                          </div>
                          <div class="card-hint">Click to flip back</div>
                      </div>
                  </div>
              </div>
          `;
      });
      
      html += `</div></div>`;
      return html;
  }
};