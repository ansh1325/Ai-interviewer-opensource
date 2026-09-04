import { InterviewDomain, ExperienceLevel, InterviewerPersona, InterviewQuestion } from './types';

export interface DomainMeta {
  id: InterviewDomain;
  title: string;
  badge: string;
  description: string;
  iconName: string;
  topics: string[];
}

export const DOMAINS: DomainMeta[] = [
  {
    id: 'frontend',
    title: 'Frontend Engineering',
    badge: 'React / Next.js / Web Performance',
    description: 'Deep dive into React lifecycle, reconciliation, CSS layout engines, bundle optimization, Core Web Vitals, and browser mechanics.',
    iconName: 'Layout',
    topics: ['Virtual DOM & Reconciliation', 'Event Loop & Tasks', 'React 19 Server Components', 'Web Performance & CWV', 'State Management']
  },
  {
    id: 'backend',
    title: 'Backend & Distributed Systems',
    badge: 'Node / Go / Databases / APIs',
    description: 'Evaluate microservices, Edge functions vs Lambdas, database indexing, caching strategies, concurrency, and API contracts.',
    iconName: 'Server',
    topics: ['Event-Driven Architecture', 'SQL vs NoSQL & Indexing', 'Edge Runtime Isolation', 'Concurrency & Locks', 'Message Queues']
  },
  {
    id: 'fullstack',
    title: 'Fullstack Architecture',
    badge: 'End-to-End System Design',
    description: 'Holistic assessment covering frontend client architecture, edge gateways, data consistency, authentication, and DevOps.',
    iconName: 'Layers',
    topics: ['Fullstack Next.js/Edge', 'Auth & JWT vs Sessions', 'GraphQL & REST', 'Optimistic UI Updates', 'CI/CD & Monitoring']
  },
  {
    id: 'system_design',
    title: 'High-Level System Design',
    badge: 'Scalability & Reliability',
    description: 'Design large-scale distributed architectures: URL shortener, collaborative document editor, real-time messaging, and rate limiters.',
    iconName: 'Network',
    topics: ['Sharding & Replication', 'Rate Limiting Algorithms', 'WebSockets vs SSE', 'Cache Invalidation', 'Disaster Recovery']
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    badge: 'Coding & Complexity',
    description: 'Live interactive coding challenge focusing on optimal algorithmic time/space complexity, edge cases, and code structure.',
    iconName: 'Code2',
    topics: ['Two Pointers & Sliding Window', 'Trees & Graph Traversal', 'Dynamic Programming', 'LRU Cache Design', 'Heaps & Sorting']
  },
  {
    id: 'behavioral',
    title: 'Behavioral & Leadership (STAR)',
    badge: 'Conflict / Ownership / Impact',
    description: 'Structured behavioral assessment using the Situation-Task-Action-Result method to measure culture fit and leadership traits.',
    iconName: 'Users',
    topics: ['Conflict Resolution', 'Technical Debt Trade-offs', 'Delivering Under Deadlines', 'Mentorship & Culture', 'Failure & Retrospectives']
  }
];

export const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; experience: string; focus: string }[] = [
  { id: 'junior', label: 'Junior / Entry', experience: '0-2 YOE', focus: 'Foundations, curiosity, code syntax, willingness to learn' },
  { id: 'mid', label: 'Mid-Level', experience: '2-5 YOE', focus: 'Autonomy, clean code patterns, debugging, architectural tradeoffs' },
  { id: 'senior', label: 'Senior Engineer', experience: '5-8 YOE', focus: 'System scalability, proactive edge-case handling, best practices' },
  { id: 'staff', label: 'Staff / Principal', experience: '8+ YOE', focus: 'Cross-functional vision, org-wide standards, architectural design' }
];

