`# Library Management System

A robust, modern full-stack web application for issuing, tracking, and returning library books. Designed with an emphasis on a lightweight aesthetic, dynamic interface, and secure inventory management.

## 🚀 Features
- **Frontend Independence**: The entire frontend is styled purely with Vanilla HTML, CSS (Variable-themed minimalist), and JS, relying strictly on native browser mechanics. Employs `localStorage` for robust, persistent User authentications across tabs.
- **Role-Based Access Control**: Strict segregation between "Customer" views (Dashboard issuance locking, Profile checking) and "Staff" views (Adding volumes). 
- **Quantitative Tracking**: Live numeric inventory calculation prevents over-issuance of books out of stock.
- **Constrained Issue Limits**: Backend dynamically restricts customers to a maximum of **3 actively issued books** per session simultaneously.
- **Robust Error Handling**: Real-time error-trapping powered by dynamic CSS-Animated Toast notifications integrated across `try/catch` wraps.
- **Fines tracking**: Backend auto-generates fines logically driven dynamically off issuance duration limits.

## 💻 Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (using Mongoose schemas)
- **Frontend:** Vanilla HTML, CSS, Javascript (Inter Font API) 

## 🛠️ Installation & Setup

### Prerequisites
Before running the project locally, ensure you have the following successfully installed:
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally on port `27017`)

### 1. Clone the repository
```bash
git clone https://github.com/aakashaygonde/LibrarySystem.git
cd LibrarySystem
```

### 2. Install dependencies
Install the required packages (`express`, `mongoose`, `cors`, `body-parser`):
```bash
npm install
```

### 3. Start the application
Once MongoDB is successfully running, fire up the backend:
```bash
node app.js
```

### 4. Access the Application
Open your favorite web browser and navigate to the application terminal:
```bash
http://localhost:3000
```

## 📚 Application Usage
1. Open the URL and toggle to the **Register** tab. 
2. Create an account utilizing the **Customer** profile to issue books.
3. Log out and register a **Staff** account to add library books with quantitative inventory.
4. Interact elegantly using the responsive Dashboard tracking UI.
