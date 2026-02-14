package transaction

import "time"

type UserID string

type Direction string

const (
	UserA UserID = "user-a"
	UserB UserID = "user-b"

	DirectionSent     Direction = "sent"
	DirectionReceived Direction = "received"
)

type Transaction struct {
	ID           string    `json:"id"`
	Channel      string    `json:"channel"`
	User         UserID    `json:"user"`
	Counterparty UserID    `json:"counterparty"`
	Direction    Direction `json:"direction"`
	Amount       float64   `json:"amount"`
	CreatedAt    time.Time `json:"createdAt"`
}

type TransferRequest struct {
	FromUser UserID  `json:"fromUser"`
	ToUser   UserID  `json:"toUser"`
	Amount   float64 `json:"amount"`
}
