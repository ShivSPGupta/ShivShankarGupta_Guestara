# Menu & Services Management Backend

A production-grade REST API for managing restaurant menus, bookings, and services with advanced pricing logic and real-time availability checking.

## 🚀 Features

- **Category Management** - Hierarchical organization with categories and subcategories
- **Item Management** - Flexible items with 5 different pricing types
- **Tax Inheritance** - Smart tax calculation with inheritance from parent categories
- **Booking System** - Real-time availability checking with conflict prevention
- **Add-ons System** - Optional extras with dynamic pricing
- **Soft Deletes** - No data loss with soft delete functionality
- **Advanced Search** - Full-text search with filters
- **Pagination & Sorting** - Efficient data retrieval
- **Joi Validation** - Robust input validation with detailed error messages
- **Docker Support** - Containerized deployment with Docker Compose

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

### Method 1: Using Docker (Recommended for Quick Start)

```bash
# 1. Clone the repository
git clone <repository-url>
cd menu-management-backend

# 2. Copy Docker environment file
cp .env.docker .env

# 3. Start everything with Docker Compose
docker-compose up --build

# Application will be running at http://localhost:3000
# PostgreSQL will be running at localhost:5432
```

**That's it!** The application and database are now running.

See [DOCKER.md](DOCKER.md) for detailed Docker documentation.

---

### Method 2: Manual Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd menu-management-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=menu_management
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
NODE_ENV=development
```

### 4. Create PostgreSQL database
```bash
psql -U postgres
CREATE DATABASE menu_management;
\q
```

### 5. Run migrations
```bash
npm run db:migrate
```

### 6. Seed sample data (optional)
```bash
npm run db:seed
```

### 7. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

---

## 🏷️ Categories

### Get All Categories
```http
GET /api/categories
Query Params:
  - page (default: 1)
  - limit (default: 10)
  - sortBy (default: name)
  - order (ASC/DESC)
  - search (partial name search)
  - active (true/false)
```

### Get Category by ID
```http
GET /api/categories/:id
```

### Create Category
```http
POST /api/categories
Body:
{
  "name": "Beverages",
  "description": "Hot and cold drinks",
  "tax_applicable": true,
  "tax_percentage": 5,
  "image": "url"
}

✅ Joi Validation:
- name: Required, 2-255 characters
- tax_percentage: Required if tax_applicable is true (0-100)
- Automatic error messages for invalid data
```

### Update Category
```http
PUT /api/categories/:id
Body: (same as create)
```

### Delete Category (Soft Delete)
```http
DELETE /api/categories/:id
```

---

## 📦 Items

### Get All Items
```http
GET /api/items
Query Params:
  - page, limit, sortBy, order
  - search (name search)
  - category_id
  - subcategory_id
  - pricing_type
  - active
  - min_price, max_price
```

### Get Item by ID
```http
GET /api/items/:id
```

### Create Item
```http
POST /api/items
Body:
{
  "name": "Cappuccino",
  "description": "Rich espresso coffee",
  "category_id": 1,  // OR subcategory_id (not both)
  "pricing_type": "static",
  "pricing_config": {
    "base_price": 200
  },
  "tax_applicable": null,  // Inherits from category
  "addons": [
    {
      "name": "Extra shot",
      "price": 50,
      "is_mandatory": false
    }
  ]
}
```

### Calculate Item Price 💰
```http
GET /api/items/:id/price
Query Params:
  - time (for dynamic pricing, format: HH:MM)
  - duration (for tiered pricing, in hours)
  - units (for tiered pricing)
  - addons (comma-separated addon IDs: 1,2,3)

Response:
{
  "success": true,
  "data": {
    "item_id": 1,
    "item_name": "Cappuccino",
    "pricing_breakdown": {
      "pricing_type": "static",
      "base_price": 200,
      "addons": [
        {"id": 1, "name": "Extra shot", "price": 50}
      ],
      "addons_total": 50,
      "subtotal": 250,
      "tax": {
        "applicable": true,
        "percentage": 5,
        "amount": 12.5,
        "inherited_from": "category"
      },
      "grand_total": 262.5
    }
  }
}
```

---

## 📅 Bookings

### Get Available Slots
```http
GET /api/items/:id/available-slots?date=2026-01-20

