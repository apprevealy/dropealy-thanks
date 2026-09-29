/** Dropealy: dados recebidos do checkout, sem confundir exibição com confirmação de pagamento. */
(() => {
  'use strict';
  const APP_ORIGIN = 'https://app.dropealy.com';
  const THANKS_ORIGIN = 'https://thanks.dropealy.com';
  const LOGIN_URL = `${APP_ORIGIN}/login`;
  const EMAIL_KEYS = ['e', 'email', 'e-mail', 'user_email', 'customer_email'];
  const NAME_KEYS = ['payerName', 'nome', 'name', 'first_name', 'firstname', 'customer_name', 'customer_first_name'];
  const params = new URLSearchParams(window.location.search);
  function parameter(keys, max) {
    for (const key of keys) {
      if (!params.has(key)) continue;
      const values = params.getAll(key);
      if (values.length !== 1 || values[0].length > max) return '';
      return values[0].trim();
    }
    return '';
  }
  function firstNameOf(name) {
    const letters = name.trim().split(/\s+/)[0].normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '');
    return letters ? letters[0].toUpperCase() + letters.slice(1).toLowerCase() : '';
  }
  const rawEmail = parameter(EMAIL_KEYS, 254);
  let email = /^[^\s@<>"\\]+@[^\s@<>"\\]+\.[^\s@<>"\\]{2,}$/.test(rawEmail) ? rawEmail.toLowerCase() : '';
  let firstName = firstNameOf(parameter(NAME_KEYS, 160));
  let password = email && firstName && firstName.length <= 123 ? `${firstName}12345` : '';
  const cleanUrl = new URL(window.location.href);
  [...EMAIL_KEYS, ...NAME_KEYS, 'password', 'senha', 'user_password', 'customer_password',
    'phone', 'telefone', 'cpf', 'document', 'cep', 'address', 'ppayId'].forEach(key => cleanUrl.searchParams.delete(key));
  // Os parâmetros chegaram do provedor. Não os encaminhar aos links de login/suporte.
  try { window.history.replaceState(window.history.state, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash); } catch (_) { /* Pode estar em iframe restrito. */ }

  function init() {
    const emailElement = document.getElementById('user-email');
    const passwordElement = document.getElementById('user-password');
    if (!emailElement || !passwordElement) return;
    const box = document.querySelector('.credentials-box');
    const note = document.createElement('p');
    note.id = 'credentials-status';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    // Aviso acessível fora do fluxo: não acrescentar altura, margem ou um item ao grid/flex.
    note.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0;';
    if (box) box.appendChild(note);
    const initialNotice = password
      ? 'Senha inicial para novos cadastros, válida após a aprovação do pagamento. Se já possuía conta, use sua senha atual. Depois de entrar, altere sua senha.'
      : 'Os dados completos do comprador não chegaram nesta página. Use o e-mail da compra e suas credenciais de acesso, ou fale com o suporte.';
    function setNotice(message) {
      note.textContent = message;
      [emailElement, passwordElement].forEach(element => {
        const describedBy = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        if (!describedBy.includes(note.id)) describedBy.push(note.id);
        element.setAttribute('aria-describedby', describedBy.join(' '));
        element.title = 'Clique para copiar. ' + message;
      });
    }
    setNotice(initialNotice);
    const setCredentials = () => {
      emailElement.textContent = email || 'E-mail não recebido do checkout';
      passwordElement.textContent = password || 'Senha inicial indisponível';
    };
    setCredentials();

    // Credenciais só em memória; nunca recuperar comprador anterior do armazenamento do navegador.
    let handoffEnabled = Boolean(email && password);
    const pending = new Set();
    const copyTimers = new Map();
    function expire() {
      handoffEnabled = false;
      email = ''; password = ''; firstName = '';
      pending.forEach(stop => stop());
      copyTimers.forEach(timer => window.clearTimeout(timer));
      copyTimers.clear();
      setCredentials();
      setNotice('Esta exibição de dados expirou. Entre com suas credenciais ou fale com o suporte.');
    }
    const expiryTimer = window.setTimeout(expire, 20 * 60 * 1000);
    window.addEventListener('pagehide', () => { window.clearTimeout(expiryTimer); expire(); }, { once: true });

    document.querySelectorAll('.platform-link').forEach(link => {
      link.href = LOGIN_URL;
      link.setAttribute('rel', 'noopener noreferrer');
      link.addEventListener('click', event => {
        // Abrir pelo menu ou com modificador usa o link normal, sem dados na URL.
        if (!handoffEnabled || window.location.origin !== THANKS_ORIGIN ||
            event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        let child = null;
        let timer = null;
        let nonce = '';
        let sent = false;
        let stopped = false;
        function stop() {
          stopped = true;
          window.removeEventListener('message', onMessage);
          if (timer !== null) window.clearTimeout(timer);
          pending.delete(stop);
          child = null;
        }
        function onMessage(event) {
          if (stopped || !child || event.origin !== APP_ORIGIN || event.source !== child) return;
          const data = event.data;
          if (!data || typeof data !== 'object' || Array.isArray(data)) return;
          if (data.type === 'DROPEALY_PREFILL_READY' && !sent &&
              typeof data.nonce === 'string' && /^[a-f0-9]{32}$/.test(data.nonce) && email && password) {
            nonce = data.nonce;
            sent = true;
            try { child.postMessage({ type: 'DROPEALY_PREFILL', nonce, email, password }, APP_ORIGIN); }
            catch (_) { stop(); }
          } else if (data.type === 'DROPEALY_PREFILL_ACK' && sent && data.nonce === nonce) {
            stop();
          }
        }
        window.addEventListener('message', onMessage);
        pending.add(stop);
        // Opener é temporário, somente entre os dois domínios fixos, e cortado no receptor.
        try { child = window.open(`${LOGIN_URL}?from=thanks`, '_blank'); } catch (_) { child = null; }
        if (!child) {
          stop();
          handoffEnabled = false;
          setNotice('O navegador bloqueou a nova aba. Copie os dados e clique novamente em Acessar Ferramenta para entrar manualmente.');
          return;
        }
        timer = window.setTimeout(() => {
          stop();
          setNotice('Caso os campos não tenham sido preenchidos na outra aba, copie os dados desta página. ' + initialNotice);
        }, 20000);
      });
    });

    // Não presumir plano Master nem inserir e-mail/senha no WhatsApp.
    document.querySelectorAll('.support-link').forEach(link => {
      link.href = 'https://wa.me/5561994210220?text=' + encodeURIComponent('Olá, preciso de ajuda com meu acesso à Dropealy.');
    });
    [emailElement, passwordElement].forEach(element => {
      element.addEventListener('click', async () => {
        const text = element === emailElement ? email : password;
        if (!text) return;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
          else {
            const area = document.createElement('textarea');
            area.value = text;
            area.style.cssText = 'position:fixed;opacity:0;';
            document.body.appendChild(area);
            try { area.select(); if (!document.execCommand('copy')) throw new Error('copy_unavailable'); }
            finally { area.remove(); }
          }
          if ((element === emailElement ? email : password) !== text) return;
          if (copyTimers.has(element)) window.clearTimeout(copyTimers.get(element));
          element.textContent = 'Copiado!';
          copyTimers.set(element, window.setTimeout(() => {
            element.textContent = element === emailElement ? email || 'E-mail não recebido do checkout' : password || 'Senha inicial indisponível';
            copyTimers.delete(element);
          }, 1500));
        } catch (_) { setNotice('Selecione o texto do campo e copie manualmente.'); }
      });
    });

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      }), { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      document.querySelectorAll('.hero__content, .form-container, .credentials-box, .credentials-contact').forEach(el => {
        el.style.opacity = '0'; el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease'; observer.observe(el);
      });
    }
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (event) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.getElementById(href.slice(1));
        if (target) { event.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
