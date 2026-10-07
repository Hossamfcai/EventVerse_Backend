const QRCode = require('qrcode');
const { randomUUID } = require('crypto');

// Generates a unique per-ticket token used both as the QR payload and the
// value verified during check-in. The token itself (not just the ticket id)
// is what the /tickets/validate endpoint checks, so a leaked ticket id alone
// cannot be used to check someone in.
function generateQrToken() {
  return randomUUID();
}

function generateTicketCode() {
  return `EVT-${randomUUID().split('-')[0].toUpperCase()}`;
}

async function generateQrDataUrl(qrToken) {
  return QRCode.toDataURL(qrToken, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
}

module.exports = { generateQrToken, generateTicketCode, generateQrDataUrl };
