# Hosting Guide

> **Before hosting:** the frontend must first be connected to the PostgreSQL database through a server. The current frontend stores data in the browser, so hosting it as-is would give every visitor a separate copy of the data. See "Before going live" in `FACULTY_HANDOVER_MANUAL.md`.

---

## Option A: Managed cloud

| Layer | Suggested provider | Notes |
| :--- | :--- | :--- |
| App | Google Cloud Run or Vercel | Automatic HTTPS, environment variables for secrets. |
| Database | Neon or Supabase (PostgreSQL) | Daily automated backups. |
| File storage (ID photos) | Cloudflare R2 or AWS S3 | Private bucket, presigned links that expire in 10 minutes. |

## Option B: University server

Ubuntu 22.04 or 24.04 LTS with Nginx and Let's Encrypt (HTTPS), PM2 to keep Node.js running, local PostgreSQL with a daily `pg_dump` backup, and a firewall allowing only ports 22, 80 and 443.

Nginx proxy block (replace `<your-domain>`):
```nginx
server {
    server_name <your-domain>;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/<your-domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<your-domain>/privkey.pem;
}
```

---

## Go-live checklist
- [ ] Domain and HTTPS working.
- [ ] Frontend connected to the database, and tested from two different devices.
- [ ] Default admin password changed.
- [ ] Test and dummy teams, judges and staff deleted from the admin panel.
- [ ] Payment numbers, helpline email, phone, venue and prizes filled in Settings.
- [ ] Registration and online round dates set (shown in Asia/Dhaka).
- [ ] Load test done with many teams registering at once.
