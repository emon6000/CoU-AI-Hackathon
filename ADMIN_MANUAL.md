# Organizing Admin & Moderator Manual

For the AI Hackathon 2026 organizing committee, Comilla University.

---

## 1. Staff login

Staff (Super Admin, Moderators, Judges) sign in at `/staff/login`. This link is not shown on the public site. Change the default admin password on first login.

---

## 2. Registration queue

1. Open the **Registrations** tab in `/admin` and filter by **Pending**.
2. Click **View ID Photos** to check student IDs.
3. Compare the team's `TrxID` and sender number with your bKash / Nagad / Rocket statement:
   - **Match**: click **Approve**. The portal creates the team login and a ready-made email. Click **Copy Ready-Made Email Text**, send it from the official helpline email, then tick **Credentials Sent**.
   - **Mismatch**: click **Correction** and add a note. Send the generated `/payment-correction/[token]` link to the team leader. The link works once.
   - **Invalid**: click **Reject** and give a reason.
4. **Ban / Unban**: blocks a team from logging in and hides it from the public Teams page.
5. **Delete**: removes a team permanently, with its scores and check-in. You will be asked to confirm. Use this for test or dummy teams.

---

## 3. Settings

In the **Settings** tab, set event dates, registration fee, team size, payment numbers, helpline email and phone, venue, and **Prizes** (3 to 5 places, amount and optional title). Click **Save All Settings**.

---

## 4. Online round

1. **Scenario Docs**: upload problem statements and rules. Turn visibility **ON** before the online round starts.
2. **Deadline override**: Super Admins can extend one team's deadline with **Override**. The reason is saved in the audit log.
3. **Repository check at the deadline**: the **Run Snapshot** button is currently a placeholder and does **not** read GitHub. Until a real version is built, do this instead: tell teams not to push after the deadline, and have a moderator note each team's latest commit link and time from GitHub right after the deadline.

---

## 5. Judging and finalists

1. **Staff & Judges**: create judge accounts. Use **Ban / Unban** to block an account and **Delete** to remove one.
2. **Judging Progress**: watch each judge's completion.
3. **Lock Judging** when all judges finish.
4. **Finalists**: click **Suggest Top N Finalists**, adjust if needed, then **Release Results** and **Phase 2 Unlock**.

---

## 6. Grand finale

1. Open the **Check-in** tab. Only finalist teams can be checked in.
2. Search the team, record how many members are present, and confirm. Check physical student ID cards.
3. Judges score live defenses in `/judge`.
4. Click **Compute Overall Final Scores** (default 50% online, 50% on-site), then **Publish**.

Note: the QR pass for finalists is being reworked. Use the check-in list for now.
