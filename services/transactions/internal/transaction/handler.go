package transaction

import (
	"encoding/json"
	"net/http"
)

type Handler struct {
	store *Store
}

func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

type createTransactionRequest struct {
	Amount       float64 `json:"amount"`
	Counterparty string  `json:"counterparty"`
}

func (h *Handler) HandleList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	respondJSON(w, http.StatusOK, h.store.List())
}

func (h *Handler) HandleSend(w http.ResponseWriter, r *http.Request) {
	h.handleCreateByType(w, r, TransactionTypeSent)
}

func (h *Handler) HandleReceive(w http.ResponseWriter, r *http.Request) {
	h.handleCreateByType(w, r, TransactionTypeReceived)
}

func (h *Handler) handleCreateByType(w http.ResponseWriter, r *http.Request, transactionType TransactionType) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req createTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 || req.Counterparty == "" {
		http.Error(w, "amount and counterparty are required", http.StatusBadRequest)
		return
	}

	created := h.store.Add(req.Amount, req.Counterparty, transactionType)
	respondJSON(w, http.StatusCreated, created)
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
