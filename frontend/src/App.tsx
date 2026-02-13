import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type TransactionType = 'sent' | 'received';

type Transaction = {
  id: string;
  amount: number;
  counterparty: string;
  type: TransactionType;
  createdAt: string;
};

const transactionsApi = 'http://localhost:8081';

const formatAmount = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

const buildSpeechText = (transaction: Transaction): string => {
  const action = transaction.type === 'sent' ? 'paid to' : 'received from';
  return `${formatAmount(transaction.amount)} ${action} ${transaction.counterparty} on ${formatTime(transaction.createdAt)}`;
};

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [sendName, setSendName] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [receiveName, setReceiveName] = useState<string>('');
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<string>('');
  const transactionsRef = useRef<HTMLElement | null>(null);

  const selectedTransaction = useMemo(
    () => transactions.find((transaction) => transaction.id === selectedId) ?? null,
    [selectedId, transactions]
  );

  const scrollToTransactions = (): void => {
    transactionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const loadTransactions = async (): Promise<void> => {
    const response = await fetch(`${transactionsApi}/api/transactions`);
    if (!response.ok) {
      throw new Error('Could not fetch transactions');
    }

    const payload = (await response.json()) as Transaction[];
    setTransactions(payload);
    if (payload.length > 0) {
      setSelectedId((current) => current || payload[0].id);
    }
  };

  useEffect(() => {
    loadTransactions().catch(() => {
      setError('Unable to load transactions. Please start transactions service on port 8081.');
    });
  }, []);

  const submitTransaction = async (
    event: FormEvent,
    type: TransactionType,
    name: string,
    amount: string
  ): Promise<void> => {
    event.preventDefault();
    setError('');
    setInfo('');

    const numericAmount = Number(amount);
    if (!name.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid name and amount.');
      return;
    }

    const response = await fetch(`${transactionsApi}/api/transactions/${type === 'sent' ? 'send' : 'receive'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: numericAmount,
        counterparty: name.trim()
      })
    });

    if (!response.ok) {
      throw new Error('failed to create transaction');
    }

    if (type === 'sent') {
      setSendName('');
      setSendAmount('');
      setInfo('Payment sent. Opening My Transactions.');
    } else {
      setReceiveName('');
      setReceiveAmount('');
      setInfo('Payment received. Opening My Transactions.');
    }

    await loadTransactions();
    scrollToTransactions();
  };

  const handleSubmit = (type: TransactionType) => async (event: FormEvent): Promise<void> => {
    try {
      const name = type === 'sent' ? sendName : receiveName;
      const amount = type === 'sent' ? sendAmount : receiveAmount;
      await submitTransaction(event, type, name, amount);
    } catch {
      setError('Transaction failed. Please retry.');
    }
  };

  const speakSelected = (): void => {
    if (!selectedTransaction || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(buildSpeechText(selectedTransaction));
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className="app-shell">
      <header>
        <h1>EchoPay Accessible UPI</h1>
        <p>Make or receive payment, then use the quick button to jump to My Transactions.</p>
        <button type="button" className="jump-btn" onClick={scrollToTransactions}>
          Go to My Transactions
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="info">{info}</p> : null}

      <section className="actions-grid" aria-label="Payment actions">
        <form className="card" onSubmit={handleSubmit('sent')}>
          <h2>Make Payment</h2>
          <label>
            Person name
            <input value={sendName} onChange={(event) => setSendName(event.target.value)} placeholder="Enter name" />
          </label>
          <label>
            Amount
            <input
              value={sendAmount}
              onChange={(event) => setSendAmount(event.target.value)}
              placeholder="Enter amount"
              inputMode="decimal"
            />
          </label>
          <button type="submit" className="primary sent">
            Send Money
          </button>
        </form>

        <form className="card" onSubmit={handleSubmit('received')}>
          <h2>Receive Payment</h2>
          <label>
            Sender name
            <input value={receiveName} onChange={(event) => setReceiveName(event.target.value)} placeholder="Enter name" />
          </label>
          <label>
            Amount
            <input
              value={receiveAmount}
              onChange={(event) => setReceiveAmount(event.target.value)}
              placeholder="Enter amount"
              inputMode="decimal"
            />
          </label>
          <button type="submit" className="primary receive">
            Mark as Received
          </button>
        </form>
      </section>

      <section ref={transactionsRef} className="card transactions" aria-label="My transactions column" id="my-transactions">
        <h2>My Transactions</h2>
        <div className="transactions-list">
          {transactions.length === 0 ? <p className="muted">No transactions yet. Make/receive a payment first.</p> : null}
          {transactions.map((transaction) => (
            <button
              key={transaction.id}
              className={`transaction-item ${selectedId === transaction.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(transaction.id)}
              aria-label={`${transaction.type} ${formatAmount(transaction.amount)} ${transaction.counterparty} ${formatTime(
                transaction.createdAt
              )}`}
            >
              <strong>
                {transaction.type === 'sent' ? 'Paid to' : 'Received from'} {transaction.counterparty}
              </strong>
              <span>{formatAmount(transaction.amount)}</span>
              <span>{formatTime(transaction.createdAt)}</span>
            </button>
          ))}
        </div>

        <button type="button" className="voice" onClick={speakSelected} disabled={!selectedTransaction}>
          🔊 Speak selected transaction
        </button>
      </section>
    </main>
  );
}
