/**
 * RTF to plain text converter.
 * Utilizes iconv-lite for robust handling of legacy character encodings found in RTF.
 * Handles nested groups, control words, control symbols, Unicode escapes (\u),
 * and hex escapes (\'xx) according to the detected document encoding OR
 * the encoding specified by the current font's \fcharset.
 *
 * Port of https://github.com/joshy/striprtf
 * Ported to TypeScript and modified for improved table output and encoding handling.
 * Includes font-specific encoding support for hex escapes (\'xx).
 */

import iconv from "npm:iconv-lite@0.6.3";

// --- RTF Control Word Definitions ---

/**
 * Set of RTF control words that designate sections (destinations) often containing
 * metadata, formatting definitions, or non-textual content. The parser uses this
 * to identify blocks that might need special handling (ignoring or suppressing output).
 * Examples: \fonttbl, \colortbl, \stylesheet, \info, \pict, \object
 */
const destinations: Set<string> = new Set([
  "aftncn",
  "aftnsep",
  "aftnsepc",
  "annotation",
  "atnauthor",
  "atndate",
  "atnicn",
  "atnid",
  "atnparent",
  "atnref",
  "atntime",
  "atrfend",
  "atrfstart",
  "author",
  "background",
  "bkmkend",
  "bkmkstart",
  "blipuid",
  "buptim",
  "category",
  "colorschememapping",
  "colortbl",
  "comment",
  "company",
  "creatim",
  "datafield",
  "datastore",
  "defchp",
  "defpap",
  "do",
  "doccomm",
  "docvar",
  "dptxbxtext",
  "ebcend",
  "ebcstart",
  "factoidname",
  "falt",
  "fchars",
  "ffdeftext",
  "ffentrymcr",
  "ffexitmcr",
  "ffformat",
  "ffhelptext",
  "ffl",
  "ffname",
  "ffstattext",
  "file",
  "filetbl",
  "fldinst",
  "fldtype",
  "fonttbl",
  "fname",
  "fontemb",
  "fontfile",
  "footer",
  "footerf",
  "footerl",
  "footerr",
  "footnote",
  "formfield",
  "ftncn",
  "ftnsep",
  "ftnsepc",
  "g",
  "generator",
  "gridtbl",
  "header",
  "headerf",
  "headerl",
  "headerr",
  "hl",
  "hlfr",
  "hlinkbase",
  "hlloc",
  "hlsrc",
  "hsv",
  "htmltag",
  "info",
  "keycode",
  "keywords",
  "latentstyles",
  "lchars",
  "levelnumbers",
  "leveltext",
  "lfolevel",
  "linkval",
  "list",
  "listlevel",
  "listname",
  "listoverride",
  "listoverridetable",
  "listpicture",
  "liststylename",
  "listtable",
  "listtext",
  "lsdlockedexcept",
  "macc",
  "maccPr",
  "mailmerge",
  "maln",
  "malnScr",
  "manager",
  "margPr",
  "mbar",
  "mbarPr",
  "mbaseJc",
  "mbegChr",
  "mborderBox",
  "mborderBoxPr",
  "mbox",
  "mboxPr",
  "mchr",
  "mcount",
  "mctrlPr",
  "md",
  "mdeg",
  "mdegHide",
  "mden",
  "mdiff",
  "mdPr",
  "me",
  "mendChr",
  "meqArr",
  "meqArrPr",
  "mf",
  "mfName",
  "mfPr",
  "mfunc",
  "mfuncPr",
  "mgroupChr",
  "mgroupChrPr",
  "mgrow",
  "mhideBot",
  "mhideLeft",
  "mhideRight",
  "mhideTop",
  "mhtmltag",
  "mlim",
  "mlimloc",
  "mlimlow",
  "mlimlowPr",
  "mlimupp",
  "mlimuppPr",
  "mm",
  "mmaddfieldname",
  "mmath",
  "mmathPict",
  "mmathPr",
  "mmaxdist",
  "mmc",
  "mmcJc",
  "mmconnectstr",
  "mmconnectstrdata",
  "mmcPr",
  "mmcs",
  "mmdatasource",
  "mmheadersource",
  "mmmailsubject",
  "mmodso",
  "mmodsofilter",
  "mmodsofldmpdata",
  "mmodsomappedname",
  "mmodsoname",
  "mmodsorecipdata",
  "mmodsosort",
  "mmodsosrc",
  "mmodsotable",
  "mmodsoudl",
  "mmodsoudldata",
  "mmodsouniquetag",
  "mmPr",
  "mmquery",
  "mmr",
  "mnary",
  "mnaryPr",
  "mnoBreak",
  "mnum",
  "mobjDist",
  "moMath",
  "moMathPara",
  "moMathParaPr",
  "mopEmu",
  "mphant",
  "mphantPr",
  "mplcHide",
  "mpos",
  "mr",
  "mrad",
  "mradPr",
  "mrPr",
  "msepChr",
  "mshow",
  "mshp",
  "msPre",
  "msPrePr",
  "msSub",
  "msSubPr",
  "msSubSup",
  "msSubSupPr",
  "msSup",
  "msSupPr",
  "mstrikeBLTR",
  "mstrikeH",
  "mstrikeTLBR",
  "mstrikeV",
  "msub",
  "msubHide",
  "msup",
  "msupHide",
  "mtransp",
  "mtype",
  "mvertJc",
  "mvfmf",
  "mvfml",
  "mvtof",
  "mvtol",
  "mzeroAsc",
  "mzeroDesc",
  "mzeroWid",
  "nesttableprops",
  "nextfile",
  "nonesttables",
  "objalias",
  "objclass",
  "objdata",
  "object",
  "objname",
  "objsect",
  "objtime",
  "oldcprops",
  "oldpprops",
  "oldsprops",
  "oldtprops",
  "oleclsid",
  "operator",
  "panose",
  "password",
  "passwordhash",
  "pgp",
  "pgptbl",
  "picprop",
  "pict",
  "pn",
  "pnseclvl",
  "pntext",
  "pntxta",
  "pntxtb",
  "printim",
  "private",
  "propname",
  "protend",
  "protstart",
  "protusertbl",
  "pxe",
  "result",
  "revtbl",
  "revtim",
  "rsidtbl",
  "rxe",
  "shp",
  "shpgrp",
  "shpinst",
  "shppict",
  "shprslt",
  "shptxt",
  "sn",
  "sp",
  "staticval",
  "stylesheet",
  "subject",
  "sv",
  "svb",
  "tc",
  "template",
  "themedata",
  "title",
  "txe",
  "ud",
  "upr",
  "userprops",
  "wgrffmtfilter",
  "windowcaption",
  "writereservation",
  "writereservhash",
  "xe",
  "xform",
  "xmlattrname",
  "xmlattrvalue",
  "xmlclose",
  "xmlname",
  "xmlnstbl",
  "xmlopen",
]);

