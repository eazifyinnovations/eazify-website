// Eazify Chatbot Widget
// Talks only to our own /api/chat endpoint — the OpenAI key never touches the browser.

(function () {
  const GREETING =
    "Hi, I'm Eazi, Eazify's AI assistant. Eazi can recommend the right solution for your business.";

  const FALLBACK_ERROR =
    "I'm having trouble connecting right now. You can reach us directly at hello@eazifyinnovations.com, or schedule a Strategy Session.";

  let history = []; // { role: 'user' | 'assistant', content: string }
  let isOpen = false;
  let isSending = false;

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((c) => c && node.appendChild(c));
    return node;
  }

  function buildWidget() {
    const root = el('div', { class: 'eazify-chat-root' });

    const toggle = el('button', {
      class: 'eazify-chat-toggle',
      'aria-label': 'Chat with EaziAI',
      'aria-expanded': 'false',
      type: 'button',
    });
    // Launcher icon: the glowing "E" mark, on its own dark rounded frame —
    // replaces the earlier illustrated support-avatar.
    toggle.innerHTML =
      '<img class="eazify-chat-icon-open" src="assets/eaziai-launcher.png" alt="" width="40" height="40">' +
      '<svg class="eazify-chat-icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>';

    const nudge = el('div', { class: 'eazify-chat-nudge' , html: 'Chat with EaziAI to find your tailored solution →'});

    const panel = el('div', { class: 'eazify-chat-panel', role: 'dialog', 'aria-label': 'Chat with EaziAI' });

    const header = el('div', { class: 'eazify-chat-header' }, [
      el('div', { class: 'eazify-chat-header-row' }, [
        el('img', { src: 'assets/eazify-mark.png', alt: '', class: 'eazify-chat-badge' }),
        el('div', { class: 'eazify-chat-header-text', html: '<strong>Ask EaziAI</strong><span>Usually replies in a few seconds</span>' }),
      ]),
    ]);

    const messages = el('div', { class: 'eazify-chat-messages' });

    const quickLinks = el('div', { class: 'eazify-chat-quicklinks' }, [
      el('a', { href: 'strategy-session.html', class: 'eazify-chat-quicklink' , html: 'Schedule a Strategy Session'}),
      el('a', { href: 'contact.html', class: 'eazify-chat-quicklink eazify-chat-quicklink-ghost', html: 'Contact us' }),
    ]);

    const form = el('form', { class: 'eazify-chat-form' });
    const input = el('input', {
      type: 'text',
      class: 'eazify-chat-input',
      placeholder: 'Type your message…',
      'aria-label': 'Message',
      autocomplete: 'off',
    });
    const sendBtn = el('button', { type: 'submit', class: 'eazify-chat-send', 'aria-label': 'Send message' });
    sendBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12L20 4L14 20L11 13L4 12Z" stroke="white" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    form.appendChild(input);
    form.appendChild(sendBtn);

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(quickLinks);
    panel.appendChild(form);

    root.appendChild(panel);
    root.appendChild(nudge);
    root.appendChild(toggle);
    document.body.appendChild(root);

    return { root, toggle, panel, messages, form, input, nudge };
  }

  function addBubble(messagesEl, role, text) {
    const bubble = el('div', { class: `eazify-chat-bubble eazify-chat-bubble-${role}` });
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function addTyping(messagesEl) {
    const typing = el('div', { class: 'eazify-chat-bubble eazify-chat-bubble-assistant eazify-chat-typing' });
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return typing;
  }

  async function sendMessage(widget, text) {
    if (isSending || !text.trim()) return;
    isSending = true;

    addBubble(widget.messages, 'user', text);
    history.push({ role: 'user', content: text });

    const typing = addTyping(widget.messages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      typing.remove();

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        addBubble(widget.messages, 'assistant', errData.error || FALLBACK_ERROR);
        isSending = false;
        return;
      }

      const data = await response.json();
      const reply = data.reply || FALLBACK_ERROR;
      addBubble(widget.messages, 'assistant', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      typing.remove();
      addBubble(widget.messages, 'assistant', FALLBACK_ERROR);
    } finally {
      isSending = false;
    }
  }

  function init() {
    const widget = buildWidget();

    // Nudge people to notice the widget is clickable — most visitors don't
    // recognize a floating icon as a live chat without a hint. Cycles on
    // repeat (visible 5s, hidden 60s) rather than showing once and vanishing,
    // so people who scroll past it early still get another chance to see it.
    let nudgeShown = false;
    const NUDGE_VISIBLE_MS = 5000;
    const NUDGE_INTERVAL_MS = 60000;

    function showNudge() {
      if (isOpen) return;
      widget.nudge.classList.add('is-visible');
      nudgeShown = true;
      nudgeHideTimer = setTimeout(() => {
        widget.nudge.classList.remove('is-visible');
      }, NUDGE_VISIBLE_MS);
    }

    let nudgeHideTimer = null;
    let nudgeTimer = setTimeout(showNudge, 2200);
    let nudgeCycle = setInterval(showNudge, NUDGE_INTERVAL_MS);

    function dismissNudge() {
      clearTimeout(nudgeTimer);
      clearTimeout(nudgeHideTimer);
      clearInterval(nudgeCycle);
      widget.nudge.classList.remove('is-visible');
    }

    widget.nudge.addEventListener('click', () => {
      dismissNudge();
      widget.toggle.click();
    });

    widget.toggle.addEventListener('click', () => {
      isOpen = !isOpen;
      dismissNudge();
      widget.root.classList.toggle('is-open', isOpen);
      widget.toggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen && widget.messages.children.length === 0) {
        addBubble(widget.messages, 'assistant', GREETING);
      }
      if (isOpen) widget.input.focus();
    });

    widget.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = widget.input.value;
      widget.input.value = '';
      sendMessage(widget, text);
    });

    // Keyboard accessibility: Escape closes the panel; Tab is trapped inside
    // the panel while it's open so keyboard users don't tab into the page
    // content hidden behind it.
    widget.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        isOpen = false;
        widget.root.classList.remove('is-open');
        widget.toggle.setAttribute('aria-expanded', 'false');
        widget.toggle.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = widget.panel.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