Response:
{
  "success": true,
  "data": {
    "date": "2026-01-20",
    "day": "Monday",
    "available": true,
    "time_slots": [
      {"start": "09:00", "end": "18:00"}
    ],
    "booked_slots": [
      {
        "start_time": "10:00",
        "end_time": "11:00",
        "booking_id": 1
      }
    ]
  }
}
```

### Create Booking
```http
POST /api/bookings
Body:
{
  "item_id": 1,
  "booking_date": "2026-01-20",
  "start_time": "14:00",
  "end_time": "16:00",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "1234567890",
  "addons": [1, 2],
  "notes": "Need projector setup"
}

Response includes:
- Booking details
- Complete pricing breakdown
- Confirmation
```

### Cancel Booking
```http
PATCH /api/bookings/:id/cancel
```

---

## 💡 Pricing Types Explained

### 1. Static Pricing
Fixed price, always the same.
```json
{
  "pricing_type": "static",
  "pricing_config": {
    "base_price": 200
  }
}
```

### 2. Tiered Pricing
Price based on quantity/duration.
```json
{
  "pricing_type": "tiered",
  "pricing_config": {
    "tiers": [
      {"max_units": 1, "price": 300},
      {"max_units": 2, "price": 500},
      {"max_units": 4, "price": 800}
    ]
  }
}
```
Example: Booking for 2.5 hours → Uses "up to 4 hours" tier → ₹800

### 3. Complimentary
Always free.
```json
{
  "pricing_type": "complimentary",
  "pricing_config": {}
}
```

### 4. Discounted Pricing
Base price with discount.
```json
{
  "pricing_type": "discounted",
  "pricing_config": {
    "base_price": 1000,
    "discount": {
      "type": "percentage",  // or "flat"
      "value": 20
    }
  }
}
```

### 5. Dynamic Pricing (Time-based)
Price changes based on time of day.
```json
{
  "pricing_type": "dynamic",
  "pricing_config": {
    "time_windows": [
      {"start": "08:00", "end": "11:00", "price": 199},
      {"start": "11:00", "end": "14:00", "price": 249}
    ]
  }
}
```

---

## 🏗️ Database Schema

### Tax Inheritance Flow
```
Category (tax: 10%)
  ↓ (inherits)
Subcategory (tax: not set → uses 10%)
  ↓ (inherits)
Item (tax: not set → uses 10%)
```

**Implementation Approach:**
Tax is calculated **dynamically at query time** using the `getEffectiveTax()` function. This ensures:
- Tax changes in categories automatically reflect in all items
- No need to update child records when parent tax changes
- Single source of truth for tax values

### Soft Delete Behavior
When `is_active = false`:
- Record remains in database
- Not shown in list APIs (filtered automatically)
- Can be reactivated
- Preserves data integrity for historical records

---

## 🔒 Booking Conflict Prevention

The system uses **database transactions with row-level locking** to prevent double bookings:

```javascript
// Pessimistic locking approach
BEGIN TRANSACTION;
  SELECT * FROM bookings WHERE ... FOR UPDATE;  // 🔒 Lock
  CHECK for conflicts;
  INSERT new booking;
