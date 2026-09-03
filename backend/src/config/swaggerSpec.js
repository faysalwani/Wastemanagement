const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Waste Management & Resource Recovery API',
    version: '1.0.0',
    description:
      'REST API and Real-time Telematics Engine for M.Sc. AI & ML Major Project (NIELIT / NDU Srinagar).\nCandidate: Mohd Faisal Wani (NDU202500069)',
    contact: {
      name: 'Mohd Faisal Wani',
      email: 'faisal.wani@ecocycle.local',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development & Viva Defense Server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System Health Check',
        tags: ['System'],
        responses: {
          200: { description: 'API gateway operational' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate User & Obtain JWT Token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'citizen@ecocycle.local' },
                  password: { type: 'string', example: 'Citizen@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully with Bearer token' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/ai/classify': {
      post: {
        summary: 'Classify Waste Image via Deep Learning',
        tags: ['AI Classification'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Returns predicted category, confidence %, and recommendation' },
        },
      },
    },
    '/iot/telemetry': {
      post: {
        summary: 'Ingest ESP32 Smart-Bin Ultrasonic & Load-Cell Telemetry',
        tags: ['IoT Telematics'],
        parameters: [
          {
            name: 'X-Device-Token',
            in: 'header',
            required: false,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['binId', 'rawDistanceCm'],
                properties: {
                  binId: { type: 'string', example: 'BIN_SRG_01' },
                  rawDistanceCm: { type: 'number', example: 15 },
                  weightKg: { type: 'number', example: 38.5 },
                  temperatureC: { type: 'number', example: 21.0 },
                  batteryPercent: { type: 'number', example: 95 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Telemetry ingested and operational status updated' },
        },
      },
    },
    '/iot/bins': {
      get: {
        summary: 'List All Active Smart Bins Across Srinagar',
        tags: ['IoT Telematics'],
        responses: {
          200: { description: 'List of smart bins with fill % and coordinates' },
        },
      },
    },
    '/routes/optimize': {
      get: {
        summary: 'Generate TSP Route Optimization Manifest for Drivers',
        tags: ['Logistics & VRP'],
        responses: {
          200: { description: 'Ordered waypoints, distance reduction %, and fuel saved' },
        },
      },
    },
    '/tracking/update': {
      post: {
        summary: 'Driver Streams Live GPS & Triggers 500m Proximity Radar',
        tags: ['Logistics & VRP'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vehicleId', 'coordinates'],
                properties: {
                  vehicleId: { type: 'string', example: 'VEH_SRG_01' },
                  coordinates: {
                    type: 'array',
                    items: { type: 'number' },
                    example: [74.8215, 34.0672],
                  },
                  speedKmph: { type: 'number', example: 25 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Location breadcrumb processed and proximity alerts triggered' },
        },
      },
    },
    '/reports': {
      post: {
        summary: 'Citizen Submits Open-Dumping Complaint',
        tags: ['GIS Open-Dumping'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  wasteCategory: { type: 'string', example: 'MIXED_MUNICIPAL' },
                  severity: { type: 'string', example: 'HIGH' },
                  wardName: { type: 'string', example: 'Batamaloo' },
                  address: { type: 'string', example: 'Near Old Bus Stand' },
                  coordinates: { type: 'string', example: '[74.79, 34.07]' },
                  photo: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Report submitted and broadcast to municipal admins' },
        },
      },
    },
    '/reports/hotspots': {
      get: {
        summary: 'Spatial 250m Hotspot Clustering of Dumping Complaints',
        tags: ['GIS Open-Dumping'],
        responses: {
          200: { description: 'Spatial clusters with incident counts and centroids' },
        },
      },
    },
    '/exchange/listings': {
      get: {
        summary: 'Browse Circular P2P Resource Exchange Marketplace',
        tags: ['P2P Resource Exchange'],
        responses: {
          200: { description: 'List of available reusable resources' },
        },
      },
    },
    '/analytics/diversion': {
      get: {
        summary: 'Waste Diversion Metrics (Measured Data vs Citizen Estimates)',
        tags: ['Analytics & Gamification'],
        responses: {
          200: { description: 'Diversion rate %, total diverted kg, and source transparency' },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
