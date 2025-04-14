/*
 * RTF to plain text converter.
 * Utilizes iconv-lite for robust handling of legacy character encodings found in RTF.
 * Handles nested groups, control words, control symbols, Unicode escapes (\u),
 * and hex escapes (\'xx) according to the detected document encoding OR
 * the encoding specified by the current font's \fcharset.
 *
 * Port of https://github.com/joshy/striprtf
 * Ported to TypeScript and modified for improved table output and encoding handling.
 * Includes font-specific encoding support for hex escapes (\'xx).
 * Aims to match the behavior of the reference Python implementation closely.
 */

import iconv from "iconv-lite";

// --- RTF Control Word Definitions ---
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

// --- Character Set Mapping ---
const charsetMap: Record<number, string> = {
  0: "cp1252",
  1: "cp1252",
  2: "cp1252",
  77: "macroman",
  78: "shiftjis",
  79: "big5",
  80: "euckr",
  81: "cp1256",
  82: "cp1255",
  83: "cp1253",
  84: "cp1251",
  85: "gb2312",
  86: "cp1250",
  87: "cp1251",
  88: "cp874",
  128: "cp932",
  129: "cp949",
  130: "johab",
  134: "cp936",
  136: "cp950",
  161: "cp1253",
  162: "cp1254",
  163: "cp1258",
  177: "cp1255",
  178: "cp1256",
  186: "cp1257",
  204: "cp1251",
  222: "cp874",
  238: "cp1250",
  254: "cp437",
  255: "cp850",
  42: "cp1252",
  201: "cp1251",
  10000: "macroman",
  10001: "shiftjis",
  10002: "big5",
  10003: "euckr",
  10004: "cp1256",
  10005: "cp1255",
  10006: "cp1253",
  10007: "cp1251",
  10008: "gb2312",
  10021: "cp874",
  10029: "cp1250",
  10081: "cp1254",
};

// --- Special Character Mapping ---
const sectionChars: Record<string, string> = {
  "par": "\n",
  "sect": "\n\n",
  "page": "\n\n",
};
const specialChars: Record<string, string> = {
  "line": "\n",
  "tab": "\t",
  "emdash": "\u2014",
  "endash": "\u2013",
  "emspace": "\u2003",
  "enspace": "\u2002",
  "qmspace": "\u2005",
  "bullet": "\u2022",
  "lquote": "\u2018",
  "rquote": "\u2019",
  "ldblquote": "\u201C",
  "rdblquote": "\u201D",
  "row": "\n",
  "cell": "|",
  "nestcell": "|",
  "~": "\xa0",
  "\n": "\n",
  "\r": "\r",
  "{": "{",
  "}": "}",
  "\\": "\\",
  "-": "\xad",
  "_": "\u2011",
  ...sectionChars,
};

// --- Regular Expressions ---
// Main RTF tokenizer pattern
const PATTERN =
  /\\([a-z]{1,32})(-?\d{1,10})?[ ]?|\\'([0-9a-f]{2})|\\([^a-z])|([{}])|[\r\n]+|(.)/gi;
