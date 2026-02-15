package transaction

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

var errInvalidUsers = errors.New("only user-a and user-b are supported")

type Store struct {
	mu     sync.RWMutex
	logs   map[UserID][]Transaction
	nextID int
}

func NewStore() *Store {
	now := time.Now()
	return &Store{
		nextID: 3,
		logs: map[UserID][]Transaction{
			UserA: {
				{
					ID:           "1",
					Channel:      channelName(UserA, UserB),
					User:         UserA,
					Counterparty: UserB,
					Direction:    DirectionSent,
					Amount:       120,
					CreatedAt:    now.Add(-40 * time.Minute),
				},
			},
			UserB: {
				{
					ID:           "2",
					Channel:      channelName(UserA, UserB),
					User:         UserB,
					Counterparty: UserA,
					Direction:    DirectionReceived,
					Amount:       120,
					CreatedAt:    now.Add(-40 * time.Minute),
				},
			},
		},
	}
}

func (s *Store) ListByUser(user UserID) ([]Transaction, error) {
	if !isValidUser(user) {
		return nil, errInvalidUsers
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	transactions := s.logs[user]
	out := make([]Transaction, len(transactions))
	copy(out, transactions)
	return out, nil
}

func (s *Store) Transfer(req TransferRequest) (Transaction, Transaction, error) {
	if !isValidUser(req.FromUser) || !isValidUser(req.ToUser) || req.FromUser == req.ToUser {
		return Transaction{}, Transaction{}, errInvalidUsers
	}
	if req.Amount <= 0 {
		return Transaction{}, Transaction{}, errors.New("amount must be greater than 0")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	fromEntry := Transaction{
		ID:           fmt.Sprintf("%d", s.nextID),
		Channel:      channelName(req.FromUser, req.ToUser),
		User:         req.FromUser,
		Counterparty: req.ToUser,
		Direction:    DirectionSent,
		Amount:       req.Amount,
		CreatedAt:    now,
	}
	s.nextID++
	toEntry := Transaction{
		ID:           fmt.Sprintf("%d", s.nextID),
		Channel:      channelName(req.FromUser, req.ToUser),
		User:         req.ToUser,
		Counterparty: req.FromUser,
		Direction:    DirectionReceived,
		Amount:       req.Amount,
		CreatedAt:    now,
	}
	s.nextID++

	s.logs[req.FromUser] = append([]Transaction{fromEntry}, s.logs[req.FromUser]...)
	s.logs[req.ToUser] = append([]Transaction{toEntry}, s.logs[req.ToUser]...)
	return fromEntry, toEntry, nil
}

func isValidUser(user UserID) bool {
	return user == UserA || user == UserB
}

func channelName(a UserID, b UserID) string {
	if a == UserA && b == UserB || a == UserB && b == UserA {
		return "user-a<->user-b"
	}
	return "unsupported"
}