/**
 * Maps RTF numeric character set identifiers (found after \fcharsetN or \ansicpgN)
 * to the corresponding encoding names recognized by iconv-lite.
 * This is essential for correctly decoding \'xx hex byte sequences.
 */
const charsetMap: Record<number, string> = {
  0: "cp1252", // ANSI Latin 1 (Default)
  1: "cp1252", // Default (often same as ANSI)
  2: "cp1252", // Symbol (often maps basic chars like ANSI) - Use 1252 as fallback base
  // Note: Python `codecs` often maps charset 2 to 'symbol'. iconv-lite doesn't have 'symbol'.
  // We'll rely on \u for actual symbol characters and treat \'xx in symbol fonts
  // as if they were cp1252 for potential fallback characters. This might differ from Python.
  77: "macroman", // Mac Roman
  78: "shiftjis", // Mac Japanese
  79: "big5", // Mac Chinese Traditional
  80: "euckr", // Mac Korean
  81: "cp1256", // Mac Arabic
  82: "cp1255", // Mac Hebrew
  83: "cp1253", // Mac Greek
  84: "cp1251", // Mac Cyrillic
  85: "gb2312", // Mac Chinese Simplified
  86: "cp1250", // Mac Latin 2 (Central/East Europe)
  87: "cp1251", // Mac Ukrainian
  88: "cp874", // Mac Thai
  128: "cp932", // Japanese Shift-JIS
  129: "cp949", // Korean EUC-KR / Unified Hangul
  130: "johab", // Korean Johab
  134: "cp936", // Chinese Simplified GBK
  136: "cp950", // Chinese Traditional Big5
  161: "cp1253", // Greek
  162: "cp1254", // Turkish
  163: "cp1258", // Vietnamese
  177: "cp1255", // Hebrew
  178: "cp1256", // Arabic
  186: "cp1257", // Baltic
  204: "cp1251", // Cyrillic
  222: "cp874", // Thai
  238: "cp1250", // Latin 2 (Central/East Europe)
  254: "cp437", // PC 437
  255: "cp850", // OEM Latin 1
  // Extended mappings based on common RTF usage / Python codecs mapping
  42: "cp1252", // SYMBOL CHARSET (fallback mapping)
  201: "cp1251", // Cyrillic (alternative code)
  10000: "macroman", // Mac Roman (alternative code)
  10001: "shiftjis", // Mac Japanese (alternative code)
  10002: "big5", // Mac Trad Chinese (alternative code)
  10003: "euckr", // Mac Korean (alternative code)
  10004: "cp1256", // Mac Arabic (alternative code)
  10005: "cp1255", // Mac Hebrew (alternative code)
  10006: "cp1253", // Mac Greek (alternative code)
  10007: "cp1251", // Mac Cyrillic (alternative code)
  10008: "gb2312", // Mac Simp Chinese (alternative code)
  10021: "cp874", // Mac Thai (alternative code)
  10029: "cp1250", // Mac Latin 2 (alternative code)
  10081: "cp1254", // Mac Turkish (alternative code)
};

