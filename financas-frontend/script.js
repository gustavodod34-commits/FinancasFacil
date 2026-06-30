/* =====================================================
   FinançasFácil — script.js  (v1.2) - VERSÃO API MONGODB
   ===================================================== */

// ── 1. VARIÁVEIS GLOBAIS E CONFIGURAÇÕES ─────────────
const API_URL = 'http://127.0.0.1:5000/api/transactions';
const STORAGE_THEME_KEY = 'financasfacil_theme';

let transactions  = [];
let selectedType  = 'income';   // formulário principal
let modalType     = 'income';   // formulário do modal
let chartMode     = 'type';     // 'type' | 'category'
let editingId     = null;

// Estado de hover do gráfico
let chartDefaultPct   = '—';
let chartDefaultLabel = 'receitas';

const CAT_COLORS = [
  '#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#06B6D4','#EC4899','#84CC16','#F97316','#64748B',
];

const CATEGORIES = {
  income: [
    '💰 Salário', '💻 Freelance', '📈 Investimentos',
    '🛍️ Vendas', '✨ Outros',
  ],
  expense: [
    '🏠 Moradia', '🍔 Alimentação', '🚌 Transporte',
    '🏥 Saúde', '🎓 Educação', '⚽ Lazer', '🛒 Outros',
  ],
};

// ── 2. INICIALIZAÇÃO (Quando a página carrega) ────────
document.addEventListener('DOMContentLoaded', () => {
    const userDataStr = localStorage.getItem('financas_user');
    
    if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const primeiroNome = userData.name.split(' ')[0];
        document.getElementById('userNameDisplay').textContent = primeiroNome;
        
        setHeaderDate();
        setDefaultDate();
        loadTheme();
        updateCategoryOptions('category', selectedType);
        
        // Busca do banco de dados do usuário logado
        loadTransactionsFromAPI(); 
    } else {
        window.location.href = 'login.html';
    }
});

// ── 3. FUNÇÕES DE ACESSO À API (MONGODB) ──────────────
async function loadTransactionsFromAPI() {
    try {
        // O "credentials: 'include'" é OBRIGATÓRIO para enviar o cookie de segurança
        const response = await fetch(API_URL, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            transactions = data.map(t => ({ ...t, id: t._id }));
            
            // Normaliza categorias antigas para versão com emoji
            transactions.forEach(t => { t.category = matchCategory(t.category); });
            
            populateMonthFilter();
            populateCategoryFilter();
            render(); // Atualiza a tela
        } else {
            console.error('Sessão inválida. Redirecionando...');
            logout();
        }
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
    }
}

async function apiAddTransaction(newTx) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(newTx)
        });
        if (response.ok) {
            await loadTransactionsFromAPI();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao adicionar:', error);
        return false;
    }
}

async function apiUpdateTransaction(id, updatedTx) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updatedTx)
        });
        if (response.ok) {
            await loadTransactionsFromAPI();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        return false;
    }
}

async function apiDeleteTransaction(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.ok) {
            await loadTransactionsFromAPI();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao deletar:', error);
        return false;
    }
}

// ── 4. FUNÇÕES GLOBAIS DE SISTEMA E TEMA ──────────────
async function logout() {
    try {
        // 1. Avisa o backend para destruir o cookie de segurança
        await fetch('http://127.0.0.1:5000/api/auth/logout', { 
            method: 'POST', 
            credentials: 'include' 
        });
    } catch (error) {
        console.error('Erro ao sair:', error);
    }
    
    // 2. Limpa o nome do usuário da tela
    localStorage.removeItem('financas_user');
    
    // 3. Redireciona para o login
    window.location.href = 'login.html';
}

function loadTheme() { applyTheme(localStorage.getItem(STORAGE_THEME_KEY) || 'light', false); }

function toggleTheme() {
  applyTheme(
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark',
    true,
  );
}

function applyTheme(theme, persist) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').textContent  = theme === 'dark' ? '☀️' : '🌙';
  document.getElementById('themeLabel').textContent = theme === 'dark' ? 'Claro' : 'Escuro';
  if (persist) localStorage.setItem(STORAGE_THEME_KEY, theme);
  if (transactions.length > 0) updateChart();
}

