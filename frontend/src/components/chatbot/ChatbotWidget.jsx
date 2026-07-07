import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, ChevronUp, Send, Sparkles } from 'lucide-react';
import { chatbotService } from '../../services/chatbot/chatbot.service.js';
import styles from './ChatbotWidget.module.css';

const STARTER_PROMPTS = [
  'What is Evangadi?',
  'What does Evangadi teach?',
  'Does Evangadi offer scholarships?',
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! I can answer questions about Evangadi programs, tutoring, scholarships, and careers. What would you like to know?',
    },
  ]);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const status = await chatbotService.getStatus();
        if (active) setReady(Boolean(status.ready));
      } catch {
        if (active) setReady(false);
      } finally {
        if (active) setStatusLoading(false);
      }
    }

    loadStatus();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages, loading]);

  const buildHistory = useCallback(
    currentMessages =>
      currentMessages
        .filter(item => item.id !== 'welcome')
        .map(item => ({
          role: item.role,
          content: item.content,
        })),
    [],
  );

  const sendPrompt = async text => {
    const trimmed = text.trim();
    if (!trimmed || loading || !ready) return;

    setError('');
    setLoading(true);

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');

    try {
      const history = buildHistory(messages);
      const data = await chatbotService.sendMessage(trimmed, history);

      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.answer || 'I could not generate a response.',
        },
      ]);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = event => {
    event.preventDefault();
    sendPrompt(input);
  };

  return (
    <div className={styles.chatbot}>
      <button
        type='button'
        className={`${styles.chatbot__toggle} ${open ? styles['chatbot__toggle--active'] : ''}`}
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls='evangadi-chatbot-panel'
      >
        <span className={styles.chatbot__toggleLabel}>
          <Bot size={16} aria-hidden />
          Evangadi Assistant
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {open && (
        <div
          id='evangadi-chatbot-panel'
          className={styles.chatbot__panel}
          role='region'
          aria-label='Evangadi assistant chat'
        >
          <div className={styles.chatbot__header}>
            <Sparkles size={14} aria-hidden />
            <span>Ask about Evangadi</span>
          </div>

          <div className={styles.chatbot__messages}>
            {messages.map(message => (
              <div
                key={message.id}
                className={`${styles.chatbot__message} ${
                  message.role === 'user'
                    ? styles['chatbot__message--user']
                    : styles['chatbot__message--assistant']
                }`}
              >
                {message.content}
              </div>
            ))}

            {loading && (
              <div
                className={`${styles.chatbot__message} ${styles['chatbot__message--assistant']} ${styles.chatbot__typing}`}
              >
                Thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {!statusLoading && !ready && (
            <p className={styles.chatbot__notice}>
              Knowledge base is still loading. Please try again in a moment.
            </p>
          )}

          {error && <p className={styles.chatbot__error}>{error}</p>}

          <div className={styles.chatbot__starters}>
            {STARTER_PROMPTS.map(prompt => (
              <button
                key={prompt}
                type='button'
                className={styles.chatbot__starter}
                onClick={() => sendPrompt(prompt)}
                disabled={loading || !ready}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form className={styles.chatbot__form} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type='text'
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder='Ask about programs, tutoring, scholarships...'
              className={styles.chatbot__input}
              disabled={loading || !ready}
              maxLength={2000}
              aria-label='Chat message'
            />
            <button
              type='submit'
              className={styles.chatbot__send}
              disabled={loading || !ready || !input.trim()}
              aria-label='Send message'
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
