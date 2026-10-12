import { assertEquals } from "@std/assert";

const root = new URL("../../", import.meta.url);
const grammar = await Deno.readTextFile(new URL("main/grammar.ts", root));
const scanner = await Deno.readTextFile(new URL("src/scanner.c", root));

/** Names in the scanner's GRAMMAR_DIRECTIVES list. */
function scannerDirectives(): Set<string> {
  const block = scanner.split("// BEGIN GRAMMAR DIRECTIVES")[1]
    .split("// END GRAMMAR DIRECTIVES")[0];
  return new Set([...block.matchAll(/"([A-Za-z\d]+)"/g)].map((m) => m[1]));
}

/** Directive names main/grammar.ts gives a rule of their own. */
function grammarDirectives(): Set<string> {
  const literals = [...grammar.matchAll(/"@([A-Za-z\d]+)"/g)].map((m) => m[1]);
  // Regex alternatives such as /@(continue|break)/ and
  // /@(slack|discord|telegram|microsoftTeams)/.
  const alternatives = [...grammar.matchAll(/\/@\(([A-Za-z\d|]+)\)\//g)]
    .flatMap((m) => m[1].split("|"));
  return new Set([...literals, ...alternatives]);
}

/** The scanner leaves these prefixes alone wholesale (GRAMMAR_DIRECTIVE_PREFIXES). */
const PREFIXED = /^(end|else|unless)/;

Deno.test("the custom-inline lookahead leaves every grammar directive alone", () => {
  const known = scannerDirectives();
  const missing = [...grammarDirectives()].filter((name) =>
    !known.has(name) && !PREFIXED.test(name)
  );
  assertEquals(missing, []);
});
