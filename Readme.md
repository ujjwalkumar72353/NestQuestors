
# 🏠 NestQuestors (Bachelor House)

NestQuestors is a specialized real estate platform designed specifically for bachelors seeking rental properties. While traditional platforms primarily cater to families, NestQuestors addresses the unique challenges bachelors face when searching for accommodation.

## 🌟 Problem Statement

As a bachelor, finding suitable rental accommodation often involves:
- Traveling to a new city
- Staying in hotels for 5-6 days while searching for rooms
- Significant expenditure on temporary accommodation
- Time-consuming and frustrating property visits

## 💡 Our Solution

NestQuestors streamlines the rental process for bachelors by:
- Enabling direct room booking through the platform
- Providing detailed property listings with high-quality images
- Allowing users to secure rooms in advance
- Minimizing hotel stays and unnecessary expenses
- Offering a "book today, move in tomorrow" experience

## ✨ Key Features

- **🔐 Secure Authentication**
  - JWT (JSON Web Token) authentication
  - OAuth integration (Google login)
  - Secure token storage using HttpOnly cookies

- **🏢 Property Management**
  - Create, read, update, and delete property listings
  - Image upload via Firebase Storage
  - Detailed property information and amenities

- **🔍 Advanced Search & Filtering**
  - Location-based search
  - Price range filters
  - Amenity-specific filtering
  - Optimized for large datasets using MongoDB indexes

- **👤 User Profiles**
  - Profile management
  - Booking history
  - Property favorites and saved searches
  - Account security settings

- **📱 Responsive Design**
  - Mobile-first approach using Tailwind CSS
  - Consistent experience across devices

## 🛠️ Technology Stack

### Frontend
- **React.js**: For building the user interface
- **Redux Toolkit**: For state management
- **Tailwind CSS**: For responsive styling
- **React Router**: For navigation

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling

### Storage & Authentication
- **Firebase Storage**: For image storage and retrieval
- **JWT**: For secure authentication
- **OAuth**: For third-party login integration

### Deployment
- **Render**: For application hosting

## 🧩 Architecture & Design

### Frontend-Backend Interaction
- Frontend communicates with backend via RESTful APIs
- Redux manages global state across components
- Asynchronous operations handled with Redux Thunk

### Database Schema
- Collections for users, properties, and bookings
- Proper indexing for optimized queries
- Data normalization for efficient storage

## 💪 Challenges & Solutions

### 1. 🔍 Search Optimization for Large Datasets
- **Problem**: Slow response times with multiple filters
- **Solution**: 
  - MongoDB indexing on frequently queried fields
  - Aggregation pipelines for advanced filtering
  - Pagination implementation
- **Learning**: Query optimization is crucial for growing datasets

### 2. 🖼️ Image Storage and Performance
- **Problem**: High server load from image handling
- **Solution**: 
  - Offloaded images to Firebase Storage
  - Implemented lazy loading and compression
- **Learning**: Cloud storage improves scalability for media-heavy applications

### 3. 🔒 Authentication & Security
- **Problem**: JWT token vulnerabilities and OAuth mismatches
- **Solution**: 
  - HttpOnly cookies for secure token storage
  - Properly configured OAuth redirect URIs
- **Learning**: Token storage methods significantly impact security

### 4. 🚀 Deployment Challenges
- **Problem**: CORS issues and connection errors in production
- **Solution**: 
  - Configured proper CORS middleware
  - Implemented connection pooling
  - Used serverless functions for specific tasks
- **Learning**: Environment configuration is critical for deployment

### 5. ⏱️ Handling Concurrent Bookings
- **Problem**: Race conditions causing double bookings
- **Solution**: 
  - Database transactions
  - Property locking mechanism
- **Learning**: Concurrency handling is essential for booking systems

### 6. ⚖️ Feature Prioritization
- **Problem**: Feature complexity slowing development
- **Solution**: 
  - Focused on MVP functionality first
  - Used job queues for heavy tasks
- **Learning**: Incremental development leads to better outcomes

## 📊 Project Structure

```
nestquestors/
├── client/               # React frontend
│   ├── public/           # Public assets
│   ├── src/              # Source code
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── redux/        # Redux state management
│   │   ├── utils/        # Utility functions
│   │   └── App.js        # Main component
├── server/               # Node.js backend
│   ├── controllers/      # Request handlers
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── index.js          # Server entry point
└── README.md             # Project documentation
```

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ujjwalkumar72353/NestQuestors.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd NestQuestors
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Run the application:**
   ```bash
   npm start
   ```
4. Set up environment variables:
   - Create `.env` file in the server directory with:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     GOOGLE_CLIENT_ID=your_google_client_id
     FIREBASE_CONFIG=your_firebase_config
     ```
   - Create `.env` file in the client directory with:
     ```
     REACT_APP_API_URL=your_api_url
     REACT_APP_FIREBASE_CONFIG=your_firebase_config
     ```

5. Start the development servers:
   - Backend: `npm start` in the server directory
   - Frontend: `npm start` in the client directory

## 🚦 Usage Flow

1. Register/Login to the platform
2. Search for properties using filters (location, price, amenities)
3. View detailed property information and images
4. Book a property of interest
5. Confirm booking and arrange move-in
6. Manage bookings through user profile

## 🔮 Future Improvements

1. **Scalability Enhancements**:
   - Implement load balancing and database sharding
   - Optimize for higher traffic volumes

2. **Real-time Notifications**:
   - Add push notifications for booking updates
   - Implement in-app messaging system

3. **Advanced Features**:
   - Virtual property tours
   - AI-based property recommendations
   - Roommate matching system

## 👨‍💻 Personal Contribution

I was responsible for:
- Implementing the authentication system
- Integrating Firebase Storage for image handling
- Building CRUD functionality for property listings
- Optimizing search functionality with MongoDB
- Deploying the application on Render

## 📬 Contact

Project Link: [https://github.com/ujjwalkumar72353/NestQuestors](https://github.com/ujjwalkumar72353/NestQuestors)