export const PERSONAS: { id: InterviewerPersona; name: string; title: string; avatar: string; description: string; style: string }[] = [
  {
    id: 'mentor',
    name: 'Elena Rostova',
    title: 'Senior Staff Mentor',
    avatar: '👩‍🏫',
    description: 'Supportive, insightful, and curious. Helps nudge you if you get stuck while testing core understanding.',
    style: 'Encouraging, pedagogical, probing deeper on underlying mental models.'
  },
  {
    id: 'strict_tech_lead',
    name: 'Marcus Vance',
    title: 'Principal Systems Architect',
    avatar: '👨‍💼',
    description: 'Fast-paced and relentless on edge cases, race conditions, memory leaks, and performance constraints.',
    style: 'Direct, analytical, challenges assumptions and demands precise complexity analysis.'
  },
  {
    id: 'startup_founder',
    name: 'Aria Chen',
    title: 'Founder & CTO',
    avatar: '🚀',
    description: 'Focuses on pragmatic engineering, developer velocity, edge-case triage, and business impact.',
    style: 'Pragmatic, high energy, asks how decisions impact shipping velocity and users.'
  },
  {
    id: 'faang_bar_raiser',
    name: 'Dr. David Sterling',
    title: 'FAANG Bar Raiser',
    avatar: '🎯',
    description: 'Calibrated rigorously against top industry standards. Evaluates depth, structural rigor, and STAR alignment.',
    style: 'Structured, impartial, measures systematic depth and clear technical reasoning.'
  }
];

