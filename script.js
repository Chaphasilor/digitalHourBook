Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

function newHoursEntry() {
  
  document.querySelector('#hoursEntry').style.height = 'calc( 3 * var(--hourDiffHeight)';
  
}

function newHolidaysEntry() {
  
  document.querySelector('#holidaysEntry').style.height = 'calc( 3 * var(--hourDiffHeight)';
  
}

var db;

function initDB() {
  return new Promise(function(resolve, reject) {
    
    var request = window.indexedDB.open("hourBook", 4);
    
    request.onsuccess = function(event) {
            
      db = event.target.result;
      
      db.onerror = function(event) {
        reject("Database error: " + event.target.errorCode);
      }
      
      resolve("DB opened successfully!");
      
    }
    
    request.onerror = function() {
      reject("Couldn't open DB!");
    }
    
    request.onupgradeneeded = function (event) {
  
      var db = event.target.result;
      
      try {
        let days = db.createObjectStore("days", {keyPath: "date"});
        let hours = days.createIndex("by_hours", "hours", {unique: false});
        let firstDay = '2018-10-22'; // The first working day ever
        let firstDayHours = 2 // The amount of hours you've worked on your first day
        // addRecord(firstDay, firstDayHours);
      } catch(e) {
        console.log("Object store already exists");
      }
      
      try {
        let holidays = db.createObjectStore("daysOff", {keyPath: "startDate"});
        let timeOff = holidays.createIndex("by_timeOff", "timeOff", {unique: false});
      } catch(e) {
        console.log("Object store already exists");
      }
      
    };
    
  });
}

function getDay(date) {

  let tx = db.transaction(['days'], "readonly");
  let txObj = tx.objectStore('days');

  let request = txObj.get(date);
  request.onsuccess = function() {
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
  
  if (isNaN(hours)) {
    alert("The amount of hours you put is not a number!");
  } else {

    let tx = db.transaction(['days'], "readwrite");
    let txObj = tx.objectStore('days');

    console.log(date+", "+hours);
    let request = txObj.put({date: date, hours: Number(hours)});

    request.onsuccess = function() {
      console.log("Success!");
    }
    
  }

}

function deleteDay(date) {

  let tx = db.transaction(['days'], "readwrite");
  let txObj = tx.objectStore('days');

  let request = txObj.delete(date);

  request.onsuccess = function() {
    console.log("Success!");
  }

}

function addHolidays(date, timeOff) {
  
    if (isNaN(timeOff)) {
      alert("The amount of days off you've put is not a number!");
    } else {
  
      let tx = db.transaction(['daysOff'], "readwrite");
      let txObj = tx.objectStore('daysOff');
  
      console.log(date+", "+timeOff);
      let request = txObj.put({startDate: date, timeOff: Number(timeOff)});
  
      request.onsuccess = function() {
        console.log("Success!");  
      }
      
    }
  
}

function getAllHours() {
  return new Promise(function(resolve, reject) {
    
    let transaction = db.transaction(['days'], "readonly");
    let objectStore = transaction.objectStore('days');
    
    let request = objectStore.getAll();
    
    request.onsuccess = function() {
      resolve(request.result);
    }
  
  });
}

function calculateOvertime() {
  return new Promise(function(resolve, reject) {
    
    getAllHours().then(function(dayResponse) {
      
      console.log(dayResponse);
      
      let totalHours = 0;
      
      let firstDate = new Date(dayResponse[0].date);
      let lastDate;
      let today = new Date(Date.now());
      
      for (let currentDay in dayResponse) {
        totalHours += dayResponse[currentDay].hours;
        lastDate = new Date(dayResponse[currentDay].date);
      }
      
      let hoursPerWeek = 11;    
      // let totalDays = Math.round(Math.abs((firstDate.getTime() - lastDate.getTime())/(24*60*60*1000))+1);
      let totalDays = Math.round(Math.abs((firstDate.getTime() - today.getTime())/(24*60*60*1000)));
      // let totalRequiredHours = totalDays*(hoursPerWeek/7);
      let totalRequiredHours = Math.ceil(totalDays*(hoursPerWeek/7));
      let overtime = totalHours - totalRequiredHours;
      
      console.log('Total Days: ' + totalDays);   
      console.log('Required Hours: ' + totalRequiredHours);
      console.log('Actual Hours: ' + totalHours);
      console.log('Overtime: ' + overtime);
      
      resolve(overtime);
      
    });
    
  });  
}