// googleCalendar.js
const CLIENT_ID = CONFIG.CLIENT_ID;
const API_KEY = CONFIG.API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let googleAuth = null;

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
    scope: SCOPES
  }).then(() => {
    googleAuth = gapi.auth2.getAuthInstance();
    
    // Listen for sign-in state changes
    googleAuth.isSignedIn.listen(updateSigninStatus);
    
    // Handle initial sign-in state
    updateSigninStatus(googleAuth.isSignedIn.get());
    
    document.getElementById('auth-button').onclick = handleAuthClick;
  }).catch(error => {
    console.error('Error initializing Google client:', error);
  });
}

function updateSigninStatus(isSignedIn) {
  const authButton = document.getElementById('auth-button');
  if (isSignedIn) {
    authButton.textContent = 'Sign out';
    authButton.onclick = handleSignoutClick;
    createEvents();
  } else {
    authButton.textContent = 'Sync with Google Calendar';
    authButton.onclick = handleAuthClick;
  }
}

function handleAuthClick() {
  googleAuth.signIn().catch(error => {
    console.error('Error signing in:', error);
    alert('Sign-in failed. Please try again.');
  });
}

function handleSignoutClick() {
  googleAuth.signOut();
}

function createEvents() {
  const eventsToSync = todo.filter(task => task.due && !task.syncedToGoogle);
  
  if (eventsToSync.length === 0) {
    alert("No tasks with due dates to sync or all tasks already synced.");
    return;
  }

  let successfulSyncs = 0;
  
  const syncPromises = eventsToSync.map(task => {
    const event = {
      summary: task.text,
      description: 'Synced from my To-Do App',
      start: {
        dateTime: new Date(task.due).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(new Date(task.due).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    return gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    }).then(response => {
      // Mark task as synced
      const taskIndex = todo.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        todo[taskIndex].syncedToGoogle = true;
        saveToLocalStorage();
      }
      successfulSyncs++;
      return response;
    }).catch(error => {
      console.error('Error creating event:', error);
      return Promise.reject(error);
    });
  });

  Promise.all(syncPromises)
    .then(() => {
      displayTasks();
      alert(`Successfully synced ${successfulSyncs} task(s) to Google Calendar.`);
    })
    .catch(() => {
      alert(`Some events failed to sync. ${successfulSyncs} were successful.`);
    });
}

// Load the client
window.handleClientLoad = handleClientLoad;