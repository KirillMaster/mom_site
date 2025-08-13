FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

# Create a script to check if SSL certificates exist
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'if [ ! -f /etc/ssl/certs/certificate.crt ] || [ ! -f /etc/ssl/private/private.key ]; then' >> /docker-entrypoint.sh && \
    echo '    echo "SSL certificates not found. Please mount them as volumes:"' >> /docker-entrypoint.sh && \
    echo '    echo "- /path/to/your/certificate.crt:/etc/ssl/certs/certificate.crt"' >> /docker-entrypoint.sh && \
    echo '    echo "- /path/to/your/private.key:/etc/ssl/private/private.key"' >> /docker-entrypoint.sh && \
    echo '    exit 1' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
