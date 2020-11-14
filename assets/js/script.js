var tasks = {};

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

  // Bring element into focus
  dateInput.trigger("focus");
});

// When user clicks out of date, save and change back to span
$(".list-group").on("blur", "input[type='text']", function()
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
});

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
