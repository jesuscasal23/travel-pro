#!/usr/bin/env bash
# Scans all .md files (excluding node_modules) for src/ file path references
# and verifies each path exists on disk. Exits with code 1 if any are missing.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

exit_code=0
missing_count=0

# Find all .md files excluding node_modules
while IFS= read -r md_file; do
  # Extract src/ paths that look like file references (ending in .ts, .tsx, .js, .jsx, .css, .json)
  while IFS= read -r path; do
    # Skip empty lines
    [ -z "$path" ] && continue
    # Strip trailing punctuation (quotes, parens, backticks, commas, periods)
    clean_path=$(echo "$path" | sed 's/[`"'\''(),;:>]*$//')
    # Verify the cleaned path exists
    if [ ! -f "$clean_path" ] && [ ! -d "$clean_path" ]; then
      echo "MISSING: $clean_path (referenced in $md_file)"
      exit_code=1
      missing_count=$((missing_count + 1))
    fi
  done < <(grep -oE 'src/[a-zA-Z0-9_./@-]+\.(ts|tsx|js|jsx|css|json)' "$md_file" 2>/dev/null | sort -u)
done < <(find . -name '*.md' -not -path '*/node_modules/*' -not -path '*/.claude/*')

if [ $exit_code -eq 0 ]; then
  echo "All file references in documentation are valid."
else
  echo ""
  echo "Found $missing_count missing file reference(s). Please update the documentation."
fi

exit $exit_code
