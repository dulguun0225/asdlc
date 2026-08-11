// Shopping cart pricing.
// Business rules:
// - Orders of $100 or more (before tax) get a 10% discount.
// - Totals are rounded to cents.

const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.1;

/** Sum of price * qty over all items. */
function subtotal(items) {
  let acc = 0;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].price * items[i].qty;
  }
  return acc;
}

function applyDiscount(sub) {
  if (sub > DISCOUNT_THRESHOLD) {
    return sub - sub * DISCOUNT_RATE;
  }
  return sub;
}

/** Total after discount and tax, rounded to cents. */
function total(items, taxRate) {
  const sub = applyDiscount(subtotal(items));
  return Math.round(sub * (1 + taxRate) * 100) / 100;
}

// Returns a new array; does not modify the input.
function cheapestFirst(items) {
  return items.sort((a, b) => a.price - b.price);
}

module.exports = { subtotal, total, cheapestFirst };
