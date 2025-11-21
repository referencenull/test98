# Inventory Management System

A web application for managing inventory sales items. Users can add new items, delete items, and browse their inventory.

## Features

- ➕ **Add Items**: Create new inventory items with name, quantity, price, and description
- 📋 **Browse Items**: View all inventory items in an organized grid layout
- 🗑️ **Delete Items**: Remove items from the inventory
- 💾 **Local Database**: Uses SQLite for data persistence
- 🎨 **Modern UI**: Responsive and user-friendly interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Test Data

The application automatically creates a SQLite database with 10 sample items on first run:
- Laptop
- Wireless Mouse
- USB-C Cable
- Monitor
- Keyboard
- Webcam
- Headphones
- External SSD
- Phone Case
- Screen Protector

## Project Structure

```
.
├── server.js           # Express server and API endpoints
├── public/
│   └── index.html      # Frontend interface
├── package.json        # Project dependencies
└── inventory.db        # SQLite database (created on first run)
```

## API Endpoints

- `GET /api/items` - Retrieve all items
- `POST /api/items` - Add a new item
- `DELETE /api/items/:id` - Delete an item by ID

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)