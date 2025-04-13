# striprtf for Deno

## Purpose
This is a Deno module to convert Rich Text Format (RTF) files to plain text. Many documents, especially in medical and legacy systems, are written in RTF format which is not ideal for parsing and further processing. This library converts them to plain text while preserving structure.

## Features
- Handles RTF character encodings properly using iconv-lite
- Improved table formatting over the original
- Preserves Unicode characters and special characters
- Handles nested groups and control words according to RTF specification
- Font-specific encoding support for hex escapes

## Usage

```ts
import { rtfToText } from "https://deno.land/x/striprtf/mod.ts";

// Basic usage
const rtf = "some rtf encoded string";
const text = rtfToText(rtf);
console.log(text);

// With custom encoding
const rtfCustomEncoding = "some rtf encoded string in different encoding";
const textCustom = rtfToText(rtfCustomEncoding, "cp1251"); // Use specific encoding
console.log(textCustom);

// With custom error handling
const rtfPotentialErrors = "some rtf with potential encoding issues";
const textSafe = rtfToText(rtfPotentialErrors, "cp1252", "ignore"); // Ignore encoding errors
console.log(textSafe);
```

## CLI Usage

You can also use this module directly from the command line:

```bash
deno run --allow-read https://deno.land/x/striprtf/mod.ts input.rtf [encoding] [error_mode]
```

Where:
- `input.rtf` is the path to your RTF file
- `encoding` (optional) is the default encoding to use (defaults to cp1252)
- `error_mode` (optional) is either "strict" or "ignore" (defaults to "ignore")

## Original Project

This is a port of the Python [striprtf](https://github.com/joshy/striprtf) library by Joshy Cyriac, ported from commit [6365066](https://github.com/joshy/striprtf/commit/6365066867a5d94dff6d2d534e01138d34550d45).

The original Python version is available at [https://github.com/joshy/striprtf](https://github.com/joshy/striprtf).

## Testing

The module includes two test approaches:

### Standard Tests

```bash
# Run the standard test suite
deno test --allow-read mod.test.ts
```

The standard test suite includes:
1. Tests for simple RTF conversion
2. Tests for table formatting
3. Tests for Unicode character handling
4. A test for the sample hello.rtf file

### Comprehensive Testing

```bash
# Run the comprehensive test suite (processes all RTF files)
deno run --allow-read test_all.ts
```

The comprehensive test:
1. Processes all RTF files in the `striprtf/tests/rtf/` directory
2. Shows a success percentage and details of any failures
3. Doesn't fail on errors, allowing you to see results for all files

## License

BSD 3-Clause License, same as the original Python library.
