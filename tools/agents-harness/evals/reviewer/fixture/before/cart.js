// Shopping cart pricing.
// Business rules:
// - Orders of $100 or more (before tax) get a 10% discount.
// - Totals are rounded to cents.

const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.1;

function subtotal(items) {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += items[i].price * items[i].qty;
  }
  return sum;
}

function total(items, taxRate) {
  let sub = subtotal(items);
  if (sub >= DISCOUNT_THRESHOLD) {
    sub -= sub * DISCOUNT_RATE;
  }
  return Math.round(sub * (1 + taxRate) * 100) / 100;
}

// Returns a new array; does not modify the input.
function cheapestFirst(items) {
  return [...items].sort((a, b) => a.price - b.price);
}

module.exports = { subtotal, total, cheapestFirst };
