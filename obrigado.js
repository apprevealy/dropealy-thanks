/**
 * Dropealy - Página de Obrigado/Acesso
 * Injeção dinâmica de credenciais e interatividade
 */

document.addEventListener('DOMContentLoaded', () => {
  // Função para obter parâmetros da URL
  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function firstAvailableParameter(names) {
    for (const name of names) {
      const value = getUrlParameter(name);
      if (value && value.trim()) return value.trim();
    }
    return '';
  }

  function normalizeFirstName(fullName) {
    const firstName = String(fullName || '').trim().split(/\s+/)[0] || '';
    const normalized = firstName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z]/g, '');

    if (!normalized) return 'Usuario';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  }

  // Função para injetar credenciais
  function injectCredentials() {
    const emailElement = document.getElementById('user-email');
    const passwordElement = document.getElementById('user-password');

    if (!emailElement || !passwordElement) return;

    // Tenta obter e-mail de múltiplas fontes
    let userEmail = firstAvailableParameter(['email', 'e-mail', 'user_email', 'customer_email']);

    // Se não estiver na URL, tenta obter do localStorage
    if (!userEmail) {
      userEmail = localStorage.getItem('dropealy_user_email') || localStorage.getItem('revealy_user_email');
    }

    // Se ainda não tiver, tenta obter de sessionStorage
    if (!userEmail) {
      userEmail = sessionStorage.getItem('dropealy_user_email') || sessionStorage.getItem('revealy_user_email');
    }

    const userName = firstAvailableParameter([
      'nome', 'name', 'first_name', 'firstname', 'customer_name', 'customer_first_name'
    ]);
    const emailName = userEmail ? userEmail.split('@')[0].split(/[._+-]/)[0] : '';
    const firstName = normalizeFirstName(userName || emailName);
    const password = `${firstName}12345`;
    const planName = firstAvailableParameter([
      'plano', 'plan', 'plan_name', 'product', 'product_name', 'produto', 'offer_name'
    ]) || 'Master';

    // Injeta e-mail no DOM
    if (userEmail) {
      emailElement.textContent = userEmail;
    } else {
      emailElement.textContent = 'Seu e-mail será inserido aqui';
    }

    passwordElement.textContent = password;

    const platformUrl = new URL('https://app.dropealy.com/login');
    if (userEmail) platformUrl.searchParams.set('email', userEmail);
    platformUrl.searchParams.set('password', password);
    document.querySelectorAll('.platform-link').forEach(link => {
      link.href = platformUrl.toString();
    });

    const supportMessage = `Olá, tudo bem? Meu nome é ${firstName} e acabei de comprar o plano ${planName} da Dropealy.`;
    const supportUrl = `https://wa.me/5561994210220?text=${encodeURIComponent(supportMessage)}`;
    document.querySelectorAll('.support-link').forEach(link => {
      link.href = supportUrl;
    });
  }

  // Função para copiar credenciais para o clipboard
  function setupCopyToClipboard() {
    const credentialsValues = document.querySelectorAll('.credentials-value');
    
    credentialsValues.forEach(element => {
      element.title = 'Clique para copiar';
      
      element.addEventListener('click', async () => {
        const text = element.textContent;
        
        // Não copia se for o texto placeholder
        if (text.includes('será inserido aqui')) return;
        
        try {
          await navigator.clipboard.writeText(text);
          
          // Feedback visual
          const originalText = element.textContent;
          const originalColor = element.style.color;
          
          element.textContent = 'Copiado!';
          element.style.color = '#25D366';
          
          setTimeout(() => {
            element.textContent = originalText;
            element.style.color = originalColor;
          }, 1500);
          
        } catch (err) {
          console.error('Erro ao copiar:', err);
          // Fallback para navegadores antigos
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          element.textContent = 'Copiado!';
          setTimeout(() => {
            element.textContent = text;
          }, 1500);
        }
      });
    });
  }

  // Animação de entrada nas seções (Intersection Observer)
  function setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Aplica animação aos elementos
    const animatedElements = document.querySelectorAll(
      '.hero__content, .form-container, .credentials-box, .credentials-contact'
    );
    
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      observer.observe(el);
    });
  }

  // Smooth scroll para links internos
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // Inicializa todas as funcionalidades
  injectCredentials();
  setupCopyToClipboard();
  setupScrollAnimations();
  setupSmoothScroll();

  // Log para debug (remover em produção)
  console.log('Dropealy - Página de Obrigado carregada com sucesso');
});
