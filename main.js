/**
 * ============================================================
 * LOCAL COMMUNITY EVENT PORTAL — main.js
 * Author: Community Hub Team
 * Tech: Vanilla JavaScript ES6+, jQuery, Fetch API
 * ============================================================
 *
 * CONTENTS:
 *  1. Constants & Configuration
 *  2. State Management
 *  3. Event Class (OOP / Prototype)
 *  4. Category Tracker (Closure)
 *  5. Data Fetching (Async/Await + Fetch API)
 *  6. DOM Manipulation & Rendering
 *  7. Filtering, Searching, Sorting
 *  8. Event Handlers (Click, Change, Keydown)
 *  9. Registration Form & AJAX POST
 * 10. Toast Notification System
 * 11. Theme Toggle (Dark/Light)
 * 12. LocalStorage Persistence
 * 13. Utility Functions
 * 14. Animated Statistics Counter
 * 15. jQuery Integrations
 * 16. Pagination
 * 17. Navbar & Scroll Behaviors
 * 18. Initialization
 */

// ============================================================
// 1. INITIAL LOG & LOAD ALERT
// ============================================================

console.log("Welcome to the Community Portal");

/**
 * Show an alert when the window fully loads.
 * Demonstrates: window.addEventListener, arrow function
 */
window.addEventListener("load", () => {
  console.log("✅ Community Portal Loaded Successfully");
  // Uncomment the line below to enable the load alert:
  // alert("Community Portal Loaded Successfully");
});

// ============================================================
// 2. CONSTANTS & CONFIGURATION
// ============================================================

/**
 * Using 'const' for values that never change.
 * Demonstrates: const, template literals, ES6 config objects
 */
const CONFIG = {
  EVENTS_URL: "./events.json",           // Local JSON data source
  API_POST_URL: "https://jsonplaceholder.typicode.com/posts", // Mock API
  ITEMS_PER_PAGE: 6,                     // Events shown per page
  SKELETON_DELAY_MS: 1200,               // Simulated network delay (ms)
  TOAST_DURATION_MS: 4000,               // Toast auto-dismiss time
  ANIMATION_DELAY_MS: 1500,             // Stats counter animation trigger
};

/**
 * Category to emoji mapping — using Object literal
 * Demonstrates: Object literals, const
 */
const CATEGORY_EMOJI = {
  "Music": "🎵",
  "Technology": "💻",
  "Sports": "⚽",
  "Food": "🍜",
  "Workshop": "🎨",
  "Community Service": "🤝",
};

// ============================================================
// 3. STATE MANAGEMENT (Centralized)
// ============================================================

/**
 * Application state object.
 * Demonstrates: let for mutable state, object destructuring later
 */
let appState = {
  allEvents: [],            // Raw events array from JSON
  filteredEvents: [],       // Events after applying filters
  registeredEvents: new Set(), // Set of registered event IDs
  favoritedEvents: new Set(),  // Set of favorited event IDs
  totalRegistrations: 0,    // Global registration counter
  currentPage: 1,           // Pagination state
  currentView: "grid",      // "grid" or "list"
  theme: "dark",            // "dark" or "light"
  filters: {
    search: "",
    category: "all",
    location: "all",
    sort: "date-asc",
  },
};

// ============================================================
// 4. EVENT CLASS & PROTOTYPE (OOP)
// ============================================================

/**
 * ES6 Class for Event objects.
 * Demonstrates: class, constructor, methods, prototype, this keyword
 */
class CommunityEvent {
  constructor(id, title, description, category, location, date, seats, image, organizer, price, time) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.category = category;
    this.location = location;
    this.date = date;
    this.seats = seats;           // Total seats
    this.availableSeats = seats;  // Available seats (will be decremented)
    this.image = image;
    this.organizer = organizer;
    this.price = price;
    this.time = time;
  }

  /**
   * Prototype method to check if event is available.
   * Demonstrates: prototype method, return values, conditionals
   */
  checkAvailability() {
    if (this.availableSeats <= 0) return "full";
    if (this.availableSeats <= 10) return "limited";
    return "available";
  }

  /**
   * Prototype method to get a formatted date string.
   * Demonstrates: Date object, template literals
   */
  getFormattedDate() {
    const dateObj = new Date(this.date);
    return dateObj.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Prototype method to check if event is in the future.
   * Demonstrates: Date comparison, conditionals
   */
  isUpcoming() {
    return new Date(this.date) > new Date();
  }

  /**
   * Prototype method to display event key-value pairs.
   * Demonstrates: Object.entries()
   */
  displayDetails() {
    console.group(`📅 Event: ${this.title}`);
    Object.entries(this).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.groupEnd();
  }
}

// ============================================================
// 5. CLOSURES — Category Registration Tracker
// ============================================================

/**
 * Factory function using CLOSURE to track registrations per category.
 * Each category gets its own private 'total' variable.
 * Demonstrates: closures, factory functions, encapsulation
 */
function categoryTracker(category) {
  let total = 0; // Private variable — not accessible outside

  return {
    /**
     * Increment and return total for this category
     * @returns {number} Updated total
     */
    increment() {
      total++;
      console.log(`📊 [Tracker] ${category}: ${total} registration(s)`);
      return total;
    },

    /**
     * Get current total without incrementing
     * @returns {number} Current total
     */
    getTotal() {
      return total;
    },

    /**
     * Get category name
     * @returns {string} Category name
     */
    getCategory() {
      return category;
    }
  };
}

/**
 * Initialize trackers for all categories using reduce().
 * Demonstrates: Array.reduce(), Object.fromEntries()
 */
const categoryTrackers = Object.fromEntries(
  Object.keys(CATEGORY_EMOJI).map(cat => [cat, categoryTracker(cat)])
);

// ============================================================
// 6. UTILITY FUNCTIONS
// ============================================================

/**
 * Debounce utility — prevents rapid repeated function calls.
 * Used for live search (keydown) to avoid excessive filtering.
 * Demonstrates: closures, setTimeout, clearTimeout
 *
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Safely get element by ID.
 * Demonstrates: try-catch, error handling, defensive coding
 *
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
function getEl(id) {
  try {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found in DOM`);
    return el;
  } catch (e) {
    console.warn(`⚠️ [getEl] ${e.message}`);
    return null;
  }
}

/**
 * Format a number with commas (Indian numbering system).
 * Demonstrates: Intl API, template literals
 *
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  return new Intl.NumberFormat("en-IN").format(num);
}

/**
 * Get CSS class name for a category.
 * Demonstrates: switch-like object lookup, default parameters
 *
 * @param {string} category
 * @returns {string} CSS class name
 */
function getCategoryClass(category = "") {
  const classMap = {
    "Music": "cat-music",
    "Technology": "cat-technology",
    "Sports": "cat-sports",
    "Food": "cat-food",
    "Workshop": "cat-workshop",
    "Community Service": "cat-community",
  };
  return classMap[category] || "cat-default";
}

