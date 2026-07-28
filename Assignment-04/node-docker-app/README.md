#Assignment-05 link - https://docs.google.com/document/d/1TvjLuvXh0fuop37N9-38fV-TkoT20KXxbfwkY2LNCz0/edit?usp=sharing

# Assignment-04 — Dockerfile & docker-compose.yml

## Dockerfile

```
FROM node:18 AS builder
```
Starts the image from the official Node 18 base image, and names this stage "builder" so we can refer back to it later.

```
WORKDIR /usr/src/app
```
Sets the working folder inside the container, so all the next commands run from here.

```
COPY package.json ./
```
Copies just the package.json file in first, before the rest of the code.

```
RUN npm install
```
Installs all the dependencies listed in package.json, inside the container.

```
COPY server.js ./
```
Copies the actual app code in, after the dependencies are already installed. Doing it in this order means Docker doesn't have to reinstall everything every time we change the code.

```
FROM node:18-alpine
```
Starts a second, separate stage using a much smaller base image (alpine), since we don't need the full builder environment anymore.

```
WORKDIR /usr/src/app
```
Same as before, sets the working folder for this new stage.

```
COPY --from=builder /usr/src/app/node_modules ./node_modules
```
Grabs only the node_modules folder from the builder stage, not the whole thing.

```
COPY --from=builder /usr/src/app/server.js ./
```
Grabs the app code from the builder stage too.

```
EXPOSE 3000
```
Just documents that the app listens on port 3000. Doesn't actually open the port, that happens in the compose file.

```
CMD ["node", "server.js"]
```
This is what runs when the container actually starts. Without this, the container wouldn't do anything.

---

## docker-compose.yml

```
app:
```
This names our app service.

```
build: .
```
Tells compose to build the image using our Dockerfile in this folder.

```
ports:
  - "3000:3000"
```
Maps our computer's port 3000 to the container's port 3000, so we can actually reach it.

```
environment:
  - DB_HOST=db
  - DB_PORT=5432
  - DB_USER=postgres
  - DB_PASSWORD=mysecretpassword
  - DB_NAME=mydb
```
Passes in the database connection details as environment variables, so we don't hardcode them in the code.

```
depends_on:
  db:
    condition: service_healthy
```
Waits for the database to actually be ready (not just started) before starting the app.

```
restart: always
```
Restarts the container automatically if it crashes.

```
db:
```
This names our database service.

```
image: postgres:15-alpine
```
Uses the official Postgres image directly, no need to write our own Dockerfile for it.

```
environment:
  - POSTGRES_USER=postgres
  - POSTGRES_PASSWORD=mysecretpassword
  - POSTGRES_DB=mydb
```
These are required by the official Postgres image to set up the user, password, and database on first run.

```
volumes:
  - postgres_data:/var/lib/postgresql/data
```
Saves the database files outside the container, so the data isn't lost if the container gets removed.

```
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 5s
  timeout: 5s
  retries: 5
```
Checks if Postgres is actually ready to accept connections. This is what the app's depends_on check relies on.

```
restart: always
```
Same as the app, restarts automatically if it crashes.

```
volumes:
  postgres_data:
```
Declares the volume so it can be used above. Docker manages where it actually lives on disk.
