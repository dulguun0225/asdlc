function slugify(s) {
  return s
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-');
}

module.exports = slugify;
