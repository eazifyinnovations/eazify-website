// Eazify Chatbot Widget
// Talks only to our own /api/chat endpoint — the OpenAI key never touches the browser.

(function () {
  const GREETING =
    "Hi, I'm the Eazify assistant. Tell me a bit about your business and what you're hoping to achieve, and I'll help point you to the right solution — or connect you with the team.";

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
      'aria-label': 'Chat with Eazify support',
      'aria-expanded': 'false',
      type: 'button',
    });
    // Friendly support-avatar icon: rounded head, warm skin tone, headset — reads as
    // "a real person is here to help" rather than an abstract chat-bubble glyph.
    toggle.innerHTML =
      '<svg class="eazify-chat-icon-open" width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="24" cy="24" r="22" fill="#0A63F7"/>' +
        '<path d="M11 23a13 13 0 0 1 26 0" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
        '<rect x="9" y="21" width="6" height="10" rx="3" fill="#FFFFFF"/>' +
        '<rect x="33" y="21" width="6" height="10" rx="3" fill="#FFFFFF"/>' +
        '<circle cx="24" cy="26" r="11" fill="#C88A5A"/>' +
        '<path d="M13 24c0-7 22-7 22 0" fill="#0A63F7"/>' +
        '<circle cx="19.5" cy="27" r="1.6" fill="#1B2130"/>' +
        '<circle cx="28.5" cy="27" r="1.6" fill="#1B2130"/>' +
        '<path d="M19 32c1.6 1.8 8.4 1.8 10 0" stroke="#1B2130" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
        '<rect x="21.5" y="34.5" width="5" height="5" rx="2" fill="#FFFFFF"/>' +
      '</svg>' +
      '<svg class="eazify-chat-icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>';

    const nudge = el('div', { class: 'eazify-chat-nudge' , html: 'Need help? Click to chat with us 💬'});

    const panel = el('div', { class: 'eazify-chat-panel', role: 'dialog', 'aria-label': 'Chat with Eazify' });

    const header = el('div', { class: 'eazify-chat-header' }, [
      el('div', { class: 'eazify-chat-header-text', html: '<strong>Ask Eazify</strong><span>Usually replies in a few seconds</span>' }),
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
    // recognize a floating icon as a live chat without a hint.
    let nudgeShown = false;
    let nudgeTimer = setTimeout(() => {
      if (!isOpen) {
        widget.nudge.classList.add('is-visible');
        nudgeShown = true;
      }
    }, 2200);
    let nudgeAutoHide = setTimeout(() => {
      widget.nudge.classList.remove('is-visible');
    }, 10000);

    function dismissNudge() {
      clearTimeout(nudgeTimer);
      clearTimeout(nudgeAutoHide);
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
