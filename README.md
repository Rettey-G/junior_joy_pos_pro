# Junior Joy POS Pro System

A comprehensive Point of Sale system for retail businesses, featuring inventory management, sales tracking, customer management, and reporting.

## Features

- **Point of Sale**: Fast and intuitive sales interface
- **Inventory Management**: Track stock levels, suppliers, and purchase orders
- **Customer Management**: Store customer information and purchase history
- **Employee Management**: Manage staff details and permissions
- **Reporting**: Generate sales reports and analytics
- **Invoicing**: Create and manage invoices and bills

## Deployment Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database (local or Atlas)
- npm or yarn package manager

### Local Development Setup

1. **Clone the repository**
   ```
   git clone https://github.com/Rettey-G/junior_joy_pos_pro.git
   cd junior_joy_pos_pro
   ```

2. **Install server dependencies**
   ```
   npm install
   ```

3. **Install client dependencies**
   ```
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     MONGODB_URI=mongodb+srv://Rettey:Adhu1447@cluster0.qi38xbl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     JWT_SECRET=junior_joy_pos_secret_key
     PORT=5000
     NODE_ENV=development
     ```

5. **Run the application**
   - For development (run server and client separately):
     ```
     # Terminal 1 - Backend
     npm start
     
     # Terminal 2 - Frontend
     cd client
     npm start
     ```

### Deployment to Render

1. **Push your code to GitHub**
   ```
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Create a new Web Service on Render**
   - Sign in to [Render](https://render.com/)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Use the following settings:
     - **Name**: junior-joy-pos-backend
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node index.js`

3. **Set environment variables on Render**
   - In the web service dashboard, go to "Environment"
   - Add the following variables:
     ```
     MONGODB_URI=mongodb+srv://Rettey:Adhu1447@cluster0.qi38xbl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     JWT_SECRET=junior_joy_pos_secret_key
     NODE_ENV=production
     ```

4. **Deploy the service**
   - Click "Manual Deploy" > "Deploy latest commit"

## Emergency Access

If you're experiencing database connection issues, you can use the emergency access feature:

1. Navigate to `/direct-login.html` in your browser
2. Click "Access System Now"
3. Use the pre-filled credentials to log in

## Troubleshooting

### Common Issues

1. **Cannot find module 'express-validator'**
   - Run `npm install express-validator --save` to install the missing dependency

2. **Database connection errors**
   - Verify your MongoDB connection string in the `.env` file
   - Check if your MongoDB Atlas account is active and the network access is properly configured

3. **Login issues**
   - Use the emergency access feature at `/direct-login.html`
   - Reset admin password using `node scripts/reset-admin-password.js`

## License

This project is proprietary software. All rights reserved.
