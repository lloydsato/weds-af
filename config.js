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
    themePreset: "gold-cream",

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
    },

    storyTimeline: [
        {
            date: "September 14, 2020",
            icon: "fa-heart",
            title: "How We Met",
            text: "It started with a chance encounter at a local bookstore on a rainy afternoon. Maschio reached for the last copy of a classic novel at the same moment Ann Sweety did. An hour of coffee and conversation later, we knew this was the start of something special."
        },
        {
            date: "October 10, 2021",
            icon: "fa-coffee",
            title: "Growing Together",
            text: "Over the course of a year, coffee dates turned into long conversations, family visits, and endless laughter. We promised to support each other through all of life's chapters, realizing that our lives were forever intertwined."
        },
        {
            date: "May 18, 2024",
            icon: "fa-ring",
            title: "The Proposal",
            text: "Under a sky full of stars, Maschio asked Ann Sweety to spend the rest of her life with him. Amid tears of joy, Ann Sweety said \"Yes!\""
        },
        {
            date: "September 24, 2026",
            icon: "fa-church",
            title: "The Big Day",
            text: "And now, we begin our greatest adventure yet: marriage. We cannot wait to celebrate this monumental day with our dearest family and friends at the Cathedral Church of The Redemption, New Delhi."
        }
    ]
};

window.WEDDING_CONFIG = WEDDING_CONFIG;
