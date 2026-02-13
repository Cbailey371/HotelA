#!/bin/bash
HOST="http://localhost:3000"
USER="admin"
PASS="admin123"

# 1. Login
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST "$HOST/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"usuario\": \"$USER\", \"password\": \"$PASS\"}")

# Simple token extraction using grep/sed to avoid dependency on jq
TOKEN=$(echo $LOGIN_RES | sed 's/.*"token":"\([^"]*\)".*/\1/')

if [ -z "$TOKEN" ] || [[ "$TOKEN" == *"error"* ]]; then
  echo "Login failed: $LOGIN_RES"
  exit 1
fi

echo "Token acquired."

# 2. Call update status on problematic order (e.g. 8)
ORDER_ID=8
echo "Updating order $ORDER_ID to RECIBIDA..."
curl -v -X PUT "$HOST/api/purchases/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado": "RECIBIDA"}'
