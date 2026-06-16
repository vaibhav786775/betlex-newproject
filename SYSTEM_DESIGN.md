# BeetleX System Design Specification

This document details the production-ready system design and scaling strategies for the BeetleX Hackathon Platform.

---

## Q1: Real-Time Leaderboard at Scale

### 1. Architecture & Aggregate Score Computation
To handle 5,000+ simultaneous read requests while 20 judges actively update scores, we use an **On-Write Cache Aggregation** strategy with a write-through fallback to a **Materialized View**.
* **Why not compute on read?** Doing `AVG` aggregations and multi-table joins on every read under load will saturate database CPU and exhaust the connection pool.
* **Why not standard Materialized Views?** Materialized views in PostgreSQL require manual refresh (`REFRESH MATERIALIZED VIEW`), which locks the view unless using `CONCURRENTLY` (which requires a unique index and introduces lag/overhead).
* **Selected Solution:** When a judge submits/updates a score, we write to the `scores` table and concurrently publish the update to an asynchronous queue (BullMQ/Redis). A worker consumes the event and computes the new aggregate leaderboard row. The result is pushed to a **Redis Sorted Set (ZSET)** named `leaderboard:{eventId}`. Ranks and scores are fetched from Redis in $O(\log N + M)$ time.

### 2. Caching Strategy
* **Cache Storage:** Redis Sorted Set (`ZSET`) where the `score` is the aggregate score of the project, and the `member` is the `projectId`.
* **Tie Breaking:** To break ties where aggregate scores are equal, we store the score as a composite float: `score_integer.timestamp_offset`. The decimal part is computed as `1.0 - (submittedAt_timestamp / 1e10)`, ensuring that earlier submissions yield a higher floating-point value.
* **TTL:** No TTL is set on the ZSET since it represents the source of truth for the active leaderboard. Instead, it is updated incrementally.
* **Invalidation:** When a judge updates a score, the backend recalculates the project's aggregate total, updates the database, and performs a `ZADD leaderboard:{eventId} CH <new_composite_score> <projectId>` to update the cache in place ($O(\log N)$).

### 3. Critical Database Indexes
```sql
-- Index to quickly filter submitted projects for an event
CREATE INDEX idx_projects_event_submitted 
ON projects (event_id) 
WHERE status = 'submitted';

-- Index to fetch scores for projects quickly
CREATE INDEX idx_scores_project_judge 
ON scores (project_id, judge_id);
```

### 4. Real-time Push (No Polling)
* We use **Server-Sent Events (SSE)** mounted at `/api/events/:id/leaderboard/live`.
* When a score updates, the worker pushes the new rank list to a Redis Pub/Sub channel `event:{eventId}:leaderboard`.
* The API instances subscribe to the Redis channel and stream JSON updates down to the clients, preventing database reads on updates.

### 5. Tradeoffs
* **Pros:** Read latency is $<2\text{ms}$ (Redis memory read); database is completely shielded from read spikes.
* **Cons:** Eventual consistency of a few milliseconds between score write and leaderboard read due to asynchronous queue processing.

---

## Q2: 50,000 Registrations in One Day

### 1. Database-Level Duplicate Prevention
The database table `registrations` enforces a composite unique constraint:
```sql
ALTER TABLE registrations ADD CONSTRAINT unique_event_user UNIQUE (event_id, user_id);
```
If a user attempts to double-register, PostgreSQL raises a unique key violation (`error code 23505`). The application catches this database exception and returns a `409 Conflict` response to the user.

### 2. Rate Limiting Strategy
Rate limits are applied at the API gateway layer (Nginx or Cloudflare) to prevent resource starvation:
* **IP-based Limit:** 100 requests per 15 minutes globally.
* **Endpoint-specific Limit (Register/Login):** 10 requests per minute per IP using a Redis Token Bucket algorithm.
* **Event-specific Limit:** Limit total registrations matching a specific `event_id` to block bulk script registration attacks.

### 3. Direct DB Writes vs Message Queue
* **Up to 50,000 registrations/day:** Translates to an average of $<1$ write per second, peaking at maybe $100$ writes/sec. PostgreSQL can easily handle up to $10,000$ writes/sec directly on basic instances. Thus, **direct database writes** are preferred to avoid infrastructure complexity.
* **When to queue?** If peaks exceed $2,000$ registrations/second (e.g. ticket drops), we buffer writes using a message broker (RabbitMQ/Kafka) to decouple registration intake from database transactions.

### 4. Connection Pool & PostgreSQL Configuration
For sustained write loads, we size the connection pool using the formula:
$$\text{Max Connections} = ((\text{Core Count} \times 2) + \text{Spindle Count})$$
* **PgBouncer:** Configured in `transaction` pooling mode to share connections among multiple lightweight Node.js instances.
* **PostgreSQL settings:**
  * `shared_buffers`: 25% of total system RAM.
  * `synchronous_commit`: Set to `off` if slight data loss on crash is acceptable (greatly increases write throughput by not waiting for disk flush).
  * `work_mem`: 16MB.

### 5. Tradeoffs
* Direct writes keep the API synchronous, giving registrants instant confirmation, but make the database vulnerable to connection exhaustion during massive unexpected spikes.

---

## Q3: Pitch Deck Upload Pipeline

### 1. Direct-to-S3 Presigned URL Flow vs Server-side Multipart
* **Direct-to-S3 Presigned URLs** are chosen.
* **Why?** Uploading a 10MB PDF through the application server consumes memory buffers and disk I/O, blocking the single-threaded Node.js event loop during slow network uploads from users. Direct S3 uploads bypass our servers completely.

