# AI Hackathon 2026 Portal

Official web portal for **AI Hackathon 2026**, hosted by the Faculty of Engineering, Comilla University, with the Departments of CSE and ICT. Open to students from all universities.

**Presented by** Gigabyte Aorus · **Powered by** IT Palace

---

## Project status

| Area | Status |
| :--- | :--- |
| Public site, registration, team portal, judge panel, admin panel | Built |
| Data storage | The frontend currently saves data in the browser (`localStorage`). A local PostgreSQL database is set up for development, but the frontend must be connected to it before a live event (see "Before going live" in `FACULTY_HANDOVER_MANUAL.md`). |
| Automatic Git snapshot | Placeholder only. It does not read GitHub yet. |
| On-site check-in | Works as a check-in list for finalist teams. The QR pass is being reworked. |

---

## Core modules

1. **Public site (`/`)**: landing page with countdown, schedule, events, prizes, FAQ and sponsors. Searchable Teams list (`/teams`) that shows only team name, university and status.
2. **Registration (`/register`)**: teams of 3–4 members, student ID photos, manual bKash / Nagad / Rocket payment details. Registration fee: 1000 BDT per team.
3. **Team portal (`/login`, `/team`)**: login with credentials issued by organizers, forced password change on first login, scenario documents, online submission (abstract up to 350 characters, GitHub repo link, demo video link), anonymized judge feedback.
4. **Judge panel (`/judge`)**: scoring (0–100, decimals allowed), comments, on-site scoring.
5. **Admin panel (`/admin`)**: registration review, payment correction links, scenario documents, settings, staff accounts, judging progress, finalists, check-in list, results, audit log.

Admin and judge login is at `/staff/login` and is not linked publicly.

---

## Admin controls

- **Prizes**: Settings tab. Add 3 to 5 places with an amount and optional title. Total prize pool is shown on the home page (25,000 BDT).
- **Ban / Unban**: teams and staff. A banned team cannot log in and is hidden from the public Teams page.
- **Delete**: teams (with their scores and check-in) and staff or judges (with their scores). Every delete and ban is recorded in the audit log.

---

## Tech stack

React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons. PostgreSQL for the database. Fonts: Sora (headings), DM Sans (body).

Design colors: background `#0a0618`, violet `#6d3df5`, cyan `#22d3ee`, amber `#ffb020`, paper `#f6f4ff`, ink `#1b1236`.

---

## Documentation

- `FACULTY_HANDOVER_MANUAL.md`: setup, event lifecycle, go-live checklist.
- `ADMIN_MANUAL.md`: day-to-day steps for organizers.
- `ASSUMPTIONS.md`: timezone, privacy and scoring decisions.
- `HOSTING.md`: deployment options.
