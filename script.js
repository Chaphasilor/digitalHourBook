var globalAttributes = {};

function initUI() {

  initDB().then(function (response) {

    console.log(response);

    updateUI();

  });

}

function updateUI() {

  calculateOvertime().then(function (overtime) {

    let overtimeSpan = document.querySelector('#overtime').querySelector('span');
    overtimeSpan.innerHTML = overtime;

    overtime < 0 ? overtimeSpan.style.color = 'red' : overtimeSpan.style.color = 'green';

  });

}

function newHoursEntry() {

  document.querySelector('#hoursEntry').style.height = 'calc( 3 * var(--hourDiffHeight)';

}

function newHolidaysEntry() {

  document.querySelector('#holidaysEntry').style.height = 'calc( 3 * var(--hourDiffHeight)';

}

var db;

function initDB() {
  return new Promise(function (resolve, reject) {

    var request = window.indexedDB.open("hourBook", 5);

    request.onsuccess = function (event) {

      db = event.target.result;

      db.onerror = function (event) {
        reject("Database error: " + event.target.errorCode);
      }

      resolve("DB opened successfully!");

    }

    request.onerror = function () {
      reject("Couldn't open DB!");
    }

    request.onupgradeneeded = function (event) {

      var db = event.target.result;

      try {
        let days = db.createObjectStore("days", { keyPath: "date" });
        let hours = days.createIndex("by_hours", "hours", { unique: false });
      } catch (e) {
        console.log("Object store already exists");
      }

      try {
        let holidays = db.createObjectStore("hoursOff", { keyPath: "date" });
        let timeOff = holidays.createIndex("by_hours", "hours", { unique: false });
      } catch (e) {
        console.log("Object store already exists");
      }

    };

  });
}

function getDay(date) {
  return new Promise((resolve, reject) => {
  
    let tx = db.transaction(['days'], "readonly");
    let txObj = tx.objectStore('days');

    let request = txObj.get(date);
    request.onsuccess = function () {
      let matching = request.result;
      if (matching !== undefined) {
        // A match was found.
        resolve(matching);
      } else {
        // No match was found.
        reject('No match was found');
      }
    };
  
  })
}

function addDay(date, hours) {
  return new Promise(async (resolve, reject) => {

    if (isNaN(hours)) {
      alert("The amount of hours you put is not a number!");
    } else {
      
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      console.log(date + ", " + hours);

      let foundEntry;
      try {
        foundEntry = await getDay(date);
      } catch (err) {
        // console.error(err);
        foundEntry = null;
      }

      if (foundEntry != null) {

        hours = Number(hours)+Number(foundEntry.hours);
        
      }

      let tx = db.transaction(['days'], "readwrite");
      let txObj = tx.objectStore('days');
      let request = txObj.put({ date: date, hours: Number(hours) });

      request.onsuccess = function () {

        console.log("Success");
        // window.location.reload();
        resolve();

      };

    }

  });
}

function deleteDay(date) {

  let tx = db.transaction(['days'], "readwrite");
  let txObj = tx.objectStore('days');

  let request = txObj.delete(date);

  request.onsuccess = function () {
    console.log("Success!");
  }

}

function addHoursOff(date, hours) {

  if (isNaN(hours)) {
    alert("The amount of hours of you've put is not a number!");
  } else {

    let tx = db.transaction(['hoursOff'], "readwrite");
    let txObj = tx.objectStore('hoursOff');

    console.log(date + ", " + hours);
    let request = txObj.put({ date: date, hours: Number(hours) });

    request.onsuccess = function () {
      console.log("Success!");
      // window.location.reload();
    }

  }

}

function getHoursOff() {
  return new Promise(function (resolve, reject) {

    let transaction = db.transaction(['hoursOff'], "readonly");
    let objectStore = transaction.objectStore('hoursOff');

    let request = objectStore.getAll();

    request.onsuccess = function () {
      resolve(request.result);
    }

  });
}

function getAllHours() {
  return new Promise(function (resolve, reject) {

    let transaction = db.transaction(['days'], "readonly");
    let objectStore = transaction.objectStore('days');

    let request = objectStore.getAll();

    request.onsuccess = function () {
      resolve(request.result);
    }

  });
}

