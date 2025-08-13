FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

# Create a script to check if SSL certificates exist
RUN echo '#!/bin/sh\n\
if [ ! -f /etc/ssl/certs/angelamoiseenko.ru.crt ] || [ ! -f /etc/ssl/private/angelamoiseenko.ru.key ]; then\n\
    echo "SSL certificates not found. Please mount them as volumes:"\n\
    echo "- /path/to/your/certificate.crt:/etc/ssl/certs/angelamoiseenko.ru.crt"\n\
    echo "- /path/to/your/private.key:/etc/ssl/private/angelamoiseenko.ru.key"\n\
    exit 1\n\
fi\n\
nginx -g "daemon off;"' > /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
