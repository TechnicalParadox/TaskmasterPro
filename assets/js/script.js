var tasks = {};

var auditTask = function(task)
{
  let now = moment();
  let dueDate = $(task).find("span").text().trim();
  dueDate = moment(dueDate, "MM/DD/YYYY");

  let hoursTilDue = dueDate.diff(now, "hours")

  // remove classes in case date changes
  task.removeClass("list-group-item-warning list-group-item-danger");

  if (hoursTilDue <= 72 && hoursTilDue > 24)
    task.addClass("list-group-item-warning");
  else if (hoursTilDue <= 24)
    task.addClass("list-group-item-danger");
}

// Audit the tasks every hour
setInterval(function()
{
  $(".card .list-group-item").each(function(index, el)
  {
    auditTask(el);
  });
}, 3600000); // 3.6e+6ms = 1hr

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

/** When user clicks on task description, convert to <textarea> and allow editing */
$(".list-group").on("click", "p", function()
{
  // Get the current description from the clicked <p>
  var text = $(this)
    .text()
    .trim();

  // Create <textarea> element, and prepare for use to edit task desc
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);

  // Replace the clicked <p> with generated <textarea>
  $(this).replaceWith(textInput);

  // Automatically focus the cursor to the text area
  textInput.trigger("focus");
});

/** revert text input back to <p> on loss of focus */
$(".list-group").on("blur", "textarea", function() {
  // Get the textareas current value/text
  let value = $(this)
    .val()
    .trim();
  // Get the parent ul's id attribute
  let parID = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  // Get the tasks position in the list of other li elements
  let index = $(this)
    .closest(".list-group-item")
    .index();

  // Update the tasks list with the new description
  tasks[parID][index].text = value;
  saveTasks();

  // Convert the <textarea> back to a <p> with the updated task description
  var taskP = $("<p>")
    .addClass("m-1")
    .text(value);
  $(this).replaceWith(taskP);
});

// When the user clicks a due date, allow editing of date
$(".list-group").on("click", "span", function()
{
  // get current task date
  let date = $(this).text().trim();

  // Create new input element
  let dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // Swap out the <span> for the new <input>
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker(
    {
      minDate: 0,
      onClose: function()
      {
        // When callendar is closed, force a "change" event on the dateInput
        $(this).trigger("change");
      }
    }
  );

  // Bring element into focus
  dateInput.trigger("focus");
});

// When user clicks out of date, save and change back to span
$(".list-group").on("change", "input[type='text']", function()
{
  // get current text
  let date = $(this).val().trim();

  // get parent ul's id attribute
  let parID = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // Get the task's position in the list of other li's
  let index = $(this)
    .closest(".list-group-item")
    .index();

  // Update task in array and resave to localStorage
  tasks[parID][index].date = date;
  saveTasks();

  // recreate span with bootstrap classes
  let dateSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // Replace <input> with <span> element
  $(this).replaceWith(dateSpan);

  // Audit the task, in case urgency changes with date change
  auditTask($(dateSpan).closest(".list-group-item"));
});

// Make the list groups sortable (drag/drop)
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  update: function(event) {
    let tempArr = [];

    // Loop through each child of the list group (list-group-item) and push its text/date to the temp array
    $(this).children().each(function() {
      let text = $(this).find("p").text().trim();
      let date = $(this).find("span").text().trim();

      tempArr.push({
        text: text,
        date: date
      });
    });

    // Get task list name from list group ID
    let arrName = $(this).attr("id").replace("list-", "");

    // Update tasks array and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

// Make the trash a droppable area that deletes items
$("#trash").droppable(
{
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui)
  {
    ui.draggable.remove();
  }
});

// add datepicker to modal due date field
$("#modalDueDate").datepicker({minDate: 0});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();