/**
 * Maps common RTF section break control words to newline sequences.
 */
const sectionChars: Record<string, string> = {
  "par": "\n", // Paragraph break
  "sect": "\n\n", // Section break
  "page": "\n\n", // Page break (often treated like section break)
};

/**
 * Maps common RTF control words and symbols to their plain text equivalents or standard Unicode characters.
 */
const specialChars: Record<string, string> = {
  "line": "\n", // Line break
  "tab": "\t", // Tab character (Python striprtf uses \t for cell too)
  "emdash": "\u2014", // Em dash (—)
  "endash": "\u2013", // En dash (–)
  "emspace": "\u2003", // Em space
  "enspace": "\u2002", // En space
  "qmspace": "\u2005", // Quarter em space
  "bullet": "\u2022", // Bullet (•)
  "lquote": "\u2018", // Left single quote (‘)
  "rquote": "\u2019", // Right single quote (’)
  "ldblquote": "\u201C", // Left double quote (“)
  "rdblquote": "\u201D", // Right double quote (”)
  "row": "\n", // Table row end (treat as newline)
  "cell": "|", // Table cell boundary (using | for clearer table structure than \t)
  "nestcell": "|", // Nested table cell boundary
  "~": "\xa0", // Non-breaking space
  "\n": "\n", // Preserve explicit newlines in RTF source (rare)
  "\r": "\r", // Preserve explicit carriage returns (rare)
  "{": "{", // Escaped literal left brace
  "}": "}", // Escaped literal right brace
  "\\": "\\", // Escaped literal backslash
  "-": "\xad", // Optional hyphen (soft hyphen)
  "_": "\u2011", // Non-breaking hyphen
  ...sectionChars, // Include paragraph, section, page breaks
};

// --- Regular Expressions ---

/**
 * The core RTF tokenizer regex. Breaks the input stream into meaningful parts:
 * 1. Control Word:  \word+argument? (e.g., \par, \b, \f3, \ansicpg1252) - captures word & arg
 * 2. Hex Escape:   \'xx             (e.g., \'e9) - captures hex digits
 * 3. Control Symbol: \?               (e.g., \*, \{, \\, \~) - captures the symbol
 * 4. Brace:        { or }           (e.g., { ) - captures the brace
 * 5. Newlines:     \r or \n         (consumed, usually ignored structurally)
 * 6. Plain Text:   Any other char   (e.g., H, e, l, l, o) - captures the character
 */
const PATTERN =
  /\\([a-z]{1,32})(-?\d{1,10})?[ ]?|\\'([0-9a-f]{2})|\\([^a-z])|([{}])|[\r\n]+|(.)/gi;

