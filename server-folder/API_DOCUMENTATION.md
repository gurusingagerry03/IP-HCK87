# Ninety Minutes API Documentation

## Base URL

- Development: `http://localhost:3000`
- API Version: `/api/v1`

## Overview

The Ninety Minutes API is a comprehensive football/soccer management system that provides endpoints for managing users, leagues, teams, players, matches, and favorites. The API includes authentication, authorization, external data synchronization, and AI-powered features.

## Endpoints :

List of available endpoints:

**Authentication:**

- `POST /api/v1/users/register`
- `POST /api/v1/users/login`
- `POST /api/v1/users/google-login`

**Leagues:**

- `GET /api/v1/leagues`
- `GET /api/v1/leagues/:id`
- `POST /api/v1/leagues/sync`

**Teams:**

- `GET /api/v1/teams`
- `GET /api/v1/teams/:id`
- `POST /api/v1/teams/sync/:leagueId`
- `PATCH /api/v1/teams/generate-descriptions/:id`
- `PATCH /api/v1/teams/img-url/:id`
- `DELETE /api/v1/teams/img-url/:id/:imageIndex`

**Players:**

- `GET /api/v1/players`
- `GET /api/v1/players/team/:id`

**Matches:**

- `GET /api/v1/matches`
- `GET /api/v1/matches/:id`
- `GET /api/v1/matches/league/:id`
- `POST /api/v1/matches/sync/:leagueId`
- `PUT /api/v1/matches/analysis/:id`
- `PUT /api/v1/matches/preview/:id`

**Favorites:**

- `GET /api/v1/favorites`
- `POST /api/v1/favorites/:teamId`
- `DELETE /api/v1/favorites/:id`

**System:**

- `GET /`
- `GET /health`

&nbsp;

---

## Authentication Endpoints

### 1. POST /api/v1/users/register

Description:

- Register a new user account

Request:

- body:

```json
{
  "fullname": "string",
  "email": "string",
  "password": "string"
}
```

_Response (201 - Created)_

```json
{
  "success": true,
  "data": {
    "id": "integer",
    "email": "string",
    "fullname": "string",
    "role": "string"
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Email is required"
}
OR
{
  "message": "Password is required"
}
OR
{
  "message": "Fullname is required"
}
OR
{
  "message": "Email already exists"
}
```

&nbsp;

### 2. POST /api/v1/users/login

Description:

- Login with email and password

Request:

- body:

```json
{
  "email": "string",
  "password": "string"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "user": {
      "id": "integer",
      "email": "string",
      "fullname": "string",
      "role": "string"
    }
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Email and password are required"
}
```

_Response (401 - Unauthorized)_

```json
{
  "success": false,
  "message": "Authentication failed",
  "errors": [
    {
      "field": "general",
      "message": "Invalid email or password"
    }
  ]
}
```

&nbsp;

### 3. POST /api/v1/users/google-login

Description:

- Login using Google OAuth token

Request:

- body:

```json
{
  "googleToken": "string"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "user": {
      "id": "integer",
      "email": "string",
      "fullname": "string",
      "role": "string"
    }
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Google token is required"
}
```

&nbsp;

---

## League Endpoints

### 4. GET /api/v1/leagues

Description:

- Get all leagues from database

_Response (200 - OK)_