// ── 5. FORMULÁRIOS E AÇÕES DE TRANSAÇÃO ───────────────
function updateCategoryOptions(selectId, type) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = '<option value="">Selecione uma categoria…</option>';
  CATEGORIES[type].forEach(cat => {
    el.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

function selectType(type) {
  selectedType = type;
  document.getElementById('btnIncome').classList.toggle('active',  type === 'income');
  document.getElementById('btnExpense').classList.toggle('active', type === 'expense');
  updateCategoryOptions('category', type);
  clearFeedback();
}

function modalSelectType(type) {
  modalType = type;
  document.getElementById('mBtnIncome').classList.toggle('active',  type === 'income');
  document.getElementById('mBtnExpense').classList.toggle('active', type === 'expense');
  updateCategoryOptions('mCategory', type);
}

async function addTransaction() {
    const descInput = document.getElementById('description');
    const catInput = document.getElementById('category');
    const amtInput = document.getElementById('amount');
    const dateInput = document.getElementById('txDate');
    const feedback = document.getElementById('formFeedback');

    const desc = descInput.value.trim();
    const cat = catInput.value;
    const amt = parseFloat(amtInput.value);
    const date = dateInput.value;

    if (!desc || !cat || isNaN(amt) || amt <= 0 || !date) {
        feedback.textContent = 'Preencha todos os campos corretamente.';
        feedback.style.color = 'var(--red)';
        return;
    }

    feedback.textContent = 'Salvando...';
    feedback.style.color = 'var(--text-m)';

    const novaTransacao = {
        type: selectedType, 
        description: desc,
        category: cat,
        amount: amt,
        date: date
    };

    const sucesso = await apiAddTransaction(novaTransacao);

    if (sucesso) {
        descInput.value = '';
        amtInput.value = '';
        feedback.textContent = 'Transação adicionada com sucesso!';
        feedback.style.color = 'var(--green)';
        setTimeout(() => { feedback.textContent = ''; }, 2000);
    } else {
        feedback.textContent = 'Erro ao salvar transação no servidor.';
        feedback.style.color = 'var(--red)';
    }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && ['description','amount','txDate'].includes(e.target.id)) addTransaction();
  if (e.key === 'Escape') closeModal();
});

async function deleteTransaction(id) {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    await apiDeleteTransaction(id);
}

function editTransaction(id) {
  const t = transactions.find(tx => tx.id === id);
  if (!t) return;

  editingId = id;
  modalSelectType(t.type);

  document.getElementById('mDescription').value = t.description;
  document.getElementById('mAmount').value      = t.amount;
  document.getElementById('mDate').value        = t.date;

  requestAnimationFrame(() => {
    const catEl = document.getElementById('mCategory');
    const matched = matchCategory(t.category);
    catEl.value = matched;
    if (!catEl.value) catEl.value = '';
  });

  document.getElementById('modalFeedback').textContent = '';
  document.getElementById('editModal').hidden = false;
  requestAnimationFrame(() => document.getElementById('mDescription').focus());
}

function closeModal() {
  document.getElementById('editModal').hidden = true;
  editingId = null;
}

async function saveEdit() {
    const desc = document.getElementById('mDescription').value.trim();
    const cat = document.getElementById('mCategory').value;
    const amt = parseFloat(document.getElementById('mAmount').value);
    const date = document.getElementById('mDate').value;
    const feedback = document.getElementById('modalFeedback');

    if (!desc || !cat || isNaN(amt) || amt <= 0 || !date) {
        feedback.textContent = 'Preencha corretamente os campos.';
        return;
    }

    feedback.textContent = 'Salvando alterações...';
    feedback.style.color = 'var(--text-m)';

    const dadosAtualizados = {
        type: modalType, 
        description: desc,
        category: cat,
        amount: amt,
        date: date
    };

    const sucesso = await apiUpdateTransaction(editingId, dadosAtualizados);

    if (sucesso) {
        closeModal();
    } else {
        feedback.textContent = 'Erro ao salvar alterações no servidor.';
        feedback.style.color = 'var(--red)';
    }
}

