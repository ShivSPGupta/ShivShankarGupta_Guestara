# Docker Setup Guide

This guide will help you run the entire application using Docker and Docker Compose.

## 📋 Prerequisites

- **Docker** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)

### Install Docker

**Windows/Mac:**
- Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)

**Linux (Ubuntu):**
```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional - to run without sudo)
sudo usermod -aG docker $USER
```

Verify installation:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start with Docker

### Option 1: Using Docker Compose (Recommended)

This will start **PostgreSQL** + **Node.js App** together.

```bash
# 1. Copy environment file
cp .env.docker .env

# 2. Build and start all services
docker-compose up --build

# That's it! Application is running at http://localhost:3000
```

**To run in background (detached mode):**
```bash
docker-compose up -d --build
```

**To stop:**
```bash
docker-compose down
```

**To stop and remove all data:**
```bash
docker-compose down -v
```

---

### Option 2: Manual Docker Commands

If you prefer to run containers individually:

**1. Create a network:**
```bash
docker network create menu_network
```

**2. Start PostgreSQL:**
```bash
docker run -d \
  --name menu_postgres \
  --network menu_network \
  -e POSTGRES_DB=menu_management \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  postgres:15-alpine
```

**3. Build the application:**
```bash
docker build -t menu-app .
```

**4. Start the application:**
```bash
docker run -d \
  --name menu_app \
  --network menu_network \
  -e DB_HOST=menu_postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=menu_management \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres123 \
  -p 3000:3000 \
  menu-app
```

---

## 📊 Docker Services Explained

### 1. PostgreSQL Database (`postgres`)
- **Image:** `postgres:18-alpine`
- **Port:** `5432`
- **Default credentials:**
  - Database: `menu_management`
  - User: `postgres`
  - Password: `postgres123`

### 2. Node.js Application (`app`)
- **Port:** `3000`
- **Auto-runs migrations** on startup
- **Depends on:** PostgreSQL (waits for it to be healthy)

### 3. pgAdmin (Optional - Development Only)
- **Port:** `5050`
- **Web UI** for managing PostgreSQL
- **Access:** http://localhost:5050
- **Login:**
  - Email: `admin@admin.com`
  - Password: `admin123`

To start with pgAdmin:
```bash
docker-compose --profile dev up
```

---

## 🛠️ Useful Docker Commands

### View running containers:
```bash
docker ps
```

### View logs:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs postgres

# Follow logs (real-time)
docker-compose logs -f app
```

### Execute commands inside container:
```bash
# Access app container shell
docker exec -it menu_app sh

# Access PostgreSQL
docker exec -it menu_postgres psql -U postgres -d menu_management
```

### Restart services:
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Stop and remove everything:
```bash
# Stop containers
docker-compose stop

# Remove containers
docker-compose down

# Remove containers + volumes (deletes all data!)
docker-compose down -v

# Remove containers + volumes + images
docker-compose down -v --rmi all
```

---

## 🗄️ Database Management

### Access PostgreSQL CLI:
```bash
docker exec -it menu_postgres psql -U postgres -d menu_management
```

### Common PostgreSQL commands:
```sql
-- List all tables
\dt

-- Describe a table
\d categories

-- Show all databases
\l

-- Quit
\q
```

### Backup Database:
```bash
docker exec menu_postgres pg_dump -U postgres menu_management > backup.sql
```

### Restore Database:
```bash
docker exec -i menu_postgres psql -U postgres menu_management < backup.sql
```

---

## 🔧 Seed Data in Docker

### Method 1: Using npm script
```bash
docker exec menu_app npm run db:seed
```

### Method 2: Execute seed file directly
```bash
docker exec menu_app node src/database/seed.js
```

---

## 🐛 Troubleshooting

### Issue: "Port 3000 already in use"
**Solution:** Change port in `.env`:
```bash
PORT=3001
```
Then rebuild:
```bash
docker-compose up --build
```

### Issue: "Database connection refused"
**Solution:** Wait for PostgreSQL to be ready:
```bash
# Check postgres health
docker-compose ps

# View postgres logs
docker-compose logs postgres
```

### Issue: "Cannot connect to Docker daemon"
**Solution:**
```bash
# Start Docker service (Linux)
sudo systemctl start docker

# Or restart Docker Desktop (Windows/Mac)
```

### Issue: Containers won't start
**Solution:** Clean up and rebuild:
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Issue: "No space left on device"
**Solution:** Clean up Docker:
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

---

## 🔒 Production Best Practices

### 1. Use Environment Variables
Never hardcode credentials. Use `.env` file:
```bash
cp .env.docker .env
# Edit .env with your production credentials
```

### 2. Use Docker Secrets (Docker Swarm)
```yaml
# docker-compose.yml
secrets:
  db_password:
    external: true

services:
  app:
    secrets:
      - db_password
```

### 3. Enable HTTPS
Use a reverse proxy (Nginx, Traefik) with SSL certificates.

### 4. Limit Resources
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 5. Health Checks
Already configured in `Dockerfile`:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', ...)"
```

### 6. Multi-stage Builds (for smaller images)
Update `Dockerfile`:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
CMD ["npm", "start"]
```

---

## 📈 Monitoring

### View resource usage:
```bash
docker stats
```

### View container health:
```bash
docker inspect menu_app | grep -A 10 Health
```

---

## 🚢 Deployment

### Deploy to Docker Hub:
```bash
# Build image
docker build -t yourusername/menu-app:latest .

# Login to Docker Hub
docker login

# Push image
docker push yourusername/menu-app:latest
```

### Deploy to Server:
```bash
# On server
docker pull yourusername/menu-app:latest
docker-compose up -d
```

---

## 📚 Docker Compose Commands Cheat Sheet

```bash
# Start services
docker-compose up                 # Foreground
docker-compose up -d             # Background
docker-compose up --build        # Rebuild images

# Stop services
docker-compose stop              # Stop without removing
docker-compose down              # Stop and remove containers

# View logs
docker-compose logs              # All logs
docker-compose logs -f           # Follow logs
docker-compose logs app          # Specific service

# Execute commands
docker-compose exec app sh       # Shell in container
docker-compose exec postgres psql # PostgreSQL CLI

# Scale services
docker-compose up -d --scale app=3  # Run 3 instances

# View running services
docker-compose ps
```

---

## 🎯 Development Workflow

### Local development with hot-reload:
```yaml
# docker-compose.dev.yml
services:
  app:
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
```

Run with:
```bash
docker-compose -f docker-compose.dev.yml up
```

---

## ✅ Validation Checklist

Before deploying:
- [ ] Change default passwords in `.env`
- [ ] Test database connection
- [ ] Test all API endpoints
- [ ] Check health endpoint: `curl http://localhost:3000/api/health`
- [ ] Review logs for errors
- [ ] Test database backups
- [ ] Configure monitoring
- [ ] Setup HTTPS/SSL
- [ ] Configure firewall rules

---

## 🆘 Need Help?

**View container details:**
```bash
docker inspect menu_app
```

**Check network configuration:**
```bash
docker network inspect menu_network
```

**View all volumes:**
```bash
docker volume ls
```

**View disk usage:**
```bash
docker system df
```

---

**🎉 You're now ready to deploy with Docker!**