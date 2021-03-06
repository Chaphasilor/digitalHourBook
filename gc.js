// Client ID and API key from the Developer Console
var CLIENT_ID = '510365434178-hj05pdb04enhctvgduhg9fc2cu4noqdv.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAmtQ8_ihcd267USGpRYYG6_Peh63vz6JQ';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar.events.readonly";

// var authorizeButton = document.getElementById('authorize_button');
// var signoutButton = document.getElementById('signout_button');
// var detailsButton = document.getElementById('details_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    handleAuthClick();
    // authorizeButton.onclick = handleAuthClick;
    // signoutButton.onclick = handleSignoutClick;
    // detailsButton.onclick = handleDetailsClick;
  }, function (error) {
    appendPre(JSON.stringify(error, null, 2));
    loading(false)
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    // authorizeButton.style.display = 'none';
    // signoutButton.style.display = 'block';
    // detailsButton.style.display = 'block';
    // listUpcomingEvents();
    setTimeout(_ => handleDetailsClick(), 500);
    // handleDetailsClick();
  } else {
    // authorizeButton.style.display = 'block';
    // signoutButton.style.display = 'none';
    // detailsButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

async function handleDetailsClick(event) {
  let response = null;
  let events = [];
  let nextPage = true;
  let nextPageToken = "";
  
  while (nextPage) {
    let options = {
      'calendarId': 'primary',
      // 'timeMin': (new Date(2019, 1, 1)).toISOString(),
      'q': 'gsi', // only list events that contain the string 'gsi' in any casing in any field
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 2500,
      'orderBy': 'startTime',
    };
    if (nextPageToken != "") {
      options.pageToken = nextPageToken;
    }
    console.log('options: ', options);

    try {
      response = await gapi.client.calendar.events.list(options);
      console.log('response:', response);
      console.log('events:', events);
      events = events.concat(response.result.items);
      console.log('events:', events);
      nextPage = (response.result.nextPageToken != undefined && response.result.nextPageToken != "");
      nextPageToken = (response.result.nextPageToken != undefined && response.result.nextPageToken != "") ? response.result.nextPageToken : "" ;
    } catch (err) {
      nextPage = false;
      console.error(err);
      loading(false);
      return;
    }
    
  }
    
  events = events.filter(event => event.summary.toUpperCase() == "GSI");
  let eventsOld = [...events];
  window.parent.console.log(eventsOld);
  // for (let o in events) {
  //   events[o] = { date: (new Date(events[o].start.dateTime)).toJSON(), duration: (Math.abs(((new Date(events[o].end.dateTime)) - (new Date(events[o].start.dateTime))) / 3600000).toFixed(2)) };
  // }
  // appendPre(JSON.stringify({ events }));
  for (let o in events) {
    events[o] = { date: (new Date(events[o].start.dateTime)), duration: (Math.abs(((new Date(events[o].end.dateTime)) - (new Date(events[o].start.dateTime))) / 3600000).toFixed(2)), description: events[o].description };
  }
  appendPre(JSON.stringify({ events }));
  window.parent.parseGoogleCalendarDataCallback(events);
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

// /**
//  * Print the summary and start datetime/date of the next ten events in
//  * the authorized user's calendar. If no events are found an
//  * appropriate message is printed.
//  */
// function listUpcomingEvents() {
//   gapi.client.calendar.events.list({
//     'calendarId': 'primary',
//     'timeMin': (new Date()).toISOString(),
//     'showDeleted': false,
//     'singleEvents': true,
//     'maxResults': 10,
//     'orderBy': 'startTime'
//   }).then(function (response) {
//     var events = response.result.items;
//     appendPre('Upcoming events:');

//     if (events.length > 0) {
//       for (i = 0; i < events.length; i++) {
//         var event = events[i];
//         var when = event.start.dateTime;
//         if (!when) {
//           when = event.start.date;
//         }
//         appendPre(event.summary + ' (' + when + ')')
//       }
//     } else {
//       appendPre('No upcoming events found.');
//     }
//   });
// }