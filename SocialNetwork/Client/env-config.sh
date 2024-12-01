#!/bin/sh

# Create an env-config.js file with runtime variables
cat <<EOF > /var/www/env-config.js
window.REACT_APP_API_BASE_URL = "$REACT_APP_API_BASE_URL";
EOF

# Start NGINX
exec "$@"