import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const createTrend = new Trend('create_todo_duration', true);
const listTrend = new Trend('list_todos_duration', true);
const getTrend = new Trend('get_todo_duration', true);
const updateTrend = new Trend('update_todo_duration', true);
const deleteTrend = new Trend('delete_todo_duration', true);
const searchTrend = new Trend('search_todos_duration', true);
const totalReqs = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '30s', target: 5 },  // warm-up
    { duration: '1m', target: 20 },  // normal load
    { duration: '30s', target: 50 },  // ramp to peak
    { duration: '2m', target: 50 },  // sustained peak
    { duration: '30s', target: 0 },  // cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
    create_todo_duration: ['p(95)<700'],
    list_todos_duration: ['p(95)<400'],
    get_todo_duration: ['p(95)<300'],
    update_todo_duration: ['p(95)<700'],
    delete_todo_duration: ['p(95)<500'],
    search_todos_duration: ['p(95)<400'],
    error_rate: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

function track(res, trend, expectStatus = 200) {
  const ok = res.status === expectStatus;
  errorRate.add(!ok);
  trend.add(res.timings.duration);
  totalReqs.add(1);
  return ok;
}

function randomTitle() {
  return `Task-${__VU}-${__ITER}-${Date.now()}`;
}

export function setup() {
  const res = http.get(`${BASE_URL}/`);
  if (res.status !== 200) {
    throw new Error(`Server not reachable at ${BASE_URL} (got ${res.status})`);
  }
  console.log(`Server reachable at ${BASE_URL}`);
  return { baseUrl: BASE_URL };
}

export default function() {
  group('GET /', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      'root 200': (r) => r.status === 200,
      'root welcome message': (r) => r.json('message') !== undefined,
    });
    errorRate.add(res.status !== 200);
    totalReqs.add(1);
  });

  sleep(0.3);

  group('GET /todos', () => {
    const res = http.get(`${BASE_URL}/todos?limit=10&skip=0`);
    check(res, {
      'list 200': (r) => r.status === 200,
      'list array body': (r) => Array.isArray(r.json()),
    });
    track(res, listTrend, 200);
  });

  sleep(0.2);

  group('GET /todos (page 2)', () => {
    const res = http.get(`${BASE_URL}/todos?limit=10&skip=10`);
    check(res, {
      'page2 200': (r) => r.status === 200,
      'page2 is array': (r) => Array.isArray(r.json()),
    });
    track(res, listTrend, 200);
  });

  sleep(0.2);

  let todoId = null;

  group('POST /todos', () => {
    const payload = JSON.stringify({
      title: randomTitle(),
      description: `Performance test todo from VU ${__VU}`,
      status: 'pending',
    });
    const res = http.post(`${BASE_URL}/todos`, payload, { headers: JSON_HEADERS });
    const ok = check(res, {
      'create 201': (r) => r.status === 201,
      'create has id': (r) => r.json('id') !== undefined,
      'create has title': (r) => r.json('title') !== undefined,
      'create status': (r) => r.json('status') === 'pending',
    });
    track(res, createTrend, 201);
    if (ok) todoId = res.json('id');
  });

  sleep(0.2);

  if (todoId !== null) {
    group('GET /todos/:id', () => {
      const res = http.get(`${BASE_URL}/todos/${todoId}`);
      check(res, {
        'get 200': (r) => r.status === 200,
        'get correct id': (r) => r.json('id') === todoId,
      });
      track(res, getTrend, 200);
    });

    sleep(0.2);

    group('PUT /todos/:id (in-progress)', () => {
      const payload = JSON.stringify({ status: 'in-progress' });
      const res = http.put(`${BASE_URL}/todos/${todoId}`, payload, { headers: JSON_HEADERS });
      check(res, {
        'update 200': (r) => r.status === 200,
        'update status changed': (r) => r.json('status') === 'in-progress',
      });
      track(res, updateTrend, 200);
    });

    sleep(0.2);

    group('PUT /todos/:id (title+desc)', () => {
      const payload = JSON.stringify({
        title: `Updated-${randomTitle()}`,
        description: 'Updated during load test',
      });
      const res = http.put(`${BASE_URL}/todos/${todoId}`, payload, { headers: JSON_HEADERS });
      check(res, {
        'full-update 200': (r) => r.status === 200,
      });
      track(res, updateTrend, 200);
    });

    sleep(0.2);

    group('PUT /todos/:id (completed)', () => {
      const payload = JSON.stringify({ status: 'completed' });
      const res = http.put(`${BASE_URL}/todos/${todoId}`, payload, { headers: JSON_HEADERS });
      check(res, {
        'complete 200': (r) => r.status === 200,
        'complete status correct': (r) => r.json('status') === 'completed',
      });
      track(res, updateTrend, 200);
    });

    sleep(0.2);

    group('DELETE /todos/:id', () => {
      const res = http.del(`${BASE_URL}/todos/${todoId}`);
      check(res, {
        'delete 200': (r) => r.status === 200,
        'delete detail field': (r) => r.json('detail') !== undefined,
      });
      track(res, deleteTrend, 200);
    });

    sleep(0.2);

    group('GET /todos/:id (post-delete)', () => {
      const res = http.get(`${BASE_URL}/todos/${todoId}`);
      check(res, {
        'gone 404': (r) => r.status === 404,
      });
      errorRate.add(res.status !== 404);
      totalReqs.add(1);
    });

    sleep(0.2);
  }

  group('GET /todos/search/all (no query)', () => {
    const res = http.get(`${BASE_URL}/todos/search/all`);
    check(res, {
      'search-all 200': (r) => r.status === 200,
      'search-all array': (r) => Array.isArray(r.json()),
    });
    track(res, searchTrend, 200);
  });

  sleep(0.2);

  group('GET /todos/search/all?q=Task', () => {
    const res = http.get(`${BASE_URL}/todos/search/all?q=Task`);
    check(res, {
      'search-query 200': (r) => r.status === 200,
      'search-query array': (r) => Array.isArray(r.json()),
    });
    track(res, searchTrend, 200);
  });

  sleep(0.2);

  group('POST /todos (missing title)', () => {
    const res = http.post(
      `${BASE_URL}/todos`,
      JSON.stringify({ description: 'no title here' }),
      { headers: JSON_HEADERS },
    );
    check(res, {
      'validation 422': (r) => r.status === 422,
      'validation detail field': (r) => r.json('detail') !== undefined,
    });
    errorRate.add(res.status !== 422);
    totalReqs.add(1);
  });

  sleep(0.2);

  group('GET /todos/:id (not found)', () => {
    const res = http.get(`${BASE_URL}/todos/999999999`);
    check(res, {
      'not-found 404': (r) => r.status === 404,
      'not-found detail field': (r) => r.json('detail') !== undefined,
    });
    errorRate.add(res.status !== 404);
    totalReqs.add(1);
  });

  sleep(Math.random() * 1.5 + 0.5);
}

export function teardown() {
  console.log('Performance test finished.');
}
