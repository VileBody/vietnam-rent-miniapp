# VietNest Telegram Mini App Prototype

Мобильный прототип сервиса подбора квартир во Вьетнаме из Facebook Marketplace:

- свайп-лента в стиле Tinder;
- галерея фото по каждому объекту;
- описание квартиры или виллы;
- избранное вместо личных сообщений;
- контакты и переход на исходное объявление FB Marketplace;
- Go backend с REST API;
- Postgres база с автосидом объявлений;
- заготовка под Telegram WebApp SDK.

## Запуск

```bash
cd vietnam-rent-miniapp
docker compose up -d postgres
go run ./cmd/server
```

Откройте `http://127.0.0.1:8080`.

Postgres доступен на локальном порту `5433`, основная dev-база называется `mock-marketplace`:

```bash
postgres://vietnest:vietnest@127.0.0.1:5433/mock-marketplace?sslmode=disable
```

При старте Go-сервер:

1. ждет Postgres;
2. накатывает схему БД, если ее еще нет;
3. делает idempotent seed мокового marketplace через `ON CONFLICT`, не плодя дубликаты;
4. раздает API и статический mini-app с одного origin.

Если Postgres volume уже был создан раньше, а базы `mock-marketplace` еще нет:

```bash
docker compose exec -T postgres psql -U vietnest -d postgres \
  -c 'CREATE DATABASE "mock-marketplace" OWNER vietnest;'
```

## API

```bash
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:8080/api/listings
curl 'http://127.0.0.1:8080/api/listings?city=danang'
curl 'http://127.0.0.1:8080/api/listings?type=villa'
curl 'http://127.0.0.1:8080/api/listings?pet_friendly=true&max_price=1000'
curl http://127.0.0.1:8080/api/listings/dn-mykhe-condo
curl http://127.0.0.1:8080/api/scrape-sources
```

По умолчанию `GET /api/listings` отдает только `listing_status = active`. Для аудита можно использовать:

```bash
curl 'http://127.0.0.1:8080/api/listings?include_inactive=true'
curl 'http://127.0.0.1:8080/api/listings?status=stale'
```

## Схема БД

Схема сделана под пайплайн импорта из Apify:

```text
locations
  города/локации Вьетнама для marketplace URL

scrape_sources
  параметры и base URL для Apify startUrls

scrape_runs
  запуски Apify actor, dataset id, статус и счетчики

raw_marketplace_items
  сырой JSON от Apify, hash, external id, source URL

listings
  нормализованная карточка для приложения
  статус актуальности: listing_status, availability_status,
  first_seen_at, last_seen_at, stale_at, removed_at, last_checked_at

listing_photos
  ссылки на фото, порядок, primary flag, будущий storage_url

listing_contacts
  владелец/агент, телефон, messenger/profile URL, raw contact

listing_price_history
  история цен по наблюдениям

listing_availability_checks
  история проверок актуальности: seen, stale, removed, error и evidence jsonb

app_users / user_favorites
  Telegram пользователи и избранное
```

Картинки бинарно в Postgres не кладем: сейчас храним `source_url`, позже можно добавить загрузку в S3/R2 и писать `storage_url`.

## Где подключать данные

Основное место для реальных данных теперь таблица `listings` в Postgres. Фронт сначала грузит `GET /api/listings`, а встроенный массив в `app.js` используется только как fallback, если API временно недоступен.

## Kubernetes Deploy

Production target:

```text
https://vietnam.teamgenius.ru
```

Image:

```text
ghcr.io/vilebody/vietnam-rent-miniapp:main
```

Create required secrets before ArgoCD sync:

```bash
kubectl create namespace vietnam-rent --dry-run=client -o yaml | kubectl apply -f -

PG_PASSWORD="$(openssl rand -hex 32)"

kubectl -n vietnam-rent create secret generic vietnest-postgres \
  --from-literal=POSTGRES_DB=mock-marketplace \
  --from-literal=POSTGRES_USER=vietnest \
  --from-literal=POSTGRES_PASSWORD="$PG_PASSWORD" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n vietnam-rent create secret generic vietnest-app-env \
  --from-literal=DATABASE_URL="postgres://vietnest:${PG_PASSWORD}@vietnest-postgres.vietnam-rent.svc.cluster.local:5432/mock-marketplace?sslmode=disable" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n vietnam-rent create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=<github-user> \
  --docker-password=<github-token> \
  --dry-run=client -o yaml | kubectl apply -f -
```

Register ArgoCD app:

```bash
kubectl apply -f argocd/vietnam-rent.yaml
```

The app service is internal:

```text
vietnest.vietnam-rent.svc.cluster.local:80
```

Public routing is expected to be handled by the existing `teamgenius.ru` edge:

```text
vietnam.teamgenius.ru -> vietnest.vietnam-rent.svc.cluster.local:80
```

After DNS and edge routing are ready:

```bash
curl -i https://vietnam.teamgenius.ru/api/health
curl -i https://vietnam.teamgenius.ru/
```

Then publish the mini app in BotFather with:

```text
/newapp
```

or attach it as a bot menu button:

```text
/setmenubutton
```
