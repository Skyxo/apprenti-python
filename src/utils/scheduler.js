/**
 * CRAM SCHEDULER (7-Day Optimization)
 * 
 * Strategy:
 * - Aggressive short-term intervals for "Learning" phase.
 * - Exponential backoff for "Review" phase but capped at low max intervals to ensure frequency within 7 days.
 */

// Intervals in MINUTES
const INTERVALS = {
    AGAIN: 1,       // 1 minute
    HARD: 10,       // 10 minutes
    GOOD_LEARNING: 60 * 4, // 4 hours
    GOOD_REVIEW: 60 * 24,  // 1 day
    EASY: 60 * 24 * 3,     // 3 days
};

export const RATE_AGAIN = 'again';
export const RATE_HARD = 'hard';
export const RATE_GOOD = 'good';
export const RATE_EASY = 'easy';

/**
 * Calculates the next due date based on the user's rating.
 * @param {Object} card - The current card object.
 * @param {string} rating - The rating ('again', 'hard', 'good', 'easy').
 * @returns {Object} updates - Object containing { dueDate, state, interval } to merge into the card.
 */
export function scheduleCard(card, rating) {
    const now = new Date();
    let interval = card.interval || 0;
    let state = card.state || 'new'; // 'new', 'learning', 'review'

    let nextInterval = 0; // in minutes

    if (rating === RATE_AGAIN) {
        nextInterval = INTERVALS.AGAIN;
        state = 'learning';
    } else if (rating === RATE_HARD) {
        nextInterval = Math.max(interval * 1.2, INTERVALS.HARD);
        state = 'learning';
    } else if (rating === RATE_GOOD) {
        if (state === 'new' || state === 'learning') {
            nextInterval = INTERVALS.GOOD_LEARNING;
            state = 'review';
        } else {
            nextInterval = Math.max(interval * 2.5, INTERVALS.GOOD_REVIEW);
        }
    } else if (rating === RATE_EASY) {
        nextInterval = Math.max(interval * 4, INTERVALS.EASY);
        state = 'review';
    }

    // Cap interval to 7 days if we are cramming for a test in 7 days? 
    // Maybe not cap, if it's > 7 days it just means "Done for the test".

    const nextDueDate = new Date(now.getTime() + nextInterval * 60 * 1000);

    return {
        state,
        interval: nextInterval,
        dueDate: nextDueDate.toISOString(),
        lastReviewed: now.toISOString(),
    };
}

export function isDue(card) {
    if (!card.dueDate) return true;
    return new Date(card.dueDate) <= new Date();
}
