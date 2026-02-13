import { useEffect, useMemo, useState } from 'react';

type Payment = {
  id: string;
  amount: number;
  payerName: string;
  paidAt: string;
};

const apiBaseUrl = 'http://localhost:8080';

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

const buildSpeechText = (payment: Payment): string => {
  const time = formatTime(payment.paidAt);
  return `${formatAmount(payment.amount)} paid to ${payment.payerName} on ${time}`;
};

export default function App() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadPayments = async (): Promise<void> => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/payments`);
        if (!response.ok) {
          throw new Error('Could not fetch payments');
        }
        const data = (await response.json()) as Payment[];
        setPayments(data);
        if (data.length > 0) {
          setSelectedPaymentId(data[0].id);
        }
      } catch {
        setError('Unable to load payments. Please ensure backend is running on port 8080.');
      }
    };

    loadPayments().catch(() => {
      setError('Unable to load payments.');
    });
  }, []);

  const selectedPayment = useMemo(
    () => payments.find((payment) => payment.id === selectedPaymentId) ?? null,
    [payments, selectedPaymentId]
  );

  const speakPayment = (): void => {
    if (!selectedPayment || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(buildSpeechText(selectedPayment));
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className="container">
      <h1>EchoPay UPI (Accessible Mode)</h1>
      <p className="subtitle">Tap any payment and use the voice button to hear amount, name and time.</p>

      {error ? <p className="error">{error}</p> : null}

      <section aria-label="Recent UPI payments" className="payments-list">
        {payments.map((payment) => (
          <button
            key={payment.id}
            className={`payment-item ${selectedPaymentId === payment.id ? 'active' : ''}`}
            onClick={() => setSelectedPaymentId(payment.id)}
            aria-label={`Payment to ${payment.payerName}, ${formatAmount(payment.amount)}, ${formatTime(
              payment.paidAt
            )}`}
          >
            <span>{payment.payerName}</span>
            <span>{formatAmount(payment.amount)}</span>
            <span className="time">{formatTime(payment.paidAt)}</span>
          </button>
        ))}
      </section>

      <button
        type="button"
        className="speak-btn"
        onClick={speakPayment}
        disabled={!selectedPayment}
        aria-label="Speak selected payment details"
      >
        🔊 Speak payment details
      </button>
    </main>
  );
}
