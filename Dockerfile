FROM golang:1.26-alpine AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/vietnest ./cmd/server

FROM alpine:3.22

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=build /out/vietnest /app/vietnest
COPY index.html styles.css app.js /app/

USER app
ENV PORT=8080
EXPOSE 8080

CMD ["/app/vietnest"]
