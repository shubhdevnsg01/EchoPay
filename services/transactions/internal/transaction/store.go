package transaction

import (
	"fmt"
	"sync"
	"time"
)

type Store struct {
	mu           sync.RWMutex
	transactions []Transaction
	nextID       int
}

func NewStore() *Store {
	return &Store{
		nextID: 4,
		transactions: []Transaction{
			{ID: "1", Amount: 250, Counterparty: "Asha", Type: TransactionTypeSent, CreatedAt: time.Now().Add(-4 * time.Hour)},
			{ID: "2", Amount: 500, Counterparty: "Office Reimbursement", Type: TransactionTypeReceived, CreatedAt: time.Now().Add(-2 * time.Hour)},
			{ID: "3", Amount: 120, Counterparty: "Rohit", Type: TransactionTypeSent, CreatedAt: time.Now().Add(-45 * time.Minute)},
		},
	}
}

func (s *Store) List() []Transaction {
	s.mu.RLock()
	defer s.mu.RUnlock()

	output := make([]Transaction, len(s.transactions))
	copy(output, s.transactions)
	return output
}

func (s *Store) Add(amount float64, counterparty string, transactionType TransactionType) Transaction {
	s.mu.Lock()
	defer s.mu.Unlock()

	entry := Transaction{
		ID:           fmt.Sprintf("%d", s.nextID),
		Amount:       amount,
		Counterparty: counterparty,
		Type:         transactionType,
		CreatedAt:    time.Now(),
	}
	s.nextID++
	s.transactions = append([]Transaction{entry}, s.transactions...)
	return entry
}
