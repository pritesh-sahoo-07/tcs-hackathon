const form = document.querySelector('#recommendation-form');
const message = document.querySelector('#form-message');
const results = document.querySelector('#recommendation-results');
const recommendationList = document.querySelector('#recommendation-list');
const comboSection = document.querySelector('#combo-section');
const comboList = document.querySelector('#combo-list');
const noRecommendations = document.querySelector('#no-recommendations');
const budgetSummary = document.querySelector('#budget-summary');

function escapeHtml(value) { const el = document.createElement('span'); el.textContent = value || ''; return el.innerHTML; }
function foodVisual(item) { return item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}">` : '<span aria-hidden="true">🍛</span>'; }
function recommendationCard(item) {
  const tags = item.dietary_info.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('') || '<span>Campus pick</span>';
  const reasons = item.explanation.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('');
  return `<article class="recommendation-card glass-card"><div class="recommendation-image">${foodVisual(item)}</div><div class="recommendation-top"><div><p>${escapeHtml(item.category)}</p><h3>${escapeHtml(item.name)}</h3></div><div class="match-circle"><strong>${item.match_percentage}%</strong><small>match</small></div></div><div class="recommendation-stats"><span>₹${item.price.toFixed(2)}</span><span>◷ ${item.preparation_time} min</span><span class="available-badge">Available</span></div><div class="menu-tags">${tags}</div><div class="recommendation-why"><b>Why we picked it</b><ul>${reasons}</ul></div></article>`;
}
function comboCard(combo) { const items = combo.items.map((item) => `${escapeHtml(item.name)} · ₹${item.price.toFixed(2)}`).join('<br>'); return `<article class="combo-card glass-card"><div><p>${escapeHtml(combo.name)}</p><small>${items}</small></div><div><strong>₹${combo.total_price.toFixed(2)}</strong><span>₹${combo.savings_from_budget.toFixed(2)} left</span></div></article>`; }
function setMessage(text, type) { message.textContent = text; message.className = `form-message ${type}`; }
async function findRecommendations(payload) {
  const token = form.querySelector('[name=csrfmiddlewaretoken]').value;
  const response = await fetch('/api/recommend/', { method: 'POST', headers: {'Content-Type': 'application/json', 'X-CSRFToken': token}, credentials: 'same-origin', body: JSON.stringify(payload) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to get recommendations right now.'); return data;
}
function renderResults(data, budget) {
  recommendationList.innerHTML = data.recommendations.map(recommendationCard).join(''); comboList.innerHTML = data.combos.map(comboCard).join('');
  budgetSummary.textContent = `Budget: ₹${Number(budget).toFixed(2)}`; noRecommendations.hidden = data.recommendations.length !== 0; noRecommendations.textContent = data.message || 'No recommendations matched your preferences.'; comboSection.hidden = data.combos.length === 0; results.hidden = false;
}
if (form && message) form.addEventListener('submit', async (event) => { event.preventDefault(); if (!form.checkValidity()) { setMessage('Please complete every field with a valid budget.', 'error'); form.reportValidity(); return; } const button = form.querySelector('button[type=submit]'); const payload = Object.fromEntries(new FormData(form).entries()); button.disabled = true; button.classList.add('is-loading'); setMessage('Analyzing today’s menu…', 'loading'); results.hidden = true; try { const data = await findRecommendations(payload); renderResults(data, payload.budget); setMessage(data.message, data.recommendations.length ? 'success' : 'error'); } catch (error) { setMessage(error.message, 'error'); } finally { button.disabled = false; button.classList.remove('is-loading'); } });

const chatForm = document.querySelector('#chat-form'); const chatInput = document.querySelector('#chat-message'); const chatMessages = document.querySelector('#chat-messages');
function addBubble(text, type) { const bubble = document.createElement('div'); bubble.className = `chat-bubble ${type}-bubble`; bubble.textContent = text; chatMessages.append(bubble); chatMessages.scrollTop = chatMessages.scrollHeight; return bubble; }
function extractPreferences(text) { const lower = text.toLowerCase(); const budget = (lower.match(/(?:₹|rs\.?|under\s+)(\d+)/) || [])[1] || '100'; return { budget, mood: /tired/.test(lower) ? 'tired' : /hungry|very hungry/.test(lower) ? 'hungry' : /happy/.test(lower) ? 'happy' : 'snacking', craving: /spicy/.test(lower) ? 'spicy' : /sweet/.test(lower) ? 'sweet' : /healthy/.test(lower) ? 'healthy' : /filling|hungry/.test(lower) ? 'filling' : /quick/.test(lower) ? 'light' : 'none', diet: /vegan/.test(lower) ? 'vegan' : /jain/.test(lower) ? 'jain' : /vegetarian|veg\b/.test(lower) ? 'vegetarian' : /protein/.test(lower) ? 'high protein' : 'none', available_time: /quick|under 5/.test(lower) ? 5 : 20, meal_type: /breakfast/.test(lower) ? 'breakfast' : /lunch/.test(lower) ? 'lunch' : 'snack' }; }
async function sendChat(text) { addBubble(text, 'user'); const typing = addBubble('CanteenAI is checking the menu…', 'ai'); try { const prefs = extractPreferences(text); const data = await findRecommendations(prefs); typing.textContent = data.recommendations.length ? `I found ${data.recommendations.length} option${data.recommendations.length > 1 ? 's' : ''} for you.` : data.message; if (data.recommendations.length) { const wrap = document.createElement('div'); wrap.className = 'chat-recommendations'; wrap.innerHTML = data.recommendations.map((item) => `<div><b>${escapeHtml(item.name)}</b><span>₹${item.price.toFixed(0)} · ${item.preparation_time} min</span></div>`).join(''); chatMessages.append(wrap); } } catch (error) { typing.textContent = error.message; } chatMessages.scrollTop = chatMessages.scrollHeight; }
if (chatForm) { chatForm.addEventListener('submit', (event) => { event.preventDefault(); const text = chatInput.value.trim(); if (!text) return; chatInput.value = ''; sendChat(text); }); document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => { chatInput.value = button.dataset.prompt; chatInput.focus(); })); }
