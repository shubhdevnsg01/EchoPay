import { FormEvent, useMemo, useState } from 'react';

type Verdict = 'Safe' | 'Suspicious' | 'Phishing';
type Severity = 'Low' | 'Medium' | 'High';

type EmailInput = {
  sender: string;
  subject: string;
  body: string;
};

type Finding = {
  id: string;
  label: string;
  description: string;
  points: number;
  severity: Severity;
};

type ScanResult = {
  id: string;
  createdAt: string;
  sender: string;
  subject: string;
  score: number;
  verdict: Verdict;
  findings: Finding[];
};

const trustedDomains = ['gmail.com', 'outlook.com', 'microsoft.com', 'apple.com', 'amazon.com', 'paypal.com', 'github.com'];
const riskyTlds = ['.zip', '.mov', '.click', '.top', '.xyz', '.quest'];
const credentialWords = ['password', 'verify', 'login', 'credential', 'account suspended', 'confirm your account'];
const urgencyWords = ['urgent', 'immediately', 'final warning', 'act now', 'within 24 hours', 'today only'];
const moneyWords = ['wire transfer', 'gift card', 'invoice', 'payment failed', 'refund', 'bank account'];
const attachmentWords = ['attached', 'attachment', '.exe', '.scr', '.iso', '.html', '.zip'];

const sampleEmails: EmailInput[] = [
  {
    sender: 'security@paypaI-alerts.com',
    subject: 'Urgent: verify your account today',
    body: 'Your account will be suspended within 24 hours. Login at https://paypal-security.example.click to confirm your password.'
  },
  {
    sender: 'hr@company.com',
    subject: 'Updated holiday calendar',
    body: 'Hi team, the updated holiday calendar is available on the employee portal. No action is required today.'
  },
  {
    sender: 'billing@vendor-invoices.xyz',
    subject: 'Invoice payment failed',
    body: 'Please open the attached invoice.html and complete a wire transfer immediately to avoid service interruption.'
  }
];

const initialEmail: EmailInput = sampleEmails[0];

const getDomain = (sender: string) => sender.split('@')[1]?.trim().toLowerCase() ?? '';

const extractUrls = (text: string) => text.match(/https?:\/\/[^\s)]+/gi) ?? [];

const countMatches = (text: string, words: string[]) => words.filter((word) => text.includes(word)).length;

const classifyScore = (score: number): Verdict => {
  if (score >= 70) {
    return 'Phishing';
  }

  if (score >= 35) {
    return 'Suspicious';
  }

  return 'Safe';
};

const analyzeEmail = (email: EmailInput): Omit<ScanResult, 'id' | 'createdAt'> => {
  const findings: Finding[] = [];
  const normalizedSubject = email.subject.toLowerCase();
  const normalizedBody = email.body.toLowerCase();
  const combinedText = `${normalizedSubject} ${normalizedBody}`;
  const senderDomain = getDomain(email.sender);
  const urls = extractUrls(email.body);

  if (!email.sender.includes('@') || !senderDomain.includes('.')) {
    findings.push({
      id: 'invalid-sender',
      label: 'Invalid sender address',
      description: 'The sender address does not look like a complete email address.',
      points: 20,
      severity: 'Medium'
    });
  }

  const lookalikeDomain = trustedDomains.find((domain) => senderDomain && senderDomain !== domain && senderDomain.replace('1', 'l').replace('i', 'l').includes(domain.split('.')[0]));
  if (lookalikeDomain) {
    findings.push({
      id: 'lookalike-domain',
      label: 'Possible brand impersonation',
      description: `The sender domain resembles ${lookalikeDomain} but is not an exact match.`,
      points: 30,
      severity: 'High'
    });
  }

  const riskyTld = riskyTlds.find((tld) => senderDomain.endsWith(tld) || urls.some((url) => url.toLowerCase().includes(tld)));
  if (riskyTld) {
    findings.push({
      id: 'risky-tld',
      label: 'Risky domain ending',
      description: `The email uses a domain or URL ending in ${riskyTld}.`,
      points: 20,
      severity: 'Medium'
    });
  }

  const urgencyCount = countMatches(combinedText, urgencyWords);
  if (urgencyCount > 0) {
    findings.push({
      id: 'urgency',
      label: 'Urgency pressure',
      description: 'The message pressures the reader to act quickly, a common phishing tactic.',
      points: Math.min(25, urgencyCount * 10),
      severity: urgencyCount > 1 ? 'High' : 'Medium'
    });
  }

  const credentialCount = countMatches(combinedText, credentialWords);
  if (credentialCount > 0) {
    findings.push({
      id: 'credential-request',
      label: 'Credential or account request',
      description: 'The email asks for login, password, verification, or account recovery action.',
      points: Math.min(30, credentialCount * 12),
      severity: 'High'
    });
  }

  const moneyCount = countMatches(combinedText, moneyWords);
  if (moneyCount > 0) {
    findings.push({
      id: 'financial-lure',
      label: 'Financial lure',
      description: 'The message references payment, invoices, refunds, bank details, or gift cards.',
      points: Math.min(25, moneyCount * 10),
      severity: moneyCount > 1 ? 'High' : 'Medium'
    });
  }

  const attachmentCount = countMatches(combinedText, attachmentWords);
  if (attachmentCount > 0) {
    findings.push({
      id: 'attachment-risk',
      label: 'Suspicious attachment language',
      description: 'The email asks the user to open an attachment or mentions risky file types.',
      points: Math.min(25, attachmentCount * 10),
      severity: attachmentCount > 1 ? 'High' : 'Medium'
    });
  }

  if (urls.length > 0 && urls.some((url) => !senderDomain || !url.toLowerCase().includes(senderDomain))) {
    findings.push({
      id: 'link-domain-mismatch',
      label: 'Link does not match sender',
      description: 'At least one link points to a different domain than the sender domain.',
      points: 25,
      severity: 'High'
    });
  }

  const score = Math.min(100, findings.reduce((total, finding) => total + finding.points, 0));

  return {
    sender: email.sender,
    subject: email.subject,
    score,
    verdict: classifyScore(score),
    findings
  };
};