// Hyperlink pattern (matches Python version's approach)
const HYPERLINKS =
  /(\{\\field\{\s*\\\*\\fldinst\{.*?HYPERLINK\s+(".*?").*?\}{2}\s*\{\\fldrslt\s*(.*?)\}{2,3})/gi;
// Font table pattern - directly equivalent to Python version, requires \fcharset
const FONTTABLE = /\\f(\d+).*?\\fcharset(\d+).*?([^;]+?);/gi;

// --- Interfaces and Types ---
interface FontTableEntry {
  name: string;
  charset: string | null; // Store the original charset string
  encoding: string; // Store the iconv-lite encoding name
}

function removePictGroups(rtfText: string): string {
  // Fast check to see if \pict and \bin exist together in the text
  if (!rtfText.includes("\\pict") || !rtfText.includes("\\bin")) {
    return rtfText;
  }

  const result: string[] = [];
  let i = 0;
  const n = rtfText.length;
  let inPict = false;
  let binaryLength = 0;

  while (i < n) {
    if (!inPict && rtfText.startsWith("\\pict", i)) {
      inPict = true;
      i += "\\pict".length;
      continue;
    }

    if (inPict) {
      if (rtfText.startsWith("\\bin", i)) {
        i += "\\bin".length;
        let lengthStr = "";
        while (i < n && /\d/.test(rtfText[i])) {
          lengthStr += rtfText[i];
          i++;
        }
        binaryLength = parseInt(lengthStr, 10);
        i += binaryLength;
        continue;
      } else if (rtfText[i] === "}") {
        inPict = false;
        i++;
        continue;
      }
    }

    if (!inPict) {
      result.push(rtfText[i]);
    }

    i++;
  }

  return result.join("");
}

// --- Main Conversion Function ---
export function stripRtf(
  rtfText: string,
  defaultEncoding: string = "cp1252",
  errors: "strict" | "ignore" = "ignore",
): string {
  // Pre-process to remove \pict groups
  rtfText = removePictGroups(rtfText);

  // Pre-processing: Truncate content after the formal RTF structure
  const lastClosingBraceIdx = rtfText.lastIndexOf("}");
  if (lastClosingBraceIdx >= 0) { // Check >= 0
    rtfText = rtfText.substring(0, lastClosingBraceIdx + 1); // Include the last brace
  }

  // Pre-processing: Simplify hyperlink fields (match Python output format)
  rtfText = rtfText.replace(HYPERLINKS, (_match, _full, url, display) => {
    const cleanedDisplay = display ? display.trim() : "";
    // Python version keeps the quotes around the URL in the output
    const urlWithQuotes = url ? url.trim() : '""';
    return `${cleanedDisplay}(${urlWithQuotes})`;
  });

  // --- Parser State Initialization ---
  const stack: Array<[number, boolean, boolean]> = [];
  const fonttbl: Record<string, FontTableEntry> = {};
  let documentEncoding = defaultEncoding; // Assume default initially
  let ignorable = false;
  let suppressOutput = false;
  let ucskip = 1;
  let curskip = 0;
  let currentFontId: string | null = null;
  let hexBytes: number[] = [];
  let output = "";

  // --- Step 1: Font Table Parsing ---
  // Determine document encoding first from \ansicpg
  const ansicpgMatch = /\\ansicpg(\d+)/.exec(rtfText);
  if (ansicpgMatch) {
    const codepage = parseInt(ansicpgMatch[1], 10);
    const detectedEncoding = charsetMap[codepage] || `cp${ansicpgMatch[1]}`;
    if (iconv.encodingExists(detectedEncoding)) {
      documentEncoding = detectedEncoding;
    } else {
      console.warn(
        `Warning: Document specified \\ansicpg${codepage}, mapped to unsupported encoding '${detectedEncoding}'. Using default '${defaultEncoding}'.`,
      );
      // Keep defaultEncoding
    }
  }
  // console.log(`[DEBUG] Using document encoding: ${documentEncoding}`);

  // Parse the font table using the Python-equivalent regex
  // This regex *only* matches fonts that explicitly have \fcharset
  rtfText.replace(FONTTABLE, (_match, fontId, fcharset, fontName) => {
    // fontId = Group 1, fcharset = Group 2, fontName = Group 3
    // All groups are guaranteed to be non-null/undefined if a match occurs with this regex.
    const actualCharset = fcharset;
    const actualName = fontName.trim().replace(/['"]$/, "");

    // console.log(`[DEBUG] FONTTABLE Match: ID=${fontId}, Charset=${actualCharset}, Name=${actualName}`);

    let encoding = documentEncoding; // Start with document encoding as fallback
    const charsetNum = parseInt(actualCharset, 10);
    const mappedEncoding = charsetMap[charsetNum];

    if (mappedEncoding && iconv.encodingExists(mappedEncoding)) {
      encoding = mappedEncoding; // Use the mapped and supported encoding
    } else if (mappedEncoding) {
      // Mapped but not supported by iconv-lite
      console.warn(
        `Warning: Font ${fontId} specified charset ${actualCharset}, mapped to unsupported encoding '${mappedEncoding}'. Falling back to document encoding '${documentEncoding}'.`,
      );
      // encoding remains documentEncoding
    } else {
      // Not found in charsetMap
      console.warn(
        `Warning: Font ${fontId} specified charset ${actualCharset}, but no mapping found in charsetMap. Falling back to document encoding '${documentEncoding}'.`,
      );
      // encoding remains documentEncoding
    }

    fonttbl[fontId] = {
      name: actualName,
      charset: actualCharset,
      encoding: encoding,
    };
    // console.log(`[DEBUG] Adding to fonttbl[${fontId}]:`, JSON.stringify(fonttbl[fontId]));
    return ""; // Required by replace
  });
  // console.log("[DEBUG] Final Parsed font table:", JSON.stringify(fonttbl, null, 2));

  // --- Step 2: Helper function to decode hex bytes ---
  const decodeHexBytes = () => {
    if (hexBytes.length === 0) return;

    let encodingToUse = documentEncoding; // Default to document encoding
    let usedFontEncoding = false;
    const fontEntry = currentFontId ? fonttbl[currentFontId] : undefined;

    // console.log(`[DEBUG] decodeHexBytes: Current fontId = ${currentFontId}`);

    // Use font-specific encoding ONLY if the font was successfully parsed by FONTTABLE regex
    // and has a valid encoding stored.
    if (fontEntry?.encoding) {
      // console.log(`[DEBUG] decodeHexBytes: Found font entry for font ${currentFontId}:`, JSON.stringify(fontEntry));
      encodingToUse = fontEntry.encoding;
      usedFontEncoding = encodingToUse !== documentEncoding;
      // console.log(`[DEBUG] decodeHexBytes: Using font encoding: ${encodingToUse}`);
    } else {
      // console.log(`[DEBUG] decodeHexBytes: No valid font entry for font ${currentFontId}. Using document encoding: ${documentEncoding}`);
      // If the font wasn't parsed (e.g., lacked \fcharset needed by the regex),
      // we correctly fall back to documentEncoding here, matching Python's implicit behavior.
    }

    try {
      const buffer = Uint8Array.from(hexBytes);
      if (iconv.encodingExists(encodingToUse)) {
        // @ts-ignore(TODO): https://github.com/denoland/deno/issues/28884
        const decodedString = iconv.decode(buffer, encodingToUse, {
          stripBOM: true,
        });
        // console.log(`[DEBUG] decodeHexBytes: Decoded "${decodedString}" using ${encodingToUse}`);
        if (!suppressOutput && !ignorable) {
          output += decodedString;
        }
      } else {
        const hexString = hexBytes.map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        const errorMessage =
          `Unsupported encoding '${encodingToUse}' by iconv-lite for hex sequence: ${hexString}.`;
        if (errors === "strict") throw new Error(errorMessage);
        else console.warn(`${errorMessage} Skipping sequence.`);
      }
    } catch (decodeError) {
      const hexString = hexBytes.map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const errorMessage =
        `Error decoding hex sequence '${hexString}' with encoding '${encodingToUse}'` +
        (usedFontEncoding ? ` (using font ${currentFontId})` : "") +
        `: ${decodeError}`;
      if (errors === "strict") {
        throw new Error(errorMessage, { cause: decodeError });
      } else console.warn(`${errorMessage} Skipping sequence.`);
    } finally {
      hexBytes = [];
    }
  };

  // --- Step 3: Main RTF Parsing Loop ---
  PATTERN.lastIndex = 0;
  let mainMatch: RegExpExecArray | null;
  while ((mainMatch = PATTERN.exec(rtfText)) !== null) {
    const [_fullMatch, word, arg, hex, char, brace, tchar] = mainMatch;

    // Decode pending hex bytes BEFORE processing the current token
    if (hexBytes.length > 0 && !hex) {
      // console.log(`[DEBUG] Parser loop: Triggering decodeHexBytes before processing token: ${_fullMatch}`);
      decodeHexBytes();
    }

    // --- Process Token ---
    if (brace) {
      curskip = 0;
      if (brace === "{") {
        stack.push([ucskip, ignorable, suppressOutput]);
      } else if (brace === "}") {
        if (stack.length > 0) {
          [ucskip, ignorable, suppressOutput] = stack.pop()!;
        } else {
          console.warn("Warning: Encountered unmatched '}' in RTF.");
          ucskip = 1;
          ignorable = false;
          suppressOutput = false;
        }
      }
    } else if (char) {
      curskip = 0;
      if (char === "*") {
        ignorable = true;
      } else if (specialChars[char]) {
        if (!ignorable && !suppressOutput) output += specialChars[char];
      }
    } else if (word) {
      curskip = 0;
      if (destinations.has(word)) {
        ignorable = true;
        // Suppress output only for specific destinations (Python version doesn't suppress as many)
        suppressOutput = word === "fonttbl" || word === "colortbl";
      } else if (ignorable) {
        // If already in an ignorable block (like {\* ...}), stay ignorable
      } else if (word === "ansicpg") {
        // Already handled pre-parsing, do nothing here
      } else if (specialChars[word]) {
        if (!suppressOutput) output += specialChars[word];
      } else if (word === "uc" && arg) {
        ucskip = parseInt(arg, 10);
      } else if (word === "u" && arg) {
        let c = parseInt(arg, 10);
        if (c < 0) c += 65536; // Handle RTF's signed 16-bit unicode
        if (!suppressOutput) {
          try {
            output += String.fromCharCode(c);
          } catch (e) {
            const codeHex = c.toString(16).toUpperCase();
            const message =
              `Invalid Unicode code point U+${codeHex} from \\u${arg}`;
            console.warn(message);
            if (errors === "strict") throw new Error(message, { cause: e });
          }
        }
        curskip = ucskip; // Skip specified number of bytes after \u
      } else if (word === "f" && arg) {
        // Update current font ID
        // console.log(`[DEBUG] Parser loop: Setting currentFontId = '${arg}' (was '${currentFontId}')`);
        currentFontId = arg;
      } else if (word === "deff" && arg) {
        // Set default font ID if none set yet (less critical now)
        if (currentFontId === null) {
          // console.log(`[DEBUG] Parser loop: Setting initial currentFontId = '${arg}' from \\deff`);
          currentFontId = arg;
        }
      }
      // Other words are generally ignored if not ignorable/suppressed
    } else if (hex) { // \'xx
      if (curskip > 0) {
        curskip -= 1; // Decrement skip counter if skipping after \u
      } else if (!ignorable && !suppressOutput) {
        // Accumulate hex byte if not skipping/ignorable/suppressed
        try {
          // console.log(`[DEBUG] Parser loop: Accumulating hex byte '${hex}'`);
          hexBytes.push(parseInt(hex, 16));
        } catch (e) {
          console.warn(`Invalid hex byte value: \\'${hex}`);
          if (errors === "strict") throw e;
        }
      }
    } else if (tchar) { // Plain text character
      if (curskip > 0) {
        curskip -= 1; // Decrement skip counter if skipping after \u
      } else if (!ignorable && !suppressOutput) {
        // Append text if not skipping/ignorable/suppressed
        output += tchar;
      }
    }
  } // End while loop

  // Final decode check for any remaining hex bytes
  if (hexBytes.length > 0) {
    // console.log(`[DEBUG] Final Check: Triggering decodeHexBytes for remaining bytes.`);
    decodeHexBytes();
  }

  return output;
}

// keep the python original name
export const rtfToText = stripRtf;

export default stripRtf;

// --- Deno Execution Block ---
if (import.meta.main) {
  const process = await import("node:process");
  const fs = await import("node:fs");

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      "Usage: stripRtf <path_to_rtf_file> [default_encoding] [error_mode]",
    );
    console.error("  default_encoding: e.g., cp1252 (default)");
    console.error("  error_mode: strict or ignore (default)");
    process.exit(1);
  }

  const file = args[0];
  const defaultEnc = args[1] || "cp1252";
  const errorMode = (args[2] || "ignore") as "strict" | "ignore";

  if (errorMode !== "strict" && errorMode !== "ignore") {
    console.error("Invalid error_mode. Use 'strict' or 'ignore'.");
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(file, "latin1");
    const result = stripRtf(
      content,
      defaultEnc,
      errorMode,
    );
    console.log(result);
  } catch (err) {
    console.error(`Error processing file '${file}':`, err);
    process.exit(1);
  }
}
