# Google calendar to Todoist Google Apps Script



## Setting

You need to get following values before setting up

* Todoist API Token
* Calendar ID

build and push to GAS:

```
$ npm install
$ npx @google/clasp login
$ npx @google/clasp create --title <Project Name> --rootDir src
```

open GAS project https://script.google.com/d/<ID>/edit
(this URL will be shown following `clasp create`)

```
$ npx @google/clasp push
$ npx @google/clasp open
```

and set `Script Properties`, then set trigger as `main`.

## development

Create credentials for Google API.
See https://github.com/google/clasp/blob/master/docs/run.md

```
$ npx @google/clasp push
$ npx @google/clasp run main
```

At first time, messages about permission error will be shown.
Follow the messages to resolve it.
