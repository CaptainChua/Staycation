/**
 * Helper utilities for CSR payment components.
 *
 * Exported utilities:
 * - currencyFormatter: an Intl.NumberFormat for PHP currency formatting.
 * - formatCurrency(amount): formats a number into a localized PHP currency string.
 * - formatDate(dateString): formats an ISO date string into a human readable date,
 *   returning a dash when no value is provided.
 */

export const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export const formatCurrency = (amount: number) => {
  return currencyFormatter.format(amount);
};

export const formatDate = (dateString?: string | null) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
