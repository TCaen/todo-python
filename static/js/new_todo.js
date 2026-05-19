import { createTodo } from "./api.js";

const form = document.getElementById("new-todo-form");
const errorMsg = document.getElementById("error-msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title       = document.getElementById("input-title").value.trim();
  const description = document.getElementById("input-description").value.trim();
  const priority    = document.getElementById("input-priority").value;
  const category    = document.getElementById("input-category").value.trim();

  const result = await createTodo({ title, description, priority, category });

  if (result) {
    window.location.href = "/";
  } else {
    errorMsg.textContent = "Une erreur est survenue, veuillez réessayer.";
    errorMsg.hidden = false;
  }
});
