# AI Hackathon 2026 Portal: Faculty Handover & Operations Manual

**Event**: AI Hackathon 2026
**Host**: Faculty of Engineering, Comilla University, with the Departments of CSE and ICT
**Open to**: students from all universities
**Presented by** Gigabyte Aorus · **Powered by** IT Palace
**Audience**: Dean, Department Heads, organizing committee, technical administrators

---

## 1. Summary

A web portal for a two-phase hackathon: an online round, then an on-site grand finale at Comilla University. It handles team registration with manual bKash / Nagad / Rocket payment checks, team logins, online submissions, blind judging, finalist selection, on-site check-in and results. Student private details are never shown publicly.

- Registration fee: 1000 BDT per team. Team size: 3–4.
- Total prize pool: 25,000 BDT, with places and amounts set by admin (3 to 5 places).

---

## 2. Local setup

1. In pgAdmin, create a database named `ai_hackathon_db`, open the Query Tool, and run `db/setup_pgadmin.sql`.
2. In the project folder run:
```bash
npm install
npm run dev
```
3. Open `http://localhost:3000`.

---

## 3. Before going live (important)

These must be done before real teams register:

1. **Connect the frontend to the database.** The current frontend saves data in the browser, so registrations from other devices would never reach the admin panel.
2. **Real Git snapshot.** The current Run Snapshot button creates a random commit ID and does not contact GitHub. Build a server job that reads each repo's latest commit at the deadline, or use the manual method in `ADMIN_MANUAL.md`.
3. **Passwords.** Store only hashed passwords and move login checks and the lockout to the server. Change the default admin password.
4. **ID photos.** Store them in a private bucket, not in the browser.
5. **QR pass.** On-site check-in works as a list. Rework the QR pass if you want it.
6. **Clean test data.** Delete dummy teams, judges and staff from the admin panel.

---

## 4. Accounts

| Role | URL | Notes |
| :--- | :--- | :--- |
| Super Admin | `/staff/login` | Default account is created at setup. Change its password immediately. |
| Moderator / Judge | `/staff/login` | Created by the Super Admin in **Staff & Judges**. |
| Team Leader | `/login` | Credentials are issued after payment approval. |

Staff login is not linked on the public site.

---

## 5. Event lifecycle

```
Registration ➔ Online Hackathon Window ➔ Finalist Selection ➔ On-Site Grand Finale
```

**Registration**: teams register and pay 1000 BDT. Organizers compare the TrxID and sender number with their statements, view ID photos, then Approve, request a Correction (single-use link), or Reject. On approval, send the generated credentials email and tick **Credentials Sent**.

**Online round**: upload scenario documents and turn visibility on at the start time. Approved teams log in, download them, and submit an abstract (up to 350 characters), a public GitHub repo link and a demo video link. Super Admins can extend one team's deadline with **Override**.

**Finalist selection**: judges score submissions blindly (0–100). When all judges finish, **Lock Judging**, then **Suggest Top N Finalists**, adjust if needed, and **Release Results** and **Phase 2 Unlock**.

**Grand finale**: use the **Check-in** tab to confirm finalist teams and how many members are present, and check physical student IDs. Judges score live defenses. Click **Compute Overall Final Scores** (default 50% online, 50% on-site) and **Publish**.

---

## 6. Moderation

- **Ban / Unban** teams and staff. Banned teams cannot log in and are hidden publicly.
- **Delete** teams (with scores and check-in) and staff (with scores). Confirmation is required.
- All actions are recorded in the audit log.

---

## 7. Security and privacy

- Public pages show team name, university and status only.
- Staff login locks after 5 failed attempts (currently tracked in the browser only).
- ID photos can be purged 30 days after the event.
- Visitors cannot open `/admin`, `/team` or `/judge` without logging in.

---

## 8. Handover checklist

- [ ] Database created and frontend connected.
- [ ] Helpline email and phone, venue and payment numbers entered in **Settings**.
- [ ] Prizes entered in **Settings**.
- [ ] Scenario documents prepared.
- [ ] Judges added in **Staff & Judges**.
- [ ] Test data deleted.
- [ ] Default admin password changed.

Helpline email: `[HELPLINE_EMAIL]`
