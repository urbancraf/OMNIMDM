# OmniPIM – Product Information Management System

OmniPIM is an **open-source, full-stack Product Information Management (PIM) system** designed to manage products, categories, attributes, and hierarchical taxonomy efficiently.  
It is built with a **React frontend** and a **backend API**, suitable for modern e-commerce, marketplaces, and enterprise catalogs.

---

## 🚀 Features

- Product & SKU management
- Primary & secondary category hierarchy (multi-level)
- Attribute & specification management
- Media (image/document) association
- REST APIs for integrations
- Scalable category level handling
- Admin-friendly UI
- Ready for analytics & AI enrichment

---

## 🏗️ Tech Stack

### Frontend
- React
- TypeScript
- Axios
- Material UI / Ant Design (if applicable)

### Backend
- Node.js
- Express / NestJS (based on implementation)
- REST APIs
- Database: MySQL / PostgreSQL / MongoDB (configurable)

---

## 📂 Project Structure (High Level)

```
omnipim/
│── frontend/          # React application
│── backend/           # API services
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── models/
│   └── utils/
│── database/
│── docs/
│── README.md
```

---

## 🧩 Category Hierarchy Design

- Categories are stored with:
  - `id`
  - `parentId`
  - `level`
- Root categories → `level = 1`
- Child categories → `level = parent.level + 1`
- Unlimited depth supported

⚠️ **Known Issue (Under Fix)**  
In some cases, new child categories are incorrectly saved as `level = 1`.  
This will be resolved by dynamically computing:

```ts
child.level = parent.level + 1;
```

---

## 🔌 API Overview (Sample)

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | /api/categories | List categories |
| POST | /api/categories | Create category |
| PUT | /api/categories/:id | Update category |
| GET | /api/products | List products |
| POST | /api/products | Create product |

---

## ⚙️ Environment Setup

Create a `.env` file in backend:

```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=omnipim
```

Frontend `.env`:

```
REACT_APP_API_BASE_URL=http://localhost:4000
```

---

## ▶️ Running the Project

### Backend
```
cd backend
npm install
npm run dev
```

### Frontend
```
cd frontend
npm install
npm start
```

---

## 🧪 Testing

- Unit tests: Jest (recommended)
- API testing: Postman / Swagger

---

## 🛣️ Roadmap

- Fix category level inheritance bug
- Bulk product import
- Role-based access control
- AI-based product enrichment
- Elasticsearch integration

---

## 🤝 Contributing

Contributions are welcome!  
Please read `CONTRIBUTING.md` before submitting a PR.

---

## 📜 License

This project is licensed under the **MIT License**.

---

## ⭐ Support

If you find this project useful, please star ⭐ the repository and share feedback!
