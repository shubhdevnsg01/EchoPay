package transaction

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleList(t *testing.T) {
	handler := NewHandler(NewStore())
	req := httptest.NewRequest(http.MethodGet, "/api/transactions", nil)
	rr := httptest.NewRecorder()

	handler.HandleList(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var transactions []Transaction
	if err := json.Unmarshal(rr.Body.Bytes(), &transactions); err != nil {
		t.Fatalf("response should be JSON: %v", err)
	}
	if len(transactions) == 0 {
		t.Fatal("expected seeded transactions")
	}
}

func TestHandleSend(t *testing.T) {
	handler := NewHandler(NewStore())
	payload := bytes.NewBufferString(`{"amount":99.5,"counterparty":"Kabir"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/transactions/send", payload)
	rr := httptest.NewRecorder()

	handler.HandleSend(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}

	var transaction Transaction
	if err := json.Unmarshal(rr.Body.Bytes(), &transaction); err != nil {
		t.Fatalf("response should be JSON: %v", err)
	}
	if transaction.Type != TransactionTypeSent {
		t.Fatalf("expected sent type, got %s", transaction.Type)
	}
}

func TestHandleReceive(t *testing.T) {
	handler := NewHandler(NewStore())
	payload := bytes.NewBufferString(`{"amount":501,"counterparty":"Divya"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/transactions/receive", payload)
	rr := httptest.NewRecorder()

	handler.HandleReceive(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}

	var transaction Transaction
	if err := json.Unmarshal(rr.Body.Bytes(), &transaction); err != nil {
		t.Fatalf("response should be JSON: %v", err)
	}
	if transaction.Type != TransactionTypeReceived {
		t.Fatalf("expected received type, got %s", transaction.Type)
	}
}
