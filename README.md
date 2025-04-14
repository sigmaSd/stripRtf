# stripRtf (javacript)

## Purpose

This is a Deno module to convert Rich Text Format (RTF) files to plain text.
Many documents, especially in medical and legacy systems, are written in RTF
format which is not ideal for parsing and further processing. This library
converts them to plain text while preserving structure.

This module works across runtimes.

## Usage

## Examples

**Example 1**

```ts
import stripRtf from "@sigma/stripRtf";

// Basic usage
const rtf = "some rtf encoded string";
const text = stripRtf(rtf);
console.log(text);

// With custom encoding
const rtfCustomEncoding = "some rtf encoded string in different encoding";
const textCustom = stripRtf(rtfCustomEncoding, "cp1251"); // Use specific encoding
console.log(textCustom);

// With custom error handling
const rtfPotentialErrors = "some rtf with potential encoding issues";
const textSafe = stripRtf(rtfPotentialErrors, "cp1252", "ignore"); // Ignore encoding errors
console.log(textSafe);
```

## CLI Usage

You can also use this module directly from the command line:

```bash
deno -R jsr:@sigma/stripRtf input.rtf [encoding] [error_mode]
```

Where:

- `input.rtf` is the path to your RTF file
- `encoding` (optional) is the default encoding to use (defaults to cp1252)
- `error_mode` (optional) is either "strict" or "ignore" (defaults to "ignore")

## Original Project

This is a port of the Python [striprtf](https://github.com/joshy/striprtf)
library by Joshy Cyriac, ported from commit
[6365066](https://github.com/joshy/striprtf/commit/6365066867a5d94dff6d2d534e01138d34550d45).

The original Python version is available at
[https://github.com/joshy/striprtf](https://github.com/joshy/striprtf).

## Testing

This module uses tests from the original Python library.

```bash
deno test -R
```

## License

BSD 3-Clause License, same as the original Python library.
