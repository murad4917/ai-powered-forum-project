/**
 * @file Landing.jsx
 * @description Public marketing route (`/`). Layout and copy align with in-app
 *   shell tokens (cards, borders, slate + orange). No data fetching.
 */
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  Search,
  PenSquare,
  Package,
  ArrowRight,
  CheckCircle2,
  FileText,
  Database,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Landing.module.css';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-48px' },
  transition: { duration: 0.45, ease: 'easeOut' },
};

const capabilityCards = [
  {
    icon: Search,
    title: 'Find related work',
    body: 'Keyword filters for exact matches, plus similarity search when you are still shaping the right vocabulary.',
  },
  {
    icon: MessageSquare,
    title: 'Readable threads',
    body: 'Questions and answers stay structured so the group can reuse explanations before exams and interviews.',
  },
  {
    icon: Sparkles,
    title: 'Lightweight AI help',
    body: 'Suggestions on your question draft and a quick relevance check on answer drafts. Always your choice to apply or post.',
  },
  {
    icon: Package,
    title: 'RAG over your course library',
    body: 'Instructors and cohorts add PDFs, syllabi, and notes into a controlled corpus. When you ask, the system retrieves the most relevant passages and attaches them to the prompt, so explanations stay tied to your class materials, not the open web.',
  },
];

