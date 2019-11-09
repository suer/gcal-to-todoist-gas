# Google calendar to Todoist Google Apps Script



## Setting

You need to get following values before setting up

* Todoist API Token
* Calendar ID

build and push to GAS:

```
$ npm install
$ clasp push
$ clasp open
```

and set `Script Properties`, then set trigger as `main`.

## development

Create credentials for Google API.
See https://github.com/google/clasp/blob/master/docs/run.md

```
$ clasp push
$ clasp run main
```

At first time, messages about permission error will be shown.
Follow the messages to resolve it.
