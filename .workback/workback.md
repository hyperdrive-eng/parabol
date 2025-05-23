- ALWAYS use `pnpm` run scripts
- You can assume that the server is running and the database is up at `localhost:5050` and running at `localhost:3000`
- Here are the steps I ran to start the development environment, you can use them as a reference:

```bash
nvm use 22.14
cp .env.example .env
pnpm i
# Start docker manually
pnpm db:start
pnpm relay:build
pnpn dev
```
