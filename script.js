var globalAttributes = {};

function initUI() {

  document.querySelector('#hoursEntry').querySelector("input[type='date']").value = new Date().toDateInputValue();

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

Date.prototype.toDateInputValue = (function () {
  var local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
});

function newHoursEntry() {

  document.querySelector('#hoursEntry').style.height = 'calc( 3 * var(--hourDiffHeight)';

}

function newHolidaysEntry() {

  document.querySelector('#holidaysEntry').style.height = 'calc( 3 * var(--hourDiffHeight)';

}

var db;

function initDB() {
  return new Promise(function (resolve, reject) {

    var request = window.indexedDB.open("hourBook", 4);

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
        let firstDay = '2018-10-22'; // The first working day ever
        let firstDayHours = 2 // The amount of hours you've worked on your first day
        // addRecord(firstDay, firstDayHours);
      } catch (e) {
        console.log("Object store already exists");
      }

      try {
        let holidays = db.createObjectStore("daysOff", { keyPath: "startDate" });
        let timeOff = holidays.createIndex("by_timeOff", "timeOff", { unique: false });
      } catch (e) {
        console.log("Object store already exists");
      }

    };

  });
}

function getDay(date) {

  let tx = db.transaction(['days'], "readonly");
  let txObj = tx.objectStore('days');

  let request = txObj.get(date);
  request.onsuccess = function () {
    let matching = request.result;
    if (matching !== undefined) {
      // A match was found.
      console.log(matching.date + ", " + matching.hours);
    } else {
      // No match was found.
      console.log("No matching record!");
    }
  };

}

function addDay(date, hours) {
  return new Promise((resolve, reject) => {

    if (isNaN(hours)) {
      alert("The amount of hours you put is not a number!");
    } else {

      let tx = db.transaction(['days'], "readwrite");
      let txObj = tx.objectStore('days');

      console.log(date + ", " + hours);
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

function addHolidays(date, timeOff) {

  if (isNaN(timeOff)) {
    alert("The amount of days off you've put is not a number!");
  } else {

    let tx = db.transaction(['daysOff'], "readwrite");
    let txObj = tx.objectStore('daysOff');

    console.log(date + ", " + timeOff);
    let request = txObj.put({ startDate: date, timeOff: Number(timeOff) });

    request.onsuccess = function () {
      console.log("Success!");
      // window.location.reload();
    }

  }

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

function getDaysOff() {
  return new Promise(function (resolve, reject) {

    let transaction = db.transaction(['daysOff'], "readonly");
    let objectStore = transaction.objectStore('daysOff');

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

      getDaysOff().then(daysOffResponse => {

        console.log(daysOffResponse);
        let countDaysOff = 0;
        for (let day in daysOffResponse) {
          day = daysOffResponse[day];
          let currentDate = new Date(day.startDate);
          let difference = Math.round((currentDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));
          console.log(difference);
          console.log(day, !(difference < 0 && (difference + day.timeOff) < 1));

          if (!((difference + day.timeOff) < 1)) {
            if (difference < 0) {
              countDaysOff += difference + day.timeOff; // difference is negative, add only the days that go beyond the first day
            } else {
              if (!(Math.round((today.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000)) - day.timeOff + 1 < 0)) { // holiday is not in the future
                if (Math.round((today.getTime() - currentDate.getTime() + (day.timeOff - 1) * 86400000) / (24 * 60 * 60 * 1000)) < 0) { // some holidays in the future
                  countDaysOff += day.timeOff + Math.round((today.getTime() - currentDate.getTime() + (day.timeOff - 1) * 86400000) / (24 * 60 * 60 * 1000)); // add remainder of holidays
                } else {
                  countDaysOff += day.timeOff
                }
              }
            }
          }
        }

        globalAttributes.daysOff = countDaysOff;

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
        console.log(globalAttributes.daysOff);
        let totalDays = Math.round(Math.abs((firstDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))) - globalAttributes.daysOff;
        // let totalRequiredHours = totalDays*(hoursPerWeek/7);
        let totalRequiredHours = Math.ceil(totalDays / 7) * hoursPerWeek;
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

  console.log(events);

  events.map(async event => await addDay(event.date, event.duration));

  updateUI();

  document.querySelector('#gcLoader').remove();

}

async function exportToProzHelper(month) {

  let allDays = await getAllHours();

  let monthDays = allDays.filter(day => {

    return (new Date(day.date)).getMonth() == month;

  });

  let outputString = "";

  outputString += ";;6220";
  outputString += "\n";

  outputString += "\n";

  for (let day of monthDays) {

    outputString += day.date.getFullYear() + '-';
    outputString += day.date.getMonth() < 9 ? "0" + parseInt(day.date.getMonth()) + parseInt(1) : parseInt(day.date.getMonth()) + parseInt(1);
    outputString += '-';
    outputString += day.date.getDate();

    outputString += ';';

    outputString += day.hours;

    outputString += "\n";

  }

  alert(outputString);

  return outputString;

}