/**
 * Regex to find and extract information from RTF hyperlink fields (\field containing HYPERLINK).
 * Used in pre-processing to simplify the RTF string.
 * Captures:
 * $1: Full field structure (for context, not used in replacement)
 * $2: The URL (quoted)
 * $3: The display text
 */
const HYPERLINKS =
  /(\{\\field\{\s*\\\*\\fldinst\{.*?HYPERLINK\s+(".*?").*?\}{2}\s*\{\\fldrslt\s*(.*?)\}{2,3})/gi; // Adjusted field result capture

/**
 * Regex to parse font definitions within the \fonttbl destination.
 * Extracts font ID, charset number, and font name.
 * Captures:
 * $1: Font ID (number)
 * $2: Charset ID (number)
 * $3: Font Name (string, terminated by ;)
 */
// Adjusted to be less greedy and handle optional charset/family commands better
const FONTTABLE = /\\f(\d+)(?:\\fcharset(\d+))?.*? T*([^;]+?);/g;

// --- Interfaces and Types ---

interface FontTableEntry {
  name: string; // Font name (e.g., "Arial")
  charset: string | null; // Original RTF charset number (e.g., "0", "128") or null if missing
  encoding: string; // iconv-lite compatible encoding name (e.g., "cp1252", "cp932")
}

// --- Main Conversion Function ---

/**
 * Converts RTF text content to plain text.
 * Decodes hex escape sequences (\'xx) using the current font's encoding (\fcharset)
 * if specified and supported, otherwise falls back to the document's default encoding (\ansicpg).
 *
 * @param rtfText The RTF text content as a string.
 * @param defaultEncoding The encoding to assume if not specified in the RTF (e.g., via \ansicpg). Defaults to 'cp1252'.
 * @param errors How to handle decoding errors encountered by iconv-lite:
 *                 'strict' - Throws an error.
 *                 'ignore' - Skips the problematic byte sequence and logs a console warning.
 * @returns The converted plain text as a string.
 */
export function rtfToText(
  rtfText: string,
  defaultEncoding: string = "cp1252",
  errors: "strict" | "ignore" = "ignore", // Defaulting to ignore for robustness
): string {
  // Match the python implementtion, don't process text after the formal RTF structure
  // Pre-processing: Truncate content after the formal RTF structure
  const lastClosingBraceIdx = rtfText.lastIndexOf("}");
  if (lastClosingBraceIdx > 0) {
    rtfText = rtfText.substring(0, lastClosingBraceIdx);
  }

  // Pre-processing: Simplify hyperlink fields into "DisplayText (URL)" format.
  rtfText = rtfText.replace(HYPERLINKS, (_match, _full, url, display) => {
    // Clean up URL (remove quotes) and display text (trim)
    const cleanedUrl = url.replace(/^"|"$/g, "");
    const cleanedDisplay = display.trim();
    return `${cleanedDisplay} (${cleanedUrl})`;
  });

  // --- Parser State Initialization ---

  // Stack to manage state changes when entering/exiting RTF groups ({ ... }).
  // Stores [ucskip, ignorable, suppressOutput] for the parent group.
  // Font ID is managed globally, not on the stack, as its effect persists.
  const stack: Array<[number, boolean, boolean]> = [];

  // Stores parsed font information (font ID -> {name, charset, encoding}).
  const fonttbl: Record<string, FontTableEntry> = {};

  // The primary character encoding for the document, determined by \ansicpgN.
  // Used as a fallback for decoding \'xx byte sequences.
  let documentEncoding = defaultEncoding;

  // --- State Flags ---
  // Is the current RTF group part of an ignorable destination (like \* or non-textual data)?
  let ignorable = false;
  // Should the textual content of the current group be suppressed from output (e.g., font/color tables)?
  let suppressOutput = false;
  // Number of bytes to skip after a \uN Unicode character (controlled by \ucN).
  let ucskip = 1;
  // Countdown of bytes currently being skipped after a \uN character.
  let curskip = 0;
  // NEW: Track the current font ID set by \fN
  let currentFontId: string | null = null;

  // Accumulates numeric byte values from consecutive \'xx sequences before decoding.
  let hexBytes: number[] = [];

  // The final plain text output string being built.
  let output = "";

  // --- Step 1: Font Table Parsing ---
  // Extract font definitions and map their charsets to iconv-lite encoding names.
  let fonttblMatch: RegExpExecArray | null;
  FONTTABLE.lastIndex = 0; // Ensure regex starts from the beginning
  while ((fonttblMatch = FONTTABLE.exec(rtfText)) !== null) {
    const fontId = fonttblMatch[1];
    const fcharset = fonttblMatch[2] || null; // Capture charset, or null if missing
    const fontName = fonttblMatch[3].trim().replace(/['"]$/, ""); // Trim and remove trailing quote if present

    let encoding = documentEncoding; // Default to document encoding
    let charsetNum: number | null = null;

    if (fcharset !== null) {
      charsetNum = parseInt(fcharset, 10);
      encoding = charsetMap[charsetNum] || documentEncoding; // Use map, fallback to document
    } else {
      // If \fcharset is missing, assume it matches the document's default ANSI CP
      // Or potentially infer from font name (complex, not done here)
      encoding = documentEncoding;
    }

    fonttbl[fontId] = { name: fontName, charset: fcharset, encoding: encoding };
  }

  // --- Step 2: Helper function to decode hex bytes based on current context ---
  const decodeHexBytes = () => {
    if (hexBytes.length === 0) return;

    let encodingToUse = documentEncoding; // Start with document default
    let usedFontEncoding = false;

    // Try to use current font's encoding
    if (
      currentFontId && fonttbl[currentFontId] && fonttbl[currentFontId].encoding
    ) {
      const fontEncoding = fonttbl[currentFontId].encoding;
      if (iconv.encodingExists(fontEncoding)) {
        encodingToUse = fontEncoding;
        usedFontEncoding = true;
      } else {
        // Only warn if the font encoding exists but iconv doesn't support it
        if (fonttbl[currentFontId].charset) { // Avoid warning if charset was null anyway
          console.warn(
            `Warning: Font ${currentFontId} ('${
              fonttbl[currentFontId].name
            }') specifies charset ${
              fonttbl[currentFontId].charset
            }, mapped to unsupported encoding '${fontEncoding}'. Falling back to document encoding '${documentEncoding}'.`,
          );
        }
      }
    }

    try {
      const buffer = Uint8Array.from(hexBytes);
      if (iconv.encodingExists(encodingToUse)) {
        const decodedString = iconv.decode(buffer, encodingToUse, {
          stripBOM: true,
        });
        if (!suppressOutput && !ignorable) {
          output += decodedString;
        }
      } else {
        // This handles cases where even the fallback documentEncoding is bad (e.g., 'cp999')
        const hexString = hexBytes.map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        const errorMessage =
          `Unsupported encoding '${encodingToUse}' by iconv-lite for hex sequence: ${hexString}.` +
          (usedFontEncoding ? ` (From font ${currentFontId})` : "");
        if (errors === "strict") {
          throw new Error(errorMessage);
        } else {
          console.warn(`${errorMessage} Skipping sequence.`);
        }
      }
    } catch (decodeError) {
      const hexString = hexBytes.map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const errorMessage =
        `Error decoding hex sequence '${hexString}' with encoding '${encodingToUse}'` +
        (usedFontEncoding ? ` (tried from font ${currentFontId})` : "") +
        `: ${decodeError}`;
      if (errors === "strict") {
        throw new Error(errorMessage, { cause: decodeError });
      } else {
        console.warn(`${errorMessage} Skipping sequence.`);
      }
    } finally {
      hexBytes = []; // Always reset accumulator
    }
  };

  // --- Step 3: Main RTF Parsing Loop ---
  // Tokenize the RTF stream using the core PATTERN regex.
  PATTERN.lastIndex = 0; // Ensure regex starts from the beginning
  let match: RegExpExecArray | null;
  while ((match = PATTERN.exec(rtfText)) !== null) {
    // Destructure the matched parts based on the PATTERN structure
    const [_fullMatch, word, arg, hex, char, brace, tchar] = match;

    // --- Decode Accumulated Hex Bytes ---
    // If we have pending hex bytes AND the current token is NOT another hex byte, decode them.
    if (hexBytes.length > 0 && !hex) {
      decodeHexBytes();
    }
    // --- End Hex Decoding ---

    // --- Process the Current RTF Token ---
    if (brace) { // Matched '{' or '}'
      curskip = 0; // Reset skip counter on group boundary
      decodeHexBytes(); // Decode any pending hex bytes before changing group state
      if (brace === "{") {
        // Entering a group: push current state onto the stack
        stack.push([ucskip, ignorable, suppressOutput]);
      } else if (brace === "}") {
        // Exiting a group: pop state from stack or handle malformed RTF
        if (stack.length > 0) {
          [ucskip, ignorable, suppressOutput] = stack.pop()!;
        } else {
          // Unmatched '}' - log warning and reset state to defaults
          console.warn("Warning: Encountered unmatched '}' in RTF.");
          ucskip = 1;
          ignorable = false;
          suppressOutput = false;
        }
        // Reset font on group exit? No, font (\fN) is not group-scoped in RTF spec.
        // It persists until the next \fN or end of document.
      }
    } else if (char) { // Matched a control symbol (e.g., \*, \{, \~)
      curskip = 0;
      if (char === "*") {
        // Enter an ignorable destination group (often metadata)
        ignorable = true;
      } else if (specialChars[char]) {
        // Handle known special characters like \~, \{, \}
        if (!ignorable && !suppressOutput) {
          output += specialChars[char];
        }
      }
      // Other unknown symbols are generally ignored
    } else if (word) { // Matched a control word (e.g., \par, \ansicpg, \f)
      curskip = 0;
      if (destinations.has(word)) {
        // Entering a known destination group
        ignorable = true;
        // Check if this specific destination's content should also be suppressed
        suppressOutput = (
          word === "fonttbl" || word === "colortbl" || word === "stylesheet" ||
          word === "info" || word === "datastore" || word === "themedata" ||
          word === "pict" || word === "object" || word === "shpinst" ||
          word === "shppict" || word === "generator" // Added generator
        );
      } else if (ignorable) {
        // If already in an ignorable block, stay ignorable unless specific non-ignorable words are found.
        // This handles cases like `{\*\bkmkstart ...}` where `\bkmkstart` is a destination but
        // we want the content inside the `\*` group to remain ignored.
        // We reset ignorable = false only for specific commands we *know* produce text.
      } else if (word === "ansicpg" && arg) {
        // Update the document's primary encoding (used as fallback)
        const codepage = parseInt(arg, 10);
        documentEncoding = charsetMap[codepage] || `cp${arg}`; // Use map or construct cpN
        // Ensure the found encoding is actually supported by iconv
        if (!iconv.encodingExists(documentEncoding)) {
          console.warn(
            `Warning: Document specified \\ansicpg${codepage}, mapped to unsupported encoding '${documentEncoding}'. Falling back to '${defaultEncoding}'.`,
          );
          documentEncoding = defaultEncoding;
        }
      } else if (specialChars[word]) {
        // Handle known special control words like \par, \tab, \line
        if (!suppressOutput) { // Check only suppression, ignorable handled above
          output += specialChars[word];
        }
      } else if (word === "uc" && arg) {
        // Set the number of bytes to skip after subsequent \u characters
        ucskip = parseInt(arg, 10);
      } else if (word === "u" && arg) {
        // Handle Unicode character escape \uN
        let charCode = parseInt(arg, 10);
        // RTF uses signed 16-bit representation for codes > 32767
        if (charCode < 0) charCode += 65536;
        if (!suppressOutput) { // Check only suppression
          try {
            // Append the Unicode character
            output += String.fromCharCode(charCode);
          } catch (e) {
            // Handle potentially invalid code points
            const codeHex = charCode.toString(16).toUpperCase();
            const message =
              `Invalid Unicode code point U+${codeHex} from \\u${arg}`;
            console.warn(message);
            if (errors === "strict") throw new Error(message, { cause: e });
          }
        }
        // Set skip counter for following bytes/chars
        curskip = ucskip;
      } else if (word === "f" && arg) { // Font change (\fN)
        currentFontId = arg;
        // Ignorable state shouldn't change just because of font switch
      } else if (word === "deff" && arg) { // Default font (\deffN)
        // Set initial font if none set yet. This is less critical now we parse font table first.
        if (currentFontId === null) {
          currentFontId = arg;
        }
        // Ignorable state shouldn't change
      }
      // General case: If a word is encountered and we are not in an ignorable group,
      // assume it might be followed by relevant text, so turn off ignorable flag.
      // This handles cases where a non-destination command appears within an ignorable
      // group (like `{\*\somedata \plaintext}`) - although structure usually prevents this.
      // A safer approach is to rely on group exit '}' to restore ignorable state.
      // Let's remove explicit `ignorable = false` here to avoid accidentally un-ignoring sections.
      // The 'ignorable' state is primarily controlled by entering destinations and exiting groups.

      // If the word isn't a destination, special char, or state modifier we handle,
      // and we *are* in an ignorable block, just continue ignoring.
      // If we are *not* in an ignorable block, most other control words (\b, \i, etc.)
      // are formatting that doesn't produce text output themselves, so we do nothing.
    } else if (hex) { // Matched a hex escape \'xx
      if (curskip > 0) {
        // If skipping bytes due to a preceding \uN, decrement skip counter
        curskip -= 1;
      } else if (!ignorable && !suppressOutput) {
        // If not skipping, and not in ignored/suppressed block, parse and accumulate the byte value
        try {
          hexBytes.push(parseInt(hex, 16));
        } catch (e) {
          // Handle invalid hex values (should be rare with regex)
          console.warn(`Invalid hex byte value: \\'${hex}`);
          if (errors === "strict") throw e;
        }
      }
    } else if (tchar) { // Matched a plain text character
      if (curskip > 0) {
        // If skipping bytes/chars due to a preceding \uN, decrement skip counter
        curskip -= 1;
      } else if (!ignorable && !suppressOutput) {
        // If not skipping, and not in ignored/suppressed block, append character to output
        output += tchar;
      }
    }
  } // End while loop (parsing finished)

  // --- Final Check for Remaining Hex Bytes ---
  // If the RTF ended with one or more \'xx escapes, decode them now using the last known context.
  decodeHexBytes();
  // --- End final check ---

  // Match the python implementtion, don't do cleanup for now
  // Basic cleanup - replace multiple pipes with single pipe, trim whitespace around pipes/newlines
  // output = output.replace(/\|+/g, "|");
  // output = output.replace(/[ \t]+\|/g, "|");
  // output = output.replace(/\|[ \t]+/g, "|");
  // output = output.replace(/(\n\|)+/g, "\n|"); // Remove empty cells at start of line
  // output = output.replace(/\|\s*(\n|$)/g, "\n"); // Remove trailing pipe before newline or EOF
  // output = output.replace(/\n{3,}/g, "\n\n"); // Collapse excess newlines
  // output = output.trim(); // Remove leading/trailing whitespace

  return output; // Return the accumulated plain text
}

// --- Deno Execution Block ---
// This code runs only when the script is executed directly using `deno run`.
if (import.meta.main) {
  // Basic command line argument check
  if (Deno.args.length === 0) {
    console.error(
      "Usage: deno run --allow-read rtf_converter.ts <path_to_rtf_file> [default_encoding] [error_mode]",
    );
    console.error("  default_encoding: e.g., cp1252 (default)");
    console.error("  error_mode: strict or ignore (default)");
    Deno.exit(1);
  }
  const file = Deno.args[0]; // Get the file path from the first argument
  const defaultEnc = Deno.args[1] || "cp1252";
  const errorMode = (Deno.args[2] || "ignore") as "strict" | "ignore";

  if (errorMode !== "strict" && errorMode !== "ignore") {
    console.error("Invalid error_mode. Use 'strict' or 'ignore'.");
    Deno.exit(1);
  }

  try {
    // Read the RTF file content
    const contentBytes = await Deno.readFile(file);
    const content = new TextDecoder("latin1").decode(contentBytes);
    // Convert RTF to text
    const result = rtfToText(content, defaultEnc, errorMode);

    console.log(result);
  } catch (err) {
    // Handle errors during file reading or conversion
    console.error(`Error processing file '${file}':`, err);
    Deno.exit(1);
  }
}