/**
 * Get emoji for a category using optional chaining.
 * Demonstrates: optional chaining (?.), nullish coalescing (??)
 *
 * @param {string} category
 * @returns {string} Emoji
 */
const getCategoryEmoji = (category) => CATEGORY_EMOJI?.[category] ?? "📌";

/**
 * Animate a counter from 0 to a target number.
 * Demonstrates: requestAnimationFrame, arithmetic operators, closures
 *
 * @param {HTMLElement} el - Element to update
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms
 */
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16); // ~60fps

  const update = () => {
    start += step;
    if (start < target) {
      el.textContent = formatNumber(Math.floor(start));
      requestAnimationFrame(update);
    } else {
      el.textContent = formatNumber(target);
    }
  };

  requestAnimationFrame(update);
}

/**
 * Check if an element is in the viewport (for intersection observer).
 * Demonstrates: getBoundingClientRect, window properties
 *
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

// ============================================================
// 7. LOCAL STORAGE — Persistence Layer
// ============================================================

/**
 * Load state from LocalStorage on startup.
 * Demonstrates: localStorage, JSON.parse, try-catch
 */
function loadFromStorage() {
  try {
    const saved = localStorage.getItem("communityPortalState");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Restore Sets from arrays (JSON doesn't support Set)
      appState.registeredEvents = new Set(parsed.registeredEvents || []);
      appState.favoritedEvents  = new Set(parsed.favoritedEvents || []);
      appState.totalRegistrations = parsed.totalRegistrations || 0;
      appState.theme = parsed.theme || "dark";
      appState.filters = { ...appState.filters, ...(parsed.filters || {}) };
      console.log("💾 [Storage] State loaded from localStorage");
    }
  } catch (e) {
    console.warn("⚠️ [Storage] Failed to load state:", e.message);
  }
}

/**
 * Save current state to LocalStorage.
 * Demonstrates: localStorage.setItem, JSON.stringify, Sets to arrays
 */
function saveToStorage() {
  try {
    const toSave = {
      registeredEvents: [...appState.registeredEvents],
      favoritedEvents:  [...appState.favoritedEvents],
      totalRegistrations: appState.totalRegistrations,
      theme: appState.theme,
      filters: appState.filters,
    };
    localStorage.setItem("communityPortalState", JSON.stringify(toSave));
  } catch (e) {
    console.warn("⚠️ [Storage] Failed to save state:", e.message);
  }
}

// ============================================================
// 8. DATA FETCHING — Async/Await + Promises
// ============================================================

/**
 * Fetch events using async/await and Fetch API.
 * Also demonstrates .then()/.catch() chain in the wrapper below.
 * Demonstrates: async/await, fetch, try-catch, Promises, error states
 *
 * @returns {Promise<CommunityEvent[]>} Array of CommunityEvent objects
 */
async function fetchEvents() {
  try {
    console.log("🔄 [Fetch] Fetching events from:", CONFIG.EVENTS_URL);

    // Simulated API delay with setTimeout wrapped in Promise
    await new Promise(resolve => setTimeout(resolve, CONFIG.SKELETON_DELAY_MS));

    const response = await fetch(CONFIG.EVENTS_URL);

    // Check HTTP status
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();

    /**
     * Map raw JSON data to CommunityEvent class instances.
     * Demonstrates: .map(), destructuring, spread operator
     */
    const events = rawData.map(({ id, title, description, category, location, date, seats, image, organizer, price, time }) => {
      const event = new CommunityEvent(id, title, description, category, location, date, seats, image, organizer, price, time);

      // Restore registered seats from localStorage
      const saved = JSON.parse(localStorage.getItem("communityPortalState") || "{}");
      const registeredIds = saved.registeredEvents || [];
      if (registeredIds.includes(id)) {
        event.availableSeats = Math.max(0, seats - 1);
      }

      return event;
    });

    console.log(`✅ [Fetch] Loaded ${events.length} events successfully`);
    return events;

  } catch (error) {
    /**
     * Error handling:
     * If fetch fails, show error notification.
     * Demonstrates: try-catch, error propagation, fallback data
     */
    console.error("❌ [Fetch] Error loading events:", error.message);
    showToast("Error", "Failed to load events. Please refresh.", "error");
    return [];
  }
}

/**
 * Alternative: Same fetch using Promise chaining (.then/.catch).
 * This version is kept for educational demonstration.
 * Demonstrates: Promise .then(), .catch(), chaining
 *
 * @returns {Promise<Object[]>}
 */
function fetchEventsPromiseChain() {
  return fetch(CONFIG.EVENTS_URL)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log("📦 [Promise Chain] Events loaded:", data.length);
      return data;
    })
    .catch(error => {
      console.error("❌ [Promise Chain] Error:", error.message);
      return [];
    });
}

// ============================================================
// 9. HIGHER-ORDER FUNCTIONS — Filtering Logic
// ============================================================

/**
 * Filter events by category.
 * Demonstrates: Higher-order function, .filter(), arrow functions
 *
 * @param {CommunityEvent[]} events
 * @param {string} category
 * @returns {CommunityEvent[]}
 */
const filterEventsByCategory = (events, category) =>
  category === "all"
    ? events
    : events.filter(e => e.category === category);

/**
 * Filter events by location.
 * Demonstrates: .filter(), ternary operator
 *
 * @param {CommunityEvent[]} events
 * @param {string} location
 * @returns {CommunityEvent[]}
 */
const filterEventsByLocation = (events, location) =>
  location === "all"
    ? events
    : events.filter(e => e.location === location);

/**
 * Filter events by search query (name, description, organizer).
 * Demonstrates: .filter(), .toLowerCase(), template literals, OR logic
 *
 * @param {CommunityEvent[]} events
 * @param {string} query
 * @returns {CommunityEvent[]}
 */
const filterEventsBySearch = (events, query) => {
  if (!query.trim()) return events;
  const q = query.toLowerCase();
  return events.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.organizer.toLowerCase().includes(q) ||
    e.location.toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q)
  );
};

/**
 * Hide events that are in the past.
 * Demonstrates: .filter(), Date comparison, conditionals
 *
 * @param {CommunityEvent[]} events
 * @returns {CommunityEvent[]}
 */
const filterUpcomingEvents = (events) =>
  events.filter(e => e.isUpcoming());

/**
 * Sort events by the selected sort option.
 * Demonstrates: .sort(), spread operator (clone array), comparator functions
 *
 * @param {CommunityEvent[]} events
 * @param {string} sortBy
 * @returns {CommunityEvent[]}
 */
function sortEvents(events, sortBy) {
  // Use spread to clone array (avoid mutating original)
  const sorted = [...events];

  const comparators = {
    "date-asc":    (a, b) => new Date(a.date) - new Date(b.date),
    "date-desc":   (a, b) => new Date(b.date) - new Date(a.date),
    "seats-asc":   (a, b) => a.availableSeats - b.availableSeats,
    "seats-desc":  (a, b) => b.availableSeats - a.availableSeats,
    "name-asc":    (a, b) => a.title.localeCompare(b.title),
  };

  return sorted.sort(comparators[sortBy] || comparators["date-asc"]);
}

