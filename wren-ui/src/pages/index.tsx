import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import StatusNeoLogo from '@/components/StatusNeoLogo';
import { Path } from '@/utils/enum';

const STATUSNEO_URL = 'https://statusneo.com/';
const WREN_DOCS_URL = 'https://docs.getwren.ai/oss/overview/introduction';
const WREN_GITHUB_URL = 'https://github.com/Canner/WrenAI';

type Scenario = {
  id: string;
  label: string;
  question: string;
  sql: string;
  columns: string[];
  rows: (string | number)[][];
};

// Illustrative output only — shows the shape of what Wren AI produces.
const SCENARIOS: Scenario[] = [
  {
    id: 'revenue',
    label: 'Revenue',
    question: 'Which product categories drove the most revenue last quarter?',
    sql: `SELECT p.category,\n       SUM(oi.price * oi.quantity) AS revenue\nFROM   order_items oi\nJOIN   products p ON p.id = oi.product_id\nJOIN   orders   o ON o.id = oi.order_id\nWHERE  o.created_at >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 month')\nGROUP  BY p.category\nORDER  BY revenue DESC\nLIMIT  5;`,
    columns: ['category', 'revenue'],
    rows: [
      ['Electronics', '1,284,300'],
      ['Home & Kitchen', '902,150'],
      ['Sports', '611,740'],
      ['Beauty', '448,020'],
      ['Toys', '302,880'],
    ],
  },
  {
    id: 'people',
    label: 'People',
    question: 'How many people joined each department this year?',
    sql: `SELECT d.name AS department,\n       COUNT(*)  AS new_hires\nFROM   employees e\nJOIN   departments d ON d.id = e.department_id\nWHERE  e.hire_date >= DATE_TRUNC('year', CURRENT_DATE)\nGROUP  BY d.name\nORDER  BY new_hires DESC;`,
    columns: ['department', 'new_hires'],
    rows: [
      ['Engineering', 42],
      ['Sales', 31],
      ['Customer Success', 18],
      ['Operations', 11],
    ],
  },
  {
    id: 'retention',
    label: 'Retention',
    question: 'What share of customers placed a second order within 30 days?',
    sql: `WITH first_two AS (\n  SELECT customer_id,\n         MIN(created_at) AS first_order,\n         NTH_VALUE(created_at, 2) OVER (\n           PARTITION BY customer_id ORDER BY created_at\n         ) AS second_order\n  FROM orders\n)\nSELECT ROUND(100.0 * COUNT(*) FILTER (\n         WHERE second_order <= first_order + INTERVAL '30 day'\n       ) / COUNT(*), 1) AS repeat_rate_pct\nFROM first_two;`,
    columns: ['repeat_rate_pct'],
    rows: [['27.4']],
  },
];

const CAPABILITIES = [
  {
    icon: '⌁',
    title: 'Ask in natural language',
    text: 'Type a business question. Wren AI turns it into accurate SQL, runs it on your database and answers with a table, a chart and a plain-English summary.',
  },
  {
    icon: '◈',
    title: 'Semantic modeling layer',
    text: 'Define models, relationships, calculated fields and metrics once on a visual canvas. Every question is grounded in your business definitions — not guesswork.',
  },
  {
    icon: '▦',
    title: 'Charts & insights',
    text: 'Turn any answer into a chart in one click. Wren AI suggests follow-up questions so exploration keeps moving.',
  },
  {
    icon: '❖',
    title: 'Dashboards',
    text: 'Pin the answers that matter to a dashboard, arrange them on a grid and keep them refreshed on a schedule.',
  },
  {
    icon: '✦',
    title: 'Knowledge you control',
    text: 'Teach Wren AI with instructions and trusted question → SQL pairs, so it speaks your company’s language and follows your rules.',
  },
  {
    icon: '⟁',
    title: 'APIs & history',
    text: 'Call Wren AI from your own apps through the API and review every request in the API history, with the SQL and result behind it.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Connect',
    text: 'Link your warehouse or database, or start with a sample dataset. Credentials stay in your own deployment.',
  },
  {
    n: '02',
    title: 'Model',
    text: 'Pick the tables that matter, define relationships and add business meaning on the modeling canvas.',
  },
  {
    n: '03',
    title: 'Ask',
    text: 'Chat with your data in plain English. Inspect the reasoning steps and the SQL behind every answer.',
  },
  {
    n: '04',
    title: 'Govern & improve',
    text: 'Save good answers as knowledge, adjust SQL when needed and keep the loop learning over time.',
  },
];

