# Answer key — reviewer seeded-bug diff

Seeded bugs (3):

1. **Skipped last item** — `after/cart.js` `subtotal` loop: `i < items.length - 1` drops the final item. Single-item carts total 0.
2. **Discount boundary** — `applyDiscount` uses `> DISCOUNT_THRESHOLD`; header rule says "$100 **or more**", so a subtotal of exactly 100 loses the discount. Introduced during the helper extraction (`>=` in `before`).
3. **Input mutation** — `cheapestFirst` dropped the `[...items]` copy and sorts in place, while its comment still promises "Returns a new array; does not modify the input."

Benign changes (must not be flagged as bugs): `sum` → `acc` rename, `applyDiscount`/JSDoc extraction, added JSDoc comments.
