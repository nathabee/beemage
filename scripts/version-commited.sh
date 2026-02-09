#!/usr/bin/env bash
set -euo pipefail

FILE="docs/version.md"

if [[ ! -f "$FILE" ]]; then
  exit 0
fi

TABLE="$(
  {
    echo '| Date       | Version   | Summary |'
    echo '|------------|-----------|---------|'

    git log --reverse --date=short --pretty=format:'%ad|%s' \
    | grep '|v' \
    | awk -F'|' '
    {
      if (match($2, /v[0-9]+\.[0-9]+\.[0-9]+/)) {
        v = substr($2, RSTART, RLENGTH)

        if (!(v in seen)) {
          seen[v] = 1
          date[v] = $1

          summary = $2
          sub(/^v[0-9]+\.[0-9]+\.[0-9]+[[:space:]]*[-—:]?[[:space:]]*/, "", summary)
          if (summary == "") summary = "—"

          label[v] = summary
          order[++n] = v
        }
      }
    }
    END {
      for (i = n; i >= 1; i--) {   # newest at top
        v = order[i]
        printf "| %s | %s | %s |\n", date[v], v, label[v]
      }
    }'
  }
)"

awk -v table="$TABLE" '
BEGIN { in_block = 0 }
/<!-- VERSION_ACTIVITY_START -->/ {
  print
  print table
  in_block = 1
  next
}
/<!-- VERSION_ACTIVITY_END -->/ {
  in_block = 0
}
!in_block {
  print
}
' "$FILE" > "$FILE.tmp"

mv "$FILE.tmp" "$FILE"

git add "$FILE"