export default function App() {
  const [email, setEmail] = useState<EmailInput>(initialEmail);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const currentAnalysis = useMemo(() => analyzeEmail(email), [email]);

  const handleScan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result: ScanResult = {
      ...currentAnalysis,
      id: `scan-${Date.now()}`,
      createdAt: new Date().toLocaleString()
    };
    setHistory((current) => [result, ...current].slice(0, 6));
  };

  const loadSample = (sample: EmailInput) => {
    setEmail(sample);
  };

  return (
    <main className="app-shell">
      <section className="hero panel">
        <div>
          <p className="eyebrow">Phishing Email Detection System</p>
          <h1>Detect risky emails before users click.</h1>
          <p className="hero-copy">
            Paste an email, scan it with rule-based threat signals, review the risk score, and learn exactly which indicators made it suspicious.
          </p>
        </div>
        <div className={`verdict-card ${currentAnalysis.verdict.toLowerCase()}`}>
          <span>Current verdict</span>
          <strong>{currentAnalysis.verdict}</strong>
          <small>{currentAnalysis.score}/100 risk score</small>
        </div>
      </section>

      <section className="grid two-column">
        <form className="panel scanner" onSubmit={handleScan}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Email Scanner</p>
              <h2>Analyze Message</h2>
            </div>
            <button type="submit">Save scan</button>
          </div>

          <label>
            Sender email
            <input value={email.sender} onChange={(event) => setEmail({ ...email, sender: event.target.value })} placeholder="security@example.com" />
          </label>

          <label>
            Subject
            <input value={email.subject} onChange={(event) => setEmail({ ...email, subject: event.target.value })} placeholder="Account notice" />
          </label>

          <label>
            Email body
            <textarea value={email.body} onChange={(event) => setEmail({ ...email, body: event.target.value })} placeholder="Paste email content here" />
          </label>
        </form>

        <section className="panel results">
          <p className="eyebrow">Detection Results</p>
          <h2>Threat Indicators</h2>
          <div className="score-bar" aria-label={`Risk score ${currentAnalysis.score} out of 100`}>
            <span style={{ width: `${currentAnalysis.score}%` }} />
          </div>
          {currentAnalysis.findings.length ? (
            <div className="finding-list">
              {currentAnalysis.findings.map((finding) => (
                <article className="finding" key={finding.id}>
                  <span className={`severity ${finding.severity.toLowerCase()}`}>{finding.severity}</span>
                  <h3>{finding.label}</h3>
                  <p>{finding.description}</p>
                  <small>+{finding.points} risk points</small>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">No phishing indicators detected by the current rules.</p>
          )}
        </section>
      </section>

      <section className="grid two-column">
        <section className="panel samples">
          <p className="eyebrow">Samples</p>
          <h2>Try Example Emails</h2>
          {sampleEmails.map((sample) => (
            <button type="button" key={sample.subject} className="sample-card" onClick={() => loadSample(sample)}>
              <strong>{sample.subject}</strong>
              <small>{sample.sender}</small>
            </button>
          ))}
        </section>

        <section className="panel history">
          <p className="eyebrow">Scan History</p>
          <h2>Recent Saved Scans</h2>
          {history.length ? (
            history.map((scan) => (
              <article className="history-card" key={scan.id}>
                <div>
                  <strong>{scan.subject || 'No subject'}</strong>
                  <small>{scan.sender} • {scan.createdAt}</small>
                </div>
                <span className={`verdict-pill ${scan.verdict.toLowerCase()}`}>{scan.verdict} · {scan.score}</span>
              </article>
            ))
          ) : (
            <p className="empty-state">Run and save a scan to build history.</p>
          )}
        </section>
      </section>
    </main>
  );
}
