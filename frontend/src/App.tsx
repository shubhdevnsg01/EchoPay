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

const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';

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

const newSeenMap = (): Record<UserID, Set<string>> => ({
  'user-a': new Set<string>(),
  'user-b': new Set<string>()
});

const newInitMap = (): Record<UserID, boolean> => ({
  'user-a': false,
  'user-b': false
});

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserID | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [amount, setAmount] = useState('');
  const [logs, setLogs] = useState<Transaction[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const seenLogIdsByUserRef = useRef<Record<UserID, Set<string>>>(newSeenMap());
  const hasInitializedUserLogsRef = useRef<Record<UserID, boolean>>(newInitMap());

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

  const selectedEntry = useMemo(() => logs.find((entry) => entry.id === selectedId) ?? null, [logs, selectedId]);

  const loadLogsForUser = async (user: UserID): Promise<void> => {
    const response = await fetch(`${apiBase}/api/channels/${user}/transactions`);
    if (!response.ok) {
      throw new Error('Unable to fetch logs');
    }

    const payload = (await response.json()) as Transaction[];
    const seenIds = seenLogIdsByUserRef.current[user];

    const isInitialized = hasInitializedUserLogsRef.current[user];
    if (isInitialized) {
      const newIncomingEntry = payload.find((entry) => entry.direction === 'received' && !seenIds.has(entry.id)) ?? null;
      if (newIncomingEntry) {
        speak(newIncomingEntry);
      }
    }

    payload.forEach((entry) => seenIds.add(entry.id));
    hasInitializedUserLogsRef.current[user] = true;

    setLogs(payload);
    setSelectedId((current) => (payload.some((entry) => entry.id === current) ? current : (payload[0]?.id ?? '')));
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

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadLogsForUser(currentUser).catch(() => {
        // keep existing UI state and retry on next interval
      });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUser]);

  const handleLogin = (event: FormEvent): void => {
    event.preventDefault();
    setError('');
    setStatus('');

    const found = allowedCredentials.find(
      (entry) => entry.username === username.trim().toLowerCase() && entry.password === password
    );

    if (!found) {
      setError('Invalid username or password.');
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
    setStatus('You have been logged out.');
    setError('');
    seenLogIdsByUserRef.current = newSeenMap();
    hasInitializedUserLogsRef.current = newInitMap();
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
      body: JSON.stringify({ fromUser: currentUser, toUser, amount: numericAmount })
    });

    if (!response.ok) {
      setError('Transfer failed. Please retry.');
      return;
    }

    setAmount('');
    setStatus(`${userLabel[currentUser]} sent ${formatAmount(numericAmount)} to ${userLabel[toUser]}.`);
    await loadLogsForUser(currentUser);
  };

  if (!currentUser) {
    return (
      <main className="page login-page">
        <section className="auth-shell" aria-label="Login page">
          <div className="brand-panel card">
            <p className="eyebrow">EchoPay</p>
            <h1>Accessible Two-User Payments</h1>
            <p className="muted">Securely login to your account and manage transfers with voice-ready transaction logs.</p>
          </div>

          <div className="card auth-card">
            <h2>Sign in</h2>
            <form onSubmit={handleLogin} className="stack">
              <label>
                Username
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter username"
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
            <p className="hint">Demo users: usera / pass@123 and userb / pass@123</p>
            {error ? <p className="error">{error}</p> : null}
            {status ? <p className="info">{status}</p> : null}
          </div>
        </section>
      </main>
    );
  }

  const otherUser = counterpartyOf(currentUser);

  return (
    <main className="page app-shell">
      <header className="topbar card">
        <div>
          <p className="eyebrow">Logged in</p>
          <h1>{userLabel[currentUser]} Dashboard</h1>
          <p className="muted">Send money to {userLabel[otherUser]} and monitor your personal payment history. Logs auto-sync every 2 seconds.</p>
        </div>
        <button type="button" className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="info">{status}</p> : null}

      <section className="dashboard-grid" aria-label="User dashboard">
        <form className="card" onSubmit={handleSendMoney}>
          <h2>Send Money</h2>
          <p className="muted">Receiver: {userLabel[otherUser]}</p>
          <label>
            Amount
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              inputMode="decimal"
            />
          </label>
          <button type="submit" className="primary">
            Send to {userLabel[otherUser]}
          </button>
        </form>

        <section className="card" aria-label="Payment logs">
          <h2>{userLabel[currentUser]} Logs</h2>
          {loading ? <p className="muted">Loading logs...</p> : null}
          <div className="transactions-list">
            {!loading && logs.length === 0 ? <p className="muted">No transactions yet.</p> : null}
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
