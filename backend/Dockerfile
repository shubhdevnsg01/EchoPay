FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /backend-service .

FROM alpine:3.20
RUN adduser -D appuser
USER appuser
COPY --from=builder /backend-service /backend-service
EXPOSE 8080
ENTRYPOINT ["/backend-service"]
