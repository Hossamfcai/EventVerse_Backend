module.exports = {
  ROLES: {
    USER: "USER",
    ORGANIZER: "ORGANIZER",
    ADMIN: "ADMIN",
  },
  EVENT_STATUS: {
    UPCOMING: "UPCOMING",
    PUBLISHED: "PUBLISHED",
    CANCELED: "CANCELED",
    ARCHIVED: "ARCHIVED",
  },
  // Statuses an organizer/admin is allowed to set via the API.
  // ARCHIVED is excluded - it is only ever set by the server-side archive sweep
  // once an event's date + endTime has passed.
  ORGANIZER_SETTABLE_EVENT_STATUSES: ["PUBLISHED", "UPCOMING", "CANCELED"],
  BOOKING_STATUS: {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    CANCELLED: "CANCELLED",
  },
  TICKET_STATUS: {
    VALID: "VALID",
    USED: "USED",
    CANCELLED: "CANCELLED",
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100,
  },
};