/**
 * Apply ALL filters and sorting to get displayable events.
 * Demonstrates: function composition, chaining function calls
 *
 * @returns {CommunityEvent[]} Filtered + sorted events
 */
function applyFilters() {
  const { search, category, location, sort } = appState.filters;

  let result = [...appState.allEvents];

  // Step 1: Show only upcoming events (hide past events)
  result = filterUpcomingEvents(result);

  // Step 2: Apply category filter
  result = filterEventsByCategory(result, category);

  // Step 3: Apply location filter
  result = filterEventsByLocation(result, location);

  // Step 4: Apply search query
  result = filterEventsBySearch(result, search);

  // Step 5: Sort results
  result = sortEvents(result, sort);

  appState.filteredEvents = result;
  appState.currentPage = 1; // Reset to first page on filter change

  return result;
}

// ============================================================
// 10. DOM RENDERING — Event Cards
// ============================================================

/**
 * Get paginated slice of filtered events.
 * Demonstrates: .slice(), arithmetic operators, pagination logic
 *
 * @returns {CommunityEvent[]}
 */
function getPaginatedEvents() {
  const { currentPage } = appState;
  const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
  const end = start + CONFIG.ITEMS_PER_PAGE;
  return appState.filteredEvents.slice(start, end);
}

/**
 * Create a single event card DOM element.
 * Demonstrates: createElement, appendChild, template literals, class manipulation
 * Also uses: destructuring, optional chaining, ternary operators, spread operator
 *
 * @param {CommunityEvent} event
 * @param {number} index - For animation delay
 * @returns {HTMLElement}
 */
function createEventCard(event, index = 0) {
  // Destructure event properties — ES6 destructuring
  const { id, title, description, category, location, organizer, price, time } = event;
  const formattedDate = event.getFormattedDate();
  const availability = event.checkAvailability();
  const categoryEmoji = getCategoryEmoji(category);
  const categoryClass = getCategoryClass(category);

  // Derived values — arithmetic and conditional operators
  let availableSeats = event.availableSeats;
  let seats = event.seats;
  let seatsPercent = seats > 0 ? Math.round((availableSeats / seats) * 100) : 0;
  let seatsBarClass = seatsPercent > 50 ? "high" : seatsPercent > 20 ? "medium" : "low";
  let seatsClass = availableSeats <= 5 ? "low-seats" : availableSeats <= 20 ? "medium-seats" : "";
  let seatsLabel = availableSeats <= 0 ? "Sold Out" : `${availableSeats} / ${seats} seats`;

  // Check if registered or favorited
  const isRegistered = appState.registeredEvents.has(id);
  const isFavorited = appState.favoritedEvents.has(id);

  // Determine button state
  const btnText = isRegistered ? "✓ Registered" : "Register";
  const btnClass = isRegistered ? "btn-register registered" : "btn-register";
  const btnDisabled = availability === "full" ? "disabled" : "";

  // Free or paid price display
  const priceDisplay = price === "Free"
    ? `<span class="event-card-price free">🎟 Free</span>`
    : `<span class="event-card-price">🎟 ${price}</span>`;

  // List view hides description in a shorter card
  const inListView = appState.currentView === "list";

  // Create card element
  const card = document.createElement("article");
  card.className = "event-card";
  card.setAttribute("role", "listitem");
  card.setAttribute("data-event-id", id);
  card.style.animationDelay = `${index * 60}ms`;
  card.setAttribute("aria-label", `Event: ${title}`);

  /**
   * Using template literals for inner HTML.
   * Demonstrates: Template literals, multi-line strings, interpolation
   */
  card.innerHTML = `
    <div class="event-card-img-wrapper">
      <div class="event-card-emoji-placeholder" aria-hidden="true">
        ${categoryEmoji}
      </div>
      <div class="event-card-category ${categoryClass}" aria-label="Category: ${category}">
        ${categoryEmoji} ${category}
      </div>
      <button
        class="event-card-fav ${isFavorited ? 'favorited' : ''}"
        data-event-id="${id}"
        aria-label="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}"
        aria-pressed="${isFavorited}"
        title="${isFavorited ? 'Unfavorite' : 'Favorite'}"
      >
        ${isFavorited ? '♥' : '♡'}
      </button>
      <div class="seats-bar-wrapper" aria-hidden="true">
        <div class="seats-bar ${seatsBarClass}" style="width: ${seatsPercent}%"></div>
      </div>
    </div>

    <div class="event-card-body">
      <h3 class="event-card-title">${title}</h3>

      <div class="event-card-meta">
        <span class="meta-item">
          <span class="meta-icon" aria-hidden="true">📅</span>
          <span>${formattedDate}</span>
        </span>
        <span class="meta-item">
          <span class="meta-icon" aria-hidden="true">🕐</span>
          <span>${time}</span>
        </span>
        <span class="meta-item">
          <span class="meta-icon" aria-hidden="true">📍</span>
          <span>${location}</span>
        </span>
        <span class="meta-item">
          <span class="meta-icon" aria-hidden="true">👤</span>
          <span>${organizer}</span>
        </span>
      </div>

      ${!inListView ? `<p class="event-card-desc">${description}</p>` : ''}

      <div class="event-card-footer">
        <div class="event-card-seats">
          <span class="seats-count ${seatsClass}" aria-label="${seatsLabel}">
            ${availableSeats <= 0 ? '🚫 Sold Out' : `💺 ${seatsLabel}`}
          </span>
          <span class="seats-label">Availability</span>
        </div>
        ${priceDisplay}
        <button
          class="${btnClass}"
          data-event-id="${id}"
          ${btnDisabled}
          aria-label="${isRegistered ? `Already registered for ${title}` : `Register for ${title}`}"
        >
          ${btnText}
        </button>
      </div>
    </div>
  `;

  return card;
}

/**
 * Render all event cards into the grid.
 * Demonstrates: .forEach(), DocumentFragment (performance), DOM manipulation
 */
function renderEvents() {
  const grid = getEl("eventsGrid");
  const emptyState = getEl("emptyState");
  const resultsInfo = getEl("resultsInfo");
  if (!grid) return;

  const events = getPaginatedEvents();
  const total = appState.filteredEvents.length;

  // Toggle empty state
  if (total === 0) {
    grid.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    if (resultsInfo) resultsInfo.innerHTML = "";
    renderPagination();
    return;
  }

  grid.style.display = "grid";
  if (emptyState) emptyState.style.display = "none";

  // Results info
  if (resultsInfo) {
    const start = (appState.currentPage - 1) * CONFIG.ITEMS_PER_PAGE + 1;
    const end = Math.min(appState.currentPage * CONFIG.ITEMS_PER_PAGE, total);
    resultsInfo.innerHTML = `Showing <strong>${start}–${end}</strong> of <strong>${total}</strong> event${total !== 1 ? "s" : ""}`;
  }

  /**
   * Use DocumentFragment to batch DOM updates (performance optimization).
   * Demonstrates: DocumentFragment, appendChild, minimize re-renders
   */
  const fragment = document.createDocumentFragment();

  events.forEach((event, index) => {
    const card = createEventCard(event, index);
    fragment.appendChild(card);
  });

  // Clear and repopulate grid
  grid.innerHTML = "";
  grid.appendChild(fragment);

  // Apply view class
  grid.className = `events-grid ${appState.currentView === "list" ? "list-view" : ""}`;

  // Render pagination controls
  renderPagination();

  // Update active filter tags
  renderFilterTags();
}