```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "name": "string",
      "country": "string",
      "externalRef": "string",
      "logoUrl": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

&nbsp;

### 5. GET /api/v1/leagues/:id

Description:

- Get league by ID

Request:

- params:

```json
{
  "id": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": {
    "id": "integer",
    "name": "string",
    "country": "string",
    "externalRef": "string",
    "logoUrl": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "League ID must be a positive number"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "League with ID {id} not found"
}
```

&nbsp;

### 6. POST /api/v1/leagues/sync

Description:

- Synchronize league data from external API (Admin only)

Request:

- headers:

```json
{
  "Authorization": "Bearer token.token.token"
}
```

- body:

```json
{
  "leagueName": "string",
  "leagueCountry": "string"
}
```

_Response (201 - Created)_

```json
{
  "success": true,
  "message": "League synchronized successfully",
  "data": {
    "id": "integer",
    "name": "string",
    "country": "string",
    "externalRef": "string",
    "logoUrl": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "League name is required"
}
OR
{
  "message": "Country is required"
}
OR
{
  "message": "Failed to connect to external league API"
}
```

_Response (409 - Conflict)_

```json
{
  "message": "League {leagueName} from {leagueCountry} already exists"
}
```

&nbsp;

---

## Team Endpoints

### 7. GET /api/v1/teams

Description:

- Get all teams with optional filtering, searching, sorting, and pagination

Request:

- query:

```json
{
  "q": "string (search term)",
  "filter": "string (country filter)",
  "sort": "string (default: name)",
  "page[number]": "integer (default: 1)",
  "page[size]": "integer (default: 10, max: 50)"
}
```

_Response (200 - OK)_

```json
{
  "data": [
    {
      "id": "integer",
      "name": "string",
      "logoUrl": "string",
      "foundedYear": "integer",
      "country": "string",
      "stadiumName": "string",
      "venueAddress": "string",
      "stadiumCity": "string",
      "stadiumCapacity": "integer",
      "coach": "string",
      "description": "string",
      "imgUrls": ["array of image objects"],
      "externalRef": "string",
      "leagueId": "integer",
      "League": {
        "id": "integer",
        "name": "string",
        "country": "string"
      }
    }
  ],
  "meta": {
    "page": "integer",
    "totalPages": "integer",
    "total": "integer",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  }
}
```

&nbsp;

### 8. GET /api/v1/teams/:id

Description:

- Get team by ID with league and players information

Request:

- params:

```json
{
  "id": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "id": "integer",
  "name": "string",
  "logoUrl": "string",
  "foundedYear": "integer",
  "country": "string",
  "stadiumName": "string",
  "venueAddress": "string",
  "stadiumCity": "string",
  "stadiumCapacity": "integer",
  "coach": "string",
  "description": "string",
  "imgUrls": ["array of image objects"],
  "externalRef": "string",
  "leagueId": "integer",
  "League": {
    "id": "integer",
    "name": "string",
    "country": "string"
  },
  "Players": [
    {
      "id": "integer",
      "fullName": "string",
      "primaryPosition": "string",
      "age": "integer",
      "shirtNumber": "integer",
      "thumbUrl": "string"
    }
  ]
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Team ID must be a positive number"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Team with ID {id} not found"
}
```

&nbsp;

### 9. POST /api/v1/teams/sync/:leagueId

Description:

- Synchronize teams and players from external API for a specific league (Admin only)

Request:

- headers:

```json
{
  "Authorization": "Bearer token.token.token"
}
```

- params:

```json
{
  "leagueId": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": {
    "totalTeam": "integer",
    "totalPlayer": "integer",
    "errors": ["array of error messages"]
  },
  "message": "Teams and players synchronization completed"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "League ID is required"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "League not found"
}
```

&nbsp;

### 10. PATCH /api/v1/teams/generate-descriptions/:id

Description:

- Generate AI-powered description for a team

Request:

- params:

```json
{
  "id": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "message": "Team description updated successfully"
}
OR
{
  "message": "Team description already exists, skipping regeneration"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Team ID must be a positive number"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Team with ID {id} not found"
}
```

&nbsp;

### 11. PATCH /api/v1/teams/img-url/:id

Description:

- Upload team images (max 4 images per team) (Admin only)

Request:

- headers:

```json
{
  "Authorization": "Bearer token.token.token",
  "Content-Type": "multipart/form-data"
}
```

- params:

```json
{
  "id": "integer (required)"
}
```

- body (form-data):

```json
{
  "images": "file[] (max 4 images)"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "message": "Successfully uploaded {count} images",
  "data": {
    "teamId": "integer",
    "teamName": "string",
    "totalImages": "integer",
    "newImages": [
      {
        "url": "string",
        "public_id": "string"
      }
    ]
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "No images provided"
}
OR
{
  "message": "Cannot upload {count} images. Team already has {count} images. Maximum allowed is 4 images per team."
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Team not found"
}
```

&nbsp;

### 12. DELETE /api/v1/teams/img-url/:id/:imageIndex

Description:

- Delete a specific team image by index (Admin only)

Request:

- headers:

```json
{
  "Authorization": "Bearer token.token.token"
}
```

- params:

```json
{
  "id": "integer (required)",
  "imageIndex": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": {
    "teamId": "integer",
    "teamName": "string",
    "remainingImages": "integer",
    "deletedImage": {
      "url": "string",
      "public_id": "string"
    }
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Team has no images to delete"
}
OR
{
  "message": "Invalid image index"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Team not found"
}
```

&nbsp;

---

## Player Endpoints

### 13. GET /api/v1/players

Description:

- Get all players from database

_Response (200 - OK)_

```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "fullName": "string",
      "primaryPosition": "string",
      "age": "integer",
      "shirtNumber": "integer",
      "thumbUrl": "string",
      "externalRef": "string",
      "teamId": "integer"
    }
  ]
}
```

&nbsp;

### 14. GET /api/v1/players/team/:id

Description:

- Get all players by team ID

Request:

- params:

```json
{
  "id": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "fullName": "string",
      "primaryPosition": "string",
      "age": "integer",
      "shirtNumber": "integer",
      "thumbUrl": "string",
      "externalRef": "string",
      "teamId": "integer",
      "Team": {
        "id": "integer",
        "name": "string",
        "logoUrl": "string",
        "League": {
          "id": "integer",
          "name": "string",
          "country": "string"
        }
      }
    }
  ]
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Invalid Team ID"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Team not found"
}
```

&nbsp;

---

## Match Endpoints

### 15. GET /api/v1/matches

Description:

- Get all matches with optional filtering and pagination

Request:

- query:

```json
{
  "status": "string (upcoming, finished, etc.)",
  "page[number]": "integer (default: 1)",
  "page[size]": "integer (default: 10, max: 50)"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "match_date": "date",
      "match_time": "string",
      "home_score": "integer",
      "away_score": "integer",
      "status": "string",
      "venue": "string",
      "match_preview": "string",
      "prediction": "string",
      "predicted_score_home": "integer",
      "predicted_score_away": "integer",
      "match_overview": "string",
      "tactical_analysis": "string",
          "statistics": [
      {
        "type": "string",
        "home": "string",
        "away": "string"
      },
      ...

    ],
      "HomeTeam": {
        "id": "integer",
        "name": "string",
        "logoUrl": "string"
      },
      "AwayTeam": {
        "id": "integer",
        "name": "string",
        "logoUrl": "string"
      },
      "League": {
        "id": "integer",
        "name": "string"
      }
    }
  ],
  "meta": {
    "page": "integer",
    "totalPages": "integer",
    "total": "integer",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  }
}
```

&nbsp;

### 16. GET /api/v1/matches/:id

Description:

- Get match by ID with complete match statistics

Request:

- params:

```json
{
  "id": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": {
    "id": "integer",
    "match_date": "date",
    "match_time": "string",
    "home_score": "integer",
    "away_score": "integer",
    "status": "string",
    "venue": "string",
    "match_preview": "string",
    "prediction": "string",
    "predicted_score_home": "integer",
    "predicted_score_away": "integer",
    "match_overview": "string",
    "tactical_analysis": "string",
    "statistics": [
      {
        "type": "string",
        "home": "string",
        "away": "string"
      },
      ...

    ],
    "HomeTeam": {
      "id": "integer",
      "name": "string",
      "logoUrl": "string",
      "country": "string"
    },
    "AwayTeam": {
      "id": "integer",
      "name": "string",
      "logoUrl": "string",
      "country": "string"
    },
    "League": {
      "id": "integer",
      "name": "string",
      "country": "string"
    }
  },
  "message": "Successfully retrieved match with ID {id}"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Invalid Match ID"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Match not found"
}
```

&nbsp;

### 17. GET /api/v1/matches/league/:id

Description:

- Get all matches by league ID with optional filtering and pagination

Request:

- params:

```json
{
  "id": "integer (required)"
}
```

- query:

```json
{
  "status": "string (upcoming, finished, all)",
  "date": "string (MM/DD/YYYY format)",
  "page[number]": "integer",
  "page[size]": "integer"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "match_date": "date",
      "match_time": "string",
      "home_score": "integer",
      "away_score": "integer",
      "status": "string",
      "venue": "string",
      "HomeTeam": {
        "id": "integer",
        "name": "string",
        "logoUrl": "string",
        "country": "string"
      },
      "AwayTeam": {
        "id": "integer",
        "name": "string",
        "logoUrl": "string",
        "country": "string"
      }
    }
  ],
  "meta": {
    "currentPage": "integer",
    "totalPages": "integer",
    "totalItems": "integer",
    "itemsPerPage": "integer",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Invalid League ID"
}
OR
{
  "message": "Invalid date format. Expected MM/DD/YYYY"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "League not found"
}
```

&nbsp;

### 18. POST /api/v1/matches/sync/:leagueId

Description:

- Synchronize matches with statistics from external API for a specific league (Admin only)
- Automatically fetches and stores match statistics in JSON format

Request:

- headers:

```json
{
  "Authorization": "Bearer token.token.token"
}
```

- params:

```json
{
  "leagueId": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": {
    "matchesAdded": "integer",
    "matchesUpdated": "integer",
    "errors": ["array of error messages"]
  },
  "message": "Successfully synchronized {count} matches with statistics"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Invalid League ID"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "League not found"
}
```

&nbsp;

### 19. PUT /api/v1/matches/analysis/:id

Description:

- Update match analysis (overview and tactical analysis) using AI with match statistics integration
- AI generates analysis based on actual match statistics data

Request:

- params:

```json
{
  "id": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "message": "Successfully updated match analysis with statistics integration"
}
OR
{
  "message": "Match analysis already exists, no update made or match is upcoming"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Match not found"
}
```

&nbsp;

### 20. PUT /api/v1/matches/preview/:id

Description:

- Update match preview and prediction using AI

Request:

- params:

```json
{
  "id": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "message": "Successfully updated match preview and prediction"
}
OR
{
  "message": "Match preview and prediction already exists, no update made or match is finished"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Match not found"
}
```

&nbsp;

---

## Favorite Endpoints

### 21. GET /api/v1/favorites

Description:

- Get all favorites for authenticated user

Request:

- headers:

```json
{
  "Authorization": "Bearer token.token.token"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "userId": "integer",
      "teamId": "integer",
      "Team": {
        "id": "integer",
        "name": "string",
        "logoUrl": "string",
        "country": "string",
        "foundedYear": "integer",
        "stadiumName": "string",
        "coach": "string"
      }
    }
  ]
}
```

&nbsp;

### 22. POST /api/v1/favorites/:teamId

Description:

- Add team to user's favorites

Request:

- headers:

```json
{
  "Authorization": "Bearer token.token.token"
}
```

- params:

```json
{
  "teamId": "integer (required)"
}
```

_Response (201 - Created)_

```json
{
  "success": true,
  "data": {
    "id": "integer",
    "userId": "integer",
    "teamId": "integer"
  }
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Team ID must be a positive number"
}
```

&nbsp;

### 23. DELETE /api/v1/favorites/:id

Description:

- Remove team from user's favorites

Request:

- headers:

```json
{
  "Authorization": "Bearer token.token.token"
}
```

- params:

```json
{
  "id": "integer (required)"
}
```

_Response (200 - OK)_

```json
{
  "success": true,
  "message": "Favorite with ID {id} has been removed"
}
```

_Response (400 - Bad Request)_

```json
{
  "message": "Favorite ID must be a positive number"
}
```

_Response (404 - Not Found)_

```json
{
  "message": "Favorite with ID {id} not found for this user"
}
```

&nbsp;

---

## System Endpoints

### 24. GET /

Description:

- Root endpoint providing API information

_Response (200 - OK)_

```json
{
  "success": true,
  "message": "Ninety Minutes API",
  "version": "1.0.0",
  "documentation": {
    "baseUrl": "/api/v1",
    "endpoints": {
      "leagues": "/api/v1/leagues",
      "teams": "/api/v1/teams",
      "players": "/api/v1/players",
      "matches": "/api/v1/matches"
    }
  }
}
```

&nbsp;

### 25. GET /health

Description:

- Health check endpoint

_Response (200 - OK)_

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "ISO string",
  "environment": "string"
}
```

