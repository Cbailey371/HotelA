#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api"
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "Error: Failed to login. Check credentials or if backend is running."
    exit 1
fi

echo "Token obtained."

# 1. Create a Quote (RFQ)
echo "Creating RFQ..."
CREATE_PAYLOAD='{
  "proveedor_id": 1,
  "fecha_solicitud": "2026-02-12",
  "codigo": "RFQ-TEST-001",
  "observaciones": "Test Quote",
  "detalles": [
    { "repuesto_id": 1, "cantidad": 10 },
    { "repuesto_id": 3, "cantidad": 5 }
  ]
}'

RESPONSE=$(curl -v -X POST $API_URL/purchases/quotes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD")

echo "Raw Response: $RESPONSE"

QUOTE_ID=$(echo $RESPONSE | jq -r '.')

# Note: create_quote returns just the ID (number), e.g. 15
# So jq -r '.' will give 15.

if [ "$QUOTE_ID" == "null" ] || [ -z "$QUOTE_ID" ]; then
    echo "Failed to create quote."
    exit 1
fi

echo "Created Quote ID: $QUOTE_ID"

# 2. Get Quote Details
echo "Fetching Quote $QUOTE_ID..."
curl -X GET $API_URL/purchases/quotes/$QUOTE_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 3. Update Quote (Edit)
echo "Updating Quote $QUOTE_ID..."
UPDATE_PAYLOAD='{
  "proveedor_id": 1,
  "fecha_solicitud": "2026-02-13",
  "codigo": "RFQ-TEST-UPD",
  "observaciones": "Updated Test Quote",
  "detalles": [
    { "repuesto_id": 1, "cantidad": 15 }
  ]
}'

curl -X PUT $API_URL/purchases/quotes/$QUOTE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD" 

# 4. Generate/Send Email (Mock)
# Note: This might fail if SMTP is not configured, but we check if endpoint is reachable.
echo "Sending Email for Quote $QUOTE_ID..."
EMAIL_PAYLOAD='{
  "pdf_base64": "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSC4gIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9GMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9iago8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAw0IG4gCjAwMDAwMDAyNzYgMDAwMDAgbiAKMDAwMDAwMDM2MiAwMDAw0IG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1NwolJUVPRgo="
}'

curl -X POST $API_URL/purchases/quotes/$QUOTE_ID/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$EMAIL_PAYLOAD" | jq '.'

# 5. Delete Quote
echo "Deleting Quote $QUOTE_ID..."
curl -X DELETE $API_URL/purchases/quotes/$QUOTE_ID \
  -H "Authorization: Bearer $TOKEN"

# 6. Verify Deletion
echo "Verifying Deletion..."
STATUS_CODE=$(curl -o /dev/null -w "%{http_code}" -X GET $API_URL/purchases/quotes/$QUOTE_ID \
  -H "Authorization: Bearer $TOKEN")

if [ "$STATUS_CODE" == "404" ]; then
    echo "Quote successfully deleted."
else
    echo "Error: Quote still exists (Status: $STATUS_CODE)"
fi

echo "Verification Complete."
