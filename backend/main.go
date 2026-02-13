package main

import (
	"log"
	"net/http"

	"echopay/backend/internal/payment"
)

func main() {
	store := payment.NewStore()
	handler := payment.NewHandler(store)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/payments", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handler.HandleCreatePayment(w, r)
			return
		}
		handler.HandleListPayments(w, r)
	})

	server := &http.Server{
		Addr:    ":8080",
		Handler: withCORS(mux),
	}

	log.Println("EchoPay backend listening on http://localhost:8080")
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
