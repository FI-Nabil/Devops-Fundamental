# Assignment-04 — Dockerfile & docker-compose.yml Explained

This README documents **only** the two infrastructure files in this assignment —
`Dockerfile` and `docker-compose.yml` — line by line. The goal is to explain
what each instruction does and *why* it was used, not just what it does.

---

## 1. Dockerfile

```dockerfile
# Stage 1: Build stage
FROM node:18 AS builder
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY server.js ./

# Stage 2: Production stage
FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
```

This is a **multi-stage build** — two separate `FROM` blocks in one file, where
the second stage selectively copies only what it needs from the first, and
discards the rest.

### Stage 1 — `builder`

| Command | What it does | Why we used it |
|---|---|---|
| `FROM node:18 AS builder` | Starts this stage from the official `node:18` image (Node.js pre-installed on a Debian-based Linux base), and labels this stage `builder` so it can be referenced later. | Every Docker image must start from *something* — you can't build from nothing. `node:18` gives us a working Node/npm environment without installing Node manually. The `AS builder` name lets Stage 2 pull specific files out of this stage later. |
| `WORKDIR /usr/src/app` | Sets the active directory inside the container. All following commands (`COPY`, `RUN`) execute relative to this path. | Avoids writing files into the container's root filesystem and keeps the app in a predictable, isolated location. |
| `COPY package.json ./` | Copies only `package.json` from the host machine into the container's working directory. | Copying just the manifest — not the whole project — lets Docker cache this layer. If only app code changes later, Docker can skip re-running `npm install` on rebuild, since `package.json` hasn't changed. |
| `RUN npm install` | Executes `npm install` **at build time**, inside the container, generating `node_modules` from what's listed in `package.json`. | This bakes all dependencies into the image itself, so the container never needs internet access or a build step at run time. |
| `COPY server.js ./` | Copies the actual application code into the container, after dependencies are already installed. | Copying code *after* `npm install` (not before) means code changes never invalidate the dependency-install cache layer — only this last step re-runs. |

### Stage 2 — Production

| Command | What it does | Why we used it |
|---|---|---|
| `FROM node:18-alpine` | Starts a **second, separate** image, based on Alpine Linux (a minimal Linux distribution) with Node pre-installed. | Alpine is dramatically smaller than the full `node:18` base used in Stage 1. Stage 1 only existed to run `npm install` — we don't need its full OS, compilers, or caches in the image we actually ship. |
| `WORKDIR /usr/src/app` | Same purpose as before — sets the working directory in this *new*, separate filesystem. | Stage 2 starts completely fresh; nothing from Stage 1 carries over automatically, so this has to be declared again. |
| `COPY --from=builder /usr/src/app/node_modules ./node_modules` | Copies **only** the already-built `node_modules` folder from the `builder` stage into this stage. | This is the core trick of multi-stage builds: we get the *result* of `npm install` without bringing along the full build environment (compilers, temporary files, npm cache) that produced it. |
| `COPY --from=builder /usr/src/app/server.js ./` | Copies the application code from the `builder` stage into this final stage. | Keeps the final image limited to exactly two things: dependencies and code — nothing extra. |
| `EXPOSE 3000` | Documents that the app inside the container listens on port `3000`. | This is informational/documentation only — it does **not** actually publish the port to the host. Actual port publishing happens in `docker-compose.yml` (`ports:`), by design, since that's a run-time decision, not a build-time one. |
| `CMD ["node", "server.js"]` | Defines the default command that runs the moment a container is started from this image. | This is what actually turns the image (a static filesystem) into a running process. Without a `CMD`, the container would have nothing to execute and would exit immediately. |

**Result of this approach:** using multi-stage build here reduced the final
image size from **1.1GB** (single-stage, using the full `node:18` base) down to
**129MB** (multi-stage, using `node:18-alpine` for the shipped image) — an ~88%
reduction, since the compilers, OS packages, and cache files from Stage 1 never
make it into the final image.

---

## 2. docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=mysecretpassword
      - DB_NAME=mydb
    depends_on:
      db:
        condition: service_healthy
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=mysecretpassword
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: always

volumes:
  postgres_data:
