#!/bin/bash
HOST="http://localhost:3000"
USER="admin"
PASS="admin123"

# 1. Login
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST "$HOST/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"usuario\":\"$USER\",\"password\":\"$PASS\"}")
TOKEN=$(echo $LOGIN_RES | jq -r '.token')

if [ -z "$TOKEN" ] || [[ "$TOKEN" == "null" ]]; then
  echo "Login failed: $LOGIN_RES"
  exit 1
fi
echo "Token acquired."

# 2. Create Purchase Order
echo "Creating Purchase Order..."
PO_DATA='{
  "proveedor_id": 1,
  "fecha_entrega": "2026-02-20",
  "items": [
    {
      "repuesto_id": 1,
      "cantidad": 10,
      "costo_unitario": 10
    },
    {
      "repuesto_id": 2,
      "cantidad": 10,
      "costo_unitario": 20
    }
  ],
  "subtotal": 300,
  "impuestos": 21,
  "total": 321
}'

curl -s -X POST "$HOST/api/purchases/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PO_DATA" > create_po.log 2>&1

CREATE_PO_RES=$(cat create_po.log)
PO_ID=$(echo $CREATE_PO_RES | jq -r '.id_orden_compra')
echo "Created PO ID: $PO_ID"

if [ "$PO_ID" == "null" ] || [ -z "$PO_ID" ]; then
    echo "Failed to create PO. Response: $CREATE_PO_RES"
    exit 1
fi

# 2.1 Get PO Details
PO_FULL=$(curl -s -X GET "$HOST/api/purchases/orders/$PO_ID" -H "Authorization: Bearer $TOKEN")
PO_DETAIL_ID_1=$(echo $PO_FULL | jq -r '.items[] | select(.id_repuesto == 1) | .id_detalle')
echo "PO Detail ID for Item 1: $PO_DETAIL_ID_1"

# 3. Create Invoice linked to PO
echo "Creating Partial Invoice..."
INVOICE_DATA='{
  "id_proveedor": 1,
  "id_orden_compra": '$PO_ID',
  "numero_factura": "PARTIAL-TEST-006",
  "fecha_emision": "2026-02-12",
  "subtotal": 50,
  "impuestos": 3.5,
  "total": 53.5,
  "detalles": [
    {
      "id_repuesto": 1,
      "id_detalle_oc": '$PO_DETAIL_ID_1',
      "cantidad": 5,
      "costo_unitario": 10
    }
  ]
}'
curl -s -X POST "$HOST/api/purchases/invoices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVOICE_DATA" > create_inv.log 2>&1

CREATE_INV_RES=$(cat create_inv.log)
INVOICE_ID=$(echo $CREATE_INV_RES | jq -r '.id')
echo "Created Invoice ID: $INVOICE_ID"

# 4. Verify Invoice Details (Check id_detalle_oc)
echo "Verifying Invoice Details..."
INVOICE_FULL=$(curl -s -X GET "$HOST/api/purchases/invoices/$INVOICE_ID" -H "Authorization: Bearer $TOKEN")
echo "Invoice Full: $INVOICE_FULL"
ID_DETALLE_OC_SAVED=$(echo $INVOICE_FULL | jq -r '.detalles[0].id_detalle_oc')
echo "Saved id_detalle_oc: $ID_DETALLE_OC_SAVED"

if [ "$ID_DETALLE_OC_SAVED" != "$PO_DETAIL_ID_1" ]; then
    echo "ERROR: id_detalle_oc NOT SAVED correctly. Expected $PO_DETAIL_ID_1, Got $ID_DETALLE_OC_SAVED"
    exit 1
fi

# 4. Receive Invoice
echo "Receiving Invoice..."
DETAIL_ID=$(echo $INVOICE_FULL | jq -r '.detalles[0].id')
RECEIVE_DATA='{
  "items": [
    {
      "id_detalle": '$DETAIL_ID',
      "cantidad_recibir": 5,
      "bodega_id": 1
    }
  ]
}'
curl -s -X POST "$HOST/api/purchases/invoices/$INVOICE_ID/receive" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$RECEIVE_DATA" > receive.log 2>&1

echo "Invoice Received."

# 5. Check PO Status
PO_FULL=$(curl -s -X GET "$HOST/api/purchases/orders/$PO_ID" -H "Authorization: Bearer $TOKEN")
PO_STATUS=$(echo $PO_FULL | jq -r '.estado_recepcion')
echo "PO Receipt Status: $PO_STATUS"
# Also check received quantity
PO_RECEIVED_QTY=$(echo $PO_FULL | jq -r '.items[] | select(.id_repuesto == 1) | .cantidad_recibida')
echo "PO Qty Received for Item 1: $PO_RECEIVED_QTY"

if [ "$PO_STATUS" == "PARCIAL" ]; then
    echo "SUCCESS: PO status is PARCIAL."
else
    echo "FAILURE: PO status is $PO_STATUS (Expected PARCIAL)."
    exit 1
fi

# Clean up
curl -s -X DELETE "$HOST/api/purchases/invoices/$INVOICE_ID" -H "Authorization: Bearer $TOKEN"
