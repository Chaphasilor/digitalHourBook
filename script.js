function loading(status) {

  if (status) {

    let overlay = document.createElement('div');
    let indicator = document.createElement('div');
    let text = document.createElement('span');
    text.innerText = 'Loading...';
    overlay.id = 'loadingIndicatorOverlay';
    indicator.id = 'loadingIndicator';
    indicator.appendChild(text);
    for (let i = 0; i < 3; i++) {
      let dot = document.createElement('div');
      let ball = document.createElement('div');
      dot.classList.add('dot')
      dot.id = 'dot'+i;
      dot.appendChild(ball);
      indicator.append(dot);
    }
    
    overlay.appendChild(indicator);
    document.body.appendChild(overlay);

  } else {

    document.querySelector('#loadingIndicatorOverlay').remove();
    
  }
  
}



function initUI() {

  initDB().then(function (response) {

    console.log(response);

    updateUI();

  });

}

function updateUI() {

  calculateOvertime()
  .then(function (overtime) {

    let overtimeSpan = document.querySelector('#overtime').querySelector('span');
    overtimeSpan.innerHTML = overtime;

    overtime < 0 ? overtimeSpan.style.color = 'red' : overtimeSpan.style.color = 'green';

  })
  .catch(err => {
    console.error(err);
  });

}

function toggleHoursEntry() {

  document.querySelector('#hoursEntry').style.height != 'calc( 3 * var(--hourDiffHeight)' ? document.querySelector('#hoursEntry').style.height = 'calc( 3 * var(--hourDiffHeight)' : document.querySelector('#hoursEntry').style.height = '0';

}

function toggleHolidaysEntry() {

  document.querySelector('#holidaysEntry').style.height != 'calc( 3 * var(--hourDiffHeight)' ? document.querySelector('#holidaysEntry').style.height = 'calc( 3 * var(--hourDiffHeight)' : document.querySelector('#holidaysEntry').style.height = '0';

}

function toggleWeeklyHoursEntry() {

  document.querySelector('#weeklyHoursEntry').style.height != 'calc( 3 * var(--hourDiffHeight)' ? document.querySelector('#weeklyHoursEntry').style.height = 'calc( 3 * var(--hourDiffHeight)' : document.querySelector('#weeklyHoursEntry').style.height = '0';

}

function toggleWeeklyHoursBackup() {

  document.querySelector('#weeklyHoursBackup').style.height != 'calc( 3 * var(--hourDiffHeight)' ? document.querySelector('#weeklyHoursBackup').style.height = 'calc( 3 * var(--hourDiffHeight)' : document.querySelector('#weeklyHoursBackup').style.height = '0';

}

var db;

function initDB() {
  return new Promise(function (resolve, reject) {

    var request = window.indexedDB.open("hourBook", 6.5);

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
        let hours = holidays.createIndex("by_hours", "hours", { unique: false });
      } catch (e) {
        console.log("Object store already exists");
      }

      try {
        let weeklyHours = db.createObjectStore("weeklyHours", { keyPath: "date" });
        let hours = weeklyHours.createIndex("by_hours", "hours", { unique: false });
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

      request.onsuccess = () => resolve();
      
      request.onerror = (err) => reject(err);

    }

  });
}

function deleteDay(date) {
  return new Promise((resolve, reject) => {
    
    let tx = db.transaction(['days'], "readwrite");
    let txObj = tx.objectStore('days');
  
    let request = txObj.delete(date);
  
    request.onsuccess = () => resolve();

    request.onerror = (err) => reject(err);
  
  })
}

function addHoursOff(date, hours) {
  return new Promise((resolve, reject) => {
  
    if (isNaN(hours)) {
      alert("The amount of hours of you've put is not a number!");
    } else {
  
      let tx = db.transaction(['hoursOff'], "readwrite");
      let txObj = tx.objectStore('hoursOff');
  
      console.log(date + ", " + hours);
      let request = txObj.put({ date: date, hours: Number(hours) });
  
      request.onsuccess = () => resolve();

      request.onerror = (err) => reject(err);
  
    }
  
  })
}

function getHoursOff() {
  return new Promise(function (resolve, reject) {

    let transaction = db.transaction(['hoursOff'], "readonly");
    let objectStore = transaction.objectStore('hoursOff');

    let request = objectStore.getAll();

    request.onsuccess = () => resolve(request.result);

    request.onerror = (err) => reject(err);

  });
}