/**
 * Render pagination buttons.
 * Demonstrates: Math.ceil(), loops, createElement, event delegation
 */
function renderPagination() {
  const container = getEl("pagination");
  if (!container) return;

  const totalPages = Math.ceil(appState.filteredEvents.length / CONFIG.ITEMS_PER_PAGE);

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.className = "page-btn";
  prevBtn.textContent = "←";
  prevBtn.setAttribute("aria-label", "Previous page");
  prevBtn.disabled = appState.currentPage === 1;
  prevBtn.dataset.page = appState.currentPage - 1;
  fragment.appendChild(prevBtn);

  // Page number buttons
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = `page-btn${i === appState.currentPage ? " active" : ""}`;
    btn.textContent = i;
    btn.setAttribute("aria-label", `Page ${i}`);
    btn.setAttribute("aria-current", i === appState.currentPage ? "page" : "false");
    btn.dataset.page = i;
    fragment.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.textContent = "→";
  nextBtn.setAttribute("aria-label", "Next page");
  nextBtn.disabled = appState.currentPage === totalPages;
  nextBtn.dataset.page = appState.currentPage + 1;
  fragment.appendChild(nextBtn);

  container.appendChild(fragment);
}

/**
 * Render active filter tags.
 * Demonstrates: Object.entries(), conditional rendering, template literals
 */
function renderFilterTags() {
  const container = getEl("activeFilters");
  if (!container) return;

  const { search, category, location } = appState.filters;
  const tags = [];

  if (search) tags.push({ label: `Search: "${search}"`, key: "search" });
  if (category !== "all") tags.push({ label: `Category: ${category}`, key: "category" });
  if (location !== "all") tags.push({ label: `City: ${location}`, key: "location" });

  container.innerHTML = tags.map(({ label, key }) => `
    <span class="filter-tag" data-filter-key="${key}" role="button" tabindex="0" aria-label="Remove filter: ${label}">
      ${label}
      <span class="filter-tag-remove" aria-hidden="true">✕</span>
    </span>
  `).join("");
}

// ============================================================
// 11. REGISTRATION — Modal, Form Validation, AJAX POST
// ============================================================

/**
 * Open the registration modal for a specific event.
 * Demonstrates: querySelector, DOM manipulation, jQuery fadeIn
 *
 * @param {number} eventId
 */
function openRegistrationModal(eventId) {
  // Use .find() to locate the event — Array method
  const event = appState.allEvents.find(e => e.id === eventId);
  if (!event) return;

  // Prevent registering for full events
  if (event.checkAvailability() === "full") {
    showToast("Event Full", `Sorry, "${event.title}" is fully booked.`, "error");
    return;
  }

  const overlay = getEl("modalOverlay");
  const eventInfo = getEl("modalEventInfo");
  const hiddenId = getEl("selectedEventId");
  const modalTitle = getEl("modalTitle");

  if (hiddenId) hiddenId.value = eventId;
  if (modalTitle) modalTitle.textContent = `Register for ${event.title}`;

  // Populate event summary in modal
  if (eventInfo) {
    eventInfo.innerHTML = `
      <strong>${getCategoryEmoji(event.category)} ${event.title}</strong><br>
      📅 ${event.getFormattedDate()} at ${event.time}<br>
      📍 ${event.location} &bull; ${event.organizer}<br>
      💺 ${event.availableSeats} seats remaining &bull; 🎟 ${event.price}
    `;
  }

  // Reset form
  const form = getEl("registrationForm");
  if (form) {
    form.reset();
    // Clear all error messages
    form.querySelectorAll(".form-error").forEach(el => el.textContent = "");
    form.querySelectorAll(".form-input, .form-textarea").forEach(el => el.classList.remove("error"));
  }

  // Show modal — using jQuery fadeIn for smooth animation
  if (overlay) {
    $(overlay).fadeIn(250);
    document.body.style.overflow = "hidden";
    // Focus first input for accessibility
    setTimeout(() => {
      const firstInput = overlay.querySelector("input:not([type=hidden])");
      if (firstInput) firstInput.focus();
    }, 300);
  }

  console.log(`📝 [Modal] Opened for Event ID: ${eventId} - "${event.title}"`);
}

/**
 * Close the registration modal.
 * Uses jQuery fadeOut.
 */
function closeModal() {
  const overlay = getEl("modalOverlay");
  if (overlay) {
    $(overlay).fadeOut(200, () => {
      document.body.style.overflow = "";
    });
  }
}

/**
 * Validate the registration form fields.
 * Demonstrates: form.elements, regex, conditional logic, DOM manipulation
 *
 * @param {HTMLFormElement} form
 * @returns {boolean} Whether form is valid
 */
function validateForm(form) {
  let isValid = true;

  // --- Name validation ---
  const name = form.elements["name"].value.trim();
  const nameError = getEl("nameError");
  if (!name) {
    setError(form.elements["name"], nameError, "Full name is required.");
    isValid = false;
  } else if (name.length < 2) {
    setError(form.elements["name"], nameError, "Name must be at least 2 characters.");
    isValid = false;
  } else {
    clearError(form.elements["name"], nameError);
  }

  // --- Email validation using Regex ---
  const email = form.elements["email"].value.trim();
  const emailError = getEl("emailError");
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  if (!email) {
    setError(form.elements["email"], emailError, "Email address is required.");
    isValid = false;
  } else if (!emailRegex.test(email)) {
    setError(form.elements["email"], emailError, "Please enter a valid email address.");
    isValid = false;
  } else {
    clearError(form.elements["email"], emailError);
  }

  // --- Tickets validation ---
  const tickets = parseInt(form.elements["tickets"].value, 10);
  const ticketsError = getEl("ticketsError");
  if (isNaN(tickets) || tickets < 1) {
    setError(form.elements["tickets"], ticketsError, "At least 1 ticket required.");
    isValid = false;
  } else if (tickets > 10) {
    setError(form.elements["tickets"], ticketsError, "Maximum 10 tickets per registration.");
    isValid = false;
  } else {
    clearError(form.elements["tickets"], ticketsError);
  }

  // --- Terms checkbox ---
  const terms = form.elements["terms"].checked;
  const termsError = getEl("termsError");
  if (!terms) {
    if (termsError) termsError.textContent = "You must agree to the terms.";
    isValid = false;
  } else {
    if (termsError) termsError.textContent = "";
  }

  return isValid;
}

