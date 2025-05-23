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

We gave ourselves super user permissions to play around in http://localhost:3000/admin/graphql with this script:

```
pnpm node ./scripts/toolbox/assignSURole.js --add you@example.com
```

You can run GraphQL mutations in `localhost:3000/admin/graphql`:

```graphql
mutation upgradetoEnterprise {
  draftEnterpriseInvoice(
    orgId: "XXXXX",
    quantity: <number>,
    email: "exampeuser@email.com",
    apEmail: "invoice@email.com",
    plan: "stripe_api_price_id") {
    organization {
      tier
    }
    error {
      message
    }
  }
}
```
