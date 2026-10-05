# 🚀 Wadaage Mobility - Hostinger Node.js Hosting & Mobile APK Connection Guide
**Hage Buuxa oo Tallaabo-Tallaabo ah: Ku Shidida Hostinger Node.js Server-ka iyo Isku Xidhka Rider & Driver APK**

---

## 📋 Hordhac (Overview)
Nidaamka Wadaage Mobility wuxuu ka kooban yahay:
1. **Hostinger Node.js Backend (`server.ts` -> `dist/server.cjs`)**: Maamula API-yada, Real-time Ride Sync, Driver GPS Telematics, WhatsApp OTP, iyo xogta MySQL.
2. **Hostinger MySQL Database (`hostinger_database.sql`)**: Kaydiya isticmaalayaasha, darawalada, safarada, boorsooyinka (wallets), iyo xisaabaadka.
3. **Rider APK (`com.wadaage.rider`)**: App-ka rakaabka ee gaadhiga laga dalbado.
4. **Driver APK (`com.wadaage.driver`)**: App-ka darawalka ee dalabaadka lagu aqbalo laguna socdo GPS.
5. **Admin Web Dashboard**: Dashboard-ka maamulka guud ee shirkadda.

---

## 🛠️ TALLAABADA 1: Hostinger Database Setup (MySQL & phpMyAdmin)

1. Gal **Hostinger hPanel** -> **Databases** -> **MySQL Databases**.
2. Abuur database cusub:
   - **Database Name**: tusaale `u123456789_wadaagedb`
   - **Database Username**: tusaale `u123456789_wadaage`
   - **Password**: Geli furaha sirta ah (keydi meel aamin ah).
3. Guji **Enter phpMyAdmin**.
4. Guji tab-ka **Import** -> Dooro faylka **`wadaage_hostinger_database.sql`** ama **`hostinger_database.sql`** ee mashruuca ku jira.
5. Guji **Go / Import** si ay dhammaan 10-ka miis (Tables) u abuurnaadaan:
   - `users`
   - `drivers`
   - `rides`
   - `wallet_transactions`
   - `driver_applications`
   - `geofence_zones`
   - `pricing_configs`
   - `coupons_and_promos`
   - `system_settings`
   - `security_audit_logs`

---

## 🖥️ TALLAABADA 2: Hostinger VPS ama Cloud Hosting Node.js Setup

### Doorashada A: Hostinger VPS (Ubuntu / Debian - Habka ugu fiican)

1. Gal Hostinger VPS-kaaga adoo isticmaalaya SSH:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```
2. Ku shub Node.js 20 LTS iyo Git:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git build-essential
   sudo npm install -g pm2
   ```
3. Nuuxi ama soo geli faylashan galka `/var/www/wadaage`:
   ```bash
   mkdir -p /var/www/wadaage
   cd /var/www/wadaage
   ```
4. Dhig faylka `.env`:
   ```env
   NODE_ENV=production
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=u123456789_wadaage
   DB_PASSWORD=YOUR_DB_PASSWORD
   DB_NAME=u123456789_wadaagedb
   VITE_API_URL=https://yourdomain.com
   ```
5. Ku dhis oo ku shid hal amar (Automated Build & PM2):
   ```bash
   chmod +x hostinger_deploy.sh
   ./hostinger_deploy.sh
   ```
   *Wuxuu si toos ah u dhisayaa Frontend-ka iyo Backend-ka, wuxuuna ku bilaabayaa PM2 Cluster!*

6. **Nginx Reverse Proxy & SSL (Domain Setup):**
   Geli faylka `/etc/nginx/sites-available/wadaage`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Kaddib shid SSL:
   ```bash
   sudo ln -s /etc/nginx/sites-available/wadaage /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 📱 TALLAABADA 3: Isku Xidhka Labada APK (Driver & Rider) iyo Hostinger

Labada APK waxaa lagu dhisay **Capacitor** iyo **API Base URL Relay**.

### 1. Dhisida Labada APK (Build Scripts):
Faylka `build_apks.sh` ayaa labadaba u dhisaya si gooni-gooni ah:
```bash
./build_apks.sh
```
- **Rider APK**: `dist-apks/Wadaage-Rider-v2.0.apk`
- **Driver APK**: `dist-apks/Wadaage-Driver-v2.0.apk`

### 2. Sida APK-yadu ula hadlaan Hostinger Server:
- Faylka `src/services/apiConfig.ts` wuxuu si toos ah u gartaa in app-ku mobayl ku jiro.
- Haddii aad rabto inaad domain-kaaga gaarka ah toos ugu xidho:
  1. Geli `VITE_API_URL=https://yourdomain.com` faylka `.env` ka hor inta aadan dhisan.
  2. AMA fur Admin Dashboard -> **Hostinger & APK Connection Manager** -> Geli domain-kaaga -> Guji **"Save & Test Live Sync"**.

---

## ⚡ Sida Isku-Xidhka Real-time u Shaqeeyo (How Real-time Sync Works)

1. **Rider dalbada gaadhi**:
   - Rider wuxuu riixaa "Codso Gaadhi" -> Waxaa la abuuraa `RideRequest` oo leh xaaladda `'searching'`.
   - Waxaa isla markiiba loo diraa `/api/rides/sync` (Hostinger Node.js) iyo Cloud Firestore.
   - Dhammaan darawalada ku dhow waxay maqlayaan dhawaaqa *"Ping"* (Incoming Ride).

2. **Driver aqbala gaadhi**:
   - Darawalku wuxuu riixaa "Aqbal Safarka" -> Xaaladdu waxay noqonaysaa `'accepted'`.
   - Rider-ka shaashadiisa waxay isla ilbiriqsigaas isu bedeshaa *"Darawalkaagii waa laguu helay!"* oo leh magaca darawalka, sawirka, nooca gaadhiga (e.g. Toyota Vitz), iyo lambarka taargada.

3. **Live GPS Tracking**:
   - Darawalku marka uu socdo, `watchPosition` wuxuu soo diraa koordinat-yada GPS-ka (`/api/drivers/location`).
   - Khariidada Rider-ka waxay toos u tusaysaa gaadhiga oo u soo socda.

4. **Lacag-bixinta (EVC Plus, Zaad, eDahab)**:
   - Marka safarku dhammaado, xisaabtu waxay toos ugu qormaysaa MySQL `wallet_transactions` iyo Firestore.
