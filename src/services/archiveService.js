const eventRepository = require("../repositories/eventRepository");
const { hasEventEnded } = require("../utils/eventTime");

// Scans PUBLISHED/UPCOMING events and flips any whose date + endTime has
// already passed to ARCHIVED. Intended to be run on a recurring timer (see
// server.js) rather than called from a request - this is background
// housekeeping, not something a client triggers.
async function archiveExpiredEvents(now = new Date()) {
  const candidates = await eventRepository.findArchiveCandidates();
  const idsToArchive = candidates
    .filter((event) => hasEventEnded(event, now))
    .map((event) => event.id);

  if (idsToArchive.length === 0) {
    return { archivedCount: 0, archivedIds: [] };
  }

  await eventRepository.archiveByIds(idsToArchive);
  return { archivedCount: idsToArchive.length, archivedIds: idsToArchive };
}

module.exports = { archiveExpiredEvents };
