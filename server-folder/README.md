# Football League API

A RESTful API for managing football league data, including leagues, teams, players, and matches.

## 🚀 Features

- **League Management**: Get all leagues, sync with external API
- **Team Management**: Get teams by league, sync team data and images
- **Player Management**: Get players by team, sync player data
- **Match Management**: Get matches by league, sync match results
- **External API Integration**: Sync data from external football API
- **Comprehensive Error Handling**: Structured error responses
- **Input Validation**: Request validation middleware
- **Logging**: Request and response logging

## 📁 Project Structure

```
server-folder/
├── app.js                          # Main application entry point
├── package.json                    # Dependencies and scripts
├── config/
│   └── config.json                 # Database configuration
├── controllers/                    # Request handlers organized by domain
│   ├── leagues/
│   │   └── leagueController.js
│   ├── teams/
│   │   └── teamController.js
│   ├── players/
│   │   └── playerController.js
│   └── matches/
│       └── matchController.js
├── helpers/                        # Utility functions
│   ├── http.js                     # HTTP client for external APIs
│   ├── responseHelper.js           # Standardized API responses
│   └── validationHelper.js         # Input validation utilities
├── middlewares/                    # Express middlewares
│   ├── errorHandling.js            # Global error handling
│   ├── logging/
│   │   └── loggingMiddleware.js    # Request logging
│   └── validation/
│       └── validationMiddleware.js  # Input validation
├── migrations/                     # Sequelize database migrations
├── models/                         # Sequelize data models
├── routes/                         # API route definitions
│   ├── index.js                    # Main route aggregator
│   ├── leagueRoutes.js
│   ├── teamRoutes.js
│   ├── playerRoutes.js
│   └── matchRoutes.js
├── seeders/                        # Database seeders
└── services/                       # Business logic layer
    ├── leagueService.js
    ├── teamService.js
    ├── playerService.js
    └── matchService.js
```

## 🛠️ Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for database operations
- **PostgreSQL** - Database
- **Axios** - HTTP client for external API calls
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📡 API Endpoints

### Base URL: `http://localhost:3000/api/v1`

### Health Check

- **GET** `/health` - Server health status

### Leagues

- **GET** `/leagues` - Get all leagues
- **POST** `/leagues/sync` - Sync leagues from external API

### Teams

- **GET** `/teams` - Get all teams
- **GET** `/teams/:leagueId` - Get teams by league
- **POST** `/teams/sync/:leagueId` - Sync teams for a league
- **GET** `/teams/:teamId/details` - Get team details
- **GET** `/teams/:teamId/images` - Get team images
- **POST** `/teams/:teamId/images/sync` - Sync team images

### Players

- **GET** `/players` - Get all players
- **GET** `/players/:teamId` - Get players by team
- **POST** `/players/sync/:teamId` - Sync players for a team

### Matches

- **GET** `/matches/:leagueId` - Get matches by league
- **POST** `/matches/sync/:leagueId` - Sync matches for a league

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd server-folder
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   PORT=3000
   CORS_ORIGIN=*
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   EXTERNAL_API_URL=your_external_api_url
   EXTERNAL_API_KEY=your_api_key
   ```

4. **Run database migrations**

   ```bash
   npx sequelize-cli db:migrate
   ```

5. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📋 API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "meta": { ... } // Optional pagination info
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ] // Optional validation errors
}
```

## 🔧 Development

### Code Organization

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and external API calls
- **Models**: Define database schemas and relationships
- **Middlewares**: Handle cross-cutting concerns
- **Helpers**: Provide utility functions
- **Routes**: Define API endpoints and middleware usage

### Error Handling

The application uses a centralized error handling system:

- Custom error classes for different error types
- Structured error responses with appropriate HTTP status codes
- Comprehensive logging for debugging

### Validation

Input validation is handled by:

- Custom validation middleware
- Validation helper functions
- Model-level validation rules

## 🧪 Testing

```bash
# Run tests (if available)
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Environment Variables

| Variable           | Description           | Default       |
| ------------------ | --------------------- | ------------- |
| `NODE_ENV`         | Environment mode      | `development` |
| `PORT`             | Server port           | `3000`        |
| `CORS_ORIGIN`      | CORS allowed origins  | `*`           |
| `DB_HOST`          | Database host         | `localhost`   |
| `DB_PORT`          | Database port         | `5432`        |
| `DB_NAME`          | Database name         | -             |
| `DB_USERNAME`      | Database username     | -             |
| `DB_PASSWORD`      | Database password     | -             |
| `EXTERNAL_API_URL` | External API base URL | -             |
| `EXTERNAL_API_KEY` | External API key      | -             |

## 🚀 Deployment

1. Set production environment variables
2. Run database migrations in production
3. Start the application with PM2 or similar process manager
4. Set up reverse proxy (nginx) if needed
5. Configure SSL certificates

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Issues

Report issues and bugs on the project's issue tracker.

## 📞 Support

For support and questions, please contact the development team.
