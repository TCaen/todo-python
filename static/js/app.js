// =============================================================================
// app.js — Rendu et événements de l'interface Todo List
// =============================================================================

import { fetchTodos, fetchCategories, createTodo, updateTodo, deleteTodo } from "./api.js";

let currentFilter = "all";

const STATE_LABELS = {
  todo:   "À faire",
  done:   "Terminé",
  forgot: "Oublié",
};

const PRIORITY_LABELS = {
  urgent:     "Urgent",
  important:  "Important",
  secondaire: "Secondaire",
};


// =============================================================================
// RENDU
// =============================================================================

function renderCategories(categories) {
  const container = document.getElementById("category-filters");
  const allBtn = container.querySelector('[data-category="all"]');
  container.innerHTML = "";
  container.appendChild(allBtn);

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (currentFilter === cat ? " active" : "");
    btn.dataset.category = cat;
    btn.textContent = cat;
    container.appendChild(btn);
  });

  allBtn.className = "filter-btn" + (currentFilter === "all" ? " active" : "");
}

function renderTodoView(todo, li) {
  li.className = `todo-item state-${todo.state} priority-${todo.priority}`;

  const priorityBadge = document.createElement("span");
  priorityBadge.className = `priority-badge ${todo.priority}`;
  priorityBadge.textContent = PRIORITY_LABELS[todo.priority];

  const content = document.createElement("div");
  content.className = "todo-content";

  const title = document.createElement("span");
  title.className = "todo-title";
  title.textContent = todo.title;
  content.appendChild(title);

  if (todo.description) {
    const desc = document.createElement("span");
    desc.className = "todo-description";
    desc.textContent = todo.description;
    content.appendChild(desc);
  }

  if (todo.category) {
    const badge = document.createElement("span");
    badge.className = "todo-category";
    badge.textContent = todo.category;
    content.appendChild(badge);
  }

  const stateSelect = document.createElement("select");
  stateSelect.className = "state-select";
  Object.entries(STATE_LABELS).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = (value === todo.state);
    stateSelect.appendChild(option);
  });

  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.textContent = "✏️";
  editBtn.title = "Modifier";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "×";
  deleteBtn.title = "Supprimer";

  li.appendChild(priorityBadge);
  li.appendChild(content);
  li.appendChild(stateSelect);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);
}

function renderEditForm(todo, li) {
  li.className = "todo-item editing";
  li.innerHTML = "";

  const form = document.createElement("div");
  form.className = "edit-form";

  const row1 = document.createElement("div");
  row1.className = "edit-form-row";

  const inputTitle = document.createElement("input");
  inputTitle.type = "text";
  inputTitle.value = todo.title;
  inputTitle.placeholder = "Titre";
  inputTitle.required = true;

  const inputDesc = document.createElement("input");
  inputDesc.type = "text";
  inputDesc.value = todo.description || "";
  inputDesc.placeholder = "Description (optionnel)";

  row1.appendChild(inputTitle);
  row1.appendChild(inputDesc);

  const row2 = document.createElement("div");
  row2.className = "edit-form-row";

  const selectPriority = document.createElement("select");
  Object.entries(PRIORITY_LABELS).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = (value === todo.priority);
    selectPriority.appendChild(option);
  });

  const inputCategory = document.createElement("input");
  inputCategory.type = "text";
  inputCategory.value = todo.category || "";
  inputCategory.placeholder = "Catégorie (optionnel)";

  row2.appendChild(selectPriority);
  row2.appendChild(inputCategory);

  const actions = document.createElement("div");
  actions.className = "edit-form-actions";

  const btnSave = document.createElement("button");
  btnSave.className = "btn-save";
  btnSave.textContent = "Enregistrer";

  const btnCancel = document.createElement("button");
  btnCancel.className = "btn-cancel";
  btnCancel.textContent = "Annuler";

  btnSave.addEventListener("click", async () => {
    const newTitle = inputTitle.value.trim();
    if (!newTitle) { inputTitle.focus(); return; }
    await updateTodo(todo.id, {
      title: newTitle,
      description: inputDesc.value.trim(),
      priority: selectPriority.value,
      category: inputCategory.value.trim(),
    });
    await refresh();
  });

  btnCancel.addEventListener("click", () => refresh());

  actions.appendChild(btnSave);
  actions.appendChild(btnCancel);
  form.appendChild(row1);
  form.appendChild(row2);
  form.appendChild(actions);
  li.appendChild(form);
  inputTitle.focus();
}

function renderTodos(todos) {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";

  if (todos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Aucune tâche pour le moment.";
    list.appendChild(empty);
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.dataset.id = todo.id;
    renderTodoView(todo, li);
    list.appendChild(li);
  });
}

async function refresh() {
  const [todos, categories] = await Promise.all([
    fetchTodos(currentFilter),
    fetchCategories(),
  ]);
  renderTodos(todos);
  renderCategories(categories);
}


// =============================================================================
// ÉVÉNEMENTS
// =============================================================================

document.getElementById("add-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await createTodo({
    title:       document.getElementById("input-title").value.trim(),
    description: document.getElementById("input-description").value.trim(),
    priority:    document.getElementById("input-priority").value,
    category:    document.getElementById("input-category").value.trim(),
  });
  e.target.reset();
  await refresh();
});

document.getElementById("todo-list").addEventListener("change", async (e) => {
  if (!e.target.classList.contains("state-select")) return;
  const id = e.target.closest(".todo-item").dataset.id;
  await updateTodo(id, { state: e.target.value });
  await refresh();
});

document.getElementById("todo-list").addEventListener("click", async (e) => {
  const li = e.target.closest(".todo-item");
  if (!li) return;

  if (e.target.classList.contains("edit-btn")) {
    const todos = await fetchTodos(currentFilter);
    const todo = todos.find((t) => t.id === li.dataset.id);
    if (todo) renderEditForm(todo, li);
    return;
  }

  if (e.target.classList.contains("delete-btn")) {
    await deleteTodo(li.dataset.id);
    await refresh();
  }
});

document.getElementById("category-filters").addEventListener("click", async (e) => {
  if (!e.target.classList.contains("filter-btn")) return;
  currentFilter = e.target.dataset.category;
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  e.target.classList.add("active");
  await refresh();
});


// =============================================================================
// INITIALISATION
// =============================================================================

refresh();
