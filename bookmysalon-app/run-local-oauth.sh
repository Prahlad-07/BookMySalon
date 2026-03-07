#!/usr/bin/env bash
set -e

PROJECT_DIR="$(dirname "$0")"
ENV_FILE="$PROJECT_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

if command -v nc >/dev/null 2>&1; then
  if ! nc -z localhost 3306 >/dev/null 2>&1; then
    echo "MySQL is not reachable on localhost:3306. Start MySQL first."
    echo "Then run: ./run-local-oauth.sh"
    exit 1
  fi
fi

set -a
source "$ENV_FILE"
set +a

if command -v mysql >/dev/null 2>&1; then
  if ! mysql -h localhost -P 3306 -u"$SPRING_DATASOURCE_USERNAME" -p"$SPRING_DATASOURCE_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS bookmysalon;" >/dev/null 2>&1; then
    echo "Unable to connect to MySQL with configured credentials."
    echo "Check SPRING_DATASOURCE_USERNAME / SPRING_DATASOURCE_PASSWORD in $ENV_FILE"
    exit 1
  fi
fi

cd "$PROJECT_DIR"
mvn spring-boot:run \
  -Dspring-boot.run.mainClass=com.bookmysalon.BookMySalonApplication \
  -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=false"
