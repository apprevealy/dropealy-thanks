/**
 * Nexy Technology - Landing Page
 * Interatividade e funcionalidades
 */

document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll para links âncora
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

  // Tabs do case study
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Form submission
  const form = document.querySelector('.form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;

      // Coleta dos dados
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // Adiciona timestamp
      data.timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

      // Feedback visual - loading
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      submitBtn.style.opacity = '0.7';

      try {
        // Envia para Google Sheets via Google Apps Script
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbyM5rsH3govrIc83gQpvpAkRQQMkEQQdIobXs_w96qz6JUIZA7ehlFZodKsTAI8b-kMmw/exec';
        const response = await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        // Feedback visual - success
        submitBtn.textContent = 'Enviado com sucesso!';
        submitBtn.style.backgroundColor = '#10B981';
        submitBtn.style.opacity = '1';

        setTimeout(() => {
          form.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
          submitBtn.style.backgroundColor = '';
          submitBtn.style.opacity = '1';
        }, 2000);

      } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        submitBtn.textContent = 'Erro ao enviar. Tente novamente.';
        submitBtn.style.backgroundColor = '#EF4444';
        submitBtn.style.opacity = '1';

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
          submitBtn.style.backgroundColor = '';
          submitBtn.style.opacity = '1';
        }, 3000);
      }
    });
  }

  // Animação de entrada nas seções (Intersection Observer)
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
  document.querySelectorAll('.skill-card, .stat-card, .case-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});
