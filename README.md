# debter (ደብተር) 📱

[![Bilingual](https://img.shields.io/badge/Language-English%20%2F%20Amharic-amber)](https://github.com/your-username/debter)
[![Platform](https://img.shields.io/badge/Platform-Android%20%2F%20iOS-blue)](#-tech-stack)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-red)](LICENSE)

# debter (ደብተር)

A secure, real-time digital sales ledger and inventory management application designed for micro-shops, kiosks, boutiques, and small merchants in Ethiopia and the wider Habesha community.

The platform replaces traditional paper ledger books with a modern cloud-powered system that provides reliable inventory management, sales tracking, and business insights in both English and Amharic.

---
## 📸 Screenshots

| Architecture | Splash | Login |
|-----------|-------|------------|
| <img src="https://github.com/user-attachments/assets/3f6e57a3-7205-4201-9c7f-6bbae2e3d01a" width="250"/> | <img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/9651d58b-2c7e-4bdc-b3b6-a18254e563a6" /> | <img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/6f1486d7-a24b-4603-8eb6-cfeab88d44cc" />

| Signup | Analytics | Record Sale |
|-----------|---------|---------|
| <img src="https://github.com/user-attachments/assets/3404684d-acf1-42c6-94b9-603d2ae43cf5" width="250"/> | <img src="https://github.com/user-attachments/assets/db55004f-44ee-4627-8374-3f3da1b047c3" width="250"/> | <img src="https://github.com/user-attachments/assets/f3845135-d4ec-4a29-8638-9c5758923191" width="250"/> |

|Sales Ledger | Inventory |
|----------|----------------|
| <img src="https://github.com/user-attachments/assets/80594d0b-46fd-4bc3-a2f9-3ca1da0ab2d3" width="250"/> | <img src="https://github.com/user-attachments/assets/f6b149f5-b507-4b88-82a3-047f64dc4db0" width="250"/> |


## ✨ Features

- 📊 Real-time sales tracking
- 📦 Inventory management
- 👥 Role-based access control
- 🔒 Immutable transaction records
- ☁️ Cloud synchronization with Supabase
- 🌐 Bilingual support (English & Amharic)
- 📈 Business analytics dashboard

---

## 🏗️ Tech Stack

| Layer | Technology |
|--------|------------|
| Mobile Framework | React Native |
| Language | TypeScript |
| Backend & Database | Supabase |
| Database Engine | PostgreSQL |
| Realtime | Supabase Realtime |
| State Management | React Hooks |
| Styling | Tailwind CSS / NativeWind |
| Icons | Lucide React |

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/epythonlab2/debter.git
cd debter
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Run Development Server

```bash
npm start
```

### Run on Android

```bash
npm run android
```

### Run on iOS

```bash
npm run ios
```

---

## 🗄️ Database Architecture

### Shops

```sql
CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Inventory

```sql
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  item_name_am TEXT NOT NULL,
  item_name_en TEXT,
  default_price NUMERIC NOT NULL,
  quantity_in_stock INT DEFAULT 0
);
```

### Transactions

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  item_name_am TEXT NOT NULL,
  item_name_en TEXT,
  quantity INT NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  total_revenue NUMERIC GENERATED ALWAYS AS
    (quantity * price_per_unit) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 Security

- Row-Level Security (RLS)
- Tenant isolation
- Immutable sales records
- Private merchant data protection

---

## 🤝 Contributing

Contributions are welcome. Feel free to fork the repository and submit pull requests.

---

## 📝 License

This project is licensed under the MIT License.

---

Built with ❤️ for Ethiopian small businesses.

