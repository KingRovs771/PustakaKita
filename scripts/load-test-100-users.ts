/**
 * Load Test Runner - Simulasi 600 Concurrent Siswa untuk Perpustakaan Digital Siswa
 * Dijalankan dengan: npx tsx scripts/load-test-100-users.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_USERS = Number(process.env.VUS || 600);
const DURATION_SECONDS = Number(process.env.DURATION || 30);

interface RequestResult {
  endpoint: string;
  label: string;
  durationMs: number;
  status: number;
  success: boolean;
  error?: string;
}

const results: RequestResult[] = [];
let isRunning = true;

const ENDPOINTS = [
  { path: '/', label: 'Halaman Beranda (GET /)', weight: 25, method: 'GET' },
  { path: '/library', label: 'Halaman Katalog (GET /library)', weight: 25, method: 'GET' },
  { path: '/api/books', label: 'API Katalog Buku (GET /api/books)', weight: 20, method: 'GET' },
  { path: '/api/categories', label: 'API Kategori (GET /api/categories)', weight: 10, method: 'GET' },
  { path: '/api/books?q=sains', label: 'API Pencarian (GET /api/books?q=...)', weight: 10, method: 'GET' },
  { path: '/api/auth/login', label: 'API Login Siswa (POST /api/auth/login)', weight: 10, method: 'POST' },
];

function pickRandomEndpoint() {
  const totalWeight = ENDPOINTS.reduce((acc, e) => acc + e.weight, 0);
  let random = Math.random() * totalWeight;
  for (const ep of ENDPOINTS) {
    if (random < ep.weight) return ep;
    random -= ep.weight;
  }
  return ENDPOINTS[0];
}

async function simulateSingleUser(userId: number) {
  // Stagger initial start over 5 seconds to simulate realistic ramp-up of 600 students
  await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 5000)));

  while (isRunning) {
    const target = pickRandomEndpoint();
    const url = `${BASE_URL}${target.path}`;
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: target.method,
        headers: {
          'Accept': 'application/json, text/html',
          'Content-Type': 'application/json',
          'User-Agent': `LoadTestRunner-Student-${userId}`,
        },
      };

      if (target.method === 'POST') {
        options.body = JSON.stringify({ nisn: '0094827165', pin: '123456' });
      }

      const res = await fetch(url, options);
      // Consume body to ensure complete HTTP transaction
      await res.arrayBuffer();

      const durationMs = performance.now() - start;
      const isOk =
        (res.status >= 200 && res.status < 400) ||
        (target.path === '/api/auth/login' && res.status === 401);

      results.push({
        endpoint: target.path,
        label: target.label,
        durationMs,
        status: res.status,
        success: isOk,
      });
    } catch (err: any) {
      const durationMs = performance.now() - start;
      results.push({
        endpoint: target.path,
        label: target.label,
        durationMs,
        status: 0,
        success: false,
        error: err?.message || 'Connection failed',
      });
    }

    // Realistic student think time between 500ms - 1500ms
    const thinkTime = Math.floor(Math.random() * 1000 + 500);
    await new Promise((resolve) => setTimeout(resolve, thinkTime));
  }
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`  PERPUSTAKAAN DIGITAL SISWA - ${CONCURRENT_USERS} CONCURRENT SISWA LOAD TEST`);
  console.log(`======================================================`);
  console.log(`Target URL         : ${BASE_URL}`);
  console.log(`Concurrent Siswa   : ${CONCURRENT_USERS} VUs`);
  console.log(`Durasi Pengujian   : ${DURATION_SECONDS} detik`);
  console.log(`Memulai simulasi beban...\n`);

  const startTime = Date.now();

  const userPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
    simulateSingleUser(i + 1)
  );

  const interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, DURATION_SECONDS - elapsed);
    process.stdout.write(`\r[Berjalan] Sisa waktu: ${remaining}s | Total Request: ${results.length}`);
  }, 1000);

  await new Promise((resolve) => setTimeout(resolve, DURATION_SECONDS * 1000));
  isRunning = false;
  clearInterval(interval);
  await Promise.all(userPromises);

  const totalTimeSeconds = (Date.now() - startTime) / 1000;
  const totalRequests = results.length;
  const successfulRequests = results.filter((r) => r.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const errorRatePct = totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(2) : '0';
  const rps = (totalRequests / totalTimeSeconds).toFixed(2);

  const durations = results.map((r) => r.durationMs);
  const avgDuration = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) : '0';
  const minDuration = durations.length > 0 ? Math.min(...durations).toFixed(2) : '0';
  const maxDuration = durations.length > 0 ? Math.max(...durations).toFixed(2) : '0';
  const p50 = calculatePercentile(durations, 50).toFixed(2);
  const p90 = calculatePercentile(durations, 90).toFixed(2);
  const p95 = calculatePercentile(durations, 95).toFixed(2);
  const p99 = calculatePercentile(durations, 99).toFixed(2);

  console.log(`\n\n======================================================`);
  console.log(`  HASIL RINGKASAN PERFORMA (${CONCURRENT_USERS} CONCURRENT SISWA)`);
  console.log(`======================================================`);
  console.log(`Total Durasi Aktual    : ${totalTimeSeconds.toFixed(1)} detik`);
  console.log(`Total Requests Selesai : ${totalRequests}`);
  console.log(`Throughput             : ${rps} req/detik (RPS)`);
  console.log(`Tingkat Keberhasilan   : ${successfulRequests}/${totalRequests} (${(100 - Number(errorRatePct)).toFixed(2)}%)`);
  console.log(`Tingkat Kegagalan      : ${failedRequests} (${errorRatePct}%)`);
  console.log(`------------------------------------------------------`);
  console.log(`LATENSI RESPON WAKTU KESELURUHAN:`);
  console.log(`  Min      : ${minDuration} ms`);
  console.log(`  Median   : ${p50} ms`);
  console.log(`  Rata-rata: ${avgDuration} ms`);
  console.log(`  p(90)    : ${p90} ms`);
  console.log(`  p(95)    : ${p95} ms`);
  console.log(`  p(99)    : ${p99} ms`);
  console.log(`  Max      : ${maxDuration} ms`);
  console.log(`------------------------------------------------------`);
  console.log(`RINCIAN PER ENDPOINT:`);

  for (const ep of ENDPOINTS) {
    const epResults = results.filter((r) => r.endpoint === ep.path);
    const epDurations = epResults.map((r) => r.durationMs);
    const epSuccess = epResults.filter((r) => r.success).length;
    const epAvg = epDurations.length > 0 ? (epDurations.reduce((a, b) => a + b, 0) / epDurations.length).toFixed(2) : '0';
    const epP50 = calculatePercentile(epDurations, 50).toFixed(2);
    const epP90 = calculatePercentile(epDurations, 90).toFixed(2);
    const epP95 = calculatePercentile(epDurations, 95).toFixed(2);
    console.log(
      `  * ${ep.label} -> Total: ${epResults.length} | Sukses: ${epSuccess}/${epResults.length} | Avg: ${epAvg}ms | p50: ${epP50}ms | p90: ${epP90}ms | p95: ${epP95}ms`
    );
  }
  console.log(`======================================================\n`);
}

run().catch(console.error);
