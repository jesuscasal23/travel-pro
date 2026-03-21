/**
 * ESLint rule: no-hardcoded-colors
 *
 * Flags arbitrary Tailwind color values like bg-[#xxx], text-[#xxx],
 * border-[#xxx], etc. in className strings and JSX className attributes.
 * These should use design tokens defined in globals.css instead.
 */

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hardcoded hex colors in Tailwind arbitrary values (e.g. bg-[#fff]). Use design tokens instead.",
    },
    messages: {
      noHardcodedColor:
        'Avoid hardcoded color "{{value}}" in className. Use a design token from globals.css instead (e.g. bg-surface-soft, text-app-blue).',
    },
    schema: [],
  },

  create(context) {
    // Matches Tailwind arbitrary color values: bg-[#xxx], text-[#xxx], border-[#xxx], etc.
    const ARBITRARY_COLOR_RE =
      /(?:bg|text|border|from|to|via|ring|outline|shadow|divide|placeholder|fill|stroke|accent|decoration)-\[#[0-9a-fA-F]{3,8}\]/g;

    function checkStringForColors(node, value) {
      let match;
      ARBITRARY_COLOR_RE.lastIndex = 0;
      while ((match = ARBITRARY_COLOR_RE.exec(value)) !== null) {
        context.report({
          node,
          messageId: "noHardcodedColor",
          data: { value: match[0] },
        });
      }
    }

    return {
      // className="bg-[#xxx]"
      JSXAttribute(node) {
        if (node.name.name !== "className" && node.name.name !== "class") return;

        // Simple string literal
        if (node.value?.type === "Literal" && typeof node.value.value === "string") {
          checkStringForColors(node.value, node.value.value);
        }

        // JSX expression: className={...}
        if (node.value?.type === "JSXExpressionContainer") {
          visitExpression(node.value.expression);
        }
      },

      // Also catch variables assigned to className-like strings
      // e.g. const cls = "bg-[#fff]"
      VariableDeclarator(node) {
        if (
          node.init?.type === "Literal" &&
          typeof node.init.value === "string" &&
          node.id?.name?.toLowerCase().includes("class")
        ) {
          checkStringForColors(node.init, node.init.value);
        }
      },
    };

    function visitExpression(expr) {
      if (!expr) return;

      switch (expr.type) {
        case "Literal":
          if (typeof expr.value === "string") {
            checkStringForColors(expr, expr.value);
          }
          break;

        case "TemplateLiteral":
          for (const quasi of expr.quasis) {
            checkStringForColors(quasi, quasi.value.raw);
          }
          break;

        case "ConditionalExpression":
          visitExpression(expr.consequent);
          visitExpression(expr.alternate);
          break;

        case "BinaryExpression":
          if (expr.operator === "+") {
            visitExpression(expr.left);
            visitExpression(expr.right);
          }
          break;

        case "LogicalExpression":
          visitExpression(expr.left);
          visitExpression(expr.right);
          break;
      }
    }
  },
};

module.exports = rule;
