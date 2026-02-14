package payment

import "time"

type Payment struct {
	ID        string    `json:"id"`
	Amount    float64   `json:"amount"`
	PayerName string    `json:"payerName"`
	PaidAt    time.Time `json:"paidAt"`
}
