#!/usr/bin/env bash
# Scans all .md files (excluding node_modules and docs/plans/) for src/ file path references
# and verifies each path exists on disk. Exits with code 1 if any are missing.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

exit_code=0
missing_count=0

# Find all .md files excluding node_modules
while IFS= read -r md_file; do
  # Extract lines containing src/ paths, skip lines about deleted/planned/removed files
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    # Skip lines that describe deleted, removed, or not-yet-implemented files
    if echo "$line" | grep -qiE '(deleted|removed|not yet implemented|planned at|was never|was fully|consolidated into)'; then
      continue
    fi
    # Extract src/ paths from the line
    for path in $(echo "$line" | grep -oE 'src/[a-zA-Z0-9_./@-]+\.(ts|tsx|js|jsx|css|json)'); do
      clean_path=$(echo "$path" | sed 's/[`"'\''(),;:>]*$//')
      if [ ! -f "$clean_path" ] && [ ! -d "$clean_path" ]; then
        echo "MISSING: $clean_path (referenced in $md_file)"
        exit_code=1
        missing_count=$((missing_count + 1))
      fi
    done
  done < <(grep -E 'src/[a-zA-Z0-9_./@-]+\.(ts|tsx|js|jsx|css|json)' "$md_file" 2>/dev/null)
done < <(find . -name '*.md' -not -path '*/node_modules/*' -not -path '*/.claude/*' -not -path '*/docs/plans/*')

if [ $exit_code -eq 0 ]; then
  echo "All file references in documentation are valid."
else
  echo ""
  echo "Found $missing_count missing file reference(s). Please update the documentation."
fi

exit $exit_code
