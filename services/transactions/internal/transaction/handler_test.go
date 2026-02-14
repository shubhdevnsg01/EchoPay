package transaction

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleListByUser(t *testing.T) {
	handler := NewHandler(NewStore())
	req := httptest.NewRequest(http.MethodGet, "/api/channels/user-a/transactions", nil)
	rr := httptest.NewRecorder()

	handler.HandleListByUser(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var logs []Transaction
	if err := json.Unmarshal(rr.Body.Bytes(), &logs); err != nil {
		t.Fatalf("response should be JSON: %v", err)
	}
	if len(logs) == 0 {
		t.Fatal("expected seeded logs")
	}
}

func TestHandleTransfer(t *testing.T) {
	handler := NewHandler(NewStore())
	payload := bytes.NewBufferString(`{"fromUser":"user-a","toUser":"user-b","amount":99.5}`)
	req := httptest.NewRequest(http.MethodPost, "/api/channels/transfer", payload)
	rr := httptest.NewRecorder()

	handler.HandleTransfer(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}

	var resp transferResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("response should be JSON: %v", err)
	}
	if resp.FromUserLog.Direction != DirectionSent {
		t.Fatalf("expected sent direction for sender, got %s", resp.FromUserLog.Direction)
	}
	if resp.ToUserLog.Direction != DirectionReceived {
		t.Fatalf("expected received direction for receiver, got %s", resp.ToUserLog.Direction)
	}
}

func TestHandleTransferRejectsInvalidUsers(t *testing.T) {
	handler := NewHandler(NewStore())
	payload := bytes.NewBufferString(`{"fromUser":"user-a","toUser":"user-a","amount":99.5}`)
	req := httptest.NewRequest(http.MethodPost, "/api/channels/transfer", payload)
	rr := httptest.NewRecorder()

	handler.HandleTransfer(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