// ── 6. RENDERIZAÇÃO E DASHBOARD ───────────────────────
function render() { updateDashboard(); updateChart(); renderTable(); }

function updateDashboard() {
  const income  = sumAll('income');
  const expense = sumAll('expense');
  const balance = income - expense;
  const nIn = transactions.filter(t => t.type === 'income').length;
  const nEx = transactions.filter(t => t.type === 'expense').length;

  setText('totalBalance', fmt(balance));
  setText('totalIncome',  fmt(income));
  setText('totalExpense', fmt(expense));
  setText('incomeSub',  `${nIn} ${nIn===1?'entrada':'entradas'}`);
  setText('expenseSub', `${nEx} ${nEx===1?'saída':'saídas'}`);

  setText('balanceSub',
    !transactions.length ? 'Nenhuma transação ainda' :
    balance > 0 ? `Você está ${fmt(balance)} positivo` :
    balance < 0 ? 'Atenção: saldo negativo' :
                  'Receitas e despesas empatadas');

  document.getElementById('balanceBar').style.width =
    income > 0 ? Math.min((income / (income + expense)) * 100, 100) + '%' : '0%';
}

// ── 7. GRÁFICOS E INTERAÇÃO ───────────────────────────
function setChartMode(mode) {
  chartMode = mode;
  document.getElementById('tabTypeBtn').classList.toggle('active', mode === 'type');
  document.getElementById('tabCatBtn').classList.toggle('active',  mode === 'category');
  updateChart();
}

function updateChart() {
  chartMode === 'category' ? drawCategoryChart() : drawTypeChart();
}

function drawTypeChart() {
  const income  = sumAll('income');
  const expense = sumAll('expense');
  const total   = income + expense;
  const cs      = getComputedStyle(document.documentElement);
  const clrIn   = cs.getPropertyValue('--green').trim()  || '#10B981';
  const clrEx   = cs.getPropertyValue('--red').trim()    || '#EF4444';
  const clrBg   = cs.getPropertyValue('--border').trim() || '#E4E7F0';

  if (total === 0) {
    drawEmptyDonut(clrBg);
    setDonutDefault('—', 'receitas');
    document.getElementById('chartLegend').innerHTML = `
      <li><span class="legend-dot" style="background:${clrIn}"></span>Receitas<span class="legend-amount">${fmt(0)}</span></li>
      <li><span class="legend-dot" style="background:${clrEx}"></span>Despesas<span class="legend-amount">${fmt(0)}</span></li>`;
    return;
  }

  const pctIn = Math.round((income / total) * 100);
  const slices = [
    { color: clrEx, frac: expense/total, pct: 100-pctIn, label: 'Despesas' },
    { color: clrIn, frac: income/total,  pct: pctIn,      label: 'Receitas' },
  ];

  drawDonut(slices, clrBg);
  setDonutDefault(pctIn + '%', 'receitas');

  document.getElementById('chartLegend').innerHTML = `
    <li><span class="legend-dot" style="background:${clrIn}"></span>Receitas<span class="legend-amount">${fmt(income)}</span></li>
    <li><span class="legend-dot" style="background:${clrEx}"></span>Despesas<span class="legend-amount">${fmt(expense)}</span></li>`;
}