```

While the Dockerfile builds **one image**, `docker-compose.yml` is responsible
for taking that image (and any other images needed, like Postgres) and running
them **together** as a working system — networking, environment variables,
startup order, and persistent storage all included.

### `app` service

| Line | What it does | Why we used it |
|---|---|---|
| `app:` | Names this service `app` — the label used to refer to it elsewhere (e.g. `depends_on`, container-to-container networking). | Gives this container a stable name inside the Compose network, rather than relying on a randomly generated container name. |
| `build: .` | Tells Compose to **build** an image from the `Dockerfile` in the current directory, rather than pulling an existing one. | This is the direct link back to the Dockerfile above — Compose triggers `docker build` on our behalf using this file. |
| `ports: - "3000:3000"` | Maps host port `3000` to container port `3000`. Format is `"HOST:CONTAINER"`. | This is what actually makes the app reachable from the host machine's browser/curl — the Dockerfile's `EXPOSE 3000` alone does not do this; it's only documentation. |
| `environment:` block | Injects environment variables into the container at run time (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). | `server.js` reads these via `process.env.*` instead of hardcoding database connection details. This keeps the image itself generic and reusable — the same image could point at a different database just by changing these values, with no rebuild required. |
| `depends_on: db: condition: service_healthy` | Tells Compose not to start the `app` container until the `db` container's healthcheck reports healthy — not merely "started." | A plain `depends_on: [db]` only waits for the container process to *start*, not for Postgres to actually be ready to accept connections. Using the `service_healthy` condition avoids a race condition where the app tries to connect before Postgres has finished initializing. |
| `restart: always` | Tells Docker to automatically restart this container if it crashes or if Docker itself restarts. | Keeps the app self-healing without manual intervention — reasonable default for a service that's expected to run continuously. |

### `db` service

| Line | What it does | Why we used it |
|---|---|---|
| `db:` | Names this service `db`. | This name is also what `app` uses as its `DB_HOST` value — Compose automatically resolves service names to the correct container over its internal network. |
| `image: postgres:15-alpine` | Pulls the official Postgres image (version 15, Alpine-based) directly — no custom Dockerfile needed for this service. | We don't need to customize Postgres itself, so there's no reason to write our own Dockerfile for it — using the prebuilt, maintained image is the standard approach. |
| `environment:` block | Sets `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — variables the official Postgres image specifically looks for on first startup to initialize the database, user, and password. | These exact variable names are defined by the Postgres image itself (not something we invented) — without `POSTGRES_PASSWORD` in particular, the official image refuses to start. |
| `volumes: - postgres_data:/var/lib/postgresql/data` | Mounts the named volume `postgres_data` onto the path where Postgres stores its actual data files inside the container. | Without this, all database data would live only in the container's disposable filesystem layer and be lost the moment the container is removed or rebuilt. The volume persists independently of the container's lifecycle. |
| `healthcheck:` block | Runs `pg_isready -U postgres` every 5 seconds, up to 5 retries, to determine whether Postgres is actually ready to accept connections. | This is what `app`'s `depends_on: condition: service_healthy` relies on — without a healthcheck defined here, that condition would have nothing to check against. |
| `restart: always` | Same as above — restarts the database container automatically if it stops unexpectedly. | Keeps the database available without manual restarts, same reasoning as the `app` service. |

### Top-level `volumes:`

| Line | What it does | Why we used it |
|---|---|---|
| `volumes: postgres_data:` | Declares `postgres_data` as a named volume that Compose manages. | This declaration is required before the volume can be referenced inside a service's `volumes:` list. Docker stores the actual data on the host disk, outside any single container's lifecycle, and hands it back to whichever container mounts this volume name. |

---

## Summary — how the two files relate

- **`Dockerfile`** answers: *"What does the `app` image need, permanently, to run?"* — Node runtime, dependencies, application code, baked in once at build time.
- **`docker-compose.yml`** answers: *"How do the `app` and `db` containers run together, right now?"* — networking, startup order, environment-specific config, and persistent storage, all handled at run time and kept out of the image itself.

Running `docker compose up` builds the `app` image from the Dockerfile, pulls
the `db` image from Docker Hub if not already present, starts both containers
on a shared internal network, waits for the database to be healthy before
starting the app, and persists all database data in the `postgres_data`
volume across restarts.