export const QUESTION_BANKS: Record<InterviewDomain, InterviewQuestion[]> = {
  frontend: [
    {
      id: 1,
      topic: 'React Rendering & Virtual DOM Mechanics',
      question: 'How does the React 19 reconciliation engine (Fiber) differ from traditional DOM manipulation? In particular, what causes unintended re-renders in a component tree, and how do you profile and eliminate them?',
      idealKeypoints: [
        'Virtual DOM reconciliation diffing algorithm O(n)',
        'Fiber tree structure with work-in-progress and current fibers',
        'State / props change triggering re-render of children',
        'useMemo / useCallback / memo caveats and object reference equality',
        'React DevTools Profiler flamegraphs and commit phase analysis'
      ]
    },
    {
      id: 2,
      topic: 'Browser Event Loop & Microtasks',
      question: 'Walk me through how JavaScript executes tasks on the browser event loop. Specifically, what is the precise order of execution between Synchronous code, Promise microtasks, requestAnimationFrame, and setTimeout/setInterval macrotasks? How does a long-running computation freeze UI rendering?',
      idealKeypoints: [
        'Call stack execution of synchronous code',
        'Microtask queue (Promises, queueMicrotask, MutationObserver) emptied after every task before next macrotask',
        'Rendering pipeline (style, layout, paint) and requestAnimationFrame',
        'Macrotask queue (setTimeout, I/O)',
        'UI freeze caused by blocking the main thread, solved via Web Workers or scheduler.yield()'
      ]
    },
    {
      id: 3,
      topic: 'Core Web Vitals & Real-World Performance',
      question: 'You are tasked with diagnosing a slow Next.js application where the LCP (Largest Contentful Paint) is 4.8 seconds and INP (Interaction to Next Paint) is 350ms. What actionable steps do you take to measure, isolate, and reduce both metrics to green thresholds?',
      idealKeypoints: [
        'LCP breakdown: TTFB, resource load delay, resource load time, element render delay',
        'Optimizations: next/image priority, preloading fonts, edge caching SSR/SSG HTML',
        'INP diagnosis: Long tasks (>50ms) blocking main thread during user input',
        'INP fixes: Debouncing/throttling, breaking tasks with requestIdleCallback or yield, removing heavy client JS'
      ]
    },
    {
      id: 4,
      topic: 'State Architecture & Client vs Server Components',
      question: 'With Next.js App Router and React Server Components (RSC), how do you draw the architectural boundary between Server Components and Client Components? When should state live in URL search params versus React Context versus server cache?',
      codePrompt: 'Write a custom React hook or component that safely synchronizes search parameters with an async debounced data fetcher.',
      starterCode: `// Implement a debounced search input that keeps URL params in sync
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function useSearchSync(debounceMs = 300) {
  // Your implementation here
}`,
      idealKeypoints: [
        'Server components for data fetching, zero bundle size, database access',
        'Client components for interactivity, hooks, browser APIs',
        'URL as source of truth for bookmarkable/shareable state (filters, search, pagination)',
        'Debounce technique avoiding excess router pushes and race conditions with AbortController'
      ]
    }
  ],

  backend: [
    {
      id: 1,
      topic: 'Edge Functions vs Serverless Containers',
      question: 'What are the core technical differences between running code on a V8 Edge isolate (like Cloudflare Workers or Vercel Edge) versus standard Node.js serverless containers (like AWS Lambda)? What are the constraints, cold start profiles, and database connection implications?',
      idealKeypoints: [
        'V8 Isolates share memory space securely, booting in <5ms with sub-megabyte overhead',
        'No Node.js native bindings (like fs, net sockets) unless supported via Web Standards',
        'Cold starts: 0-10ms for Edge vs 200-1500ms for Docker/Node containers',
        'Connection pooling issue: Edge functions cannot hold persistent TCP pools directly, requiring HTTP connection poolers (Neon, Supabase, Prisma Accelerate) or Hyperdrive'
      ]
    },
    {
      id: 2,
      topic: 'Database Indexing & Query Optimization',
      question: 'Suppose you have a PostgreSQL table with 50 million transaction records. Queries filtering by `user_id` and sorted by `created_at DESC` are timing out. Explain B-Tree composite indexing, explain the query plan (EXPLAIN ANALYZE), and how index order (user_id, created_at) matters.',
      idealKeypoints: [
        'Composite index order: (user_id, created_at DESC) allows index-only or index scan without separate in-memory sorting',
        'Equality column first, range/sort column second (Rule of Leftmost Prefix)',
        'EXPLAIN ANALYZE interpretation: Sequential Scan vs Bitmap Index Scan vs Index Scan',
        'Avoid functions on indexed columns (e.g. DATE(created_at)) which invalidate index lookups unless functional index created'
      ]
    },
    {
      id: 3,
      topic: 'Concurrency & Race Conditions',
      question: 'Two concurrent requests attempt to withdraw $100 from an account with a $150 balance at the exact same millisecond. How do you prevent a double-spend race condition at the database and application level? Compare optimistic concurrency control vs pessimistic locking (SELECT FOR UPDATE).',
      codePrompt: 'Write an atomic SQL query or pseudocode transaction demonstrating how to safely deduct balance.',
      starterCode: `// Implement a safe atomic deduction function
async function withdrawBalance(db, accountId, amount) {
  // Ensure race conditions cannot cause negative balances
}`,
      idealKeypoints: [
        'Pessimistic locking: SELECT balance FROM accounts WHERE id = ? FOR UPDATE; serializes transactions',
        'Optimistic locking: UPDATE accounts SET balance = balance - 100, version = version + 1 WHERE id = ? AND version = current_version',
        'Single atomic statement: UPDATE accounts SET balance = balance - 100 WHERE id = ? AND balance >= 100 RETURNING balance',
        'Isolation levels: Read Committed vs Repeatable Read vs Serializable'
      ]
    },
    {
      id: 4,
      topic: 'Idempotency & Message Delivery',
      question: 'In a distributed payments service, a webhook can be delivered multiple times due to network retries (At-Least-Once delivery). How do you design an end-to-end idempotent processing pipeline?',
      idealKeypoints: [
        'Unique Idempotency Key header generated by client/caller',
        'Atomic check-and-insert in an idempotency table/cache (Redis SETNX or DB unique constraint)',
        'Storing response payload so duplicated calls return exact cached result without re-processing',
        'Handling in-flight concurrent duplicate requests via distributed locks with TTL'
      ]
    }
  ],

  fullstack: [
    {
      id: 1,
      topic: 'Modern Fullstack Edge Architecture',
      question: 'Describe how you would design a modern fullstack web application that serves millions of global users with sub-100ms response times. How do you partition state between CDN Edge caches, Edge API middleware, and centralized persistent databases?',
      idealKeypoints: [
        'Static assets on global CDN edge with immutable hashing',
        'Edge middleware for geolocation routing, auth token verification, and A/B testing',
        'Read replicas or distributed edge databases (Cloudflare D1 / Turso / DynamoDB Global Tables)',
        'Stale-While-Revalidate (SWR) cache headers for instantaneous edge page delivery'
      ]
    },
    {
      id: 2,
      topic: 'Authentication & Session Security',
      question: 'Compare JWT stored in localStorage vs httpOnly Secure cookies vs Server-side sessions with Redis. What are the XSS and CSRF trade-offs of each, and how would you implement seamless token refresh without logging out active users?',
      idealKeypoints: [
        'localStorage is vulnerable to XSS theft of access tokens',
        'httpOnly SameSite=Lax/Strict Secure cookies prevent JS access, mitigating XSS token extraction',
        'CSRF protection: SameSite cookies, CSRF tokens or origin header verification',
        'Silent refresh pattern: Short-lived access token (15m) + rotating refresh token in secure cookie'
      ]
    },
    {
      id: 3,
      topic: 'Real-Time State Synchronization',
      question: 'You need to build a collaborative live dashboard where updates from multiple users reflect within 200ms. Compare WebSockets, Server-Sent Events (SSE), and Short/Long Polling. Which would you choose if the dashboard is 95% server-to-client updates, and why?',
      idealKeypoints: [
        'SSE (Server-Sent Events) is ideal for unidirectional server-to-client streaming over HTTP/2',
        'WebSockets overhead: Stateful TCP connections complicate horizontal scaling and edge function lifespans',
        'Reconnection resilience: SSE has built-in automatic reconnect and Last-Event-ID recovery',
        'Pub/Sub backing (Redis Pub/Sub or Kafka) to broadcast events across distributed server nodes'
      ]
    }
  ],

  system_design: [
    {
      id: 1,
      topic: 'Global URL Shortener (Bit.ly)',
      question: 'Design a scalable URL shortener system handling 100 million new URLs created per month and 10 billion clicks per month. Walk through your estimations, API design, hash/ID generation strategy (Base62 vs Snowflake vs counter), caching tier, and database schema.',
      idealKeypoints: [
        'Traffic estimations: ~4000 reads/sec, ~40 writes/sec (100:1 read-to-write ratio)',
        'Storage: 100M * 12 months * 500 bytes = ~600GB/year',
        'Base62 encoding (62^7 = ~3.5 trillion URLs) with distributed ID generator (Snowflake/Ticket Service) to prevent collisions',
        'Redis caching with LRU policy holding top 20% most active URLs answering 80% traffic',
        'HTTP 301 (Permanent) vs 302 (Temporary) for click analytics tracking'
      ]
    },
    {
      id: 2,
      topic: 'Distributed Rate Limiter',
      question: 'Design a distributed API rate limiter that restricts API tenants to 1,000 requests per minute across a cluster of 50 gateway nodes. Compare Token Bucket, Leaky Bucket, and Sliding Window Counter. How do you prevent race conditions when updating counts in Redis?',
      idealKeypoints: [
        'Token Bucket allows bursts while maintaining average rate',
        'Sliding Window Counter offers precision without high memory overhead of log entries',
        'Redis race condition prevention: Execute Redis Lua script (EVAL) or Redis pipelines for atomicity',
        'Local in-memory token buffering to reduce Redis network round-trips for high-throughput endpoints'
      ]
    },
    {
      id: 3,
      topic: 'Real-Time Notification Engine',
      question: 'Design an omni-channel notification platform (Push, SMS, Email, In-App) that handles 50 million notifications per day with priority queuing (e.g. OTP must arrive in <5s, marketing campaigns can queue for hours). Detail the queue architecture, dead-letter strategy, and user preference filtering.',
      idealKeypoints: [
        'Priority queues (Kafka topics or RabbitMQ priority queues: High, Normal, Batch)',
        'Worker pool pattern scaled dynamically via consumer lag metrics',
        'Dead-letter queues (DLQ) with exponential backoff and jitter for external provider outages',
        'User preference & deduplication cache to prevent spamming duplicate alerts'
      ]
    }
  ],

  dsa: [
    {
      id: 1,
      topic: 'Two Pointers / Sliding Window',
      question: 'Given an array of positive integers and a target sum S, find the minimal length of a contiguous subarray of which the sum is greater than or equal to S. If there is no such subarray, return 0. Explain your approach and achieve O(n) time and O(1) space.',
      codePrompt: 'Implement minSubArrayLen(target, nums) in JavaScript/TypeScript.',
      starterCode: `function minSubArrayLen(target: number, nums: number[]): number {
  // Two-pointer / sliding window approach
  let left = 0;
  let currentSum = 0;
  let minLength = Infinity;

  // Implement the sliding window logic
  
  return minLength === Infinity ? 0 : minLength;
}`,
      idealKeypoints: [
        'Expanding right pointer to grow window until sum >= target',
        'Shrinking left pointer while sum >= target to find minimal length',
        'Time complexity: O(n) because each element is visited at most twice',
        'Space complexity: O(1) auxiliary space'
      ]
    },
    {
      id: 2,
      topic: 'LRU Cache Implementation',
      question: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) `get(key)` and O(1) `put(key, value)`. Explain why a combination of a Hash Map and a Doubly Linked List is the optimal choice.',
      codePrompt: 'Implement the LRUCache class with get and put methods.',
      starterCode: `class DNode {
  key: number;
  val: number;
  prev: DNode | null = null;
  next: DNode | null = null;
  constructor(key: number, val: number) {
    this.key = key;
    this.val = val;
  }
}

class LRUCache {
  private capacity: number;
  private map: Map<number, DNode>;
  private head: DNode;
  private tail: DNode;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = new DNode(0, 0);
    this.tail = new DNode(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: number): number {
    // Return value and move node to head
    return -1;
  }

  put(key: number, value: number): void {
    // Add/update node and evict least recently used if exceeding capacity
  }
}`,
      idealKeypoints: [
        'HashMap provides O(1) lookup to DNode pointer',
        'Doubly linked list allows O(1) node removal and O(1) insertion at head',
        'Dummy head and tail nodes eliminate null pointer edge cases',
        'Eviction removes node at tail.prev and cleans up hashmap entry'
      ]
    }
  ],

  behavioral: [
    {
      id: 1,
      topic: 'Technical Disagreement & Influence',
      question: 'Tell me about a time you strongly disagreed with a senior colleague or tech lead on an architectural decision. How did you structure your argument, what data did you gather, and what was the ultimate resolution?',
      idealKeypoints: [
        'Situation: Context of the technical fork (e.g. GraphQL vs REST, Postgres vs DynamoDB)',
        'Task: Demonstrating mutual respect without backing down on technical risks',
        'Action: Prototyping a benchmark/POC, presenting quantitative data, active listening',
        'Result: Consensus reached, project shipped without regressions, learning preserved'
      ]
    },
    {
      id: 2,
      topic: 'High-Stakes Production Outage',
      question: 'Describe a situation where a critical bug or performance regression hit production. How did you stay calm, communicate with stakeholders, triage the root cause, and implement both an immediate hotfix and long-term preventative safeguards?',
      idealKeypoints: [
        'Situation: Incident severity (revenue/user impact, alerting trigger)',
        'Task: Fast mitigation over finding blame',
        'Action: Rollback vs feature flag disable, transparent status page updates, root cause analysis (5 Whys)',
        'Result: Blameless post-mortem, new automated integration test and synthetic alert added'
      ]
    }
  ]
};
