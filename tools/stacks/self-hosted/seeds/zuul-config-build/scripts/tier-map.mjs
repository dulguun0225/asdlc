// Shared by the tier-function and never-write jobs: read the repository's
// path-to-tier map (ADR-0006 part 5 schema) and match paths against globs.
//
// The parser reads exactly the part-5 schema shape -- two-space-indented
// maps, lists of scalars or inline-started map entries, scalar values, and
// `[a, b]` inline lists -- and throws on anything outside it. A throw is a
// build failure naming the line, never a silent skip: a map this design
// cannot read must not gate anything.

export function parseTierMap(text) {
  const lines = [];
  text.split('\n').forEach((raw, i) => {
    const noComment = raw.replace(/(^|\s)#.*$/, '').trimEnd();
    if (!noComment.trim()) return;
    const indent = noComment.length - noComment.trimStart().length;
    if (indent % 2 !== 0) throw new Error(`tier map line ${i + 1}: odd indent`);
    lines.push({ n: i + 1, indent, body: noComment.trimStart() });
  });
  const [value, next] = parseBlock(lines, 0, 0);
  if (next !== lines.length) throw new Error(`tier map line ${lines[next].n}: unexpected outdent structure`);
  return value;
}

// Parse the block starting at lines[i] whose items sit at `indent`.
// Returns [value, nextIndex].
function parseBlock(lines, i, indent) {
  if (i >= lines.length) throw new Error('tier map: empty block');
  const isList = lines[i].body.startsWith('- ');
  const out = isList ? [] : {};
  while (i < lines.length && lines[i].indent === indent) {
    const { n, body } = lines[i];
    if (isList !== body.startsWith('- ')) throw new Error(`tier map line ${n}: mixed list and map`);
    if (isList) {
      const rest = body.slice(2);
      const m = rest.match(/^([\w-]+):\s*(.*)$/);
      if (!m) { out.push(scalar(rest, n)); i++; continue; }
      // Inline-started map entry: first key on this line, the rest at indent+2.
      const entry = {};
      entry[m[1]] = m[2] === '' ? undefined : scalar(m[2], n);
      i++;
      while (i < lines.length && lines[i].indent === indent + 2 && !lines[i].body.startsWith('- ')) {
        const km = lines[i].body.match(/^([\w-]+):\s*(.*)$/);
        if (!km) throw new Error(`tier map line ${lines[i].n}: not a key`);
        if (km[2] === '') {
          const [v, next] = parseBlock(lines, i + 1, indent + 4);
          entry[km[1]] = v; i = next;
        } else { entry[km[1]] = scalar(km[2], lines[i].n); i++; }
      }
      out.push(entry);
    } else {
      const m = body.match(/^([\w-]+):\s*(.*)$/);
      if (!m) throw new Error(`tier map line ${n}: not a key`);
      if (m[2] === '') {
        const [v, next] = parseBlock(lines, i + 1, indent + 2);
        out[m[1]] = v; i = next;
      } else { out[m[1]] = scalar(m[2], n); i++; }
    }
  }
  if (i < lines.length && lines[i].indent > indent) {
    throw new Error(`tier map line ${lines[i].n}: unexpected indent`);
  }
  return [out, i];
}

function scalar(s, n) {
  const t = s.trim();
  if (t.startsWith('[')) {
    if (!t.endsWith(']')) throw new Error(`tier map line ${n}: unterminated inline list`);
    return t.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean)
      .map((x) => scalar(x, n));
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^-?\d+$/.test(t)) return Number(t);
  return t.replace(/^["']|["']$/g, '');
}

// Glob match for the map's dialect: ** crosses directories, * stays within a
// segment. A glob with neither matches only that exact path. The control
// placeholders keep the ** expansions out of the single-* pass.
export function globMatch(glob, path) {
  const DEEP_SLASH = '\u0001';
  const DEEP = '\u0002';
  const re = new RegExp('^' + glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replaceAll('**/', DEEP_SLASH)
    .replaceAll('**', DEEP)
    .replace(/\*/g, '[^/]*')
    .replaceAll(DEEP_SLASH, '(?:.*/)?')
    .replaceAll(DEEP, '.*') + '$');
  return re.test(path);
}

// Rule 4 needs "covered at all"; rules 2 and 3 need every matching entry's
// declarations. Return all matches.
export function matches(map, path) {
  return (map.paths ?? []).filter((e) => globMatch(e.glob, path));
}