function drawCategoryChart() {
  const cs    = getComputedStyle(document.documentElement);
  const clrBg = cs.getPropertyValue('--border').trim() || '#E4E7F0';

  const pool = transactions.filter(t => t.type === 'expense');
  const src  = pool.length ? pool : transactions;

  const totals = {};
  src.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });

  const entries = Object.entries(totals).sort((a,b) => b[1]-a[1]);
  const grand   = entries.reduce((s,[,v]) => s+v, 0);

  if (!grand) {
    drawEmptyDonut(clrBg);
    setDonutDefault('—', 'categorias');
    document.getElementById('chartLegend').innerHTML =
      '<li style="color:var(--text-l);font-size:12px">Sem dados ainda</li>';
    return;
  }

  const colorMap = {};
  entries.forEach(([cat], i) => { colorMap[cat] = CAT_COLORS[i % CAT_COLORS.length]; });

  const slices = entries.map(([cat, val]) => ({
    color: colorMap[cat],
    frac:  val / grand,
    pct:   Math.round((val / grand) * 100),
    label: stripEmoji(cat),
  }));

  const top = entries[0];
  drawDonut(slices, clrBg);
  setDonutDefault(Math.round((top[1]/grand)*100) + '%', stripEmoji(top[0]).toLowerCase());

  document.getElementById('chartLegend').innerHTML = entries.map(([cat, val]) => `
    <li>
      <span class="legend-dot" style="background:${colorMap[cat]}"></span>
      ${escHtml(cat)}
      <span class="legend-amount">${fmt(val)}</span>
    </li>`).join('');
}

const R = 62;           
const C = 2 * Math.PI * R;

function setDonutDefault(pct, label) {
  chartDefaultPct   = pct;
  chartDefaultLabel = label;
  setText('donutPct',   pct);
  setText('donutLabel', label);
}

function drawDonut(slices, clrBg) {
  const svg = document.getElementById('donutSvg');
  svg.innerHTML = '';
  const bg = makeSvgCircle(clrBg, C, 0);
  bg.style.cursor = 'default';
  svg.appendChild(bg);

  let offset = 0;
  slices.forEach((s) => {
    const len = s.frac * C;
    const el  = makeSvgCircle(s.color, len, offset);
    el.dataset.pct   = s.pct + '%';
    el.dataset.label = s.label.toLowerCase();

    el.addEventListener('mouseenter', () => {
      svg.classList.add('has-hover');
      el.classList.add('hovered');
      setText('donutPct',   el.dataset.pct);
      setText('donutLabel', el.dataset.label);
    });
    el.addEventListener('mouseleave', () => {
      svg.classList.remove('has-hover');
      el.classList.remove('hovered');
      setText('donutPct',   chartDefaultPct);
      setText('donutLabel', chartDefaultLabel);
    });
    el.addEventListener('click', () => {
      const isActive = el.classList.contains('hovered');
      svg.querySelectorAll('circle').forEach(c => c.classList.remove('hovered'));
      svg.classList.remove('has-hover');
      if (!isActive) {
        svg.classList.add('has-hover');
        el.classList.add('hovered');
        setText('donutPct',   el.dataset.pct);
        setText('donutLabel', el.dataset.label);
      } else {
        setText('donutPct',   chartDefaultPct);
        setText('donutLabel', chartDefaultLabel);
      }
    });

    svg.appendChild(el);
    offset += len;
  });
}

function drawEmptyDonut(clrBg) {
  const svg = document.getElementById('donutSvg');
  svg.innerHTML = '';
  svg.classList.remove('has-hover');
  svg.appendChild(makeSvgCircle(clrBg, C, 0));
}

function makeSvgCircle(color, dashLen, dashOffset) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  el.setAttribute('cx', 100); el.setAttribute('cy', 100); el.setAttribute('r', R);
  el.setAttribute('stroke', color);
  el.setAttribute('stroke-dasharray',  `${dashLen} ${C - dashLen}`);
  el.setAttribute('stroke-dashoffset', -dashOffset);
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke-width', 18);
  return el;
}

// ── 8. FILTROS E TABELA ───────────────────────────────
function populateMonthFilter() {
  const sel  = document.getElementById('filterMonth');
  const prev = sel.value;
  const months = [...new Set(transactions.map(t => t.date.slice(0,7)))].sort().reverse();
  sel.innerHTML = '<option value="all">Todos os meses</option>';
  months.forEach(ym => {
    const [y,m] = ym.split('-');
    const label = new Date(+y, +m-1).toLocaleDateString('pt-BR', { month:'long', year:'numeric' });
    sel.innerHTML += `<option value="${ym}">${label}</option>`;
  });
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
}

