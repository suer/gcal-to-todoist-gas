const calendarId: string =
  PropertiesService.getScriptProperties().getProperty('CALENDAR_ID') || '';
const todoistApiToken: string =
  PropertiesService.getScriptProperties().getProperty('TODOIST_API_TOKEN') ||
  '';
const todoistApiUrl = 'https://api.todoist.com/api/v1';

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

type TodoistProject = {
  id: string;
  inbox_project: boolean;
};
type TodoistProjectResponse = {
  results: TodoistProject[];
};

function fetchInboxProjectId_(): string {
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    headers: {
      Authorization: `Bearer ${todoistApiToken}`,
    },
  };
  const response: TodoistProjectResponse = JSON.parse(
    UrlFetchApp.fetch(`${todoistApiUrl}/projects`, options).getContentText(),
  );
  const results = response.results;
  for (let i = 0; i < results.length; i++) {
    const project = results[i];
    if (project.inbox_project) {
      return project.id;
    }
  }
  return '';
}
function getDueDate_(event: GoogleAppsScript.Calendar.CalendarEvent): string {
  const date = new Date(event.getEndTime().getTime() - 1);
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd');
}
function removeHtmlTag_(htmlString: string): string {
  return htmlString.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
}
function postToTodoist_(
  todoistProjectId: string,
  events: GoogleAppsScript.Calendar.CalendarEvent[],
): boolean {
  let allSuccess = true;
  events.forEach((event) => {
    const payload = {
      content: event.getTitle(),
      project_id: todoistProjectId,
      due_date: getDueDate_(event),
      description: removeHtmlTag_(event.getDescription()),
    };
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      payload: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${todoistApiToken}`,
      },
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(`${todoistApiUrl}/tasks`, options);
    if (response.getResponseCode() !== 200) {
      Logger.log(`Failed to post task: ${response.getContentText()}`);
      allSuccess = false;
    }
  });
  return allSuccess;
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function main(): string {
  const events = fetchEvents_(calendarId);
  const inboxProjectId = fetchInboxProjectId_();
  if (!inboxProjectId) {
    return 'Failed: Inbox project not found';
  }
  return postToTodoist_(inboxProjectId, events) ? 'Success' : 'Failed';
}
