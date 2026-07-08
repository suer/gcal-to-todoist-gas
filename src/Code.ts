const calendarId: string =
  PropertiesService.getScriptProperties().getProperty('CALENDAR_ID') || '';
const todoistApiToken: string =
  PropertiesService.getScriptProperties().getProperty('TODOIST_API_TOKEN') ||
  '';
const todoistApiUrl = 'https://api.todoist.com/api/v1/sync';

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
type TodoistProjectsResponse = {
  projects: TodoistProject[];
};

function fetchInboxProjectId_(): string {
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    payload: {
      sync_token: '*',
      resource_types: JSON.stringify(['projects']),
    },
    headers: {
      Authorization: `Bearer ${todoistApiToken}`,
    },
    muteHttpExceptions: true,
  };
  const httpResponse = UrlFetchApp.fetch(todoistApiUrl, options);
  if (httpResponse.getResponseCode() !== 200) {
    Logger.log(`Failed to fetch projects: ${httpResponse.getContentText()}`);
    return '';
  }
  const response: TodoistProjectsResponse = JSON.parse(
    httpResponse.getContentText(),
  );
  const projects = response.projects;
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
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
  let previous;
  do {
    previous = htmlString;
    htmlString = htmlString.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
  } while (htmlString !== previous);
  return htmlString;
}
type TodoistSyncStatus = Record<
  string,
  'ok' | { error_code: number; error: string }
>;
type TodoistSyncResponse = {
  sync_status: TodoistSyncStatus;
};
function postToTodoist_(
  todoistProjectId: string,
  events: GoogleAppsScript.Calendar.CalendarEvent[],
): boolean {
  if (events.length === 0) {
    return true;
  }
  const commands = events.map((event) => {
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
        description: removeHtmlTag_(event.getDescription()),
      },
    };
  });
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    payload: {
      commands: JSON.stringify(commands),
    },
    headers: {
      Authorization: `Bearer ${todoistApiToken}`,
    },
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(todoistApiUrl, options);
  if (response.getResponseCode() !== 200) {
    Logger.log(`Failed to post tasks: ${response.getContentText()}`);
    return false;
  }

  const syncResponse: TodoistSyncResponse = JSON.parse(
    response.getContentText(),
  );
  const failedCommands = commands.filter(
    (command) => syncResponse.sync_status[command.uuid] !== 'ok',
  );
  if (failedCommands.length > 0) {
    Logger.log(
      `Failed to post some tasks: ${JSON.stringify(
        failedCommands.map((command) => ({
          content: command.args.content,
          status: syncResponse.sync_status[command.uuid],
        })),
      )}`,
    );
    return false;
  }
  return true;
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
