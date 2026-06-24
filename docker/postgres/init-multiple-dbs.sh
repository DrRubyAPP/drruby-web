#!/bin/bash
# 创建额外的数据库（shadow database 等）
# 用法：在 docker-compose.yml 中通过 POSTGRES_MULTIPLE_DATABASES 环境变量传入逗号分隔的库名
set -e
set -u

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
  echo "Creating multiple databases: ${POSTGRES_MULTIPLE_DATABASES}"
  for db in $(echo "${POSTGRES_MULTIPLE_DATABASES}" | tr ',' ' '); do
    echo "  Creating database: ${db}"
    psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" <<-EOSQL
      CREATE DATABASE "${db}";
      GRANT ALL PRIVILEGES ON DATABASE "${db}" TO "${POSTGRES_USER}";
EOSQL
  done
  echo "Multiple databases created."
fi
