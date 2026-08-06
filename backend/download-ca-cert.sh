#!/bin/bash

# Download CockroachDB CA certificate
# This is required for SSL verification with sslmode=verify-full

echo "Downloading CockroachDB CA certificate..."

# Create certs directory if it doesn't exist
mkdir -p certs

# Download CA certificate from CockroachDB
curl -o certs/ca.crt https://cockroachlabs.com/clusters/cockroachdb-ca.crt

# If the above doesn't work, try the CockroachDB Cloud CA
if [ ! -f certs/ca.crt ]; then
    echo "Trying alternative CA certificate source..."
    curl -o certs/ca.crt https://www.cockroachlabs.com/docs/stable/security-reference/openssl.html
fi

# Set proper permissions
chmod 644 certs/ca.crt

echo "CA certificate downloaded to certs/ca.crt"
echo "Update your .env file to include:"
echo "PGSSLROOTCERT=certs/ca.crt"