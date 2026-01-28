#!/usr/bin/env bash
set -euo pipefail

in="${1:-}"
out="${2:-}"

if [[ -z "${in}" || -z "${out}" ]]; then
  echo "Usage: $0 input.svg output.svg" >&2
  exit 2
fi

palette=(
  "#e6194b" "#3cb44b" "#ffe119" "#4363d8" "#f58231" "#911eb4"
  "#46f0f0" "#f032e6" "#bcf60c" "#fabebe" "#008080" "#e6beff"
  "#9a6324" "#fffac8" "#800000" "#aaffc3" "#808000" "#ffd8b1"
  "#000075" "#808080"
)

pal_csv="$(IFS=,; echo "${palette[*]}")"

PAL="$pal_csv" perl -0777 -pe '
  BEGIN {
    @pal = split(/,/, $ENV{PAL});
    die "Palette is empty\n" unless @pal;
    $i = 0;
  }

  s{
    (<path\b[^>]*)(/?>)
  }{
    my ($a,$b) = ($1,$2);
    my $c = $pal[$i++ % scalar(@pal)];

    if ($a =~ s/\bstroke="[^"]*"/stroke="$c"/) {
      "$a$b";
    } else {
      "$a stroke=\"$c\"$b";
    }
  }gsex
' "$in" > "$out"

echo "Wrote: $out"
