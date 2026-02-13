package main

import (
	"log"
	"net/http"

	"echopay/transactions/internal/transaction"
)

func main() {
	store := transaction.NewStore()
	handler := transaction.NewHandler(store)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/transactions", handler.HandleList)
	mux.HandleFunc("/api/transactions/send", handler.HandleSend)
	mux.HandleFunc("/api/transactions/receive", handler.HandleReceive)

	server := &http.Server{Addr: ":8081", Handler: withCORS(mux)}
	log.Println("Transactions service listening on http://localhost:8081")
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
