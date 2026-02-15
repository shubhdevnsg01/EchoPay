package payment

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleListPayments(t *testing.T) {
	h := NewHandler(NewStore())
	req := httptest.NewRequest(http.MethodGet, "/api/payments", nil)
	rr := httptest.NewRecorder()

	h.HandleListPayments(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var payments []Payment
	if err := json.Unmarshal(rr.Body.Bytes(), &payments); err != nil {
		t.Fatalf("expected valid JSON response, got error: %v", err)
	}
	if len(payments) == 0 {
		t.Fatal("expected seeded payments")
	}
}

func TestHandleCreatePayment(t *testing.T) {
	h := NewHandler(NewStore())

	payload := []byte(`{"amount":321.99,"payerName":"Ishita"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/payments", bytes.NewBuffer(payload))
	rr := httptest.NewRecorder()

	h.HandleCreatePayment(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", rr.Code)
	}

	var payment Payment
	if err := json.Unmarshal(rr.Body.Bytes(), &payment); err != nil {
		t.Fatalf("expected valid JSON response, got error: %v", err)
	}
	if payment.PayerName != "Ishita" {
		t.Fatalf("expected payer name Ishita, got %s", payment.PayerName)
	}
}
