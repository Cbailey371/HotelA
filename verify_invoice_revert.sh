#!/bin/bash
HOST="http://localhost:3000"
USER="admin"
PASS="admin123"

# 1. Login
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST "$HOST/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}')
TOKEN=$(echo $LOGIN_RES | sed 's/.*"token":"\([^"]*\)".*/\1/')

if [ -z "$TOKEN" ] || [[ "$TOKEN" == *"error"* ]]; then
  echo "Login failed: $LOGIN_RES"
  exit 1
fi
echo "Token acquired."

# 2. Get Part 1 Stock
echo "Getting Part 1 stock..."
PARTget_stock() {
  curl -s -X GET "$HOST/api/inventory/1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.stock'
}
STOCK_INITIAL=$(PARTget_stock)
echo "Initial Stock: $STOCK_INITIAL"

# 3. Create Invoice (Part 1, Qty 10)
echo "Creating Invoice..."
INVOICE_DATA='{
  "id_proveedor": 1,
  "numero_factura": "TEST-REVERT-001",
  "fecha_emision": "2026-02-12",
  "subtotal": 100,
  "impuestos": 7,
  "total": 107,
  "detalles": [
    {
      "id_repuesto": 1,
      "cantidad": 10,
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

# 4. Receive Invoice
echo "Receiving Invoice..."
RECEIVE_DATA='{
  "items": [
    {
      "id_detalle": '$(echo $CREATE_RES | grep -o '"id":[0-9]*' | tail -n1 | cut -d: -f2)', 
      "cantidad_recibir": 10,
      "bodega_id": 1
    }
  ]
}'
# Note: The ID extraction for detail is tricky. Let's just assume we can get details from GET invoice.
# Better approach: Get Invoice details first.
INVOICE_GET=$(curl -s -X GET "$HOST/api/purchases/invoices/$INVOICE_ID" -H "Authorization: Bearer $TOKEN")
DETAIL_ID=$(echo $INVOICE_GET | grep -o '"id":[0-9]*' | sort -n | tail -n1 | cut -d: -f2) 
# Warning: This detail ID extraction is fragile with grep. 
# But let's try assuming the detail ID is usually higher than invoice ID or we can parse.
# Actually, the create response returns the DTO which has id, but details are not in the main DTO response of create_invoice as per code?
# Checking code: create_invoice returns InvoiceDto which assumes details are handled? No, create_invoice returns InvoiceDto without details list?
# Code checks: `Ok(Json(InvoiceDto { ... }))`. The DTO does NOT have details list.
# So I must fetch it.
# `get_invoice_by_id` returns `InvoiceWithDetailsDto` which HAS `detalles`.

INVOICE_FULL=$(curl -s -X GET "$HOST/api/purchases/invoices/$INVOICE_ID" -H "Authorization: Bearer $TOKEN")
# Using python one-liner to parse JSON is safer if python3 is available
DETAIL_ID=$(echo $INVOICE_FULL | python3 -c "import sys, json; print(json.load(sys.stdin)['detalles'][0]['id'])")
echo "Detail ID: $DETAIL_ID"

RECEIVE_DATA='{
  "items": [
    {
      "id_detalle": '$DETAIL_ID',
      "cantidad_recibir": 10,
      "bodega_id": 1
    }
  ]
}'
curl -s -X POST "$HOST/api/purchases/invoices/$INVOICE_ID/receive" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$RECEIVE_DATA"

# 5. Check Stock (+10)
# 5. Check Stock (+10)
STOCK_AFTER=$(PARTget_stock)
echo "Stock After Receive: $STOCK_AFTER"

if [ "$STOCK_AFTER" -ne "$((STOCK_INITIAL + 10))" ]; then
    echo "ERROR: Stock did not increase correctly."
fi

# 6. Delete/Revert Invoice
echo "Deleting/Reverting Invoice..."
curl -s -X DELETE "$HOST/api/purchases/invoices/$INVOICE_ID" -H "Authorization: Bearer $TOKEN"

# 7. Check Stock (Back to Initial)
STOCK_FINAL=$(PARTget_stock)
echo "Stock Final: $STOCK_FINAL"

if [ "$STOCK_FINAL" -eq "$STOCK_INITIAL" ]; then
    echo "SUCCESS: Stock reverted correctly."
else
    echo "FAILURE: Stock not reverted. Expected $STOCK_INITIAL, got $STOCK_FINAL"
fi
