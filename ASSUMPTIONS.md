# Technical Assumptions & Decisions

---

## 1. Time
Timestamps are stored in UTC and shown in **Asia/Dhaka (UTC+6)**.

## 2. Money and payments
- Currency: BDT. Registration fee: 1000 BDT per team.
- Payment is verified by hand against bKash / Nagad / Rocket statements. A transaction ID must be unique per payment method.
- A single-use correction link lets a team leader fix only the sender number and transaction ID.
- Total prize pool: 25,000 BDT. Places and amounts (3 to 5) are set by admin in Settings.

## 3. Eligibility
Teams of 3–4 students. Open to students from all universities. Teams enter their own university name at registration.

## 4. Privacy
- ID photos, phone numbers, emails, student IDs and transaction IDs are never shown publicly. The public Teams page shows team name, university and status only.
- Banned and rejected teams are hidden from the public list.
- An admin can purge ID photos 30 days after the event.
- Judges see abstracts, repo and video links. They do not see payment details or ID photos.

## 5. Judging
- Teams see judge feedback labeled "Judge A", "Judge B" (anonymous by default).
- Final score = (online average × online weight + on-site average × on-site weight) ÷ (sum of weights). Default 50/50, editable in Settings.

## 6. Moderation and audit
Bans, deletions, approvals, rejections, deadline overrides and settings changes are recorded in the audit log.

## 7. Known limitations
- Git snapshot is a placeholder (random commit ID, no GitHub connection).
- Staff login lockout (5 attempts) is tracked in the browser only.
- In the current frontend, data and temporary passwords are kept in browser storage. Connect the database and store only hashed passwords before going live.