COMMIT;  // 🔓 Unlock
```

This ensures that if two users try to book the same slot simultaneously:
1. First user gets the lock
2. Second user waits
3. First user completes booking
4. Second user's request is rejected (conflict detected)

---

## 📊 Project Structure

```
menu-management-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── models/
│   │   ├── Category.js
│   │   ├── Subcategory.js
│   │   ├── Item.js
│   │   ├── Addon.js
│   │   ├── Booking.js
│   │   └── index.js             # Model associations
│   ├── controllers/
│   │   ├── categoryController.js
│   │   ├── itemController.js
│   │   └── bookingController.js
│   ├── services/
│   │   ├── pricingService.js    # Pricing calculation logic
│   │   └── bookingService.js    # Booking business logic
│   ├── validators/              # 🆕 Joi validation schemas
│   │   ├── categoryValidator.js
│   │   ├── itemValidator.js
│   │   └── bookingValidator.js
│   ├── middleware/              # 🆕 Custom middleware
│   │   └── validate.js          # Validation middleware
│   ├── routes/
│   │   └── index.js             # API routes
│   ├── database/
│   │   ├── migrate.js           # Migration script
│   │   └── seed.js              # Seed data
│   └── server.js                # Main server file
├── .env                         # Environment variables
├── .env.example
├── .env.docker                  # 🆕 Docker environment
├── Dockerfile                   # 🆕 Docker configuration
├── docker-compose.yml           # 🆕 Docker Compose setup
├── .dockerignore                # 🆕 Docker ignore file
├── package.json
├── README.md
├── DOCKER.md                    # 🆕 Docker documentation
└── QUICKSTART.md
```

---

## 🧪 Testing the API

### Using cURL

**Create a category:**
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Beverages",
    "tax_applicable": true,
    "tax_percentage": 5
  }'
```

**Get item price:**
```bash
curl "http://localhost:3000/api/items/1/price?addons=1,2&time=10:30"
```

**Create a booking:**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 2,
    "booking_date": "2026-01-20",
    "start_time": "14:00",
    "end_time": "16:00",
    "customer_name": "John Doe"
  }'
```

---

## 🎯 Key Learning Points

### 1. Tax Inheritance
- **Challenge**: How to avoid storing duplicate tax values?
- **Solution**: Calculate dynamically by checking item → subcategory → category
- **Benefit**: Single source of truth, automatic updates

### 2. Pricing Engine
- **Challenge**: Different items need different pricing logic
- **Solution**: JSONB field for flexible pricing configs
- **Benefit**: Easy to add new pricing types without schema changes

### 3. Booking Conflicts
- **Challenge**: Prevent double bookings when users book simultaneously
- **Solution**: Database transactions with FOR UPDATE lock
- **Benefit**: Race condition prevention at database level

### 4. Soft Deletes
- **Challenge**: Maintain data integrity and audit trail
- **Solution**: is_active flag instead of DELETE
- **Benefit**: Data recovery, historical records, safe deletions

---

## 🚧 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure PostgreSQL is running and credentials in `.env` are correct.

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**: Change PORT in `.env` or kill process using port 3000.

### Migration Fails
```
Error: relation "categories" already exists
```
**Solution**: Drop and recreate database:
```bash
psql -U postgres
DROP DATABASE menu_management;
CREATE DATABASE menu_management;
\q
npm run db:migrate
```

---

## 📝 Requirements Checklist

✅ Categories with tax configuration  
✅ Subcategories with tax inheritance  
✅ Items with flexible parent (category OR subcategory)  
✅ 5 pricing types (static, tiered, complimentary, discounted, dynamic)  
✅ Tax inheritance system  
✅ Soft deletes  
✅ Pagination, sorting, filtering  
✅ Search functionality  
✅ Price calculation endpoint  
✅ Booking system with availability  
✅ Prevent double booking  
✅ Add-ons system  
✅ PostgreSQL database  
✅ RESTful API design  
✅ **Joi validation** with detailed error messages  
✅ **Docker & Docker Compose** for easy deployment  

---

## 🎓 Next Steps for Learning

1. **Add Authentication**: JWT tokens for user login
2. **Add Tests**: Unit and integration tests with Jest
3. **Add Logging**: Winston or Morgan for better logging
4. **Add Caching**: Redis for frequently accessed data
5. **Add Documentation**: Swagger/OpenAPI docs
6. **CI/CD Pipeline**: GitHub Actions or GitLab CI
7. **Deploy**: Deploy to AWS, DigitalOcean, or Heroku

---

## 🐳 Docker Deployment

This project includes full Docker support. See [DOCKER.md](DOCKER.md) for:
- Docker installation guide
- Quick start with Docker Compose
- Database management in containers
- Production deployment best practices
- Troubleshooting common issues

**Quick Deploy:**
```bash
docker-compose up --build
```
