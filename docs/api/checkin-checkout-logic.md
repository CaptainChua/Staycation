# Check-in / Check-out Logic

## Weekend (Fri-Sat)

- Check-in is flexible, but minimum starting time is **12:00 PM (noon)**
- User can pick 12pm, 1pm, 2pm, 3pm... any time from noon onwards
- Stay is always **21 hours** from whatever time they pick
- Checkout = check-in + 21hrs (auto-calculated)

## Weekday (Sun-Thu)

- Check-in is fully flexible, **any time**
- Stay is always **10 hours**
- Checkout = check-in + 10hrs (auto-calculated)

---

## Implementation Plan

| Stay Type | Check-in Input | Restriction | Checkout |
|---|---|---|---|
| Weekday 10hr | Current time picker | None (any time) | Auto = +10hrs, read-only |
| Weekend 21hr | Current time picker | Min 12:00 PM | Auto = +21hrs, read-only |

### Changes Needed

1. Add `min="12:00"` on the check-in time input for weekend stays
2. When check-in time changes → auto-set checkout based on stay type (+10hrs or +21hrs)
3. Make checkout field read-only (auto-filled)
4. Backend: +2hr cleaning buffer in availability check
