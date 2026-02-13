# Google calendar to Todoist Google Apps Script

A Google Apps Script to sync Google Calender schedules as Todoist tasks.

## Setting

You need to get following values before setting up

* Todoist API Token
* Calendar ID

build and push to GAS:

```sh
$ npm install
$ npx clasp login
$ npx clasp create --title <Project Name> --rootDir dist
```

open GAS project https://script.google.com/d/<ID>/edit
(this URL will be shown following `clasp create`)

```sh
$ npm run push
$ npx clasp open-script
```

and set `Script Properties`, then set trigger as `main`.