### 2. Multi-Layer Validation
* **Client Side:** HTML5 `<input type="file" accept="application/pdf">` checks size ($<10\text{MB}$) before initiating the upload.
* **API Server:** When requesting a presigned URL, the server validates:
  * `Content-Type` header must be `application/pdf`.
  * `Content-Length` matches the limit.
  * S3 policy enforces `content-length-range` minimum $1$, maximum $10485760$ (10MB).

### 3. Data Storage Mapping
* **PostgreSQL:** Stores metadata: `file_name`, `s3_key`, `file_size`, and the association `deck_url` inside the `projects` table.
* **S3 Object Storage:** Stores the physical PDF file under `s3://beetlex-decks/{eventId}/{teamId}.pdf`.

### 4. Failed/Partial Uploads Handling
* **Lifecycle Policy:** S3 bucket is configured with a Lifecycle Rule to abort and clean up incomplete multipart uploads after 24 hours.
* **UI Feedback:** The frontend uses Tus-like chunked uploading or listens to S3 progress events. On failure, it prompts the user to resume or retry. The database record is only updated once the client calls the backend's `/project/deck/confirm` callback confirming success.

### 5. Malware & Antivirus Scanning
* **Flow:** S3 triggers an AWS Lambda function via S3 Event Notifications upon file upload. The Lambda runs **ClamAV** on the uploaded file.
* **Execution:** Non-blocking. The upload returns immediately to keep the UI fast. The file metadata is flagged as `pending_scan`. If malware is detected, the Lambda deletes the file and updates PostgreSQL to set status to `infected`, triggering an alert.

---

## Q4: Announcement Delivery Under Load

### 1. Message Broker Choice
We use **Redis Pub/Sub** coupled with **SSE (Server-Sent Events)**.
* **Why?** Announcements are ephemeral, real-time broadcasts. Kafka is overkill since we do not need disk-backed historical offset replays for notifications. BullMQ is designed for job processing, not active stream fan-outs. Redis Pub/Sub has sub-millisecond delivery latency and minimal memory overhead.

### 2. Fan-out Without Blocking API
* API servers maintain open HTTP connections with clients for SSE.
* A dedicated cluster of lightweight Node.js SSE workers (independent of the core REST API instances) handles connection states.
* When an announcement is published, it is published to Redis Pub/Sub. Each SSE worker node receives the message once and loops over its local memory-set of active user connections to write the payload to the response streams.

### 3. Offline Delivery Guarantees
* When a client connects to SSE, they send their last received notification timestamp (`Last-Event-ID` header).
* The SSE worker checks PostgreSQL or a Redis List containing the last 50 announcements for that event and backfills any missed messages.

### 4. Read/Unread State Write-Storm Mitigation
* Instead of inserting a database row for every user-read event simultaneously, we store read flags in a **Redis Bitmap** per user/event using `SETBIT announcement:read:{userId} {announcementOffset} 1`.
* A background cron worker periodically flushes these bitmaps to PostgreSQL `announcement_reads` in bulk batches.

---

## Q5: Race Conditions in Team Operations

### 1. Pessimistic Locking Choice
* We use **Pessimistic Locking (`SELECT ... FOR UPDATE`)** for team-joining operations.
* **Why not Optimistic?** In high-concurrency event registration where many users compete for a single spot, optimistic locking will cause a high rate of retries and transaction failures, worsening database load. Locking the `Team` row ensures that only one request can modify the membership at a time.

### 2. Atomic Verification SQL / Prisma Code
```typescript
await prisma.$transaction(async (tx) => {
  // Lock the team row to prevent concurrent reads/updates
  const team = await tx.$queryRaw<Team[]>`
    SELECT * FROM teams 
    WHERE id = ${teamId} 
    FOR UPDATE
  `;

  const memberCount = await tx.teamMember.count({
    where: { teamId }
  });

  if (memberCount >= team[0].maxTeamSize) {
    throw new AppError("Team is full", 400, "TEAM_FULL");
  }

  // Insert member
  await tx.teamMember.create({
    data: { teamId, userId, role: 'member' }
  });
});
```

### 3. Error Responses
* **HTTP Status:** `409 Conflict` (or `400 Bad Request` if strictly business logic).
* **Code:** `TEAM_FULL`.
* **User Message:** "This team has already reached its maximum member limit."

### 4. Same approach for Max Registrations?
* **Yes, but with different lock targets:** Locking a single event row for registrations (`SELECT * FROM events WHERE id = :id FOR UPDATE`) under a massive registration spike will bottleneck all registrants.
* **Different Solution:** Instead of row locks, we use a Redis Counter: `INCRBY event:registrations:{eventId} 1`. If the incremented value exceeds the limit, we immediately return a failure, avoiding any DB locks. A background queue syncs registrations to the DB.

### 5. Concurrency Test Strategy
We write a test script using `Promise.all` sending 10 concurrent requests to join a team with only 1 spot left:
```typescript
const joinRequests = Array.from({ length: 10 }).map(() => 
  request(app)
    .post("/api/teams/join")
    .set("Authorization", `Bearer ${getRandomUserToken()}`)
    .send({ inviteCode })
);

const results = await Promise.all(joinRequests);
const successCount = results.filter(r => r.status === 200).length;
const failCount = results.filter(r => r.status === 409 || r.status === 400).length;

expect(successCount).toBe(1);
expect(failCount).toBe(9);
```
