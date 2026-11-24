/**
 * Pokémon GO Search String Validator (Leidwesen/SearchPhrases v0.435.1 guardrails).
 */
import { parseToAst } from './queryBuilder';

const SPECIMEN_VARIANTS = new Set([
  'shiny', 'background', 'locationbackground', 'specialbackground', 'profilebackground',
  'costume', 'shadow', 'purified', 'dynamax', 'gigantamax', 'lucky',
  'xxl', 'xxs', '@special', 'fusion', 'adventureeffect', 'maxmove1-',
]);

const INVERTED_RANGE_REGEX = /^(age|year|distance|cp|buddy)(\d+)-(\d+)$/;
const INVERTED_IV_REGEX = /^([0-4])-([0-4])(attack|defense|hp)$/;

export function validateSearchString(searchString, options = {}) {
  const str = typeof searchString === 'string' ? searchString : '';
  const errors = [];
  const warnings = [];
  const charCount = str.length;

  if (!str.trim()) {
    return { valid: true, errors, warnings, charCount };
  }

  if (charCount > 5000) {
    errors.push({
      code: 'LENGTH_ERROR',
      message: `Search string is ${charCount} characters (exceeds PoGO ~5,000-char ceiling). Split or collapse ranges.`,
      token: `${charCount} chars`,
    });
  } else if (charCount > 4000) {
    warnings.push({
      code: 'LENGTH_WARNING',
      message: `Search string is ${charCount} characters (>4,000 chars may lag or truncate on some mobile devices).`,
      token: `${charCount} chars`,
    });
  }

  if (/[()"]/.test(str)) {
    warnings.push({
      code: 'UNSUPPORTED_GROUPING',
      message: 'Parentheses () and quotes "" are not grouping operators in Pokémon GO (CNF precedence applies).',
      token: str.match(/[()"]/)?.[0] || '',
    });
  }

  if (str.includes('|')) {
    warnings.push({
      code: 'PIPE_IS_AND',
      message: '`|` means logical AND in Pokémon GO (not OR). Use `&` for AND and `,` for OR.',
      token: '|',
    });
  }

  if (/!\s+\S/.test(str)) {
    errors.push({
      code: 'SPACE_AFTER_NOT',
      message: 'Space after `!` breaks negation in Pokémon GO (use `!shiny`, never `! shiny`).',
      token: str.match(/!\s+\S+/)?.[0] || '!',
    });
  }

  const ast = parseToAst(str);
  const allAtomValues = ast.clauses.flatMap((c) =>
    c.atoms.map((a) => (a.negated ? `!${a.value}` : a.value))
  );

  const inferredTrash =
    Boolean(options.isTrashContext) ||
    (allAtomValues.includes('!favorite') &&
      allAtomValues.includes('!shiny') &&
      (allAtomValues.includes('0*') || allAtomValues.includes('!#')));

  for (const clause of ast.clauses) {
    for (const atom of clause.atoms) {
      const val = atom.value;
      const full = atom.negated ? `!${val}` : val;

      if (val === 'ultrabeasts') {
        errors.push({
          code: 'INVALID_ULTRABEASTS',
          message: '`ultrabeasts` (plural without space) does not work in Pokémon GO. Use `ultrabeast`.',
          token: full,
        });
      }

      if (val === 'partyplay') {
        errors.push({
          code: 'INVALID_PARTYPLAY',
          message: '`partyplay` does not exist in Pokémon GO. Use `party`.',
          token: full,
        });
      }

      // Catch both bounded (!0-1attack, !4hp) and open-ended (!-1attack, !3-attack) negated IV bars
      if (atom.negated && /^(?:[0-4]?-[0-4]|[0-4]-[0-4]?|[0-4])(?:attack|defense|hp)$/.test(val)) {
        errors.push({
          code: 'NEGATED_IV_STAT',
          message: `Pokémon GO ignores \`!\` on IV stat filters (\`${full}\` acts as \`${val}\`). Use the complement range instead.`,
          token: full,
        });
      }

      if (/^\+\d/.test(val)) {
        errors.push({
          code: 'PLUS_ON_DEX',
          message: `\`+\` does not work on Pokédex numbers (\`${full}\`). Expand family dex IDs explicitly or use species name.`,
          token: full,
        });
      }

      if (/^[0-4]-[0-4]\*$/.test(val)) {
        errors.push({
          code: 'INVALID_STAR_RANGE',
          message: `Appraisal stars do not support range hyphens (\`${full}\`). Use comma-separated stars (e.g., \`0*,1*,2*\`).`,
          token: full,
        });
      }

      // Inverted numeric or IV range check (e.g. age10-5, 4-1attack)
      const invRange = val.match(INVERTED_RANGE_REGEX);
      if (invRange && Number(invRange[2]) > Number(invRange[3])) {
        warnings.push({
          code: 'INVERTED_RANGE',
          message: `\`${full}\` has min (${invRange[2]}) > max (${invRange[3]}) and will match nothing. Did you mean \`${invRange[1]}${invRange[3]}-${invRange[2]}\`?`,
          token: full,
        });
      }
      const invIv = val.match(INVERTED_IV_REGEX);
      if (invIv && Number(invIv[1]) > Number(invIv[2])) {
        warnings.push({
          code: 'INVERTED_RANGE',
          message: `\`${full}\` has min (${invIv[1]}) > max (${invIv[2]}) and will match nothing. Did you mean \`${invIv[2]}-${invIv[1]}${invIv[3]}\`?`,
          token: full,
        });
      }

      if (/^distance\d+$/.test(val)) {
        const km = val.slice(8);
        warnings.push({
          code: 'BARE_DISTANCE',
          message: atom.negated
            ? `\`${full}\` without a trailing \`-\` means > ${km} km. Use \`!${val}-\` to exclude ≥ ${km} km.`
            : `\`${full}\` without a trailing \`-\` means ≤ ${km} km. Use \`${val}-\` for ≥ ${km} km.`,
          token: full,
        });
      }

      if (atom.negated && /^mega[0-4]?(?:-[0-4]?)?$/.test(val)) {
        if (inferredTrash) {
          errors.push({
            code: 'NEGATED_MEGA_IN_TRASH',
            message: `\`${full}\` only returns Mega-capable species and hides all non-Megas! Protect leveled Megas via \`!#\` instead.`,
            token: full,
          });
        } else {
          warnings.push({
            code: 'NEGATED_MEGA_OUTSIDE_TRASH',
            message: `\`${full}\` only matches Mega-capable species whose Mega level differs — it hides all non-Mega species.`,
            token: full,
          });
        }
      }

      if (inferredTrash && atom.negated && (val === '@3mov' || val === '@3move_name_0000')) {
        errors.push({
          code: 'INVERTED_3MOV_IN_TRASH',
          message: `\`!@3mov\` matches Pokémon WITH a 2nd charged move! Use \`@3mov\` in trash strings to shield double-moved builds.`,
          token: full,
        });
      }
    }
  }

  // Detect specimen-variant + count{N} trap across single and multi-atom positive clauses
  const positiveVariantClause = ast.clauses.find(
    (c) => c.atoms.length > 0 && c.atoms.every((a) => !a.negated && SPECIMEN_VARIANTS.has(a.value))
  );
  const countRangeClause = ast.clauses.find(
    (c) =>
      c.atoms.length === 1 &&
      !c.atoms[0].negated &&
      (c.atoms[0].value === 'count' || /^count(?:\d*-\d*|\d+)$/.test(c.atoms[0].value)) &&
      c.atoms[0].value !== 'count1'
  );
  if (positiveVariantClause && countRangeClause) {
    const variantToken = positiveVariantClause.raw;
    const countToken = countRangeClause.atoms[0].value;
    warnings.push({
      code: 'VARIANT_COUNT_TRAP',
      message: `\`${countToken}\` counts ALL copies of that National Dex # in your box, NOT just \`${variantToken}\` copies — this can hide 1-of-1 \`${variantToken}\` keepers or flag your only \`${variantToken}\` as surplus! Tag keepers sorted by \`#\` first, then filter by \`!#\`.`,
      token: `${variantToken}&${countToken}`,
    });
  }

  if (!inferredTrash) {
    const hasPositiveMaxOrTagScope = ast.clauses.some((c) =>
      c.atoms.some(
        (a) =>
          !a.negated &&
          (/^(?:maxmove|maxguard|maxspirit|dynamax|gigantamax)/.test(a.value) || a.value.startsWith('#'))
      )
    );
    if (!hasPositiveMaxOrTagScope) {
      const unscopedNegMax = ast.clauses
        .flatMap((c) => c.atoms)
        .find((a) => a.negated && /^(?:maxguard|maxspirit|maxmove[23])/.test(a.value));
      if (unscopedNegMax) {
        warnings.push({
          code: 'UNSCOPED_NEGATED_MAX',
          message: `\`!${unscopedNegMax.value}\` returns every non-Max Pokémon in your storage too. Scope with \`maxmove1-&\` or a \`#max-\` tag first.`,
          token: `!${unscopedNegMax.value}`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    charCount,
  };
}
