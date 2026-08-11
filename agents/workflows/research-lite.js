export const meta = {
  name: 'research-lite',
  description: 'Token-efficient web research: haiku searchers, sonnet verification, opus synthesis',
  whenToUse: 'Cheaper alternative to /deep-research when the question needs web research but not exhaustive cross-checking of every claim',
  phases: [
    { title: 'Plan', detail: 'split the question into search angles', model: 'sonnet' },
    { title: 'Search', detail: 'one haiku searcher per angle', model: 'haiku' },
    { title: 'Verify', detail: 'sonnet re-checks load-bearing claims against sources', model: 'sonnet' },
    { title: 'Synthesize', detail: 'opus writes the cited report', model: 'opus' },
  ],
}

const question = typeof args === 'string' ? args : args && args.question
if (!question) throw new Error('Pass the research question as args (string or {question})')

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'source', 'loadBearing'],
        properties: {
          claim: { type: 'string', description: 'One factual claim, stated precisely' },
          source: { type: 'string', description: 'URL the claim came from' },
          quote: { type: 'string', description: 'Short supporting excerpt' },
          loadBearing: { type: 'boolean', description: 'true if the final answer changes when this claim is wrong' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['supported', 'note'],
  properties: {
    supported: { type: 'boolean' },
    note: { type: 'string', description: 'What the source actually says, one sentence' },
  },
}

phase('Plan')
const plan = await agent(
  `Research question: ${question}\n\nSplit this into 3-5 distinct search angles that together cover the question. Angles must not overlap. For each give: a short name, a concrete web search query, and what that angle should establish.`,
  {
    model: 'sonnet', effort: 'medium', label: 'plan-angles',
    schema: {
      type: 'object',
      required: ['angles'],
      properties: {
        angles: {
          type: 'array', minItems: 3, maxItems: 5,
          items: {
            type: 'object',
            required: ['name', 'query', 'goal'],
            properties: { name: { type: 'string' }, query: { type: 'string' }, goal: { type: 'string' } },
          },
        },
      },
    },
  },
)
log(`${plan.angles.length} search angles: ${plan.angles.map(a => a.name).join(', ')}`)

phase('Search')
// Barrier: Verify picks load-bearing claims across ALL angles, so it needs the full set.
const results = await parallel(plan.angles.map(a => () =>
  agent(
    `Research one angle of the question "${question}".\nAngle: ${a.name} — ${a.goal}\nStart from the search query: ${a.query}\n\nUse WebSearch, then WebFetch at most 4 of the most authoritative results (official docs, primary sources over blogs). Extract factual claims with their source URL and a short supporting quote. Mark a claim loadBearing only if the final answer changes when it is wrong. Return findings only — no narrative.`,
    { model: 'haiku', effort: 'low', label: `search:${a.name}`, phase: 'Search', schema: FINDINGS },
  )
))

const all = results.filter(Boolean).flatMap(r => r.findings)
const seen = new Set()
const deduped = all.filter(f => {
  const k = f.claim.toLowerCase().replace(/\W+/g, ' ').trim()
  if (seen.has(k)) return false
  seen.add(k)
  return true
})
const loadBearing = deduped.filter(f => f.loadBearing)
const critical = loadBearing.slice(0, 6)
const overflow = loadBearing.slice(6)
log(`${deduped.length} claims collected, verifying ${critical.length} load-bearing ones` +
  (overflow.length ? `; ${overflow.length} load-bearing over the 6-claim verify cap pass through unverified` : ''))

phase('Verify')
const verified = await parallel(critical.map(c => () =>
  agent(
    `Verify this claim strictly against its cited source. Claim: "${c.claim}". Source: ${c.source}. WebFetch the source (and one independent source if the first is ambiguous). Report whether the source actually supports the claim as stated.`,
    { model: 'sonnet', effort: 'medium', label: `verify:${c.claim.slice(0, 40)}`, phase: 'Verify', schema: VERDICT },
  ).then(v => ({ ...c, verdict: v }))
))

phase('Synthesize')
// A verify agent that died returns a null verdict; treat its claim as unverified, not as trusted.
const checked = verified.filter(Boolean).filter(c => c.verdict)
const unverifiedCritical = [...overflow, ...verified.filter(Boolean).filter(c => !c.verdict)]
const report = await agent(
  `Write the final research report for the question: "${question}".\n\nVerified load-bearing claims (trust the verdicts):\n${JSON.stringify(checked, null, 2)}\n\nLoad-bearing claims that could NOT be verified (use with attribution and flag as unconfirmed):\n${JSON.stringify(unverifiedCritical, null, 2)}\n\nAll other collected claims (unverified, use with attribution):\n${JSON.stringify(deduped.filter(f => !f.loadBearing), null, 2)}\n\nRules: lead with the direct answer; cite the source URL inline after each factual statement; where a verdict was 'supported: false', either drop the claim or state the corrected fact from the verdict note; flag remaining uncertainty explicitly. Concise, complete, no filler.`,
  { model: 'opus', effort: 'high', label: 'final-report' },
)

return report
