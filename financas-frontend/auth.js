let captchaAnswer = 0; // Vai guardar a resposta correta

// Função para criar o desafio matemático
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1; // Número de 1 a 10
    const num2 = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = num1 + num2;
    document.getElementById('captchaQuestion').textContent = `${num1} + ${num2}`;
    document.getElementById('captchaInput').value = ''; // Limpa o campo
}

// Quando a página carregar, prepara os botões e o captcha
document.addEventListener('DOMContentLoaded', () => {
    generateCaptcha();

    // Lógica Profissional do botão de visualizar senha (Olhinho SVG)
    document.getElementById('togglePassword').addEventListener('click', function () {
        const passInput = document.getElementById('userPass');
        const eyeIcon = document.getElementById('eyeIcon');
        
        // Alterna entre texto e senha
        const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passInput.setAttribute('type', type);
        
        // Troca o desenho do SVG (Olho aberto vs Olho com risco)
        if (type === 'password') {
            // Desenho do olho normal
            eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
            this.style.opacity = '0.7';
        } else {
            // Desenho do olho cortado (fechado)
            eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
            this.style.opacity = '1'; // Deixa o ícone mais forte quando a senha está visível
        }
    });
});

// ── Controle de Tema ──────────────────────────────────
const STORAGE_THEME_KEY = 'financasfacil_theme';

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme');
  const newTheme = current === 'light' ? 'dark' : 'light';
  
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem(STORAGE_THEME_KEY, newTheme);
  updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon && label) {
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
    label.textContent = theme === 'light' ? 'Escuro' : 'Claro';
  }
}

// Executa a função assim que a página de login abre
loadTheme();

// Controle de estado global da tela (CORRIGIDO: Apenas uma declaração aqui)
let isLoginMode = true; 

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    
    // Mapeando todos os elementos necessários
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const nameGroup = document.getElementById('nameGroup');
    const userNameInput = document.getElementById('userName');
    const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
    const authBtn = document.getElementById('authBtn');
    const switchText = document.getElementById('switchText');
    const switchBtn = document.getElementById('switchBtn');
    const authFeedback = document.getElementById('authFeedback');
    
    // Limpa e esconde mensagens de erro anteriores para resetar o espaçamento
    authFeedback.textContent = "";
    authFeedback.style.style = "none";
    authFeedback.style.display = "none";
    
    if (isLoginMode) {
        // ---- MODO: LOGIN ----
        authTitle.textContent = "Bem-vindo de volta";
        authSubtitle.textContent = "Acesse sua conta para continuar.";
        
        nameGroup.style.display = "none"; // Esconde o campo Nome
        userNameInput.removeAttribute('required'); // Remove obrigatoriedade
        
        forgotPasswordContainer.style.display = "block"; // Mostra o Esqueci a Senha
        authBtn.textContent = "Entrar na minha conta";
        switchText.textContent = "Ainda não tem uma conta?";
        switchBtn.textContent = "Criar conta";
    } else {
        // ---- MODO: CADASTRO (CRIAR CONTA) ----
        authTitle.textContent = "Criar Nova Conta";
        authSubtitle.textContent = "Preencha os dados para se cadastrar.";
        
        nameGroup.style.display = "block"; // Mostra o campo Nome Completo!
        userNameInput.setAttribute('required', 'true'); // Torna obrigatório no cadastro
        
        forgotPasswordContainer.style.display = "none"; // Esconde o Esqueci a Senha
        authBtn.textContent = "Cadastrar agora";
        switchText.textContent = "Já tem uma conta?";
        switchBtn.textContent = "Fazer login";
    }
}

async function handleAuth(event) {
  event.preventDefault(); // Impede a página de recarregar
  
  const email = document.getElementById('userEmail').value;
  const pass  = document.getElementById('userPass').value;
  const feedback = document.getElementById('authFeedback');
  const btn = document.getElementById('authBtn');

  // Feedback visual: desativa o botão e mostra que está carregando
  btn.disabled = true;
  const textoOriginalBtn = btn.textContent;
  btn.textContent = 'Aguarde...';
  
  // Faz o parágrafo aparecer e define a cor cinza de carregamento
  feedback.style.display = 'block';
  feedback.style.color = 'var(--text-m)';
  feedback.textContent = 'Conectando ao servidor...';

  // ==========================================
  // VALIDAÇÃO DO CAPTCHA FRONTEND
  // ==========================================
  const captchaInput = parseInt(document.getElementById('captchaInput').value);
  if (captchaInput !== captchaAnswer) {
      feedback.style.color = 'var(--red)';
      feedback.textContent = '🤖 Ops! Resposta de segurança incorreta. Tente novamente.';
      generateCaptcha(); // Gera um novo para evitar tentativas repetidas
      btn.disabled = false;
      btn.textContent = textoOriginalBtn;
      return; // Interrompe a função aqui
  }

  try {
    if (isLoginMode) {
      // ==========================================
      // 1. LÓGICA DE LOGIN (ENTRAR)
      // ==========================================
      const response = await fetch('https://financas-facil-api.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password: pass })
      });

      const data = await response.json();

      if (response.ok) {
        feedback.style.color = 'var(--green)';
        feedback.textContent = 'Login aprovado! Entrando...';
        
        localStorage.setItem('financas_user', JSON.stringify(data.user));
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      } else {
        feedback.style.color = 'var(--red)';
        feedback.textContent = data.message;
        btn.disabled = false;
        btn.textContent = textoOriginalBtn;
      }

    } else {
      // ==========================================
      // 2. LÓGICA DE CADASTRO (CRIAR CONTA)
      // ==========================================
      const name = document.getElementById('userName').value;
      
      const response = await fetch('https://financas-facil-api.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password: pass })
      });

      const data = await response.json();

      if (response.ok) {
        feedback.style.color = 'var(--green)';
        feedback.textContent = 'Conta criada com sucesso! Faça login.';
        
        localStorage.setItem('financas_user', JSON.stringify(data.user));
        
        setTimeout(() => {
          toggleAuthMode();
          btn.disabled = false;
          document.getElementById('userPass').value = '';
        }, 1500);
      } else {
        feedback.style.color = 'var(--red)';
        feedback.textContent = data.message;
        btn.disabled = false;
        btn.textContent = textoOriginalBtn;
      }
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    feedback.style.color = 'var(--red)';
    feedback.textContent = 'Falha na conexão. Verifique se o servidor está rodando.';
    btn.disabled = false;
    btn.textContent = textoOriginalBtn;
  }
}