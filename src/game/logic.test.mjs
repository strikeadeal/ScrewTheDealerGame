/**
 * Smoke-test for game logic reasoning.
 * Plain Node — no test framework, no TS imports.
 * Run: node src/game/logic.test.mjs
 */

// ─── Inline rank/direction (mirrors deck.ts) ─────────────────────────────────

const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']

function rankOf(value) {
  const idx = VALUES.indexOf(value)
  if (idx === -1) throw new Error(`Unknown value: ${value}`)
  return idx + 1
}

function directionFor(guess, actual) {
  return rankOf(actual) > rankOf(guess) ? 'higher' : 'lower'
}

// ─── Assertion helpers ────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS  ${label}`)
    passed++
  } else {
    console.error(`  FAIL  ${label}`)
    failed++
  }
}

function assertEqual(a, b, label) {
  assert(a === b, `${label}  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`)
}

// ─── Rank order assertions ────────────────────────────────────────────────────

console.log('\n=== Rank order ===')
assertEqual(rankOf('A'),  1,  'A is rank 1 (lowest)')
assertEqual(rankOf('2'),  2,  '2 is rank 2')
assertEqual(rankOf('10'), 10, '10 is rank 10')
assertEqual(rankOf('J'),  11, 'J is rank 11')
assertEqual(rankOf('Q'),  12, 'Q is rank 12')
assertEqual(rankOf('K'),  13, 'K is rank 13 (highest)')

// ─── Direction assertions ─────────────────────────────────────────────────────

console.log('\n=== directionFor ===')
assertEqual(directionFor('A', 'K'),  'higher', 'A guess, K actual → higher')
assertEqual(directionFor('K', 'A'),  'lower',  'K guess, A actual → lower')
assertEqual(directionFor('5', '9'),  'higher', '5 guess, 9 actual → higher')
assertEqual(directionFor('9', '5'),  'lower',  '9 guess, 5 actual → lower')
assertEqual(directionFor('J', 'Q'),  'higher', 'J guess, Q actual → higher')
assertEqual(directionFor('Q', 'J'),  'lower',  'Q guess, J actual → lower')

// ─── Scripted round traces ────────────────────────────────────────────────────
// These trace the state machine by hand to verify rule logic.

console.log('\n=== Scripted round traces ===')

/**
 * Round 1: guesser calls correct on first try → dealer drinks 4.
 *   Card: Q. Guess: Q. → CORRECT first call → dealer -4.
 */
{
  const card = 'Q'
  const guess1 = 'Q'
  let dealerDrinks = 0
  let guesserDrinks = 0
  let outcome = null

  if (guess1 === card) {
    // First call correct
    dealerDrinks += 4
    outcome = `Dealer drinks 4 (called it first try)`
  }

  assert(dealerDrinks === 4, `Round 1: dealer drinks 4 on correct first call`)
  assert(guesserDrinks === 0, `Round 1: guesser drinks 0`)
  console.log(`  trace: card=${card}, guess=${guess1} → ${outcome}`)
}

/**
 * Round 2: guesser wrong on first, correct on second → dealer drinks 2.
 *   Card: 7. Guess1: 3 (wrong, lower < 7 so hint = higher).
 *   Guess2: 7 → CORRECT second call → dealer -2.
 */
{
  const card = '7'
  const guess1 = '3'
  const guess2 = '7'
  let dealerDrinks = 0
  let guesserDrinks = 0
  let outcome = null

  if (guess1 !== card) {
    const hint = directionFor(guess1, card)
    assertEqual(hint, 'higher', 'Round 2: hint after guess 3 vs card 7')
    if (guess2 === card) {
      dealerDrinks += 2
      outcome = `Dealer drinks 2 (correct second call). hint was: ${hint}`
    } else {
      guesserDrinks += 1
      outcome = `Guesser drinks 1 (two wrong calls). hint was: ${hint}`
    }
  }

  assert(dealerDrinks === 2, `Round 2: dealer drinks 2 on correct second call`)
  assert(guesserDrinks === 0, `Round 2: guesser drinks 0`)
  console.log(`  trace: card=${card}, guess1=${guess1}, hint=higher, guess2=${guess2} → ${outcome}`)
}

/**
 * Round 3: guesser wrong on both calls → guesser drinks 1.
 *   Card: 5. Guess1: J (wrong, hint = lower). Guess2: 9 (also wrong) → guesser -1.
 */
{
  const card = '5'
  const guess1 = 'J'
  const guess2 = '9'
  let dealerDrinks = 0
  let guesserDrinks = 0
  let outcome = null

  if (guess1 !== card) {
    const hint = directionFor(guess1, card)
    assertEqual(hint, 'lower', 'Round 3: hint after guess J vs card 5')
    if (guess2 === card) {
      dealerDrinks += 2
      outcome = `Dealer drinks 2 (correct second call). hint was: ${hint}`
    } else {
      guesserDrinks += 1
      outcome = `Guesser drinks 1 (two wrong calls). hint was: ${hint}`
    }
  }

  assert(dealerDrinks === 0, `Round 3: dealer drinks 0`)
  assert(guesserDrinks === 1, `Round 3: guesser drinks 1 on two wrong calls`)
  console.log(`  trace: card=${card}, guess1=${guess1}, hint=lower, guess2=${guess2} → ${outcome}`)
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