const SOURCES = [
  ['BigQuery', 'bigQuery.svg'],
  ['PostgreSQL', 'postgreSql.svg'],
  ['MySQL', 'mysql.svg'],
  ['SQL Server', 'sqlserver.svg'],
  ['Oracle', 'oracle.svg'],
  ['ClickHouse', 'clickhouse.svg'],
  ['Trino', 'trino.svg'],
  ['Snowflake', 'snowflake.svg'],
  ['Athena', 'athena.svg'],
  ['Redshift', 'redshift.svg'],
  ['Databricks', 'databricks.svg'],
  ['DuckDB', 'duckDb.svg'],
];

const FAQ = [
  {
    q: 'Do I need to know SQL?',
    a: 'No. You ask in everyday language. Wren AI shows the generated SQL and the reasoning steps so technical users can verify or adjust them, but it is never required.',
  },
  {
    q: 'Where does my data live?',
    a: 'Queries run against your own database through the Wren engine inside your deployment. The question and semantic-model metadata go to the LLM provider you configure.',
  },
  {
    q: 'Which AI model does it use?',
    a: 'The default configuration uses OpenAI models. Other providers can be configured in config.yaml without changing any application code.',
  },
  {
    q: 'What makes answers trustworthy?',
    a: 'The semantic layer. Because metrics, joins and definitions are modeled once, every answer is grounded in the same business logic, and every answer exposes its SQL.',
  },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function Landing() {
  const router = useRouter();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [typed, setTyped] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0],
    [scenarioId],
  );
  const done = typed >= scenario.question.length;

  useEffect(() => {
    setTyped(0);
    const timer = setInterval(() => {
      setTyped((n) => {
        if (n >= scenario.question.length) {
          clearInterval(timer);
          return n;
        }
        return n + 1;
      });
    }, 24);
    return () => clearInterval(timer);
  }, [scenario, runKey]);

  const launch = () => router.push(Path.Launch);

  return (
    <div className="sn-landing">
      <Head>
        <title>StatusNeo × Wren AI — Ask your data in plain English</title>
        <meta
          name="description"
          content="Natural-language analytics by StatusNeo, powered by Wren AI. Ask questions, get SQL, charts and insights."
        />
      </Head>

      {/* ------------------------------------------------ NAV */}
      <header className="sn-nav">
        <button
          type="button"
          className="sn-nav__brand"
          aria-label="StatusNeo × Wren AI home"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <StatusNeoLogo height={26} showWren />
        </button>
        <nav className="sn-nav__links" aria-label="Sections">
          <button type="button" onClick={() => scrollToId('capabilities')}>
            Capabilities
          </button>
          <button type="button" onClick={() => scrollToId('how')}>
            How it works
          </button>
          <button type="button" onClick={() => scrollToId('sources')}>
            Data sources
          </button>
          <button type="button" onClick={() => scrollToId('faq')}>
            FAQ
          </button>
        </nav>
        <button
          type="button"
          className="sn-btn sn-btn--primary"
          onClick={launch}
        >
          Launch Wren AI <span aria-hidden>→</span>
        </button>
      </header>

      {/* ------------------------------------------------ HERO */}
      <section className="sn-hero sn-grid-bg">
        <div className="sn-hero__copy">
          <span className="sn-chip">AuthenticAI™ × Wren AI</span>
          <h1>
            Ask your data <span className="sn-glow-text">anything.</span>
            <br />
            In plain English.
          </h1>
          <p>
            Natural-language analytics engineered by StatusNeo. Type a business
            question — Wren AI writes the SQL, runs it on your database and
            returns tables, charts and insights you can trust.
          </p>
          <div className="sn-hero__cta">
            <button
              type="button"
              className="sn-btn sn-btn--primary sn-btn--lg"
              onClick={launch}
            >
              Launch Wren AI <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              className="sn-btn sn-btn--ghost sn-btn--lg"
              onClick={() => scrollToId('capabilities')}
            >
              Explore capabilities
            </button>
          </div>
          <ul className="sn-hero__stats">
            <li>
              <b>NL → SQL</b>
              <span>with visible reasoning</span>
            </li>
            <li>
              <b>12</b>
              <span>data source connectors</span>
            </li>
            <li>
              <b>Open</b>
              <span>source, self-hosted</span>
            </li>
          </ul>
        </div>

        <div className="sn-terminal" aria-label="Wren AI example">
          <div className="sn-terminal__bar">
            <i />
            <i />
            <i />
            <span>wren-ai://ask</span>
          </div>
          <div className="sn-terminal__tabs" role="tablist">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={s.id === scenarioId}
                className={s.id === scenarioId ? 'is-active' : ''}
                onClick={() => setScenarioId(s.id)}
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              className="sn-terminal__replay"
              title="Replay"
              onClick={() => setRunKey((k) => k + 1)}
            >
              ↻ Replay
            </button>
          </div>
          <div className="sn-terminal__body">
            <div className="sn-terminal__q">
              <span className="sn-terminal__prompt">›</span>
              {scenario.question.slice(0, typed)}
              {!done && <span className="sn-caret" />}
            </div>
            {done && (
              <>
                <div className="sn-terminal__label">Generated SQL</div>
                <pre className="sn-terminal__sql">{scenario.sql}</pre>
                <div className="sn-terminal__label">
                  Result <em>(illustrative sample)</em>
                </div>
                <table className="sn-terminal__table">
                  <thead>
                    <tr>
                      {scenario.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ CAPABILITIES */}
      <section id="capabilities" className="sn-section">
        <span className="sn-chip">What Wren AI does</span>
        <h2>From question to answer, engineered end to end.</h2>
        <p className="sn-section__lead">
          Everything you need to talk to your data — governed by a semantic
          layer, visible at every step.
        </p>
        <div className="sn-grid">
          {CAPABILITIES.map((c) => (
            <article key={c.title} className="sn-card">
              <div className="sn-card__icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ HOW */}
      <section id="how" className="sn-section sn-section--alt">
        <div className="sn-section__inner">
          <span className="sn-chip">The Loop</span>
          <h2>Connect. Model. Ask. Govern.</h2>
          <p className="sn-section__lead">
            Analytics isn’t a project — it’s a loop that keeps getting sharper.
          </p>
          <ol className="sn-steps">
            {STEPS.map((s) => (
              <li key={s.n} className="sn-step">
                <span className="sn-step__n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="sn-center">
            <button
              type="button"
              className="sn-btn sn-btn--primary"
              onClick={launch}
            >
              Start with your data <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ SOURCES */}
      <section id="sources" className="sn-section">
        <span className="sn-chip">Connectors</span>
        <h2>Works with the databases you already run.</h2>
        <div className="sn-sources">
          {SOURCES.map(([name, file]) => (
            <div key={name} className="sn-source">
              <span className="sn-source__logo">
                <Image
                  src={`/images/dataSource/${file}`}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                  loading="eager"
                />
              </span>
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ STATUSNEO */}
      <section className="sn-band">
        <div>
          <span className="sn-chip">The AuthenticAI™ Company</span>
          <h2>Engineered, not assembled.</h2>
          <p>
            StatusNeo builds AI-native systems that are responsible, observable
            and governed. Wren AI brings that philosophy to analytics: every
            answer shows its work.
          </p>
        </div>
        <div className="sn-band__actions">
          <a
            className="sn-btn sn-btn--primary"
            href={STATUSNEO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit StatusNeo ↗
          </a>
          <a
            className="sn-btn sn-btn--ghost"
            href={WREN_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wren AI docs ↗
          </a>
        </div>
      </section>

      {/* ------------------------------------------------ FAQ */}
      <section id="faq" className="sn-section">
        <span className="sn-chip">FAQ</span>
        <h2>Good questions.</h2>
        <div className="sn-faq">
          {FAQ.map((f, i) => (
            <div
              key={f.q}
              className={`sn-faq__item${openFaq === i ? ' is-open' : ''}`}
            >
              <button
                type="button"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {f.q}
                <span aria-hidden>{openFaq === i ? '–' : '+'}</span>
              </button>
              {openFaq === i && <p>{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ CTA */}
      <section className="sn-cta sn-grid-bg">
        <h2>Ready to talk to your data?</h2>
        <button
          type="button"
          className="sn-btn sn-btn--primary sn-btn--lg"
          onClick={launch}
        >
          Launch Wren AI <span aria-hidden>→</span>
        </button>
      </section>

      {/* ------------------------------------------------ FOOTER */}
      <footer className="sn-footer">
        <StatusNeoLogo height={22} />
        <div className="sn-footer__links">
          <a href={STATUSNEO_URL} target="_blank" rel="noopener noreferrer">
            statusneo.com
          </a>
          <a href={WREN_DOCS_URL} target="_blank" rel="noopener noreferrer">
            Docs
          </a>
          <a href={WREN_GITHUB_URL} target="_blank" rel="noopener noreferrer">
            Wren AI on GitHub
          </a>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back to top ↑
          </button>
        </div>
        <p>
          Built on the open-source Wren AI project (AGPL-3.0). StatusNeo and
          AuthenticAI™ are trademarks of their respective owners.
        </p>
      </footer>
    </div>
  );
}
