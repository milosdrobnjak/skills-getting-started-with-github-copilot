document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function createParticipantMarkup(activityName, participants) {
    if (!participants.length) {
      return `
        <div class="participants-empty">No students signed up yet.</div>
      `;
    }

    const participantItems = participants
      .map(
        (participant) => `
          <li class="participant-item">
            <span class="participant-name">${escapeHtml(participant)}</span>
            <button
              type="button"
              class="participant-remove"
              data-activity="${encodeURIComponent(activityName)}"
              data-email="${encodeURIComponent(participant)}"
              aria-label="Remove ${escapeHtml(participant)} from ${escapeHtml(activityName)}"
              title="Unregister participant"
            >
              &times;
            </button>
          </li>
        `
      )
      .join("");

    return `
      <ul class="participants-list">
        ${participantItems}
      </ul>
    `;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];

        const spotsLeft = details.max_participants - participants.length;
        const participantCountLabel = `${participants.length} participant${
          participants.length === 1 ? "" : "s"
        }`;

        activityCard.innerHTML = `
          <div class="activity-card-header">
            <h4>${escapeHtml(name)}</h4>
            <span class="spots-pill">${spotsLeft} spots left</span>
          </div>
          <p class="activity-description">${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <div class="participants-section">
            <div class="participants-title-row">
              <strong>Participants</strong>
              <span class="participants-count">${participantCountLabel}</span>
            </div>
            ${createParticipantMarkup(name, participants)}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");

    if (!removeButton) {
      return;
    }

    const activity = decodeURIComponent(removeButton.dataset.activity || "");
    const email = decodeURIComponent(removeButton.dataset.email || "");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Failed to remove participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
