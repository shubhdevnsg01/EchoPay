import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type UserID = 'user-a' | 'user-b';

type Direction = 'sent' | 'received';

type Transaction = {
  id: string;
  channel: string;
  user: UserID;
  counterparty: UserID;
  direction: Direction;
  amount: number;
  createdAt: string;
};

type Credentials = {
  username: string;
  password: string;
  userId: UserID;
};

const apiBase = 'http://localhost:8081';

const allowedCredentials: Credentials[] = [
  { username: 'usera', password: 'pass@123', userId: 'user-a' },
  { username: 'userb', password: 'pass@123', userId: 'user-b' }
];

const userLabel: Record<UserID, string> = {
  'user-a': 'User A',
  'user-b': 'User B'
};

const counterpartyOf = (user: UserID): UserID => (user === 'user-a' ? 'user-b' : 'user-a');

const formatAmount = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);

const formatTime = (isoTime: string): string =>
  new Date(isoTime).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

const speechText = (entry: Transaction): string => {
  const action = entry.direction === 'sent' ? 'sent to' : 'received from';
  return `${formatAmount(entry.amount)} ${action} ${userLabel[entry.counterparty]} on ${formatTime(entry.createdAt)}`;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserID | null>(null);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [logs, setLogs] = useState<Transaction[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const logsSectionRef = useRef<HTMLElement | null>(null);

  const selectedEntry = useMemo(
    () => logs.find((entry) => entry.id === selectedId) ?? null,
    [logs, selectedId]
  );

  const scrollToLogs = (): void => {
    logsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const loadLogsForUser = async (user: UserID): Promise<void> => {
    const response = await fetch(`${apiBase}/api/channels/${user}/transactions`);
    if (!response.ok) {
      throw new Error('Unable to fetch logs');
    }

    const payload = (await response.json()) as Transaction[];
    setLogs(payload);
    if (payload.length > 0) {
      setSelectedId(payload[0].id);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setLoading(true);
    loadLogsForUser(currentUser)
      .catch(() => setError('Could not load logs. Ensure transactions service is running on port 8081.'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleLogin = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');
    setStatus('');

    const found = allowedCredentials.find(
      (entry) => entry.username === username.trim().toLowerCase() && entry.password === password
    );

    if (!found) {
      setError('Invalid username or password. Try usera/pass@123 or userb/pass@123');
      return;
    }

    setCurrentUser(found.userId);
    setUsername('');
    setPassword('');
  };

  const handleLogout = (): void => {
    setCurrentUser(null);
    setLogs([]);
    setSelectedId('');
    setAmount('');
    setStatus('Logged out successfully.');
    setError('');
  };

  const handleSendMoney = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }

    setError('');
    setStatus('');

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    const toUser = counterpartyOf(currentUser);
    const response = await fetch(`${apiBase}/api/channels/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUser: currentUser,
        toUser,
        amount: numericAmount
      })
    });

    if (!response.ok) {
      setError('Transfer failed. Please retry.');
      return;
    }

    setAmount('');
    setStatus(`${userLabel[currentUser]} sent ${formatAmount(numericAmount)} to ${userLabel[toUser]}.`);
    await loadLogsForUser(currentUser);
    scrollToLogs();
  };

  const speak = (entry: Transaction | null): void => {
    if (!entry || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText(entry));
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  if (!currentUser) {
    return (
      <main className="app-shell centered">
        <section className="card login-card" aria-label="Login page">
          <h1>EchoPay Login</h1>
          <p className="muted">Login as User A or User B to access your payment window and logs.</p>
          <form onSubmit={handleLogin}>
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="usera or userb"
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="primary">
              Login
            </button>
          </form>
          <p className="muted small">Demo credentials: usera/pass@123, userb/pass@123</p>
          {error ? <p className="error">{error}</p> : null}
          {status ? <p className="info">{status}</p> : null}
        </section>
      </main>
    );
  }

  const otherUser = counterpartyOf(currentUser);

  return (
    <main className="app-shell">
      <header>
        <h1>{userLabel[currentUser]} Dashboard</h1>
        <p>
          You are logged in as {userLabel[currentUser]}. Send money only to {userLabel[otherUser]} and review your own
          logs.
        </p>
        <button type="button" className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <button type="button" className="transactions-beacon" onClick={scrollToLogs}>
        📌 Jump to My Logs
      </button>

      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="info">{status}</p> : null}

      <section className="single-grid" aria-label="Single user payment window">
        <form className="card" onSubmit={handleSendMoney}>
          <h2>Send Money</h2>
          <p className="muted">Allowed receiver: {userLabel[otherUser]}</p>
          <label>
            Amount
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
              inputMode="decimal"
            />
          </label>
          <button type="submit" className="primary">
            Send to {userLabel[otherUser]}
          </button>
        </form>

        <section className="card" ref={logsSectionRef} aria-label="Logged in user payment logs">
          <h2>{userLabel[currentUser]} Payment Logs</h2>
          {loading ? <p className="muted">Loading...</p> : null}
          <div className="transactions-list">
            {logs.length === 0 && !loading ? <p className="muted">No logs yet.</p> : null}
            {logs.map((entry) => (
              <button
                key={entry.id}
                className={`transaction-item ${selectedId === entry.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(entry.id)}
                aria-label={`${entry.direction} ${formatAmount(entry.amount)} ${userLabel[entry.counterparty]} ${formatTime(
                  entry.createdAt
                )}`}
              >
                <strong>{entry.direction === 'sent' ? 'Sent to' : 'Received from'} {userLabel[entry.counterparty]}</strong>
                <span>{formatAmount(entry.amount)}</span>
                <span>{formatTime(entry.createdAt)}</span>
              </button>
            ))}
          </div>
          <button type="button" className="voice" onClick={() => speak(selectedEntry)} disabled={!selectedEntry}>
            🔊 Speak selected log
          </button>
        </section>
      </section>
    </main>
  );
}
