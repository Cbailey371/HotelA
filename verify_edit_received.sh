#!/bin/bash
HOST="http://localhost:3000"
USER="admin"
PASS="admin123"

# 1. Login
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST "$HOST/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"usuario\":\"$USER\",\"password\":\"$PASS\"}")
TOKEN=$(echo $LOGIN_RES | sed 's/.*"token":"\([^"]*\)".*/\1/')

if [ -z "$TOKEN" ] || [[ "$TOKEN" == *"error"* ]]; then
  echo "Login failed: $LOGIN_RES"
  exit 1
fi
echo "Token acquired."

# 2. Find a "RECIBIDA" invoice. 
# We'll create one to be sure.
echo "Creating Invoice..."
INVOICE_DATA='{
  "id_proveedor": 1,
  "numero_factura": "TEST-EDIT-RECV-001",
  "fecha_emision": "2026-02-12",
  "subtotal": 100,
  "impuestos": 7,
  "total": 107,
  "detalles": [
    {
      "id_repuesto": 1,
      "cantidad": 1,
      "costo_unitario": 10
    }
  ]
}'
CREATE_RES=$(curl -s -X POST "$HOST/api/purchases/invoices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVOICE_DATA")
INVOICE_ID=$(echo $CREATE_RES | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)
echo "Created Invoice ID: $INVOICE_ID"

# 3. Receive Invoice
echo "Receiving Invoice..."
# Use python to extract detail ID from full invoice since create response doesn't have it
INVOICE_FULL=$(curl -s -X GET "$HOST/api/purchases/invoices/$INVOICE_ID" -H "Authorization: Bearer $TOKEN")
DETAIL_ID=$(echo $INVOICE_FULL | python3 -c "import sys, json; print(json.load(sys.stdin)['detalles'][0]['id'])")
echo "Detail ID: $DETAIL_ID"

RECEIVE_DATA='{
  "items": [
    {
      "id_detalle": '$DETAIL_ID',
      "cantidad_recibir": 1,
      "bodega_id": 1
    }
  ]
}'
curl -s -X POST "$HOST/api/purchases/invoices/$INVOICE_ID/receive" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$RECEIVE_DATA" > /dev/null

echo "Invoice Received."

# 4. Attempt to Edit Notes
echo "Editing Notes..."
UPDATE_DATA='{
  "notas": "Updated Note for Received Invoice"
}'

UPDATE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$HOST/api/purchases/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA")

echo "Update Response Code: $UPDATE_RES"

if [ "$UPDATE_RES" -eq 200 ]; then
    echo "SUCCESS: Invoice updated."
else
    echo "FAILURE: Could not update invoice. Code: $UPDATE_RES"
    exit 1
fi

# 5. Verify Update
VERIFY_RES=$(curl -s -X GET "$HOST/api/purchases/invoices/$INVOICE_ID" -H "Authorization: Bearer $TOKEN")
NOTES=$(echo $VERIFY_RES | python3 -c "import sys, json; print(json.load(sys.stdin)['notas'])")
echo "Notes: $NOTES"

if [ "$NOTES" == "Updated Note for Received Invoice" ]; then
    echo "SUCCESS: Notes verified."
else
    echo "FAILURE: Notes mismatch."
    exit 1
fi

# Clean up
curl -s -X DELETE "$HOST/api/purchases/invoices/$INVOICE_ID" -H "Authorization: Bearer $TOKEN"
