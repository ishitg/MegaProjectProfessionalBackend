# Youtube Clone Backend

## Overview

This is an **advanced backend project for a video hosting platform**, designed to follow industry standards and production-level practices. Inspired by platforms like YouTube, it provides all the foundational backend infrastructure needed to support a modern, feature-rich video streaming service.

This project implements a well-structured and scalable codebase, emphasizing modular design, clean separation of concerns, and robust security throughout.

---

## Key Features

### User Management:
 - Registration, authentication (JWT), profile management (avatar, cover Image, channel details) , watch history


### Video Management:

- Upload and publish a video
- Video search, sorting and pagination
- Video editing and deletion
- Visibility control (published/unpublished)

### Comments & Replies:

-Engage with videos via nested comment threads, supporting moderation

### Likes & Dislikes:

-Allow users to express preferences on videos and comments and community posts
-View liked videos

### Playlists:

-Create, update, and manage playlists with custom video collections
-Add or remove videos from playlists
-View user playlists

### Subscriptions: 

- Subscribe or unsubscribe to channels
- View subscribed channels
- View channel subscribers

### Community Posts (Tweets):

-Microblogging support for user engagement updates

### Dashboard:

- Viewing channel statistics (views, subscribers, videos, likes)
- Accessing uploaded videos
---

## Technologies Used

| Technology   | Purpose                               |
|--------------|---------------------------------------|
| Node.js      | Server-side runtime                   |
| Express.js   | Web framework/API routing             |
| MongoDB      | NoSQL database                        |
| Mongoose     | ODM for MongoDB                       |
| JWT          | Authentication tokens                 |
| Bcrypt       | Password hashing                      |
| Multer       | File uploads (videos, avatars)        |
| Cloudinary   | Media storage/cloud integration       |
| Postman      | API documentation & testing           |

---

## Getting Started

1. **Clone the repository**
   ```
   git clone https://github.com/ishitg/youtube-clone-backend.git
   cd youtube-clone-backend
   ```
2. **Install dependencies**
   ```
   npm install
   ```
3. **Configure Environment**
   - Copy `.env.example` to `.env` and update credentials for DB, JWT, Cloudinary, etc.

4. **Run the development server**
   ```
   npm run start
   ```

5. **Explore API Endpoints**
   - Use Postman