function populateCategoryFilter() {
  const sel  = document.getElementById('filterCategory');
  const prev = sel.value;
  const cats = [...new Set(transactions.map(t => t.category).filter(Boolean))].sort();
  sel.innerHTML = '<option value="all">Todas as categorias</option>';
  cats.forEach(c => { sel.innerHTML += `<option value="${c}">${c}</option>`; });
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
}

const PENCIL_SVG = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor"
  stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9.5 1.5 12.5 4.5 4.5 12.5 1 13 1.5 9.5Z"/>
  <line x1="8" y1="3" x2="11" y2="6"/>
</svg>`;

function renderTable() {
  const query  = (document.getElementById('searchInput').value || '').toLowerCase();
  const fType  = document.getElementById('filterType').value;
  const fMonth = document.getElementById('filterMonth').value;
  const fCat   = document.getElementById('filterCategory').value;
  const wrap   = document.getElementById('tableWrap');
  const empty  = document.getElementById('emptyState');

  const filtered = transactions.filter(t =>
    (fType  === 'all' || t.type === fType) &&
    (fMonth === 'all' || t.date.startsWith(fMonth)) &&
    (fCat   === 'all' || stripEmoji(t.category).toLowerCase() === stripEmoji(fCat).toLowerCase()) &&
    (t.description.toLowerCase().includes(query) ||
     stripEmoji(t.category || '').toLowerCase().includes(query))
  );

  if (!filtered.length) {
    wrap.innerHTML = '';
    empty.style.display = 'flex'; 
    const oldSummary = document.getElementById('tableSummary');
    if (oldSummary) oldSummary.style.display = 'none';
    return;
  }
  
  empty.style.display = 'none'; 

  const totIn  = filtered.filter(t => t.type==='income').reduce((s,t)=>s+t.amount,0);
  const totEx  = filtered.filter(t => t.type==='expense').reduce((s,t)=>s+t.amount,0);

  const rows = filtered.map((t, i) => `
    <tr class="row-new" style="animation-delay:${Math.min(i,20)*.03}s">
      <td><span class="badge badge--${t.type}">${t.type==='income'?'↑ Receita':'↓ Despesa'}</span></td>
      <td>
        <div class="tx-desc">${escHtml(t.description)}</div>
        <div class="tx-date">${fmtDate(t.date)}</div>
        ${t.category ? `<span class="cat-chip">${escHtml(t.category)}</span>` : ''}
      </td>
      <td>
        <div class="amount amount--${t.type}">${t.type==='income'?'+':'−'} ${fmt(t.amount)}</div>
      </td>
      <td>
        <div class="action-cell">
          <button class="btn-edit" title="Editar"  onclick="editTransaction('${t.id}')">${PENCIL_SVG}</button>
          <button class="btn-del"  title="Remover" onclick="deleteTransaction('${t.id}')">×</button>
        </div>
      </td>
    </tr>`).join('');

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Tipo</th><th>Descrição / Categoria</th>
          <th style="text-align:right">Valor</th><th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  let summaryEl = document.getElementById('tableSummary');
  if (!summaryEl) {
    summaryEl = document.createElement('div');
    summaryEl.id = 'tableSummary';
    summaryEl.className = 'table-summary';
    wrap.parentNode.insertBefore(summaryEl, empty);
  }
  
  summaryEl.style.display = 'flex';
  summaryEl.innerHTML = `
    <span class="summary-item">${filtered.length} ${filtered.length===1?'transação':'transações'}</span>
    <span class="summary-item income">Receitas: <strong>${fmt(totIn)}</strong></span>
    <span class="summary-item expense">Despesas: <strong>${fmt(totEx)}</strong></span>
    <span class="summary-item">Saldo: <strong>${fmt(totIn-totEx)}</strong></span>
  `;
}

// ── 9. HELPERS E EXPORTAÇÃO ───────────────────────────
function stripEmoji(str) {
  return (str || '').replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/gu, '').trim();
}

function matchCategory(raw) {
  if (!raw) return raw;
  const all = [...CATEGORIES.income, ...CATEGORIES.expense];
  const exact = all.find(c => c === raw);
  if (exact) return exact;
  const plain = stripEmoji(raw).toLowerCase();
  return all.find(c => stripEmoji(c).toLowerCase() === plain) || raw;
}

function exportCSV() {
  const fType  = document.getElementById('filterType').value;
  const fMonth = document.getElementById('filterMonth').value;
  const fCat   = document.getElementById('filterCategory').value;
  const query  = (document.getElementById('searchInput').value || '').toLowerCase();

  const rows = transactions.filter(t =>
    (fType  === 'all' || t.type === fType) &&
    (fMonth === 'all' || t.date.startsWith(fMonth)) &&
    (fCat   === 'all' || stripEmoji(t.category||'').toLowerCase() === stripEmoji(fCat).toLowerCase()) &&
    (t.description.toLowerCase().includes(query) ||
     stripEmoji(t.category||'').toLowerCase().includes(query))
  );

  if (!rows.length) return showToast('Nenhuma transação para exportar.');

  const header = ['Data','Tipo','Categoria','Descrição','Valor (R$)'];
  const lines  = rows.map(t => [
    fmtDate(t.date),
    t.type === 'income' ? 'Receita' : 'Despesa',
    stripEmoji(t.category || ''),
    `"${t.description.replace(/"/g,'""')}"`,
    t.amount.toFixed(2).replace('.',','),
  ].join(';'));

  const csv  = [header.join(';'), ...lines].join('\r\n');
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `financasfacil${fMonth!=='all'?'_'+fMonth:''}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`${rows.length} ${rows.length===1?'transação exportada':'transações exportadas'}!`);
}

function sumAll(type) { return transactions.filter(t=>t.type===type).reduce((s,t)=>s+t.amount,0); }
function fmt(v) { return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function fmtDate(iso) { const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function setText(id, text) { const el=document.getElementById(id); if(el) el.textContent=text; }
function setDefaultDate() { document.getElementById('txDate').value = new Date().toISOString().slice(0,10); }
function setHeaderDate() {
  setText('currentDate', new Date().toLocaleDateString('pt-BR',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));
}
function setFeedback(msg)  { setText('formFeedback', msg); }
function clearFeedback()   { setText('formFeedback', ''); }

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
// ── LÓGICA DE CONTROLE DO CHATBOT ─────────────────────────────────────

// Abre e fecha a janela do chat
function toggleChat() {
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.classList.toggle('active');
  if (chatWindow.classList.contains('active')) {
    document.getElementById('chatInput').focus();
  }
}

// Captura a tecla Enter para enviar
function handleChatKey(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

// Envia a mensagem do usuário para o backend e renderiza a resposta da IA
async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const messageText = input.value.trim();
  
  if (!messageText) return;

  const messagesContainer = document.getElementById('chatMessages');

  // 1. Renderiza a mensagem que você digitou
  const userDiv = document.createElement('div');
  userDiv.className = 'message user-message';
  userDiv.textContent = messageText;
  messagesContainer.appendChild(userDiv);

  // Limpa o campo de texto e joga o scroll para baixo
  input.value = '';
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // 2. Cria o balão temporário de "Digitando..."
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message';
  typingDiv.id = 'finbot-typing';
  typingDiv.textContent = 'FinBot está pensando... 🤖';
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // 3. Dispara a requisição real para o seu server.js na porta 5000
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageText })
    });

    const data = await response.json();

    // Remove o balão de "Digitando..."
    const typingIndicator = document.getElementById('finbot-typing');
    if (typingIndicator) typingIndicator.remove();

    // 4. Renderiza a resposta inteligente e real do Gemini 2.0 Flash
    const botDiv = document.createElement('div');
    botDiv.className = 'message bot-message';
    botDiv.textContent = data.reply;
    messagesContainer.appendChild(botDiv);
    
  } catch (error) {
    console.error('Erro ao buscar resposta da IA:', error);
    
    const typingIndicator = document.getElementById('finbot-typing');
    if (typingIndicator) typingIndicator.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'message bot-message';
    errorDiv.textContent = 'Ih, deu erro na minha conexão com o servidor. O backend está ligado?';
    messagesContainer.appendChild(errorDiv);
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}