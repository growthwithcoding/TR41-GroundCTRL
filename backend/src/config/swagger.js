/**
 * Swagger/OpenAPI Configuration
 * Mission Control API Documentation
 */

const swaggerJSDoc = require('swagger-jsdoc');
const missionControl = require('./missionControl');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GroundCTRL Mission Control API',
      version: '1.0.0',
      description: `
## 🛰️ Mission Control Platform for Satellite Simulation

A production-ready Node.js/Express API with enterprise-grade security, Firebase integration, 
and aerospace-themed mission control interfaces.

### Mission Control Response Protocol

All API responses follow the Mission Control protocol with status codes:
- **GO** - Operation successful (2xx responses)
- **NO-GO** - Client error or rejected request (4xx responses)
- **HOLD** - Service temporarily unavailable (503, 504)
- **ABORT** - Critical system failure (5xx responses)

### Response Format

Every response includes:
- \`status\` - Mission control status (GO/NO-GO/HOLD/ABORT)
- \`code\` - HTTP status code
- \`brief\` - Mission control briefing message
- \`payload\` - Response data or error details
- \`telemetry\` - Mission timing and operator information
- \`timestamp\` - Unix timestamp

### Security Features

- 🔐 JWT Authentication (Access + Refresh tokens)
- 🚫 Token Blacklisting (immediate revocation)
- 🔒 Account Lockout (5 failed attempts = 15 min lockout)
- 🛡️ Rate Limiting (configurable per endpoint)
- 📝 Comprehensive Audit Logging
- 👤 Call Sign System (unique operator identification)
- 👔 Admin Role Management

### Mission Time

All timestamps use ISO 8601 format. Telemetry includes:
- \`missionTime\` - Current operation timestamp
- \`operatorCallSign\` - Authenticated operator identifier
- \`stationId\` - Ground station identifier (${missionControl.stationId})
- \`requestId\` - Unique request identifier (UUID)
      `.trim()
    },
    servers: [
      {
        url: 'http://localhost:{port}/api/v1',
        description: 'Development Server',
        variables: {
          port: {
            default: '3001',
            description: 'Server port (configured in .env)'
          }
        }
      }
      // Production Server (Coming Soon)
      // {
      //   url: 'https://missionctrl.org/api/v1',
      //   description: 'Production Server'
      // }
    ],
    tags: [
      {
        name: 'Health',
        description: 'System health and status monitoring'
      },
      {
        name: 'Authentication',
        description: 'Operator authentication and session management'
      },
      {
        name: 'Users',
        description: 'User management operations (requires authentication)'
      },
      {
        name: 'Satellites',
        description: 'Satellite operations (coming soon)'
      },
      {
        name: 'Scenarios',
        description: 'Mission scenario management (coming soon)'
      },
      {
        name: 'AI',
        description: 'AI-powered features (coming soon)'
      },
      {
        name: 'Commands',
        description: 'Command operations (coming soon)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token obtained from the login endpoint'
        }
      },
      schemas: {
        MissionControlResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['GO', 'NO-GO', 'HOLD', 'ABORT'],
              description: 'Mission control status indicator'
            },
            code: {
              type: 'integer',
              description: 'HTTP status code',
              example: 200
            },
            brief: {
              type: 'string',
              description: 'Mission control briefing message',
              example: 'Satellite uplink established. Telemetry nominal.'
            },
            payload: {
              type: 'object',
              description: 'Response data payload'
            },
            telemetry: {
              $ref: '#/components/schemas/Telemetry'
            },
            timestamp: {
              type: 'integer',
              description: 'Unix timestamp in milliseconds',
              example: 1704067200000
            }
          }
        },
        Telemetry: {
          type: 'object',
          properties: {
            missionTime: {
              type: 'string',
              format: 'date-time',
              description: 'Current operation timestamp (ISO 8601)',
              example: '2025-01-01T00:00:00.000Z'
            },
            operatorCallSign: {
              type: 'string',
              description: 'Authenticated operator call sign',
              example: 'APOLLO-11'
            },
            stationId: {
              type: 'string',
              description: 'Ground station identifier',
              example: 'GROUNDCTRL-01'
            },
            requestId: {
              type: 'string',
              format: 'uuid',
              description: 'Unique request identifier',
              example: '123e4567-e89b-12d3-a456-426614174000'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['NO-GO', 'ABORT'],
              description: 'Mission control error status'
            },
            code: {
              type: 'integer',
              description: 'HTTP error status code',
              example: 400
            },
            brief: {
              type: 'string',
              description: 'Mission control error briefing',
              example: 'Invalid trajectory parameters. Recalculate and retry.'
            },
            payload: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    code: {
                      type: 'string',
                      example: 'VALIDATION_ERROR'
                    },
                    message: {
                      type: 'string',
                      example: 'Invalid input parameters'
                    },
                    details: {
                      type: 'object',
                      nullable: true
                    }
                  }
                }
              }
            },
            telemetry: {
              $ref: '#/components/schemas/Telemetry'
            },
            timestamp: {
              type: 'integer',
              example: 1704067200000
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            uid: {
              type: 'string',
              description: 'Unique user identifier (Firebase UID)',
              example: 'abc123xyz456'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Operator email address',
              example: 'pilot@groundctrl.com'
            },
            callSign: {
              type: 'string',
              description: 'Unique operator call sign',
              example: 'APOLLO-11'
            },
            displayName: {
              type: 'string',
              description: 'Operator display name',
              example: 'Neil Armstrong'
            },
            isAdmin: {
              type: 'boolean',
              description: 'Admin privileges flag',
              example: false
            }
          }
        },
        Tokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (15 minute expiry)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token (7 day expiry)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'NO-GO - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'NO-GO',
                code: 401,
                brief: 'Ground station authorization required. Authentication failed.',
                payload: {
                  error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication token required',
                    details: null
                  }
                },
                telemetry: {
                  missionTime: '2025-01-01T00:00:00.000Z',
                  operatorCallSign: 'SYSTEM',
                  stationId: 'GROUNDCTRL-01',
                  requestId: '123e4567-e89b-12d3-a456-426614174000'
                },
                timestamp: 1704067200000
              }
            }
          }
        },
        ForbiddenError: {
          description: 'NO-GO - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'NO-GO',
                code: 403,
                brief: 'Clearance insufficient. Contact Mission Control for access.',
                payload: {
                  error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions for this operation',
                    details: null
                  }
                },
                telemetry: {
                  missionTime: '2025-01-01T00:00:00.000Z',
                  operatorCallSign: 'APOLLO-11',
                  stationId: 'GROUNDCTRL-01',
                  requestId: '123e4567-e89b-12d3-a456-426614174000'
                },
                timestamp: 1704067200000
              }
            }
          }
        },
        RateLimitError: {
          description: 'NO-GO - Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'NO-GO',
                code: 429,
                brief: 'Ground station capacity exceeded. Rate limiting engaged.',
                payload: {
                  error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests. Please try again later.',
                    details: null
                  }
                },
                telemetry: {
                  missionTime: '2025-01-01T00:00:00.000Z',
                  operatorCallSign: 'SYSTEM',
                  stationId: 'GROUNDCTRL-01',
                  requestId: '123e4567-e89b-12d3-a456-426614174000'
                },
                timestamp: 1704067200000
              }
            }
          }
        },
        ValidationError: {
          description: 'NO-GO - Invalid request data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                status: 'NO-GO',
                code: 422,
                brief: 'Payload validation failed. Check data integrity and format.',
                payload: {
                  error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: {
                      field: 'email',
                      message: 'Invalid email format'
                    }
                  }
                },
                telemetry: {
                  missionTime: '2025-01-01T00:00:00.000Z',
                  operatorCallSign: 'SYSTEM',
                  stationId: 'GROUNDCTRL-01',
                  requestId: '123e4567-e89b-12d3-a456-426614174000'
                },
                timestamp: 1704067200000
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
