# Memory Optimization Plan for Vote System

## Identified Issues

1. **MongoDB Connection Management**: Unoptimized Mongoose connections
2. **Large Data Objects**: Complex schemas with unbounded arrays and mixed types
3. **Socket.IO Memory Leaks**: Improper cleanup of socket connections
4. **Missing Pagination**: Loading large datasets without limits
5. **Deep Population**: Excessive document population without field selection
6. **Memory Monitoring**: No memory usage tracking

## Optimization Steps

### 1. MongoDB Connection Optimization

```javascript
// In server/index.js - Update connectDB function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Add these options to optimize memory usage
      maxPoolSize: 10, // Limit connection pool size
      minPoolSize: 2,  // Maintain minimum connections
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      heartbeatFrequencyMS: 10000, // Heartbeat frequency
      autoIndex: false, // Disable automatic indexing in production
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log("Please make sure MongoDB is running.");
    process.exit(1);
  }
};
```

### 2. Add Memory Monitoring

```javascript
// Add to server/index.js
const memoryMonitoring = () => {
  const formatMemoryUsage = (data) => {
    return `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
  };

  const memoryData = process.memoryUsage();
  const memoryUsage = {
    rss: formatMemoryUsage(memoryData.rss), // Total memory allocated
    heapTotal: formatMemoryUsage(memoryData.heapTotal), // Total size of allocated heap
    heapUsed: formatMemoryUsage(memoryData.heapUsed), // Actual memory used
    external: formatMemoryUsage(memoryData.external), // Memory used by C++ objects
  };

  console.log('Memory usage:', memoryUsage);
};

// Run every 5 minutes
setInterval(memoryMonitoring, 5 * 60 * 1000);
```

### 3. Optimize Session Routes

#### Implement Pagination

```javascript
// In server/routes/session.js - Update GET / route
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await Session.find({})
      .populate("team", "name") // Only select needed fields
      .populate("createdBy", "username email") // Only select needed fields
      .skip(skip)
      .limit(limit)
      .lean() // Return plain objects instead of Mongoose documents
      .exec();

    const total = await Session.countDocuments({});

    res.status(200).json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch sessions");
  }
});
```

#### Optimize Population

```javascript
// In server/routes/session.js - Update GET /:sessionId route
router.get("/:sessionId", auth, async (req, res) => {
  try {
    const { fields } = req.query;
    if (!isValidObjectId(req.params.sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    
    // Create a projection object for field selection
    let projection = {};
    if (fields) {
      fields.split(',').forEach(field => {
        projection[field] = 1;
      });
    }
    
    const session = await Session.findById(req.params.sessionId, projection)
      .populate("team", "name leader") // Only select needed fields
      .populate("createdBy", "username email") // Only select needed fields
      .lean() // Return plain objects instead of Mongoose documents
      .exec();
      
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    res.status(200).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch session", error: err.message });
  }
});
```

### 4. Optimize Socket.IO

```javascript
// In server/index.js - Update Socket.IO implementation
io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  // Add these options to optimize memory usage
  pingTimeout: 60000, // Close connection after 60s of inactivity
  pingInterval: 25000, // Check connection every 25s
  connectTimeout: 10000, // Connection timeout
  maxHttpBufferSize: 1e6, // 1MB max buffer size
});

// Track connected users to clean up properly
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("authenticate", (userId) => {
    if (userId) {
      // Remove user from previous socket if exists
      const existingSocket = connectedUsers.get(userId);
      if (existingSocket && existingSocket !== socket.id) {
        socket.to(existingSocket).emit("force_disconnect");
        io.in(existingSocket).disconnectSockets(true);
      }
      
      // Join user room and track connection
      socket.join(userId.toString());
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} joined their room`);
    }
  });

  socket.on("disconnect", () => {
    // Clean up user tracking on disconnect
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});
```

### 5. Optimize Session Model

```javascript
// In server/models/Sessions.js - Add limits to arrays and optimize schema
const candidateSchema = new mongoose.Schema({
  // Existing fields...
  promises: [{ 
    type: String,
    maxlength: 1000 // Limit string length
  }],
}, { _id: false }); // Avoid creating IDs for subdocuments when not needed

const optionSchema = new mongoose.Schema({
  // Existing fields...
}, { _id: false }); // Avoid creating IDs for subdocuments when not needed

const sessionSchema = new mongoose.Schema({
  // Existing fields...
  
  // Add validators to limit array sizes
  candidates: {
    type: [candidateSchema],
    validate: [
      array => array.length <= 100,
      'Candidates array exceeds maximum allowed length of 100'
    ]
  },
  
  participants: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SessionParticipant",
    }],
    validate: [
      array => array.length <= 1000,
      'Participants array exceeds maximum allowed length of 1000'
    ]
  },
  
  // Use more specific types instead of Mixed when possible
  results: {
    lastBlockchainSync: { type: Date },
    blockchainVoterCount: { type: Number },
    // Add other specific fields instead of using Mixed type
  }
}, {
  timestamps: true, // Use built-in timestamps
  autoIndex: false, // Disable automatic indexing in production
});
```

### 6. Add Memory Leak Detection

Install the `heapdump` package to help identify memory leaks:

```bash
npm install heapdump --save-dev
```

Add to server/index.js:

```javascript
// Only in development environment
if (process.env.NODE_ENV === 'development') {
  const heapdump = require('heapdump');
  
  // Generate heap snapshot on SIGUSR2 signal
  process.on('SIGUSR2', () => {
    const filename = `${process.cwd()}/heapdump-${Date.now()}.heapsnapshot`;
    heapdump.writeSnapshot(filename, (err) => {
      if (err) console.error(err);
      else console.log(`Heap snapshot written to ${filename}`);
    });
  });
}
```

### 7. Implement Garbage Collection Hints

```javascript
// In server/routes/session.js - After heavy operations
router.post("/:sessionId/vote-counts", auth, async (req, res) => {
  try {
    // Existing code...
    
    await session.save();
    res.status(200).json({ 
      message: "Vote counts updated successfully", 
      source,
      voterCount
    });
    
    // Hint to garbage collector after heavy operation
    if (global.gc) {
      global.gc();
    }
  } catch (err) {
    // Error handling...
  }
});
```

To enable garbage collection hints, run Node with:

```bash
node --expose-gc index.js
```

## Implementation Priority

1. MongoDB Connection Optimization
2. Memory Monitoring
3. Pagination for Routes
4. Socket.IO Optimization
5. Session Model Optimization
6. Memory Leak Detection
7. Garbage Collection Hints