const processSteps = [
  {
    icon: PenSquare,
    title: 'Ask with context',
    text: 'Title, environment, errors, and what you tried, so peers reproduce before they teach.',
  },
  {
    icon: MessageSquare,
    title: 'Get answers',
    text: 'Replies live in one thread with markdown and code blocks, visible to everyone in the cohort.',
  },
  {
    icon: Search,
    title: 'Search two ways',
    text: 'Classic text search on the feed, or semantic search when you want “questions like this one.”',
  },
  {
    icon: BarChart3,
    title: 'Own your trail',
    text: (
      <>
        Your topics list keeps authorship clear. The Knowledge base hosts
        uploads and RAG retrieval so answers can cite your materials. See{' '}
        <strong>Course RAG</strong> above for the full pipeline.
      </>
    ),
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goToAuth = (mode = 'login') => {
    navigate('/auth', { state: { mode } });
  };

  const scrollToHowItWorks = () => {
    document
      .getElementById('how-it-works')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCourseRag = () => {
    document
      .getElementById('course-rag')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.landing}>
      <header className={styles.landing__header}>
        <div className={styles.landing__headerInner}>
          <button
            type='button'
            className={styles.landing__brand}
            onClick={() => navigate('/')}
            aria-label='Evangadi Forum home'
          >
            <span className={styles.landing__brandMark} aria-hidden>
              E
            </span>
            <span className={styles.landing__brandText}>
              <span className={styles.landing__brandName}>Evangadi Forum</span>
              <span className={styles.landing__brandLine}>
                Learn together. Ask with context.
              </span>
            </span>
          </button>

          <nav className={styles.landing__nav} aria-label='Marketing'>
            <button
              type='button'
              className={styles.landing__navLink}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Overview
            </button>
            <button
              type='button'
              className={styles.landing__navLink}
              onClick={scrollToCourseRag}
            >
              Course RAG
            </button>
            <button
              type='button'
              className={styles.landing__navLink}
              onClick={scrollToHowItWorks}
            >
              How it works
            </button>
          </nav>

          <div className={styles.landing__headerActions}>
            {isAuthenticated ? (
              <button
                type='button'
                className={styles.landing__btnPrimary}
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
                <ArrowRight size={16} aria-hidden />
              </button>
            ) : (
              <>
                <button
                  type='button'
                  className={styles.landing__btnGhost}
                  onClick={() => goToAuth('login')}
                >
                  Sign in
                </button>
                <button
                  type='button'
                  className={styles.landing__btnPrimary}
                  onClick={() => goToAuth('register')}
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={styles.landing__main}>
        <section className={styles.landing__hero}>
          <div className={styles.landing__heroInner}>
            <div className={styles.landing__heroCopy}>
              <Motion.p
                className={styles.landing__eyebrow}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Search size={14} aria-hidden />
                Keyword search + embedding similarity
              </Motion.p>
              <Motion.h1
                className={styles.landing__title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                A calm place for{' '}
                <span className={styles.landing__titleAccent}>
                  technical Q&A
                </span>
              </Motion.h1>
              <Motion.p
                className={styles.landing__lead}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Post with enough context for peers to help in one pass. Search
                the archive by phrase or by meaning, keep your threads in one
                place, and ground questions in{' '}
                <strong className={styles.landing__leadStrong}>
                  course documents
                </strong>{' '}
                with retrieval-augmented generation (RAG) so answers cite the
                right syllabus, readings, and handouts.
              </Motion.p>
              <Motion.div
                className={styles.landing__heroCtas}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <button
                  type='button'
                  className={styles.landing__btnPrimary}
                  onClick={() =>
                    navigate(isAuthenticated ? '/dashboard' : '/auth', {
                      state: isAuthenticated ? undefined : { mode: 'register' },
                    })
                  }
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get started'}
                  <ArrowRight size={16} aria-hidden />
                </button>
                {!isAuthenticated && (
                  <button
                    type='button'
                    className={styles.landing__btnOutline}
                    onClick={scrollToHowItWorks}
                  >
                    See how it works
                  </button>
                )}
              </Motion.div>
            </div>

            <aside
              className={styles.landing__heroPanel}
              aria-label='What you get'
            >
              <p className={styles.landing__heroPanelLabel}>At a glance</p>
              <ul className={styles.landing__heroPanelList}>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Markdown threads and replies
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Semantic search on question embeddings
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Optional AI draft tips when you ask or answer
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  <span>
                    <strong className={styles.landing__heroPanelStrong}>
                      Course RAG:
                    </strong>{' '}
                    upload or sync course materials, retrieve the best chunks
                    for each question, and answer with citations, not generic
                    web text.
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </section>

        <section
          className={styles.landing__rag}
          id='course-rag'
          aria-labelledby='rag-heading'
        >
          <div className={styles.landing__sectionInner}>
            <p className={styles.landing__ragEyebrow}>
              Retrieval-augmented generation
            </p>
            <h2 className={styles.landing__sectionTitle} id='rag-heading'>
              How course RAG works with the forum
            </h2>
            <p className={styles.landing__sectionLead}>
              Forum search already helps you find <em>similar questions</em>{' '}
              from peers. RAG goes further: it finds{' '}
              <em>evidence inside your own documents</em> (readings, rubrics,
              lab specs) and surfaces those snippets when you write or review an
              answer. That keeps AI assistance on-policy for Evangadi-style
              courses and reduces “confident but wrong” generic answers.
            </p>
            <div className={styles.landing__ragPipeline}>
              <Motion.article
                className={styles.landing__ragStep}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0 }}
              >
                <span className={styles.landing__ragStepIcon} aria-hidden>
                  <FileText size={20} />
                </span>
                <h3 className={styles.landing__ragStepTitle}>Ingest & chunk</h3>
                <p className={styles.landing__ragStepText}>
                  Upload or connect course files; split them into overlapping
                  chunks and store embeddings the same way we already embed
                  questions, so retrieval stays fast and auditable.
                </p>
              </Motion.article>
              <Motion.article
                className={styles.landing__ragStep}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.08 }}
              >
                <span className={styles.landing__ragStepIcon} aria-hidden>
                  <Database size={20} />
                </span>
                <h3 className={styles.landing__ragStepTitle}>
                  Retrieve at question time
                </h3>
                <p className={styles.landing__ragStepText}>
                  When you open Ask or run a search, the app pulls the
                  top-matching chunks from the cohort corpus (with scores), not
                  just other threads. That is ideal for “what does the syllabus
                  say about…” style questions.
                </p>
              </Motion.article>
              <Motion.article
                className={styles.landing__ragStep}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.16 }}
              >
                <span className={styles.landing__ragStepIcon} aria-hidden>
                  <Sparkles size={20} />
                </span>
                <h3 className={styles.landing__ragStepTitle}>
                  Grounded responses
                </h3>
                <p className={styles.landing__ragStepText}>
                  Downstream prompts quote or summarize only from retrieved
                  spans, with room for instructors to review sources. The UI
                  makes it obvious when an answer drew on RAG versus peer
                  replies alone.
                </p>
              </Motion.article>
            </div>
            <p className={styles.landing__ragFootnote}>
              Live forum threads, semantic question search, draft/fit AI
              helpers, and this RAG pipeline work together: uploads and access
              control live in the Knowledge base per cohort, and RAG-backed
              context shows up in the same thread view you already use.
            </p>
          </div>
        </section>

        {!isAuthenticated && (
          <>
            <section className={styles.landing__capabilities}>
              <div
                className={`${styles.landing__sectionInner} ${styles.landing__sectionInnerCentered}`}
              >
                <h2 className={styles.landing__sectionTitle}>
                  Built for cohort coursework
                </h2>
                <p className={styles.landing__sectionLead}>
                  Same patterns you use after sign-in, without a separate
                  “marketing product.”
                </p>
                <div className={styles.landing__cardGrid}>
                  {capabilityCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <Motion.article
                        key={card.title}
                        className={styles.landing__card}
                        {...fadeUp}
                        transition={{
                          ...fadeUp.transition,
                          delay: index * 0.08,
                        }}
                      >
                        <div className={styles.landing__cardIcon} aria-hidden>
                          <Icon size={22} strokeWidth={1.75} />
                        </div>
                        <h3 className={styles.landing__cardTitle}>
                          {card.title}
                        </h3>
                        <p className={styles.landing__cardBody}>{card.body}</p>
                      </Motion.article>
                    );
                  })}
                </div>
              </div>
            </section>

            <section
              className={styles.landing__process}
              id='how-it-works'
              aria-labelledby='how-heading'
            >
              <div
                className={`${styles.landing__sectionInner} ${styles.landing__sectionInnerCentered}`}
              >
                <h2 className={styles.landing__sectionTitle} id='how-heading'>
                  How it works
                </h2>
                <p className={styles.landing__sectionLead}>
                  Four steps from question to searchable knowledge for the next
                  person.
                </p>
                <ol className={styles.landing__steps}>
                  {processSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <Motion.li
                        key={step.title}
                        className={styles.landing__step}
                        {...fadeUp}
                        transition={{
                          ...fadeUp.transition,
                          delay: index * 0.08,
                        }}
                      >
                        <span className={styles.landing__stepIcon} aria-hidden>
                          <Icon size={18} />
                        </span>
                        <div>
                          <h3 className={styles.landing__stepTitle}>
                            {step.title}
                          </h3>
                          <p className={styles.landing__stepText}>{step.text}</p>
                        </div>
                      </Motion.li>
                    );
                  })}
                </ol>
              </div>
            </section>

            <section className={styles.landing__cta}>
              <Motion.div
                className={styles.landing__ctaInner}
                {...fadeUp}
              >
                <h2 className={styles.landing__ctaTitle}>Ready when you are</h2>
                <p className={styles.landing__ctaText}>
                  Create a free learner account to post, reply, and search the
                  forum index.
                </p>
                <button
                  type='button'
                  className={styles.landing__btnPrimary}
                  onClick={() => goToAuth('register')}
                >
                  Create free account
                  <ArrowRight size={16} aria-hidden />
                </button>
              </Motion.div>
            </section>
          </>
        )}

        {isAuthenticated && (
          <section className={styles.landing__welcomeBack}>
            <div className={styles.landing__sectionInner}>
              <p className={styles.landing__eyebrow}>Signed in</p>
              <h2 className={styles.landing__sectionTitle}>
                Back to your workspace
              </h2>
              <p className={styles.landing__sectionLead}>
                Home has the live feed, shortcuts, and search. Your topics lists
                only threads you started. Course-document RAG (ingest, retrieve,
                cite) ties the Knowledge base to threads. Scroll to{' '}
                <strong>Course RAG</strong> on this page for the full picture.
              </p>
              <button
                type='button'
                className={styles.landing__btnPrimary}
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className={styles.landing__footer}>
        <div className={styles.landing__footerInner}>
          <div>
            <p className={styles.landing__footerBrand}>Evangadi Forum</p>
            <p className={styles.landing__footerMeta}>
              © {new Date().getFullYear()} · Learner-led Q&A
            </p>
          </div>
          <div className={styles.landing__footerLinks}>
            {!isAuthenticated && (
              <>
                <button
                  type='button'
                  className={styles.landing__footerLink}
                  onClick={() => goToAuth('login')}
                >
                  Sign in
                </button>
                <span className={styles.landing__footerDot} aria-hidden>
                  ·
                </span>
              </>
            )}
            <a href='#' className={styles.landing__footerLinkAnchor}>
              Privacy
            </a>
            <span className={styles.landing__footerDot} aria-hidden>
              ·
            </span>
            <a href='#' className={styles.landing__footerLinkAnchor}>
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
