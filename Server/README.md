# Kamali Grifts — Backend API (MySQL)

Express + Sequelize + **MySQL** backend for the Kamali Gifts e-commerce frontend.

## Project Structure

```
kamali-backend/
├── server.js               # Entry point
├── config/
│   └── database.js         # Sequelize + MySQL config
├── models/
│   ├── index.js            # All models + associations
│   ├── User.js
│   ├── Product.js          # JSON columns (category, tag, variation, image)
│   ├── CartItem.js
│   ├── WishlistItem.js
│   ├── Blog.js
│   ├── HeroSlide.js
│   ├── Nav.js              # NavCategory, NavEvent, NavCombo
│   ├── Marketing.js        # OfferBanner, MarqueeMessage
│   └── Order.js
├── controllers/
│   ├── authController.js
│   ├── productController.js  # Uses JSON_CONTAINS for array filters
│   ├── cartController.js
│   ├── wishlistController.js
│   ├── compareController.js
│   ├── blogController.js     # Uses JSON_CONTAINS for tag filter
│   ├── navController.js
│   ├── marketingController.js
│   └── orderController.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── cart.js
│   ├── wishlist.js
│   ├── compare.js
│   ├── blogs.js
│   ├── nav.js
│   ├── marketing.js
│   └── orders.js
├── middleware/
│   ├── auth.js             # protect + adminOnly JWT middleware
│   └── errorHandler.js
└── seeders/
    └── seed.js             # Seeds all tables with initial data
```

## MySQL-specific changes from PostgreSQL

| Feature | PostgreSQL (old) | MySQL (new) |
|---------|-----------------|-------------|
| Driver | `pg` + `pg-hstore` | `mysql2` |
| JSON column type | `DataTypes.JSONB` | `DataTypes.JSON` |
| Case-insensitive search | `Op.iLike` | `Op.like` (utf8mb4_unicode_ci is case-insensitive) |
| JSON array contains | `Op.contains` | `sequelize.literal('JSON_CONTAINS(...)')` |
| Dialect | `"mysel"` ❌ | `"mysql"` ✅ |
| Default port | 5432 | 3306 |
| dotenv loading | `.env.example` ❌ | `.env` ✅ |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Create the MySQL database
```sql
CREATE DATABASE kamali_grifts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Seed the database
```bash
npm run seed
```

### 5. Start the server
```bash
npm run dev   # development (nodemon)
npm start     # production
```

## API Endpoints

### Auth — `/api/auth`
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/register` | — | Register user |
| POST | `/login` | — | Login, returns JWT |
| GET | `/me` | 🔒 | Get current user |
| PUT | `/me` | 🔒 | Update profile |

### Products — `/api/products`
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/` | — | List (filter by category/tag/search/price/rating/sort) |
| GET | `/:id` | — | Get single product |
| POST | `/` | 🔒 Admin | Create |
| PUT | `/:id` | 🔒 Admin | Update |
| DELETE | `/:id` | 🔒 Admin | Soft delete |

**Query params:** `category`, `tag`, `search`, `minPrice`, `maxPrice`, `rating`, `sort` (`price_asc` | `price_desc` | `rating` | `sales`)

### Cart — `/api/cart` 🔒
`GET /` · `POST /add` · `PATCH /decrease/:cartItemId` · `DELETE /remove/:cartItemId` · `DELETE /clear`

### Wishlist — `/api/wishlist` 🔒
`GET /` · `POST /add` · `DELETE /remove/:productId` · `DELETE /clear`

### Compare — `/api/compare`
`POST /add` · `DELETE /remove/:productId`

### Blogs — `/api/blogs`
`GET /` · `GET /:slug` · `POST /` 🔒 Admin · `PUT /:id` 🔒 Admin · `DELETE /:id` 🔒 Admin

### Nav — `/api/nav`
`GET /categories` · `GET /events` · `GET /combos` (+ admin CRUD for each)

### Marketing
`GET /api/hero-slides` · `GET /api/offer-banners` · `GET /api/marquee` (+ admin CRUD)

### Orders — `/api/orders` 🔒
`GET /` · `GET /:id` · `POST /` · `GET /admin/all` 🔒 Admin · `PUT /admin/:id/status` 🔒 Admin

## Default Admin Credentials
```
Email:    admin@kamaligifts.com
Password: Admin@123
```
> Change this immediately after first login!

## Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
```
