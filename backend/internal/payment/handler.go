package payment

import (
	"encoding/json"
	"net/http"
	"time"
)

type Handler struct {
	store *Store
}

func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

type createPaymentRequest struct {
	Amount    float64 `json:"amount"`
	PayerName string  `json:"payerName"`
}

func (h *Handler) HandleListPayments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	respondJSON(w, http.StatusOK, h.store.List())
}

func (h *Handler) HandleCreatePayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req createPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 || req.PayerName == "" {
		http.Error(w, "amount and payerName are required", http.StatusBadRequest)
		return
	}

	payment := h.store.Add(req.Amount, req.PayerName, time.Now())
	respondJSON(w, http.StatusCreated, payment)
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