/**
 * Set an error state on a form field.
 * @param {HTMLElement} input
 * @param {HTMLElement} errorEl
 * @param {string} message
 */
function setError(input, errorEl, message) {
  if (input) input.classList.add("error");
  if (errorEl) errorEl.textContent = message;
}

/**
 * Clear error state on a form field.
 * @param {HTMLElement} input
 * @param {HTMLElement} errorEl
 */
function clearError(input, errorEl) {
  if (input) input.classList.remove("error");
  if (errorEl) errorEl.textContent = "";
}

/**
 * Handle registration form submission.
 * Demonstrates: event.preventDefault(), async/await, Fetch POST, AJAX
 *
 * @param {SubmitEvent} e
 */
async function handleRegistration(e) {
  e.preventDefault(); // Prevent page reload

  const form = e.target;

  // Validate before submitting
  if (!validateForm(form)) {
    showToast("Validation Error", "Please fix the form errors and try again.", "error");
    return;
  }

  const eventId = parseInt(getEl("selectedEventId").value, 10);
  const event = appState.allEvents.find(ev => ev.id === eventId);
  if (!event) return;

  // Destructure form values
  const name = form.elements["name"].value.trim();
  const email = form.elements["email"].value.trim();
  const phone = form.elements["phone"].value.trim();
  const tickets = parseInt(form.elements["tickets"].value, 10);
  const message = form.elements["message"].value.trim();

  /**
   * Registration payload object.
   * Demonstrates: Object literal, spread operator, template literals
   */
  const payload = {
    title: `Registration: ${event.title}`,
    body: JSON.stringify({
      eventId,
      eventName: event.title,
      name,
      email,
      phone: phone || "Not provided",
      tickets,
      message: message || "None",
      registrationTime: new Date().toISOString(),
    }),
    userId: 1, // Required by jsonplaceholder
  };

  // Show loading state on submit button
  const submitBtn = getEl("submitRegBtn");
  const btnText = submitBtn?.querySelector(".btn-text");
  const btnSpinner = submitBtn?.querySelector(".btn-spinner");

  if (submitBtn) submitBtn.disabled = true;
  if (btnText) btnText.textContent = "Submitting...";
  if (btnSpinner) btnSpinner.style.display = "inline-block";

  // ---- DEBUGGING COMMENTS ----
  // To debug this registration:
  // 1. Open DevTools > Network tab > Filter by "posts"
  // 2. Check the request payload in the "Payload" tab
  // 3. Look for the response in the "Response" tab
  // 4. Console.log(payload) to inspect before sending
  console.log("📤 [AJAX] Submitting registration payload:", payload);

  try {
    /**
     * POST registration data to JSONPlaceholder (mock API).
     * Demonstrates: fetch POST, JSON.stringify, headers, async/await
     */
    const response = await fetch(CONFIG.API_POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ [AJAX] Registration successful. Server response:", result);

    // --- Update application state ---
    appState.registeredEvents.add(eventId);
    appState.totalRegistrations++;

    // Decrement available seats using -- operator
    event.availableSeats = Math.max(0, event.availableSeats - tickets);
    event.seats = event.seats; // Keep total seats unchanged

    // Track this registration using the closure-based tracker
    if (categoryTrackers[event.category]) {
      const newTotal = categoryTrackers[event.category].increment();
      console.log(`📊 [Category Tracker] ${event.category} total: ${newTotal}`);
    }

    // Save to localStorage
    saveToStorage();

    // Update UI
    updateNavCounters();
    closeModal();
    applyFilters();
    renderEvents();

    // Success toast notification
    showToast(
      "Registration Confirmed! 🎉",
      `You're registered for "${event.title}". A confirmation will be sent to ${email}.`,
      "success"
    );

    // Update hero stats
    updateHeroStats();

  } catch (error) {
    console.error("❌ [AJAX] Registration failed:", error.message);
    showToast("Submission Failed", `Could not complete registration: ${error.message}`, "error");

  } finally {
    // Reset button state regardless of success/failure
    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.textContent = "Register Now";
    if (btnSpinner) btnSpinner.style.display = "none";
  }
}

// ============================================================
// 12. TOAST NOTIFICATION SYSTEM
// ============================================================

/**
 * Display a toast notification.
 * Demonstrates: createElement, classList, setTimeout, jQuery slideToggle concept
 *
 * @param {string} title - Toast title
 * @param {string} message - Toast message body
 * @param {"success"|"error"|"info"|"warning"} type - Toast type
 */
function showToast(title, message, type = "info") {
  const container = getEl("toastContainer");
  if (!container) return;

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type] || "ℹ️"}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close-btn" aria-label="Dismiss notification">✕</button>
  `;

  container.appendChild(toast);
  console.log(`🔔 [Toast] ${type.toUpperCase()}: ${title}`);

  // Close button handler
  toast.querySelector(".toast-close-btn").addEventListener("click", () => dismissToast(toast));

  // Auto-dismiss after TOAST_DURATION_MS
  const timer = setTimeout(() => dismissToast(toast), CONFIG.TOAST_DURATION_MS);

  // Cancel auto-dismiss on hover (UX improvement)
  toast.addEventListener("mouseenter", () => clearTimeout(timer));
  toast.addEventListener("mouseleave", () => setTimeout(() => dismissToast(toast), 1500));
}

/**
 * Dismiss a toast with animation.
 * @param {HTMLElement} toast
 */
function dismissToast(toast) {
  if (!toast.parentNode) return;
  toast.classList.add("leaving");
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

// ============================================================
// 13. THEME TOGGLE — Dark / Light Mode
// ============================================================

/**
 * Apply the current theme to the document.
 * Demonstrates: setAttribute, localStorage, DOM manipulation
 */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", appState.theme);
  const icon = getEl("themeIcon");
  if (icon) icon.textContent = appState.theme === "dark" ? "☀️" : "🌙";
  saveToStorage();
  console.log(`🎨 [Theme] Switched to ${appState.theme} mode`);
}

/**
 * Toggle between dark and light themes.
 * Demonstrates: ternary operator, state mutation, side effects
 */
function toggleTheme() {
  appState.theme = appState.theme === "dark" ? "light" : "dark";
  applyTheme();
  showToast("Theme Changed", `Switched to ${appState.theme} mode.`, "info");
}

// ============================================================
// 14. FAVORITES SYSTEM
// ============================================================

/**
 * Toggle favorite status for an event.
 * Demonstrates: Set.has(), Set.add(), Set.delete(), DOM update
 *
 * @param {number} eventId
 */
function toggleFavorite(eventId) {
  const isFav = appState.favoritedEvents.has(eventId);
  const event = appState.allEvents.find(e => e.id === eventId);
  const eventTitle = event?.title || "Event";

  if (isFav) {
    appState.favoritedEvents.delete(eventId);
    showToast("Removed from Favorites", `"${eventTitle}" has been unfavorited.`, "info");
  } else {
    appState.favoritedEvents.add(eventId);
    showToast("Added to Favorites ♥", `"${eventTitle}" saved to your favorites!`, "success");
  }

  saveToStorage();
  updateNavCounters();

  // Update the specific card's favorite button without re-rendering all
  const card = document.querySelector(`[data-event-id="${eventId}"] .event-card-fav`);
  if (card) {
    const newFav = appState.favoritedEvents.has(eventId);
    card.classList.toggle("favorited", newFav);
    card.innerHTML = newFav ? "♥" : "♡";
    card.setAttribute("aria-pressed", newFav);
    card.setAttribute("aria-label", newFav ? "Remove from favorites" : "Add to favorites");
  }
}

// ============================================================
// 15. COUNTER UPDATES
// ============================================================

/**
 * Update the navbar registration and favorites counters.
 * Demonstrates: DOM manipulation, Set.size
 */
function updateNavCounters() {
  const regCount = getEl("navRegCount");
  const favCount = getEl("navFavCount");

  if (regCount) regCount.textContent = appState.totalRegistrations;
  if (favCount) favCount.textContent = appState.favoritedEvents.size;
}

/**
 * Update hero section stats numbers.
 * Demonstrates: DOM text content update, state reading
 */
function updateHeroStats() {
  const heroEventCount = getEl("heroEventCount");
  const heroCityCount = getEl("heroCityCount");
  const heroRegCount = getEl("heroRegCount");

  if (heroEventCount) heroEventCount.textContent = appState.allEvents.length;
  if (heroCityCount) heroCityCount.textContent = new Set(appState.allEvents.map(e => e.location)).size;
  if (heroRegCount) heroRegCount.textContent = appState.totalRegistrations;
}

// ============================================================
// 16. ANIMATED STATISTICS COUNTER (Intersection Observer)
// ============================================================

/**
 * Trigger stat counter animations when section enters viewport.
 * Demonstrates: IntersectionObserver API, data attributes, animateCounter
 */
function initStatsAnimation() {
  const statNumbers = document.querySelectorAll(".stat-number");
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        statNumbers.forEach(el => {
          const target = parseInt(el.dataset.target, 10);
          if (!isNaN(target)) animateCounter(el, target);
        });
        observer.disconnect(); // Only animate once
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector(".stats-section");
  if (statsSection) observer.observe(statsSection);
}

// ============================================================
// 17. EVENT HANDLERS (with Event Delegation)
// ============================================================

/**
 * Set up all event listeners.
 * Uses Event Delegation where possible to minimize DOM event listeners.
 * Demonstrates: addEventListener, event delegation, keydown, change, click
 */
function setupEventListeners() {

  // ---- SEARCH INPUT (live search with debounce) ----
  const searchInput = getEl("searchInput");
  const searchClear = getEl("searchClear");

  if (searchInput) {
    /**
     * Live search on keydown using debounce.
     * Demonstrates: keydown event, debounce, state mutation, re-render
     */
    searchInput.addEventListener("input", debounce((e) => {
      appState.filters.search = e.target.value;

      // Show/hide clear button
      if (searchClear) {
        searchClear.style.display = e.target.value ? "block" : "none";
      }

      applyFilters();
      renderEvents();
      console.log(`🔍 [Search] Query: "${e.target.value}"`);
    }, 250));

    // Keyboard support: Escape to clear
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        appState.filters.search = "";
        if (searchClear) searchClear.style.display = "none";
        applyFilters();
        renderEvents();
      }
    });
  }

  // ---- SEARCH CLEAR BUTTON ----
  if (searchClear) {
    searchClear.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      appState.filters.search = "";
      searchClear.style.display = "none";
      applyFilters();
      renderEvents();
    });
  }

  // ---- CATEGORY FILTER ----
  const categoryFilter = getEl("categoryFilter");
  if (categoryFilter) {
    /**
     * onchange filter for category.
     * Demonstrates: onchange event, state mutation
     */
    categoryFilter.addEventListener("change", (e) => {
      appState.filters.category = e.target.value;
      applyFilters();
      renderEvents();
      console.log(`📂 [Filter] Category: ${e.target.value}`);
    });
  }

  // ---- LOCATION FILTER ----
  const locationFilter = getEl("locationFilter");
  if (locationFilter) {
    locationFilter.addEventListener("change", (e) => {
      appState.filters.location = e.target.value;
      applyFilters();
      renderEvents();
      console.log(`📍 [Filter] Location: ${e.target.value}`);
    });
  }

  // ---- SORT FILTER ----
  const sortFilter = getEl("sortFilter");
  if (sortFilter) {
    sortFilter.addEventListener("change", (e) => {
      appState.filters.sort = e.target.value;
      applyFilters();
      renderEvents();
    });
  }

  // ---- RESET FILTERS BUTTON ----
  const resetFilters = getEl("resetFilters");
  const emptyResetBtn = getEl("emptyResetBtn");

  function resetAllFilters() {
    appState.filters = { search: "all", category: "all", location: "all", sort: "date-asc" };
    appState.filters.search = "";

    // Reset UI controls
    if (searchInput) searchInput.value = "";
    if (searchClear) searchClear.style.display = "none";
    if (categoryFilter) categoryFilter.value = "all";
    if (locationFilter) locationFilter.value = "all";
    if (sortFilter) sortFilter.value = "date-asc";

    applyFilters();
    renderEvents();
    showToast("Filters Reset", "All filters have been cleared.", "info");
  }

  if (resetFilters) resetFilters.addEventListener("click", resetAllFilters);
  if (emptyResetBtn) emptyResetBtn.addEventListener("click", resetAllFilters);

  // ---- EVENTS GRID — Event Delegation for Register & Favorite buttons ----
  const eventsGrid = getEl("eventsGrid");
  if (eventsGrid) {
    /**
     * Event delegation: attach ONE listener to the grid container,
     * handle clicks on any register/favorite button inside it.
     * Demonstrates: event delegation, closest(), dataset, performance best practice
     */
    eventsGrid.addEventListener("click", (e) => {
      // Register button
      const registerBtn = e.target.closest(".btn-register");
      if (registerBtn && !registerBtn.disabled) {
        const eventId = parseInt(registerBtn.dataset.eventId, 10);
        openRegistrationModal(eventId);
        return;
      }

      // Favorite button
      const favBtn = e.target.closest(".event-card-fav");
      if (favBtn) {
        const eventId = parseInt(favBtn.dataset.eventId, 10);
        toggleFavorite(eventId);
        return;
      }
    });
  }

  // ---- PAGINATION — Event Delegation ----
  const pagination = getEl("pagination");
  if (pagination) {
    pagination.addEventListener("click", (e) => {
      const btn = e.target.closest(".page-btn");
      if (btn && !btn.disabled) {
        const page = parseInt(btn.dataset.page, 10);
        if (!isNaN(page) && page > 0) {
          appState.currentPage = page;
          renderEvents();
          // Smooth scroll back to events section
          document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  // ---- ACTIVE FILTER TAGS — Remove individual filters ----
  const activeFilters = getEl("activeFilters");
  if (activeFilters) {
    activeFilters.addEventListener("click", (e) => {
      const tag = e.target.closest(".filter-tag");
      if (tag) {
        const key = tag.dataset.filterKey;
        if (key === "search") {
          appState.filters.search = "";
          if (searchInput) searchInput.value = "";
          if (searchClear) searchClear.style.display = "none";
        } else if (key === "category") {
          appState.filters.category = "all";
          if (categoryFilter) categoryFilter.value = "all";
        } else if (key === "location") {
          appState.filters.location = "all";
          if (locationFilter) locationFilter.value = "all";
        }
        applyFilters();
        renderEvents();
      }
    });
  }

  // ---- REGISTRATION FORM SUBMIT ----
  const regForm = getEl("registrationForm");
  if (regForm) {
    regForm.addEventListener("submit", handleRegistration);
  }

  // ---- MODAL CLOSE BUTTON & OVERLAY CLICK ----
  const modalClose = getEl("modalClose");
  const cancelRegBtn = getEl("cancelRegBtn");
  const modalOverlay = getEl("modalOverlay");

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (cancelRegBtn) cancelRegBtn.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      // Close when clicking the backdrop (not the modal itself)
      if (e.target === modalOverlay) closeModal();
    });
  }

  // ---- KEYBOARD: Escape closes modal ----
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ---- THEME TOGGLE ----
  const themeToggle = getEl("themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

  // ---- HAMBURGER MENU ----
  const hamburger = getEl("hamburger");
  const navLinks = getEl("navLinks");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      hamburger.classList.toggle("active", isOpen);
      hamburger.setAttribute("aria-expanded", isOpen);

      // jQuery slideToggle visual effect
      if (isOpen) {
        $(navLinks).css("opacity", 0).animate({ opacity: 1 }, 300);
      }
    });

    // Close menu when a nav link is clicked
    navLinks.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        hamburger.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- VIEW TOGGLE (Grid / List) ----
  const gridViewBtn = getEl("gridViewBtn");
  const listViewBtn = getEl("listViewBtn");

  if (gridViewBtn && listViewBtn) {
    gridViewBtn.addEventListener("click", () => {
      appState.currentView = "grid";
      gridViewBtn.classList.add("active");
      listViewBtn.classList.remove("active");
      gridViewBtn.setAttribute("aria-pressed", "true");
      listViewBtn.setAttribute("aria-pressed", "false");
      renderEvents();
    });

    listViewBtn.addEventListener("click", () => {
      appState.currentView = "list";
      listViewBtn.classList.add("active");
      gridViewBtn.classList.remove("active");
      listViewBtn.setAttribute("aria-pressed", "true");
      gridViewBtn.setAttribute("aria-pressed", "false");
      renderEvents();
    });
  }

  // ---- HERO REGISTER BUTTON ----
  const heroRegBtn = getEl("heroRegisterBtn");
  if (heroRegBtn) {
    heroRegBtn.addEventListener("click", () => {
      document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
      // If events are loaded, open the first one
      if (appState.allEvents.length > 0) {
        setTimeout(() => openRegistrationModal(appState.allEvents[0].id), 700);
      }
    });
  }

  // ---- BACK TO TOP BUTTON ----
  const backToTop = getEl("backToTop");
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---- SCROLL EVENT: Navbar + Back-to-Top visibility ----
  window.addEventListener("scroll", () => {
    const navbar = getEl("navbar");
    const backToTopBtn = getEl("backToTop");
    const scrollY = window.scrollY;

    // Add scrolled class to navbar
    if (navbar) navbar.classList.toggle("scrolled", scrollY > 50);

    // Show/hide back to top button
    if (backToTopBtn) {
      if (scrollY > 400) {
        $(backToTopBtn).fadeIn(200);
      } else {
        $(backToTopBtn).fadeOut(200);
      }
    }

    // Update active nav link based on scroll position
    updateActiveNavLink();
  }, { passive: true }); // passive: true for scroll performance

  // ---- ACTIVE NAV LINK: Input inline validation (real-time) ----
  const regName = getEl("regName");
  const regEmail = getEl("regEmail");

  if (regName) {
    regName.addEventListener("blur", () => {
      const nameError = getEl("nameError");
      if (!regName.value.trim()) setError(regName, nameError, "Name is required.");
      else clearError(regName, nameError);
    });
  }

  if (regEmail) {
    regEmail.addEventListener("blur", () => {
      const emailError = getEl("emailError");
      const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
      if (!regEmail.value.trim()) setError(regEmail, emailError, "Email is required.");
      else if (!emailRegex.test(regEmail.value)) setError(regEmail, emailError, "Invalid email format.");
      else clearError(regEmail, emailError);
    });
  }
}

// ============================================================
// 18. NAVBAR ACTIVE LINK TRACKER
// ============================================================

/**
 * Update the active nav link based on current scroll position.
 * Demonstrates: querySelectorAll, getBoundingClientRect, classList
 */
function updateActiveNavLink() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  let currentSection = "";

  sections.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;
    if (sectionTop <= 100) {
      currentSection = section.getAttribute("id");
    }
  });

  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${currentSection}`) {
      link.classList.add("active");
    }
  });
}

