function createActivityCard(activity, name) {
  return `
    <div class="activity-card">
      <h2>${escapeHtml(name)}</h2>
      <p class="activity-desc">${escapeHtml(activity.description)}</p>
      <p class="activity-schedule"><strong>Schedule:</strong> ${escapeHtml(activity.schedule)}</p>
      <p class="activity-spots"><strong>Available Spots:</strong> ${activity.max_participants - activity.participants.length} / ${activity.max_participants}</p>

      <div class="participants-section">
        <p class="participants-header">Current Participants</p>
        <ul class="participants-list">
          ${activity.participants.length ? activity.participants.map(email => `<li>${escapeHtml(email)}</li>`).join('') : `<li class="no-participants">No participants yet</li>`}
        </ul>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  loadActivities();
  setupSignupForm();
});

async function loadActivities() {
  try {
    const res = await fetch("/activities");
    if (!res.ok) throw new Error("Failed to load activities");
    const activities = await res.json();
    renderActivities(activities);
    populateActivityOptions(activities);
  } catch (err) {
    showMessage(err.message || "Could not load activities", true);
  }
}

function renderActivities(activities) {
  const container = document.getElementById("activities-list");
  if (!container) return;
  // Use createActivityCard defined in index.html
  container.innerHTML =
    Object.keys(activities)
      .map((name) => createActivityCard(activities[name], name))
      .join("") || "<p>No activities available.</p>";
}

function populateActivityOptions(activities) {
  const select = document.getElementById("activity");
  if (!select) return;
  select.innerHTML =
    '<option value="">-- Select an activity --</option>' +
    Object.keys(activities)
      .map(
        (name) =>
          `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`
      )
      .join("");
}

function setupSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;
    if (!email || !activity) {
      showMessage("Please enter an email and choose an activity", true);
      return;
    }
    await signUp(activity, email);
  });
}

// Exposed globally so inline onclick in createActivityCard can call it
async function signUp(activityName, email) {
  if (!activityName || !email) {
    showMessage("Missing activity or email", true);
    return;
  }
  try {
    const url = `/activities/${encodeURIComponent(
      activityName
    )}/signup?email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data.detail || data.message || "Sign up failed");
    showMessage(data.message || `Signed up ${email} for ${activityName}`, false);
    await loadActivities(); // refresh to show updated participants
  } catch (err) {
    showMessage(err.message || "Error signing up", true);
  }
}

function showMessage(text, isError = false) {
  const el = document.getElementById("message");
  if (!el) return;
  el.textContent = text;
  el.className = isError ? "message error" : "message success";
  el.style.display = "block";
  clearTimeout(showMessage._timeout);
  showMessage._timeout = setTimeout(() => {
    el.style.display = "none";
  }, 4000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
