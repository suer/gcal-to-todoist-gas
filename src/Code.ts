const calendarId: string =
  PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
const todoistApiToken: string =
  PropertiesService.getScriptProperties().getProperty('TODOIST_API_TOKEN');
const todoistApiUrl = 'https://api.todoist.com/sync/v9/sync';

function isSameDay_(a: GoogleAppsScript.Base.Date, b: Date): boolean {
  return (
    a.getFullYear() == b.getFullYear() &&
    a.getMonth() == b.getMonth() &&
    a.getDate() == b.getDate()
  );
}

function fetchEvents_(
  calendarId: string,
): GoogleAppsScript.Calendar.CalendarEvent[] {
  const today = new Date();
  const cal = CalendarApp.getCalendarById(calendarId);
  return cal
    .getEventsForDay(new Date())
    .filter((e) => isSameDay_(e.getStartTime(), today));
}

type TodoistProjectResponse = {
  id: number;
  inbox_project: boolean;
};
type TodoistProjectsResponse = {
  projects: [TodoistProjectResponse];
};

function fetchInboxProjectId_(): number {
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    payload: JSON.stringify({
      sync_token: '*',
      resource_types: '["projects"]',
    }),
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${todoistApiToken}`,
    },
  };
  const response: TodoistProjectsResponse = JSON.parse(
    UrlFetchApp.fetch(todoistApiUrl, options).getContentText(),
  );
  for (let i = 0; i < response['projects'].length; i++) {
    const project = response['projects'][i];
    if (project['inbox_project']) {
      return project.id;
    }
  }
  return 0;
}
function getDueDate_(event: GoogleAppsScript.Calendar.CalendarEvent): string {
  const date = new Date(event.getEndTime().getTime() - 1);
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd');
}
function postToTodoist_(
  todoistProjectId: number,
  events: GoogleAppsScript.Calendar.CalendarEvent[],
): boolean {
  const commands = events.map(function (event) {
    return {
      type: 'item_add',
      uuid: Utilities.getUuid(),
      temp_id: Utilities.getUuid(),
      args: {
        content: event.getTitle(),
        project_id: todoistProjectId,
        due: {
          date: getDueDate_(event),
        },
      },
    };
  });
  const payload = {
    commands: commands,
  };
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    payload: JSON.stringify(payload),
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${todoistApiToken}`,
    },
  };

  const response = UrlFetchApp.fetch(todoistApiUrl, options);
  Logger.log(response.getContentText());
  return response.getResponseCode() == 200;
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function main(): string {
  const events = fetchEvents_(calendarId);
  const inboxProjectId = fetchInboxProjectId_();
  return postToTodoist_(inboxProjectId, events) ? 'Success' : 'Failed';
}