function getAllHours() {
  return new Promise(function (resolve, reject) {

    let transaction = db.transaction(['days'], "readonly");
    let objectStore = transaction.objectStore('days');

    let request = objectStore.getAll();

    request.onsuccess = () => resolve(request.result);

    request.onerror = (err) => reject(err);

  });
}

function changeWeeklyHours(date, newWeeklyHours) {
  return new Promise((resolve, reject) => {
  
    if (isNaN(newWeeklyHours)) {
      alert("The amount of hours you put is not a number!");
    } else {
    
      console.log(date + ", " + newWeeklyHours);

      let tx = db.transaction(['weeklyHours'], "readwrite");
      let txObj = tx.objectStore('weeklyHours');
      let request = txObj.put({ date: date, hours: Number(newWeeklyHours) });

      request.onsuccess = () => resolve();
      
      request.onerror = (err) => reject(err);

    }
  
  })
}

function deleteWeeklyHours(date) {
  return new Promise((resolve, reject) => {
    
    let tx = db.transaction(['weeklyHours'], "readwrite");
    let txObj = tx.objectStore('weeklyHours');
  
    let request = txObj.delete(date);
  
    request.onsuccess = () => resolve();

    request.onerror = (err) => reject(err);
  
  })
}

function getWeeklyHours() {
  return new Promise(function (resolve, reject) {

    let transaction = db.transaction(['weeklyHours'], "readonly");
    let objectStore = transaction.objectStore('weeklyHours');

    let request = objectStore.getAll();

    request.onsuccess = () => resolve(request.result);

    request.onerror = (err) => reject(err);

  });
}


/**
 * A function to calculate the amount of days between two dates. 
 * Beware that the second date isn't included in the amount.
 *
 * @param {Date} date1 the first date
 * @param {Date} date2 the second date
 * @returns the amount of days
 */
function amountOfDaysBetween(date1, date2) {
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / (24 * 60 * 60 * 1000)));
}

/**
 * Rounds a given number to .25 accuracy
 *
 * @param {Number} number the number to round
 * @returns a float with either .00, .25, .50 or .75 after the decimal point
 */
function roundToQuarter(number) {
  return parseFloat((Math.round(number * 4) / 4).toFixed(2));
}

function calculateOvertime() {
  return new Promise(async function (resolve, reject) {

    // retrieve data from IndexedDB
    let daysResponse = await getAllHours();
    let hoursOffResponse = await getHoursOff();
    let weeklyHoursResponse = await getWeeklyHours();
    console.log(daysResponse);
    console.log(hoursOffResponse);
    console.log(weeklyHoursResponse);

    // initialize variables
    let totalHours = 0;
    if (daysResponse.length == 0) {
      return reject(`No days in IndexedDB!`);
    }
    const firstDate = new Date(daysResponse[0].date);
    console.log('firstDate:', firstDate);
    const today = new Date();
    
    // sum up all hours off
    let totalHoursOff = hoursOffResponse.reduce((sum, day) => {
      // only include hours off from past and present in the calculation (same as actual working hours)
      if (today - day.date >= 0) {
        return sum + day.hours;
      } else {
        return sum;
      }
    }, 0);
    console.log('totalHoursOff:', totalHoursOff);

    // sum up all working hours
    totalHours = daysResponse.reduce((sum, currentDay) => {
      return sum + currentDay.hours
    }, 0);
    console.log('totalHours:', totalHours);

    // let hoursPerWeek = 7;
    // let weeksPerMonth = 4.349; // constant used by GSI
    // let daysPerMonth = 7*weeksPerMonth;
    // let hoursPerDay = (hoursPerWeek*weeksPerMonth)/daysPerMonth;
    // let totalDays = Math.round(Math.abs((firstDate.getTime() - lastDate.getTime())/(24*60*60*1000))+1);

    // only include hours off from past and present in the calculation (same as actual working hours)
    weeklyHoursResponse = weeklyHoursResponse.filter(currentWeeklyHours => {
      return today - currentWeeklyHours.date >= 0;
    })
    
    let totalRequiredHoursNoDaysOff = weeklyHoursResponse.reduce((sum, currentWeeklyHours, o) => {
      let intervalDays = 0;
      // if there are no more entries in weeklyHoursResponse, use these weekly hours up until the current day
      if (o+1 >= weeklyHoursResponse.length) {
        // because of how amountOfDaysBetween works, we need to count the days until the next day, not the current (the second date is always excluded)
        let nextDay = new Date(today);
        nextDay.setDate(nextDay.getDate()+1);
        intervalDays = amountOfDaysBetween(currentWeeklyHours.date, nextDay);
        // console.log('Interval between ' + currentWeeklyHours.date.toLocaleDateString() + ' and ' + nextDay.toLocaleDateString() + ':', intervalDays);
      } else {
        intervalDays = amountOfDaysBetween(currentWeeklyHours.date, weeklyHoursResponse[o+1].date);
        // console.log('Interval between ' + currentWeeklyHours.date.toLocaleDateString() + ' and ' + weeklyHoursResponse[o+1].date.toLocaleDateString() + ':', intervalDays);
      }
      // console.log('Weekly hours for this interval:', currentWeeklyHours.hours);
      // console.log('Hours for this interval:', roundToQuarter(intervalDays / 7 * currentWeeklyHours.hours));
      return sum + roundToQuarter(intervalDays / 7 * currentWeeklyHours.hours);
    }, 0);
    console.log('totalRequiredHoursNoDaysOff:', totalRequiredHoursNoDaysOff);
    
    let totalDays = amountOfDaysBetween(firstDate, today);
    // let totalRequiredHours = totalDays*(hoursPerWeek/7);
    // let totalRequiredHoursNoDaysOff = Math.ceil(totalDays / 7) * hoursPerWeek;
    
    let totalRequiredHours = totalRequiredHoursNoDaysOff - totalHoursOff;
    let overtime = totalHours - totalRequiredHours;

    console.log('Total Days: ' + totalDays);
    console.log('Required Hours: ' + totalRequiredHours);
    console.log('Actual Hours: ' + totalHours);
    console.log('Overtime: ' + overtime);

    resolve(overtime);

  });
}

