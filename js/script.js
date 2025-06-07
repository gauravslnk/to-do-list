
      // Retrieve todo from local storage or initialize an empty array
      let todo = JSON.parse(localStorage.getItem("todo")) || [];
      let currentFilter = "all";
      let sortAsc = true;
      let searchTerm = "";

      const todoInput = document.getElementById("todoInput");
      const todoList = document.getElementById("todoList");
      const todoCount = document.getElementById("todoCount");
      const addButton = document.querySelector(".btn");
      const deleteButton = document.getElementById("deleteButton");
      const filters = document.querySelectorAll(".filter");
      const sortButton = document.getElementById("sortButton");
      const themeSwitcher = document.getElementById("themeSwitcher");
      const searchInput = document.getElementById("searchInput");
      const clearBtn = document.getElementById("clearSearch");

      // Initialize
      document.addEventListener("DOMContentLoaded", function () {
        // Set initial theme based on preference
        if (localStorage.getItem("darkMode") === "enabled") {
          document.body.classList.add("dark-mode");
          themeSwitcher.checked = true;
        }

        addButton.addEventListener("click", addTask);
        todoInput.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            addTask();
          }
        });
        
        deleteButton.addEventListener("click", deleteAllTasks);
        
        filters.forEach((btn) => {
          btn.addEventListener("click", () => {
            filters.forEach(f => f.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            displayTasks();
          });
        });
        
        sortButton.addEventListener("click", toggleSort);
        themeSwitcher.addEventListener("change", toggleDarkMode);
        
        // Search functionality
        searchInput.addEventListener("input", handleSearch);
        clearBtn.addEventListener("click", clearSearch);
        searchInput.addEventListener("keydown", function(e) {
          if (e.key === "Enter") {
            scrollToFirstMatch();
          }
        });

        displayTasks();
      });

function addTask() {
  const newTask = todoInput.value.trim();
  const dueDateInput = document.getElementById("dueDate").value;

  if (newTask !== "") {
    todo.push({
      text: newTask,
      disabled: false,
      date: Date.now(),
      due: dueDateInput || null,
      id: Date.now().toString(),
      syncedToGoogle: false // Add this flag
    });
    saveToLocalStorage();
    todoInput.value = "";
    document.getElementById("dueDate").value = "";
    displayTasks();
  }
  todoInput.focus();
}


      function handleSearch() {
        searchTerm = searchInput.value.toLowerCase();
        clearBtn.classList.toggle("visible", searchTerm.length > 0);
        displayTasks();
      }

      function clearSearch() {
        searchInput.value = "";
        searchTerm = "";
        clearBtn.classList.remove("visible");
        displayTasks();
      }

      function scrollToFirstMatch() {
        if (searchTerm) {
          const firstVisibleTask = document.querySelector("#todoList li:not([style*='display: none'])");
          if (firstVisibleTask) {
            firstVisibleTask.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }

      function toggleSort() {
        sortAsc = !sortAsc;
        sortButton.textContent = sortAsc ? "Sort A-Z" : "Sort Z-A";
        displayTasks();
      }

      function displayTasks() {
        todoList.innerHTML = "";
        
        if (todo.length === 0) {
          const emptyState = document.createElement("li");
          emptyState.textContent = "No tasks found";
          emptyState.classList.add("empty-state");
          todoList.appendChild(emptyState);
          todoCount.textContent = "0";
          return;
        }

        let filtered = [...todo];

        // Apply search filter
        if (searchTerm) {
          filtered = filtered.filter(item => 
            item.text.toLowerCase().includes(searchTerm)
          );
        }

        // Apply status filter
        if (currentFilter === "active") {
          filtered = filtered.filter(item => !item.disabled);
        } else if (currentFilter === "completed") {
          filtered = filtered.filter(item => item.disabled);
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const comparison = a.text.localeCompare(b.text);
          return sortAsc ? comparison : -comparison;
        });

        // Display tasks
        if (filtered.length === 0) {
          const emptyState = document.createElement("li");
          emptyState.textContent = "No tasks match your criteria";
          emptyState.classList.add("empty-state");
          todoList.appendChild(emptyState);
        } else {
          filtered.forEach((item) => {
            const li = document.createElement("li");
            li.dataset.id = item.id;
            li.classList.add("task");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = item.disabled;
            checkbox.classList.add("todo-checkbox");
            checkbox.addEventListener("change", () => toggleTask(item.id));

            const textSpan = document.createElement("span");
            textSpan.classList.add("todo-text");
            if (item.disabled) {
              textSpan.classList.add("disabled");
            }
            
            // Highlight search matches
            if (searchTerm) {
              const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
              textSpan.innerHTML = item.text.replace(regex, "<mark>$1</mark>");
            } else {
              textSpan.textContent = item.text;
            }
            
            textSpan.addEventListener("click", () => editTask(item.id));

            const delBtn = document.createElement("button");
            delBtn.innerHTML = "&times;";
            delBtn.classList.add("delete-btn");
            delBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              deleteTask(item.id);
            });

            const todoContainer = document.createElement("div");
            todoContainer.classList.add("todo-item");
            todoContainer.appendChild(checkbox);
            todoContainer.appendChild(textSpan);

            const dueSpan = document.createElement("span");
dueSpan.classList.add("due-date");
if (item.due) {
  const formatted = new Date(item.due).toLocaleString();
  dueSpan.textContent = `📅 Due: ${formatted}`;
}
todoContainer.appendChild(dueSpan);


            li.appendChild(todoContainer);
            li.appendChild(delBtn);
            todoList.appendChild(li);
          });
        }

        todoCount.textContent = filtered.length;
      }

      function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      function editTask(taskId) {
        const taskIndex = todo.findIndex(item => item.id === taskId);
        if (taskIndex === -1) return;

        const taskItem = document.querySelector(`li[data-id="${taskId}"] .todo-text`);
        const currentText = todo[taskIndex].text;

        const inputElement = document.createElement("input");
        inputElement.type = "text";
        inputElement.value = currentText;
        inputElement.classList.add("edit-input");

        taskItem.replaceWith(inputElement);
        inputElement.focus();

        function saveEdit() {
          const updatedText = inputElement.value.trim();
          if (updatedText && updatedText !== currentText) {
            todo[taskIndex].text = updatedText;
            saveToLocalStorage();
          }
          displayTasks();
        }

        inputElement.addEventListener("blur", saveEdit);
        inputElement.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            saveEdit();
          }
        });
      }

function toggleTask(taskId) {
  const taskIndex = todo.findIndex(item => item.id === taskId);
  if (taskIndex !== -1) {
    todo[taskIndex].disabled = !todo[taskIndex].disabled;
    saveToLocalStorage();
    displayTasks();
  }
}

function deleteTask(taskId) {
  todo = todo.filter(item => item.id !== taskId);
  saveToLocalStorage();
  displayTasks();
}

function deleteAllTasks() {
  if (confirm("Are you sure you want to delete all tasks?")) {
    todo = [];
    saveToLocalStorage();
    displayTasks();
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
    document.getElementById("themeSwitcher").textContent = "Light Mode";
  } else {
    localStorage.setItem("darkMode", "disabled");
    document.getElementById("themeSwitcher").textContent = "Dark Mode";
  }
  document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

}

// Load saved mode on page load
window.onload = function () {
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    document.getElementById("themeSwitcher").textContent = "Light Mode";
  }
  document
    .getElementById("themeSwitcher")
    .addEventListener("click", toggleDarkMode);
};


function saveToLocalStorage() {
  localStorage.setItem("todo", JSON.stringify(todo));
}