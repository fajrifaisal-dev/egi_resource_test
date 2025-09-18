1. Anda diminta merancang sistem backend untuk aplikasi e-commerce yang mendukung 10.000 pengguna bersamaan. Sistem ini terdiri dari beberapa layanan: API Gateway, User Service, Product Service, dan Order Service, semuanya berjalan secara independen. Jelaskan :
- a. Bagaimana Anda akan menerapkan load balancing secara efisien antar instance layanan?
- b. Bagaimana Anda akan mengelola session state secara terdistribusi tanpa menggunakan session pada server?
- c. Jelaskan dengan rinci bagaimana Anda bisa menggunakan caching (misalnya Redis) untuk meminimalkan beban ke database.

JAWABAN :
## a. Load Balancing Antar Instance Layanan saya pake Case Alibaba Cloud Server sepengalaman saya :
Untuk menerapkan load balancing antar ECS instance secara efisien di Alibaba Cloud:
- **Menggunakan SLB/ALB (Server Load Balancer / Application Load Balancer)**  
  SLB menerima request dari client, lalu mendistribusikan ke ECS instance dengan algoritma round-robin atau least-connections.
- **Health Check**  
  SLB secara berkala memeriksa endpoint `/health` pada setiap instance. Jika ada yang gagal, request akan otomatis dialihkan ke instance sehat.
- **Auto Scaling (ESS)**  
  Jika traffic meningkat, instance ECS otomatis ditambah. Jika traffic turun, instance otomatis dikurangi agar hemat biaya.
- **NGINX di tiap ECS**  
  Sebagai reverse proxy untuk service Node.js, caching konten statis, dan terminasi SSL.

### contoh NGINX
di -> nginx.example.conf
dibuat untuk beberapa api gateway untuk slb beberapa service di cloud

### Sequence Diagram
```mermaid
sequenceDiagram
    participant Client
    participant SLB as Server Load Balancer
    participant ECS1 as ECS Instance 1 (User Service)
    participant ECS2 as ECS Instance 2 (User Service)

    Client->>SLB: HTTP Request (login)
    SLB->>ECS1: Forward request (round-robin)
    ECS1-->>SLB: Response (200 OK)
    SLB-->>Client: Response (200 OK)

    Client->>SLB: HTTP Request (login)
    SLB->>ECS2: Forward request (round-robin)
    ECS2-->>SLB: Response (200 OK)
    SLB-->>Client: Response (200 OK)
 ```

### b. Bagaimana Anda akan mengelola session state secara terdistribusi tanpa menggunakan session pada server?

saya menggunakan Token JWT untuk Session agar sistemnya bisa Stateless dan tidak bergantung ke server
contoh sequence alur yang saya maksud :
```mermaid
sequenceDiagram
    participant Client
    participant API as API Gateway / Service
    participant Auth as Auth Service

    Client->>Auth: POST /login (username & password)
    Auth-->>Client: JWT Token

    Client->>API: Request /orders (Authorization: Bearer <JWT>)
    API->>API: Verifikasi JWT (public key/secret)
    API-->>Client: Response data orders
```

### c  Jelaskan dengan rinci bagaimana Anda bisa menggunakan caching (misalnya Redis) untuk meminimalkan beban ke database

-> Query Result Caching
- Data hasil query database disimpan ke Redis.
- Kalau ada request yang sama, ambil dari Redis, bukan ke DB lagi.
- Contoh: GET /products → simpan hasil list produk di Redis selama 60 detik.

-> Session/Token Caching
- sudah pake JWT
- Setiap instance ECS baca session dari Redis, bukan memory lokal.
- Rate Limiting & Throttling

-> Cache Aside Pattern (Lazy Loading)
- Aplikasi cek cache dulu di sisi FE .
- Kalau tidak ada → query database → simpan hasil ke Redis → kembalikan ke client.
- Kalau ada → langsung ambil dari Redis.

___________________________________________________________________________________________________________
2. Buat middleware dalam Node.js (Express.js) yang mencatat (log) informasi request dan response secara mendalam, tetapi tanpa mencatat data sensitif (seperti password, token, credit card). Tambahkan juga fitur untuk:
- a. Mencatat waktu eksekusi request.
- b. Mendeteksi jika request lebih dari 1 detik → log warning.
- c. Menyimpan log ke file dan juga mengirim ke sistem monitoring (dengan format Structured Logging JSON).
Gunakan diagnostik async/await untuk track request lifetime.

Jawaban :
## 2. Middleware Logging di Node.js (Express.js)
### Tujuan
Membuat middleware yang:
- Mencatat informasi request dan response secara **mendalam**.
- Tidak mencatat data sensitif (password, token, kartu kredit).
- Mengukur waktu eksekusi setiap request.
- Jika request > 1 detik → log dengan level `WARN`.
- Menyimpan log ke file (`logs/app.log`) dalam format **Structured JSON**.
- Menggunakan `async/await` untuk melacak lifecycle request.
---
### Struktur Project
example-logger/
├─ index.js
├─ middlewares/
│ ├─ auth.js
│ └─ logger.js
└─ logs/
└─ app.log


---

### `middlewares/logger.js`
```js
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../logs/app.log");

module.exports = async function logger(req, res, next) {
  const start = process.hrtime();

  // tunggu request selesai
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;

    const logEntry = {
      service: "user-service",
      level: durationMs > 1000 ? "WARN" : "INFO",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: durationMs.toFixed(2)
    };

    // tampilkan ke console
    console.log(JSON.stringify(logEntry));

    // simpan ke file log
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");
  });

  next();
};
```


3. Aplikasi React Anda memiliki 1000 item dalam daftar, dan ketika user scroll, performa jadi rendah. Ini terjadi karena re-render berulang, terutama saat filter digunakan. Jelaskan:
Apa akar permasalahannya?
Bagaimana cara mengoptimalkannya?

jawaban :

a.)