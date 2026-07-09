// --- WEDDING DIGITAL CARD CONFIGURATION DATA ---
// Edit these values directly, or use the on-page "Card Customizer" drawer
// and click "Save Settings" to download an updated copy of this file.
const WEDDING_CONFIG = {
    groomName: "Maschio",
    brideName: "Ann Sweety",
    initials: "M & A",
    cardInviteMsg: "You are cordially invited to share in our joy.",
    weddingDateText: "September 24, 2026",
    rsvpDeadlineText: "September 1, 2026",
    // Used to drive the countdown timer and the numeric hero date (DD . MM . YYYY).
    countdownTarget: "2026-09-24T16:00:00",
    // Visual theme. Each preset re-colors both the interface and the live
    // WebGL scene (nebula, aurora, rings and particles). Options:
    // "midnight-gold" | "nebula-rose" | "aurora-emerald" | "royal-violet"
    themePreset: "midnight-gold",

    // Passcode for the "Guest List" admin dashboard link in the footer.
    // NOTE: this is a static site with no backend, so this code is only ever
    // checked in the guest's own browser and is visible to anyone who views
    // the page source. Treat it as a light deterrent, not real security.
    adminPasscode: "2026",

    // Optional: paste a form-backend endpoint (e.g. Formspree, Getform, a
    // Google Apps Script webhook) here to also deliver each RSVP off of the
    // guest's device. Without this, RSVPs only save to that guest's own
    // browser (localStorage) and never reach the couple. Leave blank to
    // disable.
    rsvpWebhookUrl: "",

    events: {
        ceremony: {
            title: "Wedding Ceremony",
            time: "Thursday, 4:00 PM – 5:00 PM",
            venue: "Cathedral Church of The Redemption",
            address: "1 Church Road, North Avenue, New Delhi 110001",
            mapLink: "https://maps.google.com/maps?q=Cathedral+Church+of+The+Redemption+1+Church+Road+North+Avenue+New+Delhi+110001",
            startISO: "2026-09-24T16:00:00",
            endISO: "2026-09-24T17:00:00"
        },
        reception: {
            title: "Grand Reception",
            time: "Thursday, 7:00 PM – 11:00 PM",
            venue: "Details to be announced",
            address: "New Delhi, India",
            mapLink: "https://maps.google.com/maps?q=New+Delhi,+India",
            startISO: "2026-09-24T19:00:00",
            endISO: "2026-09-24T23:00:00"
        }
    }
};

window.WEDDING_CONFIG = WEDDING_CONFIG;
