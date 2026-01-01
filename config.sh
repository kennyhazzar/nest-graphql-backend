#!/bin/sh

CONFIG="config.yaml"
if [ -n "$1" ]; then
    CONFIG="config.$1.yaml"
fi

echo "Generating ${CONFIG} from environment "${CI_ENVIRONMENT_NAME}" variables..."
cat <<EOF > ${CONFIG}
log:
  level: ${LOG_LEVEL:-info}
  colorize: ${LOG_COLORIZE:-false}

host:
  hostname: "${HOSTNAME:-localhost}"
  port: ${PORT:-3000}
  origin: "${ORIGIN:-http://localhost:3000}"
  environment: "${CI_ENVIRONMENT_NAME:-development}"

settings:
  language: ${LANGUAGE:-ru}
  locale: ${LOCALE:-ru-RU}
  country: ${COUNTRY:-RU}

graphql:
  graphiql: ${GRAPHQL_GRAPHIQL:-false}
  introspection: ${GRAPHQL_INTROSPECTION:-false}
  path: "${GRAPHQL_PATH:-/graphql}"

database:
  type: "${DATABASE_TYPE:-postgres}"
  uri: "${DATABASE_URI:-}"
  username: "${DATABASE_USERNAME}"
  password: "${DATABASE_PASSWORD}"
  host: "${DATABASE_HOST}"
  port: ${DATABASE_PORT:-5432}
  db: "${DATABASE_DB}"
  ssl: ${DATABASE_SSL:-false}
  dropSchema: ${DATABASE_DROP_SCHEMA:-false}

admin:
  email: "${ADMIN_EMAIL}"
  password: "${ADMIN_PASSWORD}"

redis:
  host: "${REDIS_HOST:-localhost}"
  port: ${REDIS_PORT:-6379}
  password: "${REDIS_PASSWORD:-}"

jwt:
  algorithm: "${JWT_ALGORITHM:-SHA512}"
  access:
    token: "${JWT_ACCESS_TOKEN}"
    expires: "${JWT_ACCESS_EXPIRES:-15min}"
    jwtAlgorithm: "${JWT_ACCESS_JWTALGORITHM:-HS256}"
  refresh:
    token: "${JWT_REFRESH_TOKEN}"
    expires: "${JWT_REFRESH_EXPIRES:-7days}"
    jwtAlgorithm: "${JWT_REFRESH_JWTALGORITHM:-HS256}"

auth:
  mode: "${AUTH_MODE:-HYBRID}"
  csrf:
    enabled: ${AUTH_CSRF_ENABLED:-true}
  cookies:
    accessToken:
      name: "${AUTH_COOKIE_ACCESS_NAME:-accessToken}"
      httpOnly: ${AUTH_COOKIE_ACCESS_HTTPONLY:-true}
      secure: ${AUTH_COOKIE_ACCESS_SECURE:-true}
      sameSite: "${AUTH_COOKIE_ACCESS_SAMESITE:-strict}"
      maxAge: ${AUTH_COOKIE_ACCESS_MAXAGE:-900000}
    refreshToken:
      name: "${AUTH_COOKIE_REFRESH_NAME:-refreshToken}"
      httpOnly: ${AUTH_COOKIE_REFRESH_HTTPONLY:-true}
      secure: ${AUTH_COOKIE_REFRESH_SECURE:-true}
      sameSite: "${AUTH_COOKIE_REFRESH_SAMESITE:-strict}"
      maxAge: ${AUTH_COOKIE_REFRESH_MAXAGE:-604800000}
    csrf:
      name: "${AUTH_COOKIE_CSRF_NAME:-csrf-token}"
      httpOnly: ${AUTH_COOKIE_CSRF_HTTPONLY:-false}
      secure: ${AUTH_COOKIE_CSRF_SECURE:-true}
      sameSite: "${AUTH_COOKIE_CSRF_SAMESITE:-strict}"
      maxAge: ${AUTH_COOKIE_CSRF_MAXAGE:-604800000}

# Optional: Uncomment to enable email
# mailer:
#   host: "${MAIL_HOST}"
#   port: ${MAIL_PORT:-465}
#   user: "${MAIL_USER}"
#   pass: "${MAIL_PASS}"
#   from: "${MAIL_FROM}"

# Optional: Uncomment to enable S3 storage
# s3:
#   accessKey: "${S3_ACCESS_KEY}"
#   secretKey: "${S3_SECRET_KEY}"
#   bucket: "${S3_BUCKET}"
#   region: "${S3_REGION}"
#   endpoint: "${S3_ENDPOINT}"
#   forcePathStyle: ${S3_FORCE_PATH_STYLE:-false}
#   signedUrlExpires: ${S3_SIGNED_URL_EXPIRES:-604800}

# Optional: Uncomment to enable Graylog
# graylog:
#   host: "${GRAYLOG_HOST:-localhost}"
#   port: ${GRAYLOG_PORT:-12201}
#   protocol: "${GRAYLOG_PROTOCOL:-tcp}"
#   facility: "${GRAYLOG_FACILITY:-backend}"
#   compression: ${GRAYLOG_COMPRESSION:-true}
#   maxChunkSize: ${GRAYLOG_MAX_CHUNK_SIZE:-8192}
#   enabled: ${GRAYLOG_ENABLED:-false}
EOF

if [ "$2" != "false" ]; then
echo "Generating ecosystem.config.cjs for PM2..."
cat <<EOF > ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "${CI_ENVIRONMENT_NAME:-development}-api",
      script: 'node ./dist/apps/backend/main.js',
      max_memory_restart: '800M',
      error_file: "/var/log/pm2/${CI_ENVIRONMENT_NAME:-development}/api/error.log",
      out_file: "/var/log/pm2/${CI_ENVIRONMENT_NAME:-development}/api/out.log",
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
EOF
fi