function calculateOvertime() {
  return new Promise(function (resolve, reject) {

    getAllHours().then(function (daysResponse) {


      console.log(daysResponse);

      let totalHours = 0;

      let firstDate = new Date(daysResponse[0].date);
      // let lastDate;
      let today = new Date(Date.now());

      getHoursOff().then(hoursOffResponse => {

        console.log(hoursOffResponse);
        
        let today = new Date();
        let totalHoursOff = hoursOffResponse.reduce((sum, day) => {
          // only include hours off from past and present in the calculation (same as actual working hours)
          if (today - day.date >= 0) {
            return sum + day.hours;
          } else {
            return sum;
          }
        }, 0);

        globalAttributes.hoursOff = totalHoursOff;

      }).then(_ => {

        for (let currentDay in daysResponse) {
          totalHours += daysResponse[currentDay].hours;
          // lastDate = new Date(daysResponse[currentDay].date);
        }

        let hoursPerWeek = 7;
        // let weeksPerMonth = 4.349; // constant used by GSI
        // let daysPerMonth = 7*weeksPerMonth;
        // let hoursPerDay = (hoursPerWeek*weeksPerMonth)/daysPerMonth;
        // let totalDays = Math.round(Math.abs((firstDate.getTime() - lastDate.getTime())/(24*60*60*1000))+1);
        console.log(globalAttributes.hoursOff);
        let totalDays = Math.round(Math.abs((firstDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
        // let totalRequiredHours = totalDays*(hoursPerWeek/7);
        let totalRequiredHoursNoDaysOff = Math.ceil(totalDays / 7) * hoursPerWeek;
        let totalRequiredHours = totalRequiredHoursNoDaysOff - globalAttributes.hoursOff;
        let overtime = totalHours - totalRequiredHours;

        console.log('Total Days: ' + totalDays);
        console.log('Required Hours: ' + totalRequiredHours);
        console.log('Actual Hours: ' + totalHours);
        console.log('Overtime: ' + overtime);

        resolve(overtime);

      })

    });

  });
}

function importHours(hoursAsJson) {

  let hoursAsObject = JSON.parse(hoursAsJson);

  for (const date of hoursAsObject) {
    addDay(date.date, date.hours[0].hours);
  }

}

function loadGoogleCalendarData() {

  let frame = document.createElement('iframe');
  frame.src = 'googleIsolator.html';
  frame.style.display = 'none';
  frame.id = 'gcLoader';

  document.body.appendChild(frame);

}

function parseGoogleCalendarData(events) {
  return new Promise(async (resolve, reject) => {
  
    console.log(events);

    for (const event of events) {
      await addDay(event.date, event.duration);
    }

    resolve();
  
  })
}

function parseGoogleCalendarDataCallback(events) {

  parseGoogleCalendarData(events).then(_ => {

    updateUI();

    document.querySelector('#gcLoader').remove();
    
  })
  
}

async function exportToProzHelper(year, month) {
  return new Promise(async (resolve, reject) => {
  
    let allDays = await getAllHours();

    let monthDays = allDays.filter(day => {

      return ((new Date(day.date)).getMonth() == month) && ((new Date(day.date)).getFullYear() == year);

    });

    let outputString = "";

    outputString += ";;6220";
    outputString += "\n";

    outputString += "\n";

    let i = 1; // days start with 1

    let fullMonthArray = [];

    let test = [...monthDays];
    console.log('test:', test);

    while ((new Date(year, month, i)).getMonth() == month) {
      //TODO add all days to an array, check if actual date exists in monthDays
      console.log('i:', i);
      console.log('fullMonthArray:', fullMonthArray);
      if (monthDays.length > 0) {
        console.log('monthDays[0].date.getDate():', monthDays[0].date.getDate());
        fullMonthArray[i-1] = monthDays[0].date.getDate()==i ? monthDays.shift() : {date: new Date(year, month, i), hours: 0};
      } else {
        fullMonthArray[i-1] = {date: new Date(year, month, i), hours: 0};
      }
      i++;
      
    }

    for (let day of fullMonthArray) {

      outputString += day.date.getFullYear() + '-';
      outputString += day.date.getMonth() < 9 ? '0' +(parseInt(day.date.getMonth()) + parseInt(1)): parseInt(day.date.getMonth()) + parseInt(1);
      outputString += '-';
      outputString += day.date.getDate();

      outputString += ';';

      outputString += day.hours; // total hours

      outputString += ';';

      outputString += day.hours; // project hours

      outputString += "\n";

    }

    // alert(outputString);

    resolve(outputString);
  
  })
}

/**
 * Can be used to show a dialog to the user asking which calendar provider they want to sync with, once more providers are implemented.
 *
 * @returns an integer representing the calendar
 */
function chooseCalendarProvider() {
  return 'googleCalendar';
}

function sync(overwrite = true) {

  if (overwrite) {

    let transaction = db.transaction(['days'], "readwrite");
    let objectStore = transaction.objectStore('days');

    let request = objectStore.clear();

    request.onsuccess = function initSync() {

      let cal = chooseCalendarProvider();

      switch (cal) {
        case 'googleCalendar':
          loadGoogleCalendarData();
          break;

        default:
          break;
      }
      
    }

    request.onerror = function() {
      confirm("Old records couldn't be erased, sync anyway?") ? initSync() : false;
    }
    
  }
  
}

function updateClipboard(newClip) {
  navigator.clipboard.writeText(newClip).then(function() {
    document.body.innerHTML += "<br><span style='color: green;'>Data copied!</span>";
    /* clipboard successfully set */
  }, function() {
    alert('Writing to clipboard not allowed, please copy the data manually!')
    /* clipboard write failed */
  });
}