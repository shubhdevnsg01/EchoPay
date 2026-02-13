package transaction

import "time"

type TransactionType string

const (
	TransactionTypeSent     TransactionType = "sent"
	TransactionTypeReceived TransactionType = "received"
)

type Transaction struct {
	ID           string          `json:"id"`
	Amount       float64         `json:"amount"`
	Counterparty string          `json:"counterparty"`
	Type         TransactionType `json:"type"`
	CreatedAt    time.Time       `json:"createdAt"`
}