// ============================================================
// 19. JQUERY INTEGRATIONS
// ============================================================

/**
 * Initialize jQuery-specific behaviors.
 * Demonstrates: jQuery CDN, $(), .click(), .fadeIn(), .fadeOut(),
 *               .slideToggle(), event handling via jQuery
 */
function initJQuery() {
  // Wait for jQuery to be available
  if (typeof $ === "undefined") {
    console.warn("⚠️ jQuery not loaded. Skipping jQuery initialization.");
    return;
  }

  console.log("💛 [jQuery] Initialized. Version:", $.fn.jquery);

  /**
   * jQuery click handler for register buttons.
   * Uses event delegation via .on() — equivalent to addEventListener with delegation.
   * Demonstrates: jQuery event delegation, $(document).on()
   */
  $(document).on("click", "#registerBtn", function () {
    const eventId = parseInt($(this).data("event-id"), 10);
    openRegistrationModal(eventId);
  });

  /**
   * Smooth fade-in effect when filtering is applied.
   * Demonstrates: jQuery .fadeIn(), .fadeOut(), callbacks
   */
  $(document).on("change", ".filter-select", function () {
    $("#eventsGrid").fadeOut(150, function () {
      $(this).fadeIn(200);
    });
  });

  /**
   * jQuery hover effects on stat cards.
   * Demonstrates: jQuery .hover(), .css(), chaining
   */
  $(document).on("mouseenter", ".stat-card", function () {
    $(this).find(".stat-icon").css("transform", "scale(1.2) rotate(10deg)");
  }).on("mouseleave", ".stat-card", function () {
    $(this).find(".stat-icon").css("transform", "scale(1) rotate(0deg)");
  });

  /**
   * jQuery animate: smooth transition on stat icon hover.
   * Demonstrates: .css() with transition
   */
  $(".stat-icon").css("transition", "transform 0.3s ease");

  console.log("✅ [jQuery] All jQuery behaviors initialized.");
}

