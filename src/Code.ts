const calendarId: string = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
const todoistApiToken: string = PropertiesService.getScriptProperties().getProperty('TODOIST_API_TOKEN');
const todoistApiUrl = 'https://api.todoist.com/sync/v8/sync'

function main() {
  const events = fetchEvents(calendarId)
  const inboxProjectId = fetchInboxProjectId()
  return postToTodoist(inboxProjectId, events) ? 'Success' : 'Failed'
}

function fetchEvents(calendarId: string): GoogleAppsScript.Calendar.CalendarEvent[] {
  const cal = CalendarApp.getCalendarById(calendarId)
  return cal.getEventsForDay(new Date())
}

type TodoistProjectResponse = {
  id: number,
  inbox_project: boolean
}
type TodoistProjectsResponse = {
  projects: [TodoistProjectResponse]
}

function fetchInboxProjectId(): number {
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    'method' : 'get',
    'payload' : JSON.stringify({
      'token': todoistApiToken,
      'sync_token': '*',
      'resource_types': '["projects"]'
    }),
    'headers': {
      'content-type': 'application/json',
    }
  }
  const response: TodoistProjectsResponse = JSON.parse(UrlFetchApp.fetch(todoistApiUrl, options).getContentText())
  for (let i = 0; i < response['projects'].length; i++) {
    const project = response['projects'][i]
    if (project['inbox_project']) {
      return project.id
    }
  }
  return 0
}
function postToTodoist(todoistProjectId: number, events: GoogleAppsScript.Calendar.CalendarEvent[]): boolean {
  const commands = events.map(function(event) {
    return {
      'type': 'item_add',
      'uuid': Utilities.getUuid(),
      'temp_id': Utilities.getUuid(),
      'args': {
        'content': event.getTitle(),
        'project_id': todoistProjectId
      }
    }
  })
  const payload = {
    'token': todoistApiToken,
    'commands': commands
  }
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    'method' : 'post',
    'payload' : JSON.stringify(payload),
    'headers': {
      'content-type': 'application/json',
    }
  }

  const response = UrlFetchApp.fetch(todoistApiUrl, options)
  Logger.log(response.getContentText())
  return response.getResponseCode() == 200
}
