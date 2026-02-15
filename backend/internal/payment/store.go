package payment

import (
	"fmt"
	"sync"
	"time"
)

type Store struct {
	mu       sync.RWMutex
	payments []Payment
	nextID   int
}

func NewStore() *Store {
	return &Store{
		nextID: 4,
		payments: []Payment{
			{ID: "1", Amount: 249.00, PayerName: "Asha", PaidAt: time.Now().Add(-3 * time.Hour)},
			{ID: "2", Amount: 1200.50, PayerName: "Rohit", PaidAt: time.Now().Add(-95 * time.Minute)},
			{ID: "3", Amount: 75.00, PayerName: "Meera", PaidAt: time.Now().Add(-28 * time.Minute)},
		},
	}
}

func (s *Store) List() []Payment {
	s.mu.RLock()
	defer s.mu.RUnlock()

	copyOfPayments := make([]Payment, len(s.payments))
	copy(copyOfPayments, s.payments)
	return copyOfPayments
}

func (s *Store) Add(amount float64, payerName string, paidAt time.Time) Payment {
	s.mu.Lock()
	defer s.mu.Unlock()

	payment := Payment{
		ID:        fmt.Sprintf("%d", s.nextID),
		Amount:    amount,
		PayerName: payerName,
		PaidAt:    paidAt,
	}
	s.nextID++
	s.payments = append([]Payment{payment}, s.payments...)
	return payment
}