// ============================================================
// 20. SKELETON LOADING
// ============================================================

/**
 * Show skeleton loading state.
 * Demonstrates: element.style, display property, setTimeout
 */
function showSkeleton() {
  const skeletonGrid = getEl("skeletonGrid");
  const eventsGrid = getEl("eventsGrid");
  if (skeletonGrid) skeletonGrid.style.display = "grid";
  if (eventsGrid) eventsGrid.style.display = "none";
}

/**
 * Hide skeleton loading and show events.
 * Demonstrates: display style, jQuery fadeIn
 */
function hideSkeleton() {
  const skeletonGrid = getEl("skeletonGrid");
  if (skeletonGrid) {
    $(skeletonGrid).fadeOut(300, function () {
      skeletonGrid.style.display = "none";
    });
  }
}

// ============================================================
// 21. RESTORE FILTER STATE FROM LOCALSTORAGE
// ============================================================

/**
 * Restore filter UI controls from saved state.
 * Demonstrates: value assignment, multiple DOM selections
 */
function restoreFiltersFromState() {
  const { search, category, location, sort } = appState.filters;

  const searchInput = getEl("searchInput");
  const categoryFilter = getEl("categoryFilter");
  const locationFilter = getEl("locationFilter");
  const sortFilter = getEl("sortFilter");

  if (searchInput && search) searchInput.value = search;
  if (categoryFilter && category) categoryFilter.value = category;
  if (locationFilter && location) locationFilter.value = location;
  if (sortFilter && sort) sortFilter.value = sort;
}

