# Ledger ERP

A TypeScript port of the Spring ERP. The Express API handles sales, inventory and procurement in one process. React provides forms and searchable tables for products, warehouses, stock, sales orders, reservations and purchase orders. Guests browse an administrator’s products and signed-in customers can purchase them. Administrators manage their inventory and sales orders in the dashboard. Users authenticate with a bcrypt-hashed password and receive an eight-hour bearer JWT.

## Source layout

Each ERP entity has a router, controller, service class, and Mongoose model. For example, `routes/order.routes.ts` maps requests to `controllers/order.controller.ts`, which calls `OrderService` in `services/order.service.ts`. The service uses `OrderModel` for CRUD and runs stock allocation in the same transaction as the order write. Models use the existing MongoDB collection names and UUID string IDs.

In the frontend, each entity has a page with its own table and search, and a form with explicit inputs and API calls. For example, `frontend/src/pages/ProductPage.tsx` lists products and `frontend/src/components/product/ProductForm.tsx` creates and edits them. Shared components provide layout and dialogs.

## Run locally

Use Node.js 22.22 or later and Docker with Linux containers. Run these commands from the project root.

```powershell
docker compose up -d --wait
npm ci --prefix backend
npm ci --prefix frontend
npm run dev --prefix backend
```

In a second terminal, run `npm run dev --prefix frontend` and open [the local workspace](http://localhost:5173). Register an account, then grant dashboard access to your chosen administrator from the repository root:

```powershell
npm run grant-admin --prefix backend -- admin@example.com
```

Use the registered email and the database for the intended environment. Sign in and select **Dashboard** to manage inventory. An administrator’s products appear in the public catalog, and purchases appear in that administrator’s sales orders. Existing accounts default to customers until promoted.

Local `backend/.env` and `frontend/.env` are supplied in this workspace and excluded from Git. For a fresh checkout, copy each app's `.env.example` to `.env` and set the backend's `JWT_SECRET` to a random secret. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.

The Compose service initializes a single-node replica set and retains its data in a named volume. A hosted replica set also works. Include the database name in `MONGODB_URI`. Transactions require a replica set or sharded cluster.

## Demo data

Set `SEED_PASSWORD` in `backend/.env` to a password of at least eight characters. The default demo email is `demo@example.test`. Set `SEED_EMAIL` to use another address. From the project root, run:

```powershell
npm run seed --prefix backend
```

The seed account has administrator access. Rerun the seed with its original credentials to promote a previously seeded account. Sign in with that email and password. The script uses the database in `MONGODB_URI` and creates the account, two warehouses, eleven products, stock, a purchase receipt, and three sales orders in one transaction. The examples include fulfilled and reserved units and a rejected order for an out-of-stock dock. Previously seeded accounts receive the eight additional stocked catalog products once. Further runs preserve edits and stock levels.

## Domain behavior

- Orders embed line items, aggregate repeated products and snapshot unit prices. The API derives the placer from the signed-in account. Creating an order allocates available units across active warehouses. A shortage rejects the whole order without partially reserving inventory.
- An order checks on-hand quantities during allocation. Stock below `LOW_STOCK_THRESHOLD` (default 10) triggers a simulated purchase from supplier 1 for the difference between 100 and the observed on-hand count. The warehouse with the lowest stock for that product receives the goods. The reservation decision uses the stock available before receipt. Resubmit a rejected order with PUT to retry it.
- Editing order lines reallocates stock in a transaction. Fulfilled reservations must be reversed before replacing lines or deleting their order. Editing a reservation updates reserved quantities, fulfillment deducts on-hand stock, and fulfilling every line completes the order.
- Purchase orders act as immediate goods receipts. Edits and deletions adjust stock by the difference. Changes that would consume reserved units, oversell inventory, or leave dangling references return HTTP 409.
- Set `SMTP_URL` and `MAIL_FROM` to send order results to the account email. Email is best effort after commit. The order status remains available in the UI.
- Accounts start empty. This port uses UUIDs and per-account records. It does not import existing PostgreSQL data.

## HTTP API

All paths below use the prefix `/api/v1`. Send JSON request bodies. `POST /auth/register` and `POST /auth/login` accept `email` and `password` and return `{ token, email, role }`. Send the token in `Authorization: Bearer <token>` on resource requests.

`GET /catalog` publicly lists product IDs, names and prices. `POST /catalog/purchases` requires a bearer token and accepts `{ productId, quantity }`. It returns an order reference, status and line items. The server resolves the inventory owner, authenticated buyer and unit price. A shortage produces a rejected order.

Dashboard endpoints require an administrator. The dashboard uses `?scope=dashboard` to list records across administrator workspaces. Other administrators can view those records. The owner can edit or delete them. Each collection supports POST and GET at its collection path and GET, PUT and DELETE at `/:id`. PUT accepts the full editable document. The API returns the saved record on POST (201) and PUT (200), and an empty response on DELETE (204).

| Collection | Editable fields |
| --- | --- |
| `/products` | `name`, `price` |
| `/warehouses` | `code`, `name`, `city`, `address`, `active` |
| `/stocks` | `productId`, `warehouseId`, `quantityOnHand`. Product and warehouse are fixed after creation. |
| `/orders` | `description`, `items` containing `productId` and `quantity` |
| `/reservations` | `orderId`, `stockId`, `quantity`, `status` (`RESERVED`, `RELEASED`, `FULFILLED`) |
| `/purchase-orders` | `stockId`, `supplierId`, `quantity` |

`GET /api/v1/orders/:id/status` returns the status as a JSON string. `GET /health` checks database connectivity without authentication.

## Deploy

1. Push this project to a repository accessible by both hosts. Prepare a MongoDB replica set and give the backend a database user with read/write access. Configure database network access for the Render service.
2. On Render, create a Blueprint from the root `render.yaml`. Supply `MONGODB_URI` and `CLIENT_ORIGIN` (the exact Vercel production origin, with scheme and no trailing slash). The Blueprint generates the JWT secret and sets the build, start and health-check commands. [Render Express deployment](https://render.com/docs/deploy-node-express-app)
3. On Vercel, import the repository, choose `frontend` as the root directory and use the Vite preset. Set `VITE_API_URL` to `https://YOUR-SERVICE.onrender.com/api/v1` before building. Redeploy the frontend after changing this variable. Keep MongoDB credentials, SMTP credentials and the JWT secret in the backend environment. [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
4. Open the Render service's `/health` endpoint and register from the deployed frontend to check the database and cross-origin configuration.

## Verification

Run `npm run build --prefix backend` and `npm run build --prefix frontend` to type-check and build both applications. The HTTP integration test exercises order allocation, concurrent orders, reversals, receipt corrections and account isolation. Point it at a disposable running API. It creates test accounts and records.

```powershell
cd backend
$env:ERP_TEST_URL = 'http://localhost:4000/api/v1'
$env:ERP_TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/erp?replicaSet=rs0&directConnection=true'
node --import tsx --test test/workflow.test.ts
```

