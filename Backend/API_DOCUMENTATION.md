# BeetleX API Documentation

This document provides details for testing the BeetleX Backend API using Postman or any other API client.

**Base URL**: `http://localhost:5000`

---

## 🔐 Authentication Endpoints

All authentication routes are prefixed with `/api/auth`.

### 1. Register User
Creates a new account in the system.

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body** (JSON):
```json
{
  "email": "test@example.com",
  "password": "Password123!",
  "fullName": "Test User",
  "username": "testuser"
}
```
- **Success Response** (201 Created):
```json
{
  "id": "uuid-string",
  "email": "test@example.com",
  "fullName": "Test User",
  "username": "testuser",
  "role": "participant",
  "isVerified": false,
  "isActive": true,
  "createdAt": "2024-...",
  "updatedAt": "2024-..."
}
```

### 2. Login User
Authenticates a user and returns tokens.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body** (JSON):
```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```
- **Success Response** (200 OK):
Returns `accessToken` in the JSON body and `refreshToken` in a secure http-only cookie.
```json
{
  "accessToken": "eyJhbG...",
  "user": {
    "id": "uuid-string",
    "email": "test@example.com",
    "fullName": "Test User",
    "username": "testuser",
    "role": "participant"
  }
}
```

### 3. Get Current User (Me)
Retrieves the profile of the currently logged-in user.

- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**:
    - `Authorization`: `Bearer <accessToken>`
- **Success Response** (200 OK):
```json
{
  "id": "uuid-string",
  "email": "test@example.com",
  "fullName": "Test User",
  "username": "testuser",
  "role": "participant"
}
```

### 4. Refresh Token
Refreshes the access token using the refresh token stored in cookies.

- **URL**: `/api/auth/refresh`
- **Method**: `POST`
- **Note**: Requires the `refreshToken` cookie to be present.
- **Success Response** (200 OK):
Returns a new `accessToken`.

### 5. Logout
Clears the authentication cookies.

- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Success Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

## 📅 Event Endpoints

Routes prefixed with `/api/events`.

### 1. Create Event
Creates a new hackathon/event.

- **URL**: `/api/events`
- **Method**: `POST`
- **Auth**: Required (`Bearer <token>`)
- **Roles**: `organizer`, `admin`
- **Body** (JSON):
```json
{
  "title": "Global Hackathon 2024",
  "description": "The biggest coding event of the year.",
  "slug": "global-hack-2024",
  "registrationOpen": "2024-01-01T00:00:00Z",
  "registrationClose": "2024-02-01T00:00:00Z",
  "eventStart": "2024-02-15T00:00:00Z",
  "eventEnd": "2024-02-20T00:00:00Z",
  "submissionDeadline": "2024-02-19T23:59:59Z",
  "timezone": "UTC",
  "maxTeamSize": 4,
  "minTeamSize": 1,
  "tags": ["web3", "ai"],
  "prizePool": { "total": "$10,000" },
  "isPublic": true
}
```

### 2. List Events
Retrieves multiple events with optional filtering.

- **URL**: `/api/events?page=1&limit=10&status=open&tag=ai`
- **Method**: `GET`
- **Auth**: Not required

### 3. Get Event by Slug
Retrieves details of a specific event.

- **URL**: `/api/events/global-hack-2024`
- **Method**: `GET`
- **Auth**: Not required

### 4. Update Event
Updates an existing event.

- **URL**: `/api/events/:id`
- **Method**: `PATCH`
- **Auth**: Required (`Bearer <token>`)
- **Note**: Only the organizer or an admin can update.

## 📝 Registration Endpoints

Routes prefixed with `/api/events/:id`.

### 1. Register for Event
Joins a specific event.

- **URL**: `/api/events/:id/register`
- **Method**: `POST`
- **Auth**: Required (`Bearer <token>`)
- **Body** (JSON):
```json
{
  "registrationData": {
    "tshirtSize": "XL",
    "dietaryRestrictions": "none"
  },
  "teamId": "optional-uuid-of-team"
}
```
- **Success Response** (201 Created):
Returns the registration object.

### 2. Get My Registration
Retrieves the logged-in user's registration for an event.

- **URL**: `/api/events/:id/registration`
- **Method**: `GET`
- **Auth**: Required (`Bearer <token>`)

### 3. Cancel Registration
Removes the user from the event. Only allowed before the event starts.

- **URL**: `/api/events/:id/registration`
- **Method**: `DELETE`
- **Auth**: Required (`Bearer <token>`)

### 4. List Event Registrations
Retrieves all registrations for an event.

- **URL**: `/api/events/:id/registrations?page=1&limit=20`
- **Method**: `GET`
- **Auth**: Required (`Bearer <token>`)
- **Roles**: `organizer`, `admin`

## 👥 Team Endpoints

### 1. Create Team
Creates a new team for an event.

- **URL**: `/api/events/:id/teams`
- **Method**: `POST`
- **Auth**: Required (`Bearer <token>`)
- **Body** (JSON):
```json
{
  "name": "The Bug Slayers",
  "track": "Open Innovation"
}
```

### 2. Join Team
Joins a team using an invite code.

- **URL**: `/api/teams/join`
- **Method**: `POST`
- **Auth**: Required (`Bearer <token>`)
- **Body** (JSON):
```json
{
  "inviteCode": "A1B2C3D4E5"
}
```

### 3. Update Team
Updates team metadata. Only available to the leader.

- **URL**: `/api/teams/:id`
- **Method**: `PATCH`
- **Auth**: Required (`Bearer <token>`)
- **Body** (JSON):
```json
{
  "name": "New Team Name"
}
```

### 4. Remove Member
Removes a specific member from the team. Only available to the leader.

- **URL**: `/api/teams/:id/members/:userId`
- **Method**: `DELETE`
- **Auth**: Required (`Bearer <token>`)

### 5. Create Team
Deletes the team. Only available to the leader before the submission deadline.

- **URL**: `/api/teams/:id`
- **Method**: `DELETE`
- **Auth**: Required (`Bearer <token>`)

### 6. List Event Teams
Retrieves all teams for a specific event.

- **URL**: `/api/events/:id/teams`
- **Method**: `GET`
- **Auth**: Not required

3. Ensure **Cookies** are enabled in Postman to handle the `refreshToken`.