// ============================================================
// 22. MAIN INITIALIZATION
// ============================================================

/**
 * Main entry point — runs when DOM is fully parsed.
 * Demonstrates: DOMContentLoaded, async/await, orchestration
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 [Init] DOM ready. Initializing Community Portal...");

  // Step 1: Load persisted state from localStorage
  loadFromStorage();

  // Step 2: Apply saved theme
  applyTheme();

  // Step 3: Restore filter UI from state
  restoreFiltersFromState();

  // Step 4: Show skeleton loading
  showSkeleton();

  // Step 5: Set up all event listeners BEFORE data loads
  setupEventListeners();

  // Step 6: Initialize jQuery behaviors
  initJQuery();

  // Step 7: Fetch events data asynchronously
  const rawEvents = await fetchEvents();

  // Step 8: Map raw data to CommunityEvent instances
  appState.allEvents = rawEvents;

  // Step 9: Apply initial filters and render
  applyFilters();

  // Step 10: Hide skeleton, render events
  hideSkeleton();
  setTimeout(() => {
    renderEvents();
  }, 350); // Slight delay for smooth transition after skeleton fade

  // Step 11: Update counters and stats
  updateNavCounters();
  updateHeroStats();

  // Step 12: Initialize stat counter animations
  initStatsAnimation();

  // Step 13: Welcome toast
  setTimeout(() => {
    showToast(
      "Welcome to CommunityHub! 🏛️",
      `${appState.allEvents.length} events loaded across 5 cities.`,
      "success"
    );
  }, 1500);

  // Step 14: Log category tracker info for debugging
  console.log("📊 [Trackers] Category trackers initialized:");
  Object.values(categoryTrackers).forEach(tracker => {
    console.log(`  → ${tracker.getCategory()}: ${tracker.getTotal()} registrations`);
  });

  // Step 15: Demo — Using various JS concepts from the spec
  demonstrateJSConcepts();

  console.log("✅ [Init] Community Portal fully initialized.");
});

// ============================================================
// 23. JS CONCEPTS DEMONSTRATION
// ============================================================

/**
 * Demonstrates various JavaScript concepts from the requirements.
 * This runs silently and logs to the console for educational purposes.
 * Demonstrates: const, let, template literals, operators, loops, closures
 */
function demonstrateJSConcepts() {
  console.group("📚 JavaScript Concepts Demo");

  // --- 2. Syntax, Data Types, Operators ---
  const eventName = "Chennai Music Festival 2026";
  const eventDate = "2026-06-15";
  let seats = 20;

  console.log(`Event: ${eventName}`);
  console.log(`Date: ${eventDate}`);
  console.log(`Initial Seats: ${seats}`);

  seats--;       // Decrement operator
  console.log(`After 1 Registration: ${seats} seats`);

  const summary = `"${eventName}" on ${eventDate} — ${seats} seats available.`;
  console.log("Summary:", summary);

  // --- 3. Conditionals, Loops ---
  const sampleEvents = [
    { name: "Event A", date: "2025-01-01", seats: 0 },
    { name: "Event B", date: "2027-01-01", seats: 50 },
    { name: "Event C", date: "2027-06-01", seats: 0 },
  ];

  console.log("\n--- Filtering Past & Full Events ---");
  sampleEvents.forEach(ev => {
    const isUpcoming = new Date(ev.date) > new Date();
    const hasSeats = ev.seats > 0;

    if (!isUpcoming) {
      console.log(`⏰ [PAST] ${ev.name} — hidden`);
    } else if (!hasSeats) {
      console.log(`🚫 [FULL] ${ev.name} — no seats`);
    } else {
      console.log(`✅ [SHOW] ${ev.name} — ${ev.seats} seats`);
    }
  });

  // --- 4. Higher-Order Functions ---
  const nums = [1, 2, 3, 4, 5];
  const doubled = nums.map(n => n * 2);
  const evens = nums.filter(n => n % 2 === 0);
  console.log("\nHigher-Order Functions:");
  console.log("Original:", nums);
  console.log("Doubled:", doubled);
  console.log("Evens:", evens);

  // --- 5. OOP: Create an Event instance ---
  const demoEvent = new CommunityEvent(
    99, "Demo Event", "A test event", "Technology",
    "Chennai", "2027-01-01", 50, "", "Demo Org", "Free", "10:00 AM"
  );
  demoEvent.displayDetails();
  console.log("Availability:", demoEvent.checkAvailability());

  // --- 6. Array Methods ---
  const musicEvents = appState.allEvents.filter(e => e.category === "Music");
  const titles = appState.allEvents.map(e => e.title.toUpperCase());
  const firstTech = appState.allEvents.find(e => e.category === "Technology");
  console.log("\nMusic Events:", musicEvents.length);
  console.log("First Tech Event:", firstTech?.title);

  // --- 10. Modern JS Features ---
  const { title, category, location } = (appState.allEvents[0] || {});
  console.log("\nDestructured first event:", { title, category, location });

  const clonedEvents = [...appState.allEvents]; // Spread operator
  console.log("Cloned events array length:", clonedEvents.length);

  // Optional chaining & nullish coalescing
  const orgName = appState.allEvents[0]?.organizer ?? "Unknown";
  console.log("Organizer (optional chaining):", orgName);

  console.groupEnd();
}

// ============================================================
// ---- END OF main.js ----
// ============================================================
