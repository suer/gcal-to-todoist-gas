# Google calendar to Todoist Google Apps Script



## Setting

You need to get following values before setting up

* Todoist API Token
* Calendar ID

build and push to GAS:

```
$ npm install
$ npx clasp login
$ npx clasp create --title <Project Name> --rootDir dist
```

open GAS project https://script.google.com/d/<ID>/edit
(this URL will be shown following `clasp create`)

```
$ npm run push
$ npx clasp open-script
```

and set `Script Properties`, then set trigger as `main`.