function importHours(hoursAsJson) {

  let hoursAsObject = JSON.parse(hoursAsJson);

  for (const date of hoursAsObject) {
    addDay(date.date, date.hours[0].hours);
  }

}

function loadGoogleCalendarData() {

  loading(true);
  
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

      if (['leave', 'free', 'off', 'holiday', 'holidays', 'timeOff'].includes(event.description)) {
        await addHoursOff(event.date, event.duration);
      } else {
        await addDay(event.date, event.duration);
      }

    }

    resolve();
  
  })
}

function parseGoogleCalendarDataCallback(events) {

  parseGoogleCalendarData(events).then(_ => {

    updateUI();

    document.querySelector('#gcLoader').remove();
    loading(false);
    
  })
  
}

function exportPastMonth(monthId) {
  return new Promise(async(resolve, reject) => {
  
    if ((new Date()).getMonth() < monthId) {
      monthId -= 12;
    }

    resolve(await exportToProzHelper(monthId))
  
  })
}

function exportToProzHelper(monthOffset) {
  return new Promise(async (resolve, reject) => {
  
    let allDays = await getAllHours();
    let exportDay = new Date();
    exportDay.setMonth(monthOffset);
    month = exportDay.getMonth();
    year = exportDay.getFullYear();

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

    while ((new Date(year, month, i)).getMonth() == month) {
      // add all days to an array, check if actual date exists in monthDays
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

function initSync() {

  let cal = chooseCalendarProvider();

  switch (cal) {
    case 'googleCalendar':
      loadGoogleCalendarData();
      break;

    default:
      break;
  }
  
}

function sync(overwrite = true) {

  if (overwrite) {

    let transaction1 = db.transaction(['days'], "readwrite");
    let objectStore1 = transaction1.objectStore('days');

    let request1 = objectStore1.clear();

    request1.onsuccess = () => {
      let transaction2 = db.transaction(['hoursOff'], "readwrite");
      let objectStore2 = transaction2.objectStore('hoursOff');

      let request2 = objectStore2.clear();

      request2.onsuccess = initSync;

      request2.onerror = function() {
        confirm("Old records (hours off) couldn't be erased, sync anyway?") ? initSync() : false;
      }

    }

    request1.onerror = function() {
      confirm("Old records (working hours) couldn't be erased, sync anyway?") ? initSync() : false;
    }
    
  }
  
}

function updateClipboard(newClip) {
  navigator.clipboard.writeText(newClip).then(function() {
    let notice = document.querySelector('#notice');
    notice.innerText = "Data copied to clipboard!";
    setTimeout(_ => {
      notice.innerText = '';
    }, 3000)
    /* clipboard successfully set */
  }, function() {
    alert('Writing to clipboard not allowed, please copy the data manually!')
    /* clipboard write failed */
  });
}