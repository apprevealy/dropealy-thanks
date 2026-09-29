import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../obrigado.js', import.meta.url), 'utf8');
const ORIGIN = 'https://app.dropealy.com';
const NONCE = 'a'.repeat(32);
class Element {
  constructor() { this.textContent = ''; this.style = {}; this.events = {}; this.attrs = {}; this.children = []; }
  addEventListener(type, cb) { (this.events[type] ||= []).push(cb); }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key]; }
  appendChild(child) { this.children.push(child); }
  querySelector() { return null; }
  async emit(type, data = {}) { for (const cb of this.events[type] || []) await cb.call(this, data); }
}
function page(query = '', options = {}) {
  const email = new Element(), password = new Element(), box = new Element(), label = new Element();
  label.textContent = 'Senha';
  password.parentElement = { querySelector: () => label };
  const links = Array.from({ length: 3 }, () => new Element());
  const support = [new Element()];
  const document = {
    readyState: 'complete', createElement: () => new Element(),
    getElementById: id => ({ 'user-email': email, 'user-password': password }[id]),
    querySelector: selector => selector === '.credentials-box' ? box : null,
    querySelectorAll: selector => selector === '.platform-link' ? links : selector === '.support-link' ? support : [],
  };
  const listeners = new Map(), timers = new Map(), opened = [], posts = [], copied = [];
  let nextTimer = 1;
  const location = new URL((options.origin || 'https://thanks.dropealy.com') + '/' + query);
  const state = { preserve: true };
  const history = { state, replaceState(s, _unused, url) { assert.equal(s, state); this.cleaned = url; } };
  const window = {
    location, history,
    setTimeout(cb, delay) { const id = nextTimer++; timers.set(id, { cb, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(type, cb) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(cb); },
    removeEventListener(type, cb) { listeners.get(type)?.delete(cb); },
    open(url, target) {
      assert.equal(target, '_blank');
      if (options.popupBlocked) return null;
      const child = { url, postMessage(data, origin) { posts.push({ data, origin, child }); } };
      opened.push(child); return child;
    },
  };
  const storage = { getItem() { throw new Error('storage must not be used'); }, setItem() { throw new Error('storage must not be used'); } };
  vm.runInNewContext(source, { document, window, URL, URLSearchParams, localStorage: storage, sessionStorage: storage,
    navigator: { clipboard: { async writeText(text) { copied.push(text); } } }, console }, { timeout: 1000 });
  const dispatch = (type, data) => { for (const cb of [...listeners.get(type) || []]) cb(data); };
  const fireTimers = delay => { for (const [id, entry] of [...timers]) if (entry.delay === delay) { timers.delete(id); entry.cb(); } };
  const click = async (index = 0, extra = {}) => {
    let prevented = false;
    await links[index].emit('click', { button: 0, preventDefault() { prevented = true; }, ...extra });
    return prevented;
  };
  return { email, password, links, support, label, note: box.children[0], history, opened, posts, copied, click, dispatch, fireTimers, listeners };
}
const purchase = (name = 'João Silva', extra = '') => '?e=cliente%2Bteste%40example.com&payerName=' + encodeURIComponent(name) + extra;
for (const [name, expected] of [['Paulo Silva','Paulo12345'],['Gian Reis','Gian12345'],['João Silva','Joao12345'],['JOSÉ','Jose12345'],['A\u0301lvaro Souza','Alvaro12345'],['  MÁRCIA   Dias  ','Marcia12345'],['Ana-Maria Silva','Anamaria12345']]) {
  test(`nome do checkout normalizado: ${name}`, () => {
    const p = page(purchase(name));
    assert.equal(p.email.textContent, 'cliente+teste@example.com');
    assert.equal(p.password.textContent, expected);
    assert.equal(p.label.textContent, 'Senha');
  });
}
test('parâmetros nativos prevalecem sem misturar nome ou e-mail legado', () => {
  const p = page(purchase('José') + '&email=outro%40example.com&name=Pedro');
  assert.equal(p.email.textContent, 'cliente+teste@example.com');
  assert.equal(p.password.textContent, 'Jose12345');
});
test('aliases antigos válidos continuam funcionando', () => {
  const p = page('?email=ANA%40example.com&nome=Ana');
  assert.equal(p.email.textContent, 'ana@example.com'); assert.equal(p.password.textContent, 'Ana12345');
});
for (const query of ['', '?e=cliente%40example.com', '?payerName=Paulo', '?e=invalid&payerName=Paulo', '?e=a%40example.com&e=b%40example.com&payerName=Paulo', purchase('123'), purchase('姓名'), '?password=Paulo12345']) {
  test(`dados ausentes/ambíguos não inventam credenciais: ${query}`, async () => {
    const p = page(query);
    assert.equal(p.password.textContent, 'Senha inicial indisponível');
    assert.equal(await p.click(), false); assert.equal(p.opened.length, 0);
  });
}
test('nome do e-mail não é usado como nome do comprador', () => {
  const p = page('?e=paulo%40example.com'); assert.equal(p.password.textContent, 'Senha inicial indisponível');
});
test('e-mail inválido e nomes excessivamente longos são recusados', () => {
  assert.equal(page(purchase('P'.repeat(161))).password.textContent, 'Senha inicial indisponível');
  const p = page('?e=' + encodeURIComponent('<img src=x>@example.com') + '&payerName=Paulo');
  assert.equal(p.email.textContent, 'E-mail não recebido do checkout');
});
test('remove dados pessoais do endereço preservando parâmetros de campanha e history.state', () => {
  const p = page(purchase('João', '&password=segredo&phone=000&ppayId=pedido&utm_source=campanha'));
  assert.equal(p.history.cleaned, '/?utm_source=campanha');
});
test('nenhum link contém senha/e-mail; WhatsApp não presume plano nem recebe credenciais', () => {
  const p = page(purchase());
  p.links.forEach(link => { assert.equal(link.href, ORIGIN + '/login'); assert.equal(link.attrs.rel, 'noopener noreferrer'); });
  assert.ok(!p.support[0].href.includes('Master')); assert.ok(!p.support[0].href.includes('example'));
});
test('handshake explícito, origem e janela exatas, nonce, envio único e ACK', async () => {
  const p = page(purchase());
  assert.equal(p.posts.length, 0); assert.equal(await p.click(), true);
  const child = p.opened[0]; assert.equal(child.url, ORIGIN + '/login?from=thanks');
  const ready = { type: 'DROPEALY_PREFILL_READY', nonce: NONCE };
  p.dispatch('message', { origin: 'https://evil.example', source: child, data: ready });
  p.dispatch('message', { origin: ORIGIN, source: {}, data: ready });
  p.dispatch('message', { origin: ORIGIN, source: child, data: { ...ready, nonce: 'invalid' } });
  assert.equal(p.posts.length, 0);
  p.dispatch('message', { origin: ORIGIN, source: child, data: ready });
  assert.equal(p.posts.length, 1); assert.equal(p.posts[0].origin, ORIGIN);
  assert.equal(p.posts[0].data.password, 'Joao12345'); assert.equal(p.posts[0].data.email, 'cliente+teste@example.com');
  p.dispatch('message', { origin: ORIGIN, source: child, data: ready }); assert.equal(p.posts.length, 1);
  p.dispatch('message', { origin: ORIGIN, source: child, data: { type: 'DROPEALY_PREFILL_ACK', nonce: 'b'.repeat(32) } });
  assert.equal(p.listeners.get('message').size, 1);
  p.dispatch('message', { origin: ORIGIN, source: child, data: { type: 'DROPEALY_PREFILL_ACK', nonce: NONCE } });
  assert.equal(p.listeners.get('message').size, 0);
});
test('timeout cancela envio tardio', async () => {
  const p = page(purchase()); await p.click(); p.fireTimers(20000);
  p.dispatch('message', { origin: ORIGIN, source: p.opened[0], data: { type: 'DROPEALY_PREFILL_READY', nonce: NONCE } });
  assert.equal(p.posts.length, 0); assert.equal(p.listeners.get('message').size, 0);
});
test('popup bloqueado deixa alternativa de login manual, sem query de credenciais', async () => {
  const p = page(purchase(), { popupBlocked: true }); await p.click();
  assert.equal(await p.click(), false); assert.equal(p.links[0].href, ORIGIN + '/login');
  assert.equal(p.listeners.get('message').size, 0); assert.match(p.note.textContent, /bloqueou/);
});
test('origem de prévia e clique modificado não enviam dados', async () => {
  assert.equal(await page(purchase(), { origin: 'https://preview.example' }).click(), false);
  assert.equal(await page(purchase()).click(0, { ctrlKey: true }), false);
});
test('duas abas recebem somente respostas vinculadas à própria janela', async () => {
  const p = page(purchase()); await p.click(0); await p.click(1);
  for (const child of p.opened) p.dispatch('message', { origin: ORIGIN, source: child, data: { type: 'DROPEALY_PREFILL_READY', nonce: NONCE } });
  assert.equal(p.posts.length, 2); assert.notEqual(p.posts[0].child, p.posts[1].child);
});
test('cópia usa dado original, não o texto Copiado!', async () => {
  const p = page(purchase()); await p.password.emit('click'); await p.password.emit('click');
  assert.deepEqual(p.copied, ['Joao12345','Joao12345']);
});
test('expiração limpa credenciais e timers de cópia, sem restaurar dado antigo', async () => {
  const p = page(purchase()); await p.password.emit('click'); await p.click(); p.fireTimers(1200000); p.fireTimers(1500);
  assert.equal(p.password.textContent, 'Senha inicial indisponível');
  assert.equal(await p.click(), false); assert.equal(p.listeners.get('message').size, 0);
});
test('saída/volta do cache da página não conserva senha', async () => {
  const p = page(purchase()); p.dispatch('pagehide', {});
  assert.equal(p.password.textContent, 'Senha inicial indisponível'); assert.equal(await p.click(), false);
});

test('aviso acessível não ocupa espaço nem substitui o rótulo original', () => {
  const p = page(purchase());
  assert.match(p.note.style.cssText, /position:absolute/);
  assert.match(p.note.style.cssText, /width:1px;height:1px/);
  assert.match(p.note.style.cssText, /overflow:hidden/);
  assert.equal(p.label.textContent, 'Senha');
  assert.equal(p.password.attrs['aria-describedby'], 'credentials-status');
  assert.equal(p.email.attrs['aria-describedby'], 'credentials-status');
  assert.match(p.password.title, /Se já possuía conta/);
  assert.match(p.password.title, /Clique para copiar/);
});
test('aviso de popup bloqueado permanece disponível sem acrescentar blocos visuais', async () => {
  const p = page(purchase(), { popupBlocked: true });
  await p.click();
  assert.match(p.note.style.cssText, /position:absolute/);
  assert.match(p.email.title, /bloqueou/);
  assert.equal(p.label.textContent, 'Senha');
});
test('expiração atualiza descrição acessível sem duplicar identificadores', () => {
  const p = page(purchase()); p.fireTimers(1200000);
  assert.equal(p.password.attrs['aria-describedby'], 'credentials-status');
  assert.match(p.password.title, /expirou/);
  assert.match(p.note.style.cssText, /position:absolute/);
});
