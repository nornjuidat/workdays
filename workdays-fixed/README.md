# Work Days Tracker

Vanilla HTML/CSS/JavaScript + Node.js/Express + MongoDB.

## Features
- Username + password only (no email)
- Register / login
- Daily salary
- Manually choose any work date
- No date is added automatically
- Duplicate work dates are blocked
- Filter by month and year
- Delete work days
- Monthly salary total

## Run

Make sure MongoDB is running locally.

Then open PowerShell in this folder:

npm install
npm start

Open:

http://localhost:3133

## Important if you used the old database

The old project had a unique `email_1` index in the `users` collection.
This new code does not use email at all.

If MongoDB still reports:

E11000 ... index: email_1 ... email: null

Open MongoDB Compass:
workdays_db -> users -> Indexes

Delete ONLY the old `email_1` index.

Keep `_id_` and the username index.
