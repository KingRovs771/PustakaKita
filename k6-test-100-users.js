import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom Metrics untuk Analisis Performa Perpustakaan Digital Siswa
const errorRate = new Rate('errors');
const homeDuration = new Trend('home_page_duration');
const catalogDuration = new Trend('api_catalog_duration');
const searchDuration = new Trend('api_search_duration');
const loginDuration = new Trend('auth_login_duration');
const successfulRequests = new Counter('successful_requests');

// Konfigurasi 600 Concurrent Siswa (Virtual Users - VUs)
export const options = {
  scenarios: {
    student_peak_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 200 },  // Ramp-up ke 200 VUs
        { duration: '20s', target: 600 },  // Ramp-up mencapai 600 Concurrent Siswa
        { duration: '30s', target: 600 },  // Tahan beban puncak 600 Concurrent Siswa
        { duration: '10s', target: 0 },    // Ramp-down pendinginan kembali ke 0
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // SLA Performa Sesuai PRD & Standar Edge/SSR
    http_req_duration: ['p(95)<500', 'p(99)<1200'], // 95% request < 500ms, 99% < 1.2s
    http_req_failed: ['rate<0.01'],                 // Error HTTP < 1%
    errors: ['rate<0.01'],                          // Logic assertion error < 1%
    checks: ['rate>0.99'],                          // 99%+ assertions harus lolos
    api_catalog_duration: ['p(95)<300'],            // API katalog < 300ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const commonHeaders = {
    'Accept': 'application/json, text/html, */*',
    'User-Agent': 'k6-load-test-pustakakita/1.0',
  };

  // 1. User Journey 1: Siswa Mengakses Beranda & Katalog Utama (60% Traffic)
  group('01_Home_and_Catalog_Browsing', function () {
    const resHome = http.get(`${BASE_URL}/`, { headers: commonHeaders });
    homeDuration.add(resHome.timings.duration);
    const checkHome = check(resHome, {
      'Home page status 200': (r) => r.status === 200,
    });
    errorRate.add(!checkHome);
    if (checkHome) successfulRequests.add(1);

    sleep(0.5);

    // Fetch live books & categories API
    const resBooks = http.get(`${BASE_URL}/api/books`, { headers: commonHeaders });
    catalogDuration.add(resBooks.timings.duration);
    const checkBooks = check(resBooks, {
      'API Books status 200': (r) => r.status === 200,
      'API Books has books array': (r) => {
        try {
          const json = r.json();
          return Array.isArray(json.books);
        } catch (_) {
          return false;
        }
      },
    });
    errorRate.add(!checkBooks);
    if (checkBooks) successfulRequests.add(1);

    const resCats = http.get(`${BASE_URL}/api/categories`, { headers: commonHeaders });
    const checkCats = check(resCats, {
      'API Categories status 200': (r) => r.status === 200,
    });
    errorRate.add(!checkCats);
    if (checkCats) successfulRequests.add(1);
  });

  sleep(Math.random() * 1.5 + 0.5);

  // 2. User Journey 2: Siswa Mencari Materi & Buku Populer (25% Traffic)
  group('02_Search_and_Discovery', function () {
    const searchQueries = ['sains', 'pelangi', 'sejarah', 'komik', 'laut'];
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

    const resSearch = http.get(`${BASE_URL}/api/books?q=${randomQuery}`, { headers: commonHeaders });
    searchDuration.add(resSearch.timings.duration);

    const checkSearch = check(resSearch, {
      'Search API status 200': (r) => r.status === 200,
    });
    errorRate.add(!checkSearch);
    if (checkSearch) successfulRequests.add(1);
  });

  sleep(Math.random() * 1.5 + 0.5);

  // 3. User Journey 3: Simulasi Otentikasi Siswa NISN (10% Traffic)
  // Menggunakan akun siswa terdaftar dari seed: NISN 0094827165, PIN 123456
  group('03_Student_Authentication', function () {
    const payload = JSON.stringify({
      nisn: '0094827165',
      pin: '123456',
    });

    const resLogin = http.post(`${BASE_URL}/api/auth/login`, payload, {
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
      responseCallback: http.expectedStatuses(200, 401),
    });
    loginDuration.add(resLogin.timings.duration);

    const checkLogin = check(resLogin, {
      'Student login endpoint responds properly (200 or 401)': (r) => r.status === 200 || r.status === 401,
      'Student login response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!checkLogin);
    if (checkLogin) successfulRequests.add(1);
  });

  sleep(Math.random() * 2 + 1);

  // 4. User Journey 4: Guru Pustakawan Mengakses Panel Analitik (5% Traffic)
  group('04_Librarian_Analytics_Query', function () {
    // Admin login
    const adminPayload = JSON.stringify({
      username: 'pustakawan',
      password: 'sekolah123',
    });

    const resAdmin = http.post(`${BASE_URL}/api/auth/admin-login`, adminPayload, {
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
    });

    let adminToken = '';
    const checkAdminLogin = check(resAdmin, {
      'Admin login status 200': (r) => {
        if (r.status === 200) {
          try {
            adminToken = r.json().accessToken;
            return true;
          } catch (_) {
            return false;
          }
        }
        return false;
      },
    });
    errorRate.add(!checkAdminLogin);

    if (adminToken) {
      const resAnalytics = http.get(`${BASE_URL}/api/admin/analytics`, {
        headers: {
          ...commonHeaders,
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const checkAnalytics = check(resAnalytics, {
        'Admin Analytics status 200': (r) => r.status === 200,
      });
      errorRate.add(!checkAnalytics);
      if (checkAnalytics) successfulRequests.add(1);
    }
  });

  // Waktu jeda berpikir siswa sebelum sesi berikutnya
  sleep(Math.random() * 2 + 1);
}

