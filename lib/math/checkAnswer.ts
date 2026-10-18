import type { Problem } from "@/lib/types";

interface Rational {
  numerator: bigint;
  denominator: bigint;
}

const gcd = (a: bigint, b: bigint): bigint => {
  const zero = BigInt(0);
  let left = a < zero ? -a : a;
  let right = b < zero ? -b : b;
  while (right !== zero) {
    [left, right] = [right, left % right];
  }
  return left;
};

function rational(numerator: bigint, denominator: bigint): Rational | null {
  const zero = BigInt(0);
  if (denominator === zero) return null;
  const sign = denominator < zero ? BigInt(-1) : BigInt(1);
  const divisor = gcd(numerator, denominator);
  return {
    numerator: (numerator / divisor) * sign,
    denominator: (denominator / divisor) * sign,
  };
}

function decimalToRational(value: string): Rational | null {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) return null;
  const [, sign, whole, decimal = ""] = match;
  const denominator = BigInt(10) ** BigInt(decimal.length);
  const magnitude = BigInt(whole) * denominator + BigInt(decimal || "0");
  return rational(sign === "-" ? -magnitude : magnitude, denominator);
}

function parsePart(value: string): Rational | null {
  const trimmed = value.trim().replace(/,/g, "");
  const fraction = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(trimmed);
  if (fraction) return rational(BigInt(fraction[1]), BigInt(fraction[2]));

  const mixed = /^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(trimmed);
  if (mixed) {
    const negative = mixed[1].startsWith("-");
    const whole = BigInt(mixed[1]);
    const numerator = BigInt(mixed[2]);
    const denominator = BigInt(mixed[3]);
    if (denominator === BigInt(0)) return null;
    const direction = negative ? BigInt(-1) : BigInt(1);
    return rational(whole * denominator + direction * numerator, denominator);
  }

  return decimalToRational(trimmed);
}

function parseAnswer(value: string): Rational | null {
  const normalized = value
    .trim()
    .replace(/,/g, "")
    .replace(
      /^(?:(?:my )?answer|I think(?: it's| it is)?|I got|I would say|it is|it's)\s*[:=]?\s*/i,
      "",
    )
    .replace(/\s*(?:cups?|tablespoons?|tbsp|teaspoons?|tsp|items?|students?)\s*$/i, "")
    .trim();

  const expressions =
    normalized.match(/[-+]?\d+(?:\.\d+)?(?:\s*[/:]\s*[-+]?\d+(?:\.\d+)?)?/g) ?? [];
  const answerText =
    expressions.length === 1 ? expressions[0].replace(/\s+/g, "") : normalized;
  const ratio = /^(.+?)\s*:\s*(.+)$/.exec(answerText);
  if (ratio) {
    const left = parsePart(ratio[1]);
    const right = parsePart(ratio[2]);
    if (!left || !right || right.numerator === BigInt(0)) return null;
    return rational(
      left.numerator * right.denominator,
      left.denominator * right.numerator,
    );
  }

  return parsePart(answerText);
}

function sameRational(left: Rational | null, right: Rational | null): boolean {
  return (
    left !== null &&
    right !== null &&
    left.numerator === right.numerator &&
    left.denominator === right.denominator
  );
}

function classifyRatioError(problem: Problem, answer: string): string | undefined {
  const values = [...problem.prompt.matchAll(/(?<![\w.])\d+(?:\.\d+)?/g)].map(
    ([value]) => decimalToRational(value),
  );
  if (values.length !== 3 || values.some((value) => value === null)) return undefined;

  const [first, second, target] = values as [Rational, Rational, Rational];
  if (
    first.numerator === BigInt(0) ||
    second.numerator === BigInt(0)
  ) {
    return undefined;
  }

  const addedAcross = rational(
    second.numerator * first.denominator * target.denominator +
      (target.numerator * first.denominator -
        first.numerator * target.denominator) *
        second.denominator,
    first.denominator * second.denominator * target.denominator,
  );
  if (sameRational(parseAnswer(answer), addedAcross)) {
    return "adds-across-ratio-table";
  }

  const reversed = rational(
    first.numerator * target.numerator * second.denominator,
    first.denominator * target.denominator * second.numerator,
  );
  if (sameRational(parseAnswer(answer), reversed)) return "reverses-ratio";

  if (sameRational(parseAnswer(answer), second)) {
    return "scales-only-one-ratio-term";
  }
  return undefined;
}

/**
 * Compare numeric, fraction, and ratio answers exactly; no floating-point rounding
 * is used, so equivalent forms such as 6/8, 3/4, and 3:4 agree.
 */
export function check_answer(
  problem: Problem,
  answer: string,
): { correct: boolean; error_type?: string } {
  const actual = parseAnswer(answer);
  const expected = parseAnswer(problem.answer);
  if (sameRational(actual, expected)) return { correct: true };

  const ratioError =
    problem.skill_id === "6.RP.A.3"
      ? classifyRatioError(problem, answer)
      : undefined;
  return {
    correct: false,
    error_type:
      ratioError ?? (actual === null ? "unrecognized-answer" : "calculation-slip"),
  };
}
