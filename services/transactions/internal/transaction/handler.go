package transaction

import (
	"encoding/json"
	"net/http"
	"strings"
)

type Handler struct {
	store *Store
}

func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

type transferResponse struct {
	FromUserLog Transaction `json:"fromUserLog"`
	ToUserLog   Transaction `json:"toUserLog"`
}

func (h *Handler) HandleListByUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, ok := parseUserFromPath(r.URL.Path)
	if !ok {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}

	logs, err := h.store.ListByUser(user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	respondJSON(w, http.StatusOK, logs)
}

func (h *Handler) HandleTransfer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TransferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	fromLog, toLog, err := h.store.Transfer(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	respondJSON(w, http.StatusCreated, transferResponse{FromUserLog: fromLog, ToUserLog: toLog})
}

func parseUserFromPath(path string) (UserID, bool) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 4 || parts[0] != "api" || parts[1] != "channels" || parts[3] != "transactions" {
		return "", false
	}
	return UserID(parts[2]), true
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
