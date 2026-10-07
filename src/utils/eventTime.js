// Combines an Event's `date` (day) with its `endTime` string ("HH:MM", 24h,
// UTC) into a single Date representing the exact moment the event ends.
// This is what the archive sweep compares against "now" to decide whether
// an event should flip to ARCHIVED.
function getEventEndDateTime(event) {
  const end = new Date(event.date);
  const [hours, minutes] = (event.endTime || "23:59")
    .split(":")
    .map((v) => parseInt(v, 10));

  end.setUTCHours(
    Number.isFinite(hours) ? hours : 23,
    Number.isFinite(minutes) ? minutes : 59,
    0,
    0,
  );
  return end;
}

function hasEventEnded(event, now = new Date()) {
  return getEventEndDateTime(event) <= now;
}

module.exports = { getEventEndDateTime, hasEventEnded };
