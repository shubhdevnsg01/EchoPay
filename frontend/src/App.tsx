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

const apiBase = 'http://localhost:8081';

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
  const [logs, setLogs] = useState<Record<UserID, Transaction[]>>({ 'user-a': [], 'user-b': [] });
  const [amountByUser, setAmountByUser] = useState<Record<UserID, string>>({ 'user-a': '', 'user-b': '' });
  const [selectedByUser, setSelectedByUser] = useState<Record<UserID, string>>({ 'user-a': '', 'user-b': '' });
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const logsSectionRef = useRef<HTMLElement | null>(null);

  const selectedA = useMemo(
    () => logs['user-a'].find((entry) => entry.id === selectedByUser['user-a']) ?? null,
    [logs, selectedByUser]
  );
  const selectedB = useMemo(
    () => logs['user-b'].find((entry) => entry.id === selectedByUser['user-b']) ?? null,
    [logs, selectedByUser]
  );

  const scrollToLogs = (): void => {
    logsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const loadUserLogs = async (user: UserID): Promise<Transaction[]> => {
    const response = await fetch(`${apiBase}/api/channels/${user}/transactions`);
    if (!response.ok) {
      throw new Error('Unable to fetch logs');
    }
    return (await response.json()) as Transaction[];
  };

  const refreshAllLogs = async (): Promise<void> => {
    const [aLogs, bLogs] = await Promise.all([loadUserLogs('user-a'), loadUserLogs('user-b')]);
    setLogs({ 'user-a': aLogs, 'user-b': bLogs });

    if (aLogs.length > 0) {
      setSelectedByUser((current) => ({ ...current, 'user-a': current['user-a'] || aLogs[0].id }));
    }
    if (bLogs.length > 0) {
      setSelectedByUser((current) => ({ ...current, 'user-b': current['user-b'] || bLogs[0].id }));
    }
  };

  useEffect(() => {
    refreshAllLogs()
      .catch(() => {
        setError('Transactions service not reachable on port 8081.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const transferFrom = (fromUser: UserID) => async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');
    setStatus('');

    const amount = Number(amountByUser[fromUser]);
    if (Number.isNaN(amount) || amount <= 0) {
      setError(`Enter a valid amount for ${userLabel[fromUser]}.`);
      return;
    }

    const toUser = counterpartyOf(fromUser);
    const response = await fetch(`${apiBase}/api/channels/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUser, toUser, amount })
    });

    if (!response.ok) {
      setError('Transfer failed. Please retry.');
      return;
    }

    setAmountByUser((current) => ({ ...current, [fromUser]: '' }));
    setStatus(`${userLabel[fromUser]} sent ${formatAmount(amount)} to ${userLabel[toUser]}.`);

    await refreshAllLogs();
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

  return (
    <main className="app-shell">
      <header>
        <h1>EchoPay Two-User Channel</h1>
        <p>Only two users can transfer money between each other. Each user has a separate log window.</p>
      </header>

      <button type="button" className="transactions-beacon" onClick={scrollToLogs}>
        📌 Jump to User Logs
      </button>

      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="info">{status}</p> : null}

      <section className="transfer-grid" aria-label="Transfer windows">
        {(['user-a', 'user-b'] as UserID[]).map((user) => (
          <form key={user} className="card" onSubmit={transferFrom(user)}>
            <h2>{userLabel[user]} Window</h2>
            <p className="muted">Can send only to {userLabel[counterpartyOf(user)]}</p>
            <label>
              Amount to send
              <input
                value={amountByUser[user]}
                onChange={(event) =>
                  setAmountByUser((current) => ({
                    ...current,
                    [user]: event.target.value
                  }))
                }
                placeholder="Enter amount"
                inputMode="decimal"
              />
            </label>
            <button type="submit" className="primary">
              Send to {userLabel[counterpartyOf(user)]}
            </button>
          </form>
        ))}
      </section>

      <section className="logs-grid" ref={logsSectionRef} aria-label="Separate user logs">
        {(['user-a', 'user-b'] as UserID[]).map((user) => {
          const selected = user === 'user-a' ? selectedA : selectedB;
          return (
            <article key={user} className="card">
              <h2>{userLabel[user]} Log</h2>
              {loading ? <p className="muted">Loading...</p> : null}
              <div className="transactions-list">
                {logs[user].map((entry) => (
                  <button
                    key={entry.id}
                    className={`transaction-item ${selectedByUser[user] === entry.id ? 'selected' : ''}`}
                    onClick={() =>
                      setSelectedByUser((current) => ({
                        ...current,
                        [user]: entry.id
                      }))
                    }
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

              <button type="button" className="voice" onClick={() => speak(selected)} disabled={!selected}>
                🔊 Speak selected log
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