&nbsp;

---

## Global Error Responses

_Response (401 - Unauthorized)_

```json
{
  "message": "Invalid token"
}
OR
{
  "message": "Access token is required"
}
```

_Response (403 - Forbidden)_

```json
{
  "message": "Admin access required"
}
```

_Response (404 - Not Found)_

```json
{
  "success": false,
  "message": "Route {method} {path} not found",
  "availableRoutes": ["array of available routes"]
}
```

_Response (500 - Internal Server Error)_

```json
{
  "message": "Internal server error"
}
```

&nbsp;

---

## Authentication & Authorization

### Headers Required:

- **Authorization**: `Bearer {access_token}` - Required for protected endpoints
- **Content-Type**: `application/json` - For JSON requests
- **Content-Type**: `multipart/form-data` - For file uploads

### Roles:

- **User**: Default role, access to basic endpoints
- **Admin**: Access to all endpoints including synchronization and management features

### Protected Endpoints:

- All `/favorites/*` endpoints require authentication
- All `/sync/*` endpoints require admin authentication
- Image upload/delete endpoints require admin authentication
- Match analysis/preview update endpoints are public but recommended for admin use

&nbsp;

---

## External API Integration

The system integrates with external football APIs to synchronize:

- League data
- Team information
- Player rosters
- Match schedules and results

### Synchronization Features:

- **Deduplication**: Prevents duplicate entries during sync
- **Bulk Operations**: Efficient batch processing
- **Error Handling**: Comprehensive error reporting
- **Update on Conflict**: Updates existing records with new data

&nbsp;

---

## AI Features

### Powered by Google Gemini 2.5 Flash Lite:

- **Team Descriptions**: Auto-generate professional team profiles
- **Match Previews**: AI-powered match analysis and predictions
- **Tactical Analysis**: Detailed match breakdowns
- **Score Predictions**: Realistic score forecasting

### AI Endpoints:

- `PATCH /api/v1/teams/generate-descriptions/:id`
- `PUT /api/v1/matches/preview/:id`
- `PUT /api/v1/matches/analysis/:id`

&nbsp;

---

## File Upload Features

### Image Management:

- **Cloudinary Integration**: Secure cloud storage
- **Multiple Uploads**: Up to 4 images per team
- **File Validation**: Image files only
- **Image Deletion**: Remove specific images by index

### Supported Formats:

- JPEG, PNG, GIF, WebP
- Maximum 4 images per team
- Automatic cloud optimization
