let db;
const request = indexedDB.open("budget_tracker", 1);
// this happens if the db version changes
request.onupgradeneeded = function (event) {
  //save reference to db
  const db = event.target.result;
  //create object store (table) with auto-incrementing primary key
  db.createObjectStore("new_entry", { autoIncrement: true });
};
request.onsuccess = function (event) {
  //save reference to db in global variable when db and object store are succesfully created
  db = event.target.result;
  //check if app is online
  if (navigator.onLine) {
    uploadEntry();
  }
};
request.onerror = function (event) {
  console.log(event.target.errorCode);
};
function saveRecord(record) {
  //open a new transaction with the db w/ read/write permissions
  const transaction = db.transaction(["new_entry"], "readwrite");
  //access `new_entry` object store
  const entryObjectStore = transaction.objectStore("new_entry");
  //add record to object store with add method
  entryObjectStore.add(record);
}

function uploadEntry() {
  const transaction = db.transaction(["new_entry"], "readwrite");

  const entryObjectStore = transaction.objectStore("new_entry");

  const getAll = entryObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(["new_entry"], "readwrite");
          const entryObjectStore = transaction.objectStore("new_entry");
          entryObjectStore.clear();

          alert("All saved entries have been submitted");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

//listen for app coming back online

window.addEventListener("online", function () {
  console.log("test");
});
