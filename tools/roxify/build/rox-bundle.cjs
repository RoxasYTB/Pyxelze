#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/cli-progress/lib/eta.js
var require_eta = __commonJS({
  "node_modules/cli-progress/lib/eta.js"(exports, module2) {
    var ETA = class {
      constructor(length, initTime, initValue) {
        this.etaBufferLength = length || 100;
        this.valueBuffer = [initValue];
        this.timeBuffer = [initTime];
        this.eta = "0";
      }
      // add new values to calculation buffer
      update(time, value, total) {
        this.valueBuffer.push(value);
        this.timeBuffer.push(time);
        this.calculate(total - value);
      }
      // fetch estimated time
      getTime() {
        return this.eta;
      }
      // eta calculation - request number of remaining events
      calculate(remaining) {
        const currentBufferSize = this.valueBuffer.length;
        const buffer = Math.min(this.etaBufferLength, currentBufferSize);
        const v_diff = this.valueBuffer[currentBufferSize - 1] - this.valueBuffer[currentBufferSize - buffer];
        const t_diff = this.timeBuffer[currentBufferSize - 1] - this.timeBuffer[currentBufferSize - buffer];
        const vt_rate = v_diff / t_diff;
        this.valueBuffer = this.valueBuffer.slice(-this.etaBufferLength);
        this.timeBuffer = this.timeBuffer.slice(-this.etaBufferLength);
        const eta = Math.ceil(remaining / vt_rate / 1e3);
        if (isNaN(eta)) {
          this.eta = "NULL";
        } else if (!isFinite(eta)) {
          this.eta = "INF";
        } else if (eta > 1e7) {
          this.eta = "INF";
        } else if (eta < 0) {
          this.eta = 0;
        } else {
          this.eta = eta;
        }
      }
    };
    module2.exports = ETA;
  }
});

// node_modules/cli-progress/lib/terminal.js
var require_terminal = __commonJS({
  "node_modules/cli-progress/lib/terminal.js"(exports, module2) {
    var _readline = require("readline");
    var Terminal = class {
      constructor(outputStream) {
        this.stream = outputStream;
        this.linewrap = true;
        this.dy = 0;
      }
      // save cursor position + settings
      cursorSave() {
        if (!this.stream.isTTY) {
          return;
        }
        this.stream.write("\x1B7");
      }
      // restore last cursor position + settings
      cursorRestore() {
        if (!this.stream.isTTY) {
          return;
        }
        this.stream.write("\x1B8");
      }
      // show/hide cursor
      cursor(enabled) {
        if (!this.stream.isTTY) {
          return;
        }
        if (enabled) {
          this.stream.write("\x1B[?25h");
        } else {
          this.stream.write("\x1B[?25l");
        }
      }
      // change cursor positionn
      cursorTo(x = null, y = null) {
        if (!this.stream.isTTY) {
          return;
        }
        _readline.cursorTo(this.stream, x, y);
      }
      // change relative cursor position
      cursorRelative(dx = null, dy = null) {
        if (!this.stream.isTTY) {
          return;
        }
        this.dy = this.dy + dy;
        _readline.moveCursor(this.stream, dx, dy);
      }
      // relative reset
      cursorRelativeReset() {
        if (!this.stream.isTTY) {
          return;
        }
        _readline.moveCursor(this.stream, 0, -this.dy);
        _readline.cursorTo(this.stream, 0, null);
        this.dy = 0;
      }
      // clear to the right from cursor
      clearRight() {
        if (!this.stream.isTTY) {
          return;
        }
        _readline.clearLine(this.stream, 1);
      }
      // clear the full line
      clearLine() {
        if (!this.stream.isTTY) {
          return;
        }
        _readline.clearLine(this.stream, 0);
      }
      // clear everyting beyond the current line
      clearBottom() {
        if (!this.stream.isTTY) {
          return;
        }
        _readline.clearScreenDown(this.stream);
      }
      // add new line; increment counter
      newline() {
        this.stream.write("\n");
        this.dy++;
      }
      // write content to output stream
      // @TODO use string-width to strip length
      write(s, rawWrite = false) {
        if (this.linewrap === true && rawWrite === false) {
          this.stream.write(s.substr(0, this.getWidth()));
        } else {
          this.stream.write(s);
        }
      }
      // control line wrapping
      lineWrapping(enabled) {
        if (!this.stream.isTTY) {
          return;
        }
        this.linewrap = enabled;
        if (enabled) {
          this.stream.write("\x1B[?7h");
        } else {
          this.stream.write("\x1B[?7l");
        }
      }
      // tty environment ?
      isTTY() {
        return this.stream.isTTY === true;
      }
      // get terminal width
      getWidth() {
        return this.stream.columns || (this.stream.isTTY ? 80 : 200);
      }
    };
    module2.exports = Terminal;
  }
});

// node_modules/ansi-regex/index.js
var require_ansi_regex = __commonJS({
  "node_modules/ansi-regex/index.js"(exports, module2) {
    "use strict";
    module2.exports = ({ onlyFirst = false } = {}) => {
      const pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
      ].join("|");
      return new RegExp(pattern, onlyFirst ? void 0 : "g");
    };
  }
});

// node_modules/strip-ansi/index.js
var require_strip_ansi = __commonJS({
  "node_modules/strip-ansi/index.js"(exports, module2) {
    "use strict";
    var ansiRegex = require_ansi_regex();
    module2.exports = (string) => typeof string === "string" ? string.replace(ansiRegex(), "") : string;
  }
});

// node_modules/is-fullwidth-code-point/index.js
var require_is_fullwidth_code_point = __commonJS({
  "node_modules/is-fullwidth-code-point/index.js"(exports, module2) {
    "use strict";
    var isFullwidthCodePoint = (codePoint) => {
      if (Number.isNaN(codePoint)) {
        return false;
      }
      if (codePoint >= 4352 && (codePoint <= 4447 || // Hangul Jamo
      codePoint === 9001 || // LEFT-POINTING ANGLE BRACKET
      codePoint === 9002 || // RIGHT-POINTING ANGLE BRACKET
      // CJK Radicals Supplement .. Enclosed CJK Letters and Months
      11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || // Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
      12880 <= codePoint && codePoint <= 19903 || // CJK Unified Ideographs .. Yi Radicals
      19968 <= codePoint && codePoint <= 42182 || // Hangul Jamo Extended-A
      43360 <= codePoint && codePoint <= 43388 || // Hangul Syllables
      44032 <= codePoint && codePoint <= 55203 || // CJK Compatibility Ideographs
      63744 <= codePoint && codePoint <= 64255 || // Vertical Forms
      65040 <= codePoint && codePoint <= 65049 || // CJK Compatibility Forms .. Small Form Variants
      65072 <= codePoint && codePoint <= 65131 || // Halfwidth and Fullwidth Forms
      65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || // Kana Supplement
      110592 <= codePoint && codePoint <= 110593 || // Enclosed Ideographic Supplement
      127488 <= codePoint && codePoint <= 127569 || // CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
      131072 <= codePoint && codePoint <= 262141)) {
        return true;
      }
      return false;
    };
    module2.exports = isFullwidthCodePoint;
    module2.exports.default = isFullwidthCodePoint;
  }
});

// node_modules/emoji-regex/index.js
var require_emoji_regex = __commonJS({
  "node_modules/emoji-regex/index.js"(exports, module2) {
    "use strict";
    module2.exports = function() {
      return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
    };
  }
});

// node_modules/string-width/index.js
var require_string_width = __commonJS({
  "node_modules/string-width/index.js"(exports, module2) {
    "use strict";
    var stripAnsi = require_strip_ansi();
    var isFullwidthCodePoint = require_is_fullwidth_code_point();
    var emojiRegex = require_emoji_regex();
    var stringWidth = (string) => {
      if (typeof string !== "string" || string.length === 0) {
        return 0;
      }
      string = stripAnsi(string);
      if (string.length === 0) {
        return 0;
      }
      string = string.replace(emojiRegex(), "  ");
      let width = 0;
      for (let i = 0; i < string.length; i++) {
        const code = string.codePointAt(i);
        if (code <= 31 || code >= 127 && code <= 159) {
          continue;
        }
        if (code >= 768 && code <= 879) {
          continue;
        }
        if (code > 65535) {
          i++;
        }
        width += isFullwidthCodePoint(code) ? 2 : 1;
      }
      return width;
    };
    module2.exports = stringWidth;
    module2.exports.default = stringWidth;
  }
});

// node_modules/cli-progress/lib/format-value.js
var require_format_value = __commonJS({
  "node_modules/cli-progress/lib/format-value.js"(exports, module2) {
    module2.exports = function formatValue(v, options, type) {
      if (options.autopadding !== true) {
        return v;
      }
      function autopadding(value, length) {
        return (options.autopaddingChar + value).slice(-length);
      }
      switch (type) {
        case "percentage":
          return autopadding(v, 3);
        default:
          return v;
      }
    };
  }
});

// node_modules/cli-progress/lib/format-bar.js
var require_format_bar = __commonJS({
  "node_modules/cli-progress/lib/format-bar.js"(exports, module2) {
    module2.exports = function formatBar(progress, options) {
      const completeSize = Math.round(progress * options.barsize);
      const incompleteSize = options.barsize - completeSize;
      return options.barCompleteString.substr(0, completeSize) + options.barGlue + options.barIncompleteString.substr(0, incompleteSize);
    };
  }
});

// node_modules/cli-progress/lib/format-time.js
var require_format_time = __commonJS({
  "node_modules/cli-progress/lib/format-time.js"(exports, module2) {
    module2.exports = function formatTime(t, options, roundToMultipleOf) {
      function round(input) {
        if (roundToMultipleOf) {
          return roundToMultipleOf * Math.round(input / roundToMultipleOf);
        } else {
          return input;
        }
      }
      function autopadding(v) {
        return (options.autopaddingChar + v).slice(-2);
      }
      if (t > 3600) {
        return autopadding(Math.floor(t / 3600)) + "h" + autopadding(round(t % 3600 / 60)) + "m";
      } else if (t > 60) {
        return autopadding(Math.floor(t / 60)) + "m" + autopadding(round(t % 60)) + "s";
      } else if (t > 10) {
        return autopadding(round(t)) + "s";
      } else {
        return autopadding(t) + "s";
      }
    };
  }
});

// node_modules/cli-progress/lib/formatter.js
var require_formatter = __commonJS({
  "node_modules/cli-progress/lib/formatter.js"(exports, module2) {
    var _stringWidth = require_string_width();
    var _defaultFormatValue = require_format_value();
    var _defaultFormatBar = require_format_bar();
    var _defaultFormatTime = require_format_time();
    module2.exports = function defaultFormatter(options, params, payload) {
      let s = options.format;
      const formatTime = options.formatTime || _defaultFormatTime;
      const formatValue = options.formatValue || _defaultFormatValue;
      const formatBar = options.formatBar || _defaultFormatBar;
      const percentage = Math.floor(params.progress * 100) + "";
      const stopTime = params.stopTime || Date.now();
      const elapsedTime = Math.round((stopTime - params.startTime) / 1e3);
      const context = Object.assign({}, payload, {
        bar: formatBar(params.progress, options),
        percentage: formatValue(percentage, options, "percentage"),
        total: formatValue(params.total, options, "total"),
        value: formatValue(params.value, options, "value"),
        eta: formatValue(params.eta, options, "eta"),
        eta_formatted: formatTime(params.eta, options, 5),
        duration: formatValue(elapsedTime, options, "duration"),
        duration_formatted: formatTime(elapsedTime, options, 1)
      });
      s = s.replace(/\{(\w+)\}/g, function(match, key) {
        if (typeof context[key] !== "undefined") {
          return context[key];
        }
        return match;
      });
      const fullMargin = Math.max(0, params.maxWidth - _stringWidth(s) - 2);
      const halfMargin = Math.floor(fullMargin / 2);
      switch (options.align) {
        case "right":
          s = fullMargin > 0 ? " ".repeat(fullMargin) + s : s;
          break;
        case "center":
          s = halfMargin > 0 ? " ".repeat(halfMargin) + s : s;
          break;
        case "left":
        default:
          break;
      }
      return s;
    };
  }
});

// node_modules/cli-progress/lib/options.js
var require_options = __commonJS({
  "node_modules/cli-progress/lib/options.js"(exports, module2) {
    function mergeOption(v, defaultValue) {
      if (typeof v === "undefined" || v === null) {
        return defaultValue;
      } else {
        return v;
      }
    }
    module2.exports = {
      // set global options
      parse: function parse(rawOptions, preset) {
        const options = {};
        const opt = Object.assign({}, preset, rawOptions);
        options.throttleTime = 1e3 / mergeOption(opt.fps, 10);
        options.stream = mergeOption(opt.stream, process.stderr);
        options.terminal = mergeOption(opt.terminal, null);
        options.clearOnComplete = mergeOption(opt.clearOnComplete, false);
        options.stopOnComplete = mergeOption(opt.stopOnComplete, false);
        options.barsize = mergeOption(opt.barsize, 40);
        options.align = mergeOption(opt.align, "left");
        options.hideCursor = mergeOption(opt.hideCursor, false);
        options.linewrap = mergeOption(opt.linewrap, false);
        options.barGlue = mergeOption(opt.barGlue, "");
        options.barCompleteChar = mergeOption(opt.barCompleteChar, "=");
        options.barIncompleteChar = mergeOption(opt.barIncompleteChar, "-");
        options.format = mergeOption(opt.format, "progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}");
        options.formatTime = mergeOption(opt.formatTime, null);
        options.formatValue = mergeOption(opt.formatValue, null);
        options.formatBar = mergeOption(opt.formatBar, null);
        options.etaBufferLength = mergeOption(opt.etaBuffer, 10);
        options.etaAsynchronousUpdate = mergeOption(opt.etaAsynchronousUpdate, false);
        options.progressCalculationRelative = mergeOption(opt.progressCalculationRelative, false);
        options.synchronousUpdate = mergeOption(opt.synchronousUpdate, true);
        options.noTTYOutput = mergeOption(opt.noTTYOutput, false);
        options.notTTYSchedule = mergeOption(opt.notTTYSchedule, 2e3);
        options.emptyOnZero = mergeOption(opt.emptyOnZero, false);
        options.forceRedraw = mergeOption(opt.forceRedraw, false);
        options.autopadding = mergeOption(opt.autopadding, false);
        options.gracefulExit = mergeOption(opt.gracefulExit, false);
        return options;
      },
      // derived options: instance specific, has to be created for every bar element
      assignDerivedOptions: function assignDerivedOptions(options) {
        options.barCompleteString = options.barCompleteChar.repeat(options.barsize + 1);
        options.barIncompleteString = options.barIncompleteChar.repeat(options.barsize + 1);
        options.autopaddingChar = options.autopadding ? mergeOption(options.autopaddingChar, "   ") : "";
        return options;
      }
    };
  }
});

// node_modules/cli-progress/lib/generic-bar.js
var require_generic_bar = __commonJS({
  "node_modules/cli-progress/lib/generic-bar.js"(exports, module2) {
    var _ETA = require_eta();
    var _Terminal = require_terminal();
    var _formatter = require_formatter();
    var _options = require_options();
    var _EventEmitter = require("events");
    module2.exports = class GenericBar extends _EventEmitter {
      constructor(options) {
        super();
        this.options = _options.assignDerivedOptions(options);
        this.terminal = this.options.terminal ? this.options.terminal : new _Terminal(this.options.stream);
        this.value = 0;
        this.startValue = 0;
        this.total = 100;
        this.lastDrawnString = null;
        this.startTime = null;
        this.stopTime = null;
        this.lastRedraw = Date.now();
        this.eta = new _ETA(this.options.etaBufferLength, 0, 0);
        this.payload = {};
        this.isActive = false;
        this.formatter = typeof this.options.format === "function" ? this.options.format : _formatter;
      }
      // internal render function
      render(forceRendering = false) {
        const params = {
          progress: this.getProgress(),
          eta: this.eta.getTime(),
          startTime: this.startTime,
          stopTime: this.stopTime,
          total: this.total,
          value: this.value,
          maxWidth: this.terminal.getWidth()
        };
        if (this.options.etaAsynchronousUpdate) {
          this.updateETA();
        }
        const s = this.formatter(this.options, params, this.payload);
        const forceRedraw = forceRendering || this.options.forceRedraw || this.options.noTTYOutput && !this.terminal.isTTY();
        if (forceRedraw || this.lastDrawnString != s) {
          this.emit("redraw-pre");
          this.terminal.cursorTo(0, null);
          this.terminal.write(s);
          this.terminal.clearRight();
          this.lastDrawnString = s;
          this.lastRedraw = Date.now();
          this.emit("redraw-post");
        }
      }
      // start the progress bar
      start(total, startValue, payload) {
        this.value = startValue || 0;
        this.total = typeof total !== "undefined" && total >= 0 ? total : 100;
        this.startValue = startValue || 0;
        this.payload = payload || {};
        this.startTime = Date.now();
        this.stopTime = null;
        this.lastDrawnString = "";
        this.eta = new _ETA(this.options.etaBufferLength, this.startTime, this.value);
        this.isActive = true;
        this.emit("start", total, startValue);
      }
      // stop the bar
      stop() {
        this.isActive = false;
        this.stopTime = Date.now();
        this.emit("stop", this.total, this.value);
      }
      // update the bar value
      // update(value, payload)
      // update(payload)
      update(arg0, arg1 = {}) {
        if (typeof arg0 === "number") {
          this.value = arg0;
          this.eta.update(Date.now(), arg0, this.total);
        }
        const payloadData = (typeof arg0 === "object" ? arg0 : arg1) || {};
        this.emit("update", this.total, this.value);
        for (const key in payloadData) {
          this.payload[key] = payloadData[key];
        }
        if (this.value >= this.getTotal() && this.options.stopOnComplete) {
          this.stop();
        }
      }
      // calculate the actual progress value
      getProgress() {
        let progress = this.value / this.total;
        if (this.options.progressCalculationRelative) {
          progress = (this.value - this.startValue) / (this.total - this.startValue);
        }
        if (isNaN(progress)) {
          progress = this.options && this.options.emptyOnZero ? 0 : 1;
        }
        progress = Math.min(Math.max(progress, 0), 1);
        return progress;
      }
      // update the bar value
      // increment(delta, payload)
      // increment(payload)
      increment(arg0 = 1, arg1 = {}) {
        if (typeof arg0 === "object") {
          this.update(this.value + 1, arg0);
        } else {
          this.update(this.value + arg0, arg1);
        }
      }
      // get the total (limit) value
      getTotal() {
        return this.total;
      }
      // set the total (limit) value
      setTotal(total) {
        if (typeof total !== "undefined" && total >= 0) {
          this.total = total;
        }
      }
      // force eta calculation update (long running processes)
      updateETA() {
        this.eta.update(Date.now(), this.value, this.total);
      }
    };
  }
});

// node_modules/cli-progress/lib/single-bar.js
var require_single_bar = __commonJS({
  "node_modules/cli-progress/lib/single-bar.js"(exports, module2) {
    var _GenericBar = require_generic_bar();
    var _options = require_options();
    module2.exports = class SingleBar extends _GenericBar {
      constructor(options, preset) {
        super(_options.parse(options, preset));
        this.timer = null;
        if (this.options.noTTYOutput && this.terminal.isTTY() === false) {
          this.options.synchronousUpdate = false;
        }
        this.schedulingRate = this.terminal.isTTY() ? this.options.throttleTime : this.options.notTTYSchedule;
        this.sigintCallback = null;
      }
      // internal render function
      render() {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        super.render();
        if (this.options.noTTYOutput && this.terminal.isTTY() === false) {
          this.terminal.newline();
        }
        this.timer = setTimeout(this.render.bind(this), this.schedulingRate);
      }
      update(current, payload) {
        if (!this.timer) {
          return;
        }
        super.update(current, payload);
        if (this.options.synchronousUpdate && this.lastRedraw + this.options.throttleTime * 2 < Date.now()) {
          this.render();
        }
      }
      // start the progress bar
      start(total, startValue, payload) {
        if (this.options.noTTYOutput === false && this.terminal.isTTY() === false) {
          return;
        }
        if (this.sigintCallback === null && this.options.gracefulExit) {
          this.sigintCallback = this.stop.bind(this);
          process.once("SIGINT", this.sigintCallback);
          process.once("SIGTERM", this.sigintCallback);
        }
        this.terminal.cursorSave();
        if (this.options.hideCursor === true) {
          this.terminal.cursor(false);
        }
        if (this.options.linewrap === false) {
          this.terminal.lineWrapping(false);
        }
        super.start(total, startValue, payload);
        this.render();
      }
      // stop the bar
      stop() {
        if (!this.timer) {
          return;
        }
        if (this.sigintCallback) {
          process.removeListener("SIGINT", this.sigintCallback);
          process.removeListener("SIGTERM", this.sigintCallback);
          this.sigintCallback = null;
        }
        this.render();
        super.stop();
        clearTimeout(this.timer);
        this.timer = null;
        if (this.options.hideCursor === true) {
          this.terminal.cursor(true);
        }
        if (this.options.linewrap === false) {
          this.terminal.lineWrapping(true);
        }
        this.terminal.cursorRestore();
        if (this.options.clearOnComplete) {
          this.terminal.cursorTo(0, null);
          this.terminal.clearLine();
        } else {
          this.terminal.newline();
        }
      }
    };
  }
});

// node_modules/cli-progress/lib/multi-bar.js
var require_multi_bar = __commonJS({
  "node_modules/cli-progress/lib/multi-bar.js"(exports, module2) {
    var _Terminal = require_terminal();
    var _BarElement = require_generic_bar();
    var _options = require_options();
    var _EventEmitter = require("events");
    module2.exports = class MultiBar extends _EventEmitter {
      constructor(options, preset) {
        super();
        this.bars = [];
        this.options = _options.parse(options, preset);
        this.options.synchronousUpdate = false;
        this.terminal = this.options.terminal ? this.options.terminal : new _Terminal(this.options.stream);
        this.timer = null;
        this.isActive = false;
        this.schedulingRate = this.terminal.isTTY() ? this.options.throttleTime : this.options.notTTYSchedule;
        this.loggingBuffer = [];
        this.sigintCallback = null;
      }
      // add a new bar to the stack
      create(total, startValue, payload, barOptions = {}) {
        const bar = new _BarElement(Object.assign(
          {},
          // global options
          this.options,
          // terminal instance
          {
            terminal: this.terminal
          },
          // overrides
          barOptions
        ));
        this.bars.push(bar);
        if (this.options.noTTYOutput === false && this.terminal.isTTY() === false) {
          return bar;
        }
        if (this.sigintCallback === null && this.options.gracefulExit) {
          this.sigintCallback = this.stop.bind(this);
          process.once("SIGINT", this.sigintCallback);
          process.once("SIGTERM", this.sigintCallback);
        }
        if (!this.isActive) {
          if (this.options.hideCursor === true) {
            this.terminal.cursor(false);
          }
          if (this.options.linewrap === false) {
            this.terminal.lineWrapping(false);
          }
          this.timer = setTimeout(this.update.bind(this), this.schedulingRate);
        }
        this.isActive = true;
        bar.start(total, startValue, payload);
        this.emit("start");
        return bar;
      }
      // remove a bar from the stack
      remove(bar) {
        const index = this.bars.indexOf(bar);
        if (index < 0) {
          return false;
        }
        this.bars.splice(index, 1);
        this.update();
        this.terminal.newline();
        this.terminal.clearBottom();
        return true;
      }
      // internal update routine
      update() {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        this.emit("update-pre");
        this.terminal.cursorRelativeReset();
        this.emit("redraw-pre");
        if (this.loggingBuffer.length > 0) {
          this.terminal.clearLine();
          while (this.loggingBuffer.length > 0) {
            this.terminal.write(this.loggingBuffer.shift(), true);
          }
        }
        for (let i = 0; i < this.bars.length; i++) {
          if (i > 0) {
            this.terminal.newline();
          }
          this.bars[i].render();
        }
        this.emit("redraw-post");
        if (this.options.noTTYOutput && this.terminal.isTTY() === false) {
          this.terminal.newline();
          this.terminal.newline();
        }
        this.timer = setTimeout(this.update.bind(this), this.schedulingRate);
        this.emit("update-post");
        if (this.options.stopOnComplete && !this.bars.find((bar) => bar.isActive)) {
          this.stop();
        }
      }
      stop() {
        clearTimeout(this.timer);
        this.timer = null;
        if (this.sigintCallback) {
          process.removeListener("SIGINT", this.sigintCallback);
          process.removeListener("SIGTERM", this.sigintCallback);
          this.sigintCallback = null;
        }
        this.isActive = false;
        if (this.options.hideCursor === true) {
          this.terminal.cursor(true);
        }
        if (this.options.linewrap === false) {
          this.terminal.lineWrapping(true);
        }
        this.terminal.cursorRelativeReset();
        this.emit("stop-pre-clear");
        if (this.options.clearOnComplete) {
          this.terminal.clearBottom();
        } else {
          for (let i = 0; i < this.bars.length; i++) {
            if (i > 0) {
              this.terminal.newline();
            }
            this.bars[i].render();
            this.bars[i].stop();
          }
          this.terminal.newline();
        }
        this.emit("stop");
      }
      log(s) {
        this.loggingBuffer.push(s);
      }
    };
  }
});

// node_modules/cli-progress/presets/legacy.js
var require_legacy = __commonJS({
  "node_modules/cli-progress/presets/legacy.js"(exports, module2) {
    module2.exports = {
      format: "progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
      barCompleteChar: "=",
      barIncompleteChar: "-"
    };
  }
});

// node_modules/cli-progress/presets/shades-classic.js
var require_shades_classic = __commonJS({
  "node_modules/cli-progress/presets/shades-classic.js"(exports, module2) {
    module2.exports = {
      format: " {bar} {percentage}% | {step} | {elapsed}s",
      barCompleteChar: "#",
      barIncompleteChar: "-"
    };
  }
});

// node_modules/cli-progress/presets/shades-grey.js
var require_shades_grey = __commonJS({
  "node_modules/cli-progress/presets/shades-grey.js"(exports, module2) {
    module2.exports = {
      format: " {bar} {percentage}% | {step} | {elapsed}s",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591"
    };
  }
});

// node_modules/cli-progress/presets/rect.js
var require_rect = __commonJS({
  "node_modules/cli-progress/presets/rect.js"(exports, module2) {
    module2.exports = {
      format: " {bar} {percentage}% | {step} | {elapsed}s"
    };
  }
});

// node_modules/cli-progress/presets/index.js
var require_presets = __commonJS({
  "node_modules/cli-progress/presets/index.js"(exports, module2) {
    var _legacy = require_legacy();
    var _shades_classic = require_shades_classic();
    var _shades_grey = require_shades_grey();
    var _rect = require_rect();
    module2.exports = {
      legacy: _legacy,
      shades_classic: _shades_classic,
      shades_grey: _shades_grey,
      rect: _rect
    };
  }
});

// node_modules/cli-progress/cli-progress.js
var require_cli_progress = __commonJS({
  "node_modules/cli-progress/cli-progress.js"(exports, module2) {
    var _SingleBar = require_single_bar();
    var _MultiBar = require_multi_bar();
    var _Presets = require_presets();
    var _Formatter = require_formatter();
    var _defaultFormatValue = require_format_value();
    var _defaultFormatBar = require_format_bar();
    var _defaultFormatTime = require_format_time();
    module2.exports = {
      Bar: _SingleBar,
      SingleBar: _SingleBar,
      MultiBar: _MultiBar,
      Presets: _Presets,
      Format: {
        Formatter: _Formatter,
        BarFormat: _defaultFormatBar,
        ValueFormat: _defaultFormatValue,
        TimeFormat: _defaultFormatTime
      }
    };
  }
});

// node_modules/crc-32/crc32.js
var require_crc32 = __commonJS({
  "node_modules/crc-32/crc32.js"(exports) {
    var CRC32;
    (function(factory) {
      if (typeof DO_NOT_EXPORT_CRC === "undefined") {
        if ("object" === typeof exports) {
          factory(exports);
        } else if ("function" === typeof define && define.amd) {
          define(function() {
            var module3 = {};
            factory(module3);
            return module3;
          });
        } else {
          factory(CRC32 = {});
        }
      } else {
        factory(CRC32 = {});
      }
    })(function(CRC322) {
      CRC322.version = "0.3.0";
      function signed_crc_table() {
        var c = 0, table2 = new Array(256);
        for (var n = 0; n != 256; ++n) {
          c = n;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
          table2[n] = c;
        }
        return typeof Int32Array !== "undefined" ? new Int32Array(table2) : table2;
      }
      var table = signed_crc_table();
      var use_buffer = typeof Buffer !== "undefined";
      function crc32_bstr(bstr) {
        if (bstr.length > 32768) {
          if (use_buffer)
            return crc32_buf_8(new Buffer(bstr));
        }
        var crc2 = -1, L = bstr.length - 1;
        for (var i = 0; i < L; ) {
          crc2 = table[(crc2 ^ bstr.charCodeAt(i++)) & 255] ^ crc2 >>> 8;
          crc2 = table[(crc2 ^ bstr.charCodeAt(i++)) & 255] ^ crc2 >>> 8;
        }
        if (i === L)
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ bstr.charCodeAt(i)) & 255];
        return crc2 ^ -1;
      }
      function crc32_buf(buf) {
        if (buf.length > 1e4)
          return crc32_buf_8(buf);
        for (var crc2 = -1, i = 0, L = buf.length - 3; i < L; ) {
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
        }
        while (i < L + 3)
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
        return crc2 ^ -1;
      }
      function crc32_buf_8(buf) {
        for (var crc2 = -1, i = 0, L = buf.length - 7; i < L; ) {
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
        }
        while (i < L + 7)
          crc2 = crc2 >>> 8 ^ table[(crc2 ^ buf[i++]) & 255];
        return crc2 ^ -1;
      }
      function crc32_str(str) {
        for (var crc2 = -1, i = 0, L = str.length, c, d; i < L; ) {
          c = str.charCodeAt(i++);
          if (c < 128) {
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ c) & 255];
          } else if (c < 2048) {
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ (192 | c >> 6 & 31)) & 255];
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ (128 | c & 63)) & 255];
          } else if (c >= 55296 && c < 57344) {
            c = (c & 1023) + 64;
            d = str.charCodeAt(i++) & 1023;
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ (240 | c >> 8 & 7)) & 255];
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ (128 | c >> 2 & 63)) & 255];
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ (128 | d >> 6 & 15 | c & 3)) & 255];
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ (128 | d & 63)) & 255];
          } else {
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ (224 | c >> 12 & 15)) & 255];
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ (128 | c >> 6 & 63)) & 255];
            crc2 = crc2 >>> 8 ^ table[(crc2 ^ (128 | c & 63)) & 255];
          }
        }
        return crc2 ^ -1;
      }
      CRC322.table = table;
      CRC322.bstr = crc32_bstr;
      CRC322.buf = crc32_buf;
      CRC322.str = crc32_str;
    });
  }
});

// node_modules/png-chunks-extract/index.js
var require_png_chunks_extract = __commonJS({
  "node_modules/png-chunks-extract/index.js"(exports, module2) {
    var crc322 = require_crc32();
    module2.exports = extractChunks;
    var uint8 = new Uint8Array(4);
    var int32 = new Int32Array(uint8.buffer);
    var uint32 = new Uint32Array(uint8.buffer);
    function extractChunks(data) {
      if (data[0] !== 137)
        throw new Error("Invalid .png file header");
      if (data[1] !== 80)
        throw new Error("Invalid .png file header");
      if (data[2] !== 78)
        throw new Error("Invalid .png file header");
      if (data[3] !== 71)
        throw new Error("Invalid .png file header");
      if (data[4] !== 13)
        throw new Error("Invalid .png file header: possibly caused by DOS-Unix line ending conversion?");
      if (data[5] !== 10)
        throw new Error("Invalid .png file header: possibly caused by DOS-Unix line ending conversion?");
      if (data[6] !== 26)
        throw new Error("Invalid .png file header");
      if (data[7] !== 10)
        throw new Error("Invalid .png file header: possibly caused by DOS-Unix line ending conversion?");
      var ended = false;
      var chunks = [];
      var idx = 8;
      while (idx < data.length) {
        uint8[3] = data[idx++];
        uint8[2] = data[idx++];
        uint8[1] = data[idx++];
        uint8[0] = data[idx++];
        var length = uint32[0] + 4;
        var chunk = new Uint8Array(length);
        chunk[0] = data[idx++];
        chunk[1] = data[idx++];
        chunk[2] = data[idx++];
        chunk[3] = data[idx++];
        var name = String.fromCharCode(chunk[0]) + String.fromCharCode(chunk[1]) + String.fromCharCode(chunk[2]) + String.fromCharCode(chunk[3]);
        if (!chunks.length && name !== "IHDR") {
          throw new Error("IHDR header missing");
        }
        if (name === "IEND") {
          ended = true;
          chunks.push({
            name,
            data: new Uint8Array(0)
          });
          break;
        }
        for (var i = 4; i < length; i++) {
          chunk[i] = data[idx++];
        }
        uint8[3] = data[idx++];
        uint8[2] = data[idx++];
        uint8[1] = data[idx++];
        uint8[0] = data[idx++];
        var crcActual = int32[0];
        var crcExpect = crc322.buf(chunk);
        if (crcExpect !== crcActual) {
          throw new Error(
            "CRC values for " + name + " header do not match, PNG file is likely corrupted"
          );
        }
        var chunkData = new Uint8Array(chunk.buffer.slice(4));
        chunks.push({
          name,
          data: chunkData
        });
      }
      if (!ended) {
        throw new Error(".png file ended prematurely: no IEND header was found");
      }
      return chunks;
    }
  }
});

// node_modules/sharp/lib/is.js
var require_is = __commonJS({
  "node_modules/sharp/lib/is.js"(exports, module2) {
    var defined = (val) => typeof val !== "undefined" && val !== null;
    var object = (val) => typeof val === "object";
    var plainObject = (val) => Object.prototype.toString.call(val) === "[object Object]";
    var fn = (val) => typeof val === "function";
    var bool = (val) => typeof val === "boolean";
    var buffer = (val) => val instanceof Buffer;
    var typedArray = (val) => {
      if (defined(val)) {
        switch (val.constructor) {
          case Uint8Array:
          case Uint8ClampedArray:
          case Int8Array:
          case Uint16Array:
          case Int16Array:
          case Uint32Array:
          case Int32Array:
          case Float32Array:
          case Float64Array:
            return true;
        }
      }
      return false;
    };
    var arrayBuffer = (val) => val instanceof ArrayBuffer;
    var string = (val) => typeof val === "string" && val.length > 0;
    var number = (val) => typeof val === "number" && !Number.isNaN(val);
    var integer = (val) => Number.isInteger(val);
    var inRange = (val, min, max2) => val >= min && val <= max2;
    var inArray = (val, list) => list.includes(val);
    var invalidParameterError = (name, expected, actual) => new Error(
      `Expected ${expected} for ${name} but received ${actual} of type ${typeof actual}`
    );
    var nativeError = (native, context) => {
      context.message = native.message;
      return context;
    };
    module2.exports = {
      defined,
      object,
      plainObject,
      fn,
      bool,
      buffer,
      typedArray,
      arrayBuffer,
      string,
      number,
      integer,
      inRange,
      inArray,
      invalidParameterError,
      nativeError
    };
  }
});

// node_modules/detect-libc/lib/process.js
var require_process = __commonJS({
  "node_modules/detect-libc/lib/process.js"(exports, module2) {
    "use strict";
    var isLinux = () => process.platform === "linux";
    var report = null;
    var getReport = () => {
      if (!report) {
        if (isLinux() && process.report) {
          const orig = process.report.excludeNetwork;
          process.report.excludeNetwork = true;
          report = process.report.getReport();
          process.report.excludeNetwork = orig;
        } else {
          report = {};
        }
      }
      return report;
    };
    module2.exports = { isLinux, getReport };
  }
});

// node_modules/detect-libc/lib/filesystem.js
var require_filesystem = __commonJS({
  "node_modules/detect-libc/lib/filesystem.js"(exports, module2) {
    "use strict";
    var fs = require("fs");
    var LDD_PATH = "/usr/bin/ldd";
    var SELF_PATH = "/proc/self/exe";
    var MAX_LENGTH = 2048;
    var readFileSync5 = (path) => {
      const fd2 = fs.openSync(path, "r");
      const buffer = Buffer.alloc(MAX_LENGTH);
      const bytesRead = fs.readSync(fd2, buffer, 0, MAX_LENGTH, 0);
      fs.close(fd2, () => {
      });
      return buffer.subarray(0, bytesRead);
    };
    var readFile = (path) => new Promise((resolve3, reject) => {
      fs.open(path, "r", (err2, fd2) => {
        if (err2) {
          reject(err2);
        } else {
          const buffer = Buffer.alloc(MAX_LENGTH);
          fs.read(fd2, buffer, 0, MAX_LENGTH, 0, (_, bytesRead) => {
            resolve3(buffer.subarray(0, bytesRead));
            fs.close(fd2, () => {
            });
          });
        }
      });
    });
    module2.exports = {
      LDD_PATH,
      SELF_PATH,
      readFileSync: readFileSync5,
      readFile
    };
  }
});

// node_modules/detect-libc/lib/elf.js
var require_elf = __commonJS({
  "node_modules/detect-libc/lib/elf.js"(exports, module2) {
    "use strict";
    var interpreterPath = (elf) => {
      if (elf.length < 64) {
        return null;
      }
      if (elf.readUInt32BE(0) !== 2135247942) {
        return null;
      }
      if (elf.readUInt8(4) !== 2) {
        return null;
      }
      if (elf.readUInt8(5) !== 1) {
        return null;
      }
      const offset = elf.readUInt32LE(32);
      const size = elf.readUInt16LE(54);
      const count = elf.readUInt16LE(56);
      for (let i = 0; i < count; i++) {
        const headerOffset = offset + i * size;
        const type = elf.readUInt32LE(headerOffset);
        if (type === 3) {
          const fileOffset = elf.readUInt32LE(headerOffset + 8);
          const fileSize = elf.readUInt32LE(headerOffset + 32);
          return elf.subarray(fileOffset, fileOffset + fileSize).toString().replace(/\0.*$/g, "");
        }
      }
      return null;
    };
    module2.exports = {
      interpreterPath
    };
  }
});

// node_modules/detect-libc/lib/detect-libc.js
var require_detect_libc = __commonJS({
  "node_modules/detect-libc/lib/detect-libc.js"(exports, module2) {
    "use strict";
    var childProcess = require("child_process");
    var { isLinux, getReport } = require_process();
    var { LDD_PATH, SELF_PATH, readFile, readFileSync: readFileSync5 } = require_filesystem();
    var { interpreterPath } = require_elf();
    var cachedFamilyInterpreter;
    var cachedFamilyFilesystem;
    var cachedVersionFilesystem;
    var command = "getconf GNU_LIBC_VERSION 2>&1 || true; ldd --version 2>&1 || true";
    var commandOut = "";
    var safeCommand = () => {
      if (!commandOut) {
        return new Promise((resolve3) => {
          childProcess.exec(command, (err2, out) => {
            commandOut = err2 ? " " : out;
            resolve3(commandOut);
          });
        });
      }
      return commandOut;
    };
    var safeCommandSync = () => {
      if (!commandOut) {
        try {
          commandOut = childProcess.execSync(command, { encoding: "utf8" });
        } catch (_err) {
          commandOut = " ";
        }
      }
      return commandOut;
    };
    var GLIBC = "glibc";
    var RE_GLIBC_VERSION = /LIBC[a-z0-9 \-).]*?(\d+\.\d+)/i;
    var MUSL = "musl";
    var isFileMusl = (f) => f.includes("libc.musl-") || f.includes("ld-musl-");
    var familyFromReport = () => {
      const report = getReport();
      if (report.header && report.header.glibcVersionRuntime) {
        return GLIBC;
      }
      if (Array.isArray(report.sharedObjects)) {
        if (report.sharedObjects.some(isFileMusl)) {
          return MUSL;
        }
      }
      return null;
    };
    var familyFromCommand = (out) => {
      const [getconf, ldd1] = out.split(/[\r\n]+/);
      if (getconf && getconf.includes(GLIBC)) {
        return GLIBC;
      }
      if (ldd1 && ldd1.includes(MUSL)) {
        return MUSL;
      }
      return null;
    };
    var familyFromInterpreterPath = (path) => {
      if (path) {
        if (path.includes("/ld-musl-")) {
          return MUSL;
        } else if (path.includes("/ld-linux-")) {
          return GLIBC;
        }
      }
      return null;
    };
    var getFamilyFromLddContent = (content) => {
      content = content.toString();
      if (content.includes("musl")) {
        return MUSL;
      }
      if (content.includes("GNU C Library")) {
        return GLIBC;
      }
      return null;
    };
    var familyFromFilesystem = async () => {
      if (cachedFamilyFilesystem !== void 0) {
        return cachedFamilyFilesystem;
      }
      cachedFamilyFilesystem = null;
      try {
        const lddContent = await readFile(LDD_PATH);
        cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
      } catch (e) {
      }
      return cachedFamilyFilesystem;
    };
    var familyFromFilesystemSync = () => {
      if (cachedFamilyFilesystem !== void 0) {
        return cachedFamilyFilesystem;
      }
      cachedFamilyFilesystem = null;
      try {
        const lddContent = readFileSync5(LDD_PATH);
        cachedFamilyFilesystem = getFamilyFromLddContent(lddContent);
      } catch (e) {
      }
      return cachedFamilyFilesystem;
    };
    var familyFromInterpreter = async () => {
      if (cachedFamilyInterpreter !== void 0) {
        return cachedFamilyInterpreter;
      }
      cachedFamilyInterpreter = null;
      try {
        const selfContent = await readFile(SELF_PATH);
        const path = interpreterPath(selfContent);
        cachedFamilyInterpreter = familyFromInterpreterPath(path);
      } catch (e) {
      }
      return cachedFamilyInterpreter;
    };
    var familyFromInterpreterSync = () => {
      if (cachedFamilyInterpreter !== void 0) {
        return cachedFamilyInterpreter;
      }
      cachedFamilyInterpreter = null;
      try {
        const selfContent = readFileSync5(SELF_PATH);
        const path = interpreterPath(selfContent);
        cachedFamilyInterpreter = familyFromInterpreterPath(path);
      } catch (e) {
      }
      return cachedFamilyInterpreter;
    };
    var family = async () => {
      let family2 = null;
      if (isLinux()) {
        family2 = await familyFromInterpreter();
        if (!family2) {
          family2 = await familyFromFilesystem();
          if (!family2) {
            family2 = familyFromReport();
          }
          if (!family2) {
            const out = await safeCommand();
            family2 = familyFromCommand(out);
          }
        }
      }
      return family2;
    };
    var familySync = () => {
      let family2 = null;
      if (isLinux()) {
        family2 = familyFromInterpreterSync();
        if (!family2) {
          family2 = familyFromFilesystemSync();
          if (!family2) {
            family2 = familyFromReport();
          }
          if (!family2) {
            const out = safeCommandSync();
            family2 = familyFromCommand(out);
          }
        }
      }
      return family2;
    };
    var isNonGlibcLinux = async () => isLinux() && await family() !== GLIBC;
    var isNonGlibcLinuxSync = () => isLinux() && familySync() !== GLIBC;
    var versionFromFilesystem = async () => {
      if (cachedVersionFilesystem !== void 0) {
        return cachedVersionFilesystem;
      }
      cachedVersionFilesystem = null;
      try {
        const lddContent = await readFile(LDD_PATH);
        const versionMatch = lddContent.match(RE_GLIBC_VERSION);
        if (versionMatch) {
          cachedVersionFilesystem = versionMatch[1];
        }
      } catch (e) {
      }
      return cachedVersionFilesystem;
    };
    var versionFromFilesystemSync = () => {
      if (cachedVersionFilesystem !== void 0) {
        return cachedVersionFilesystem;
      }
      cachedVersionFilesystem = null;
      try {
        const lddContent = readFileSync5(LDD_PATH);
        const versionMatch = lddContent.match(RE_GLIBC_VERSION);
        if (versionMatch) {
          cachedVersionFilesystem = versionMatch[1];
        }
      } catch (e) {
      }
      return cachedVersionFilesystem;
    };
    var versionFromReport = () => {
      const report = getReport();
      if (report.header && report.header.glibcVersionRuntime) {
        return report.header.glibcVersionRuntime;
      }
      return null;
    };
    var versionSuffix = (s) => s.trim().split(/\s+/)[1];
    var versionFromCommand = (out) => {
      const [getconf, ldd1, ldd2] = out.split(/[\r\n]+/);
      if (getconf && getconf.includes(GLIBC)) {
        return versionSuffix(getconf);
      }
      if (ldd1 && ldd2 && ldd1.includes(MUSL)) {
        return versionSuffix(ldd2);
      }
      return null;
    };
    var version = async () => {
      let version2 = null;
      if (isLinux()) {
        version2 = await versionFromFilesystem();
        if (!version2) {
          version2 = versionFromReport();
        }
        if (!version2) {
          const out = await safeCommand();
          version2 = versionFromCommand(out);
        }
      }
      return version2;
    };
    var versionSync = () => {
      let version2 = null;
      if (isLinux()) {
        version2 = versionFromFilesystemSync();
        if (!version2) {
          version2 = versionFromReport();
        }
        if (!version2) {
          const out = safeCommandSync();
          version2 = versionFromCommand(out);
        }
      }
      return version2;
    };
    module2.exports = {
      GLIBC,
      MUSL,
      family,
      familySync,
      isNonGlibcLinux,
      isNonGlibcLinuxSync,
      version,
      versionSync
    };
  }
});

// node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/semver/internal/debug.js"(exports, module2) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module2.exports = debug;
  }
});

// node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/semver/internal/constants.js"(exports, module2) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module2.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/semver/internal/re.js"(exports, module2) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports = module2.exports = {};
    var re = exports.re = [];
    var safeRe = exports.safeRe = [];
    var src = exports.src = [];
    var safeSrc = exports.safeSrc = [];
    var t = exports.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max2] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max2}}`).split(`${token}+`).join(`${token}{1,${max2}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/semver/internal/parse-options.js"(exports, module2) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module2.exports = parseOptions;
  }
});

// node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/semver/internal/identifiers.js"(exports, module2) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module2.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/semver/classes/semver.js"(exports, module2) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var SemVer = class _SemVer {
      constructor(version, options) {
        options = parseOptions(options);
        if (version instanceof _SemVer) {
          if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
                if (isNaN(this.prerelease[1])) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module2.exports = SemVer;
  }
});

// node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/semver/functions/parse.js"(exports, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version, options, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module2.exports = parse;
  }
});

// node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/semver/functions/coerce.js"(exports, module2) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === "number") {
        version = String(version);
      }
      if (typeof version !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module2.exports = coerce;
  }
});

// node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/semver/functions/compare.js"(exports, module2) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module2.exports = compare;
  }
});

// node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/semver/functions/gte.js"(exports, module2) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module2.exports = gte;
  }
});

// node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/semver/internal/lrucache.js"(exports, module2) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module2.exports = LRUCache;
  }
});

// node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/semver/functions/eq.js"(exports, module2) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module2.exports = eq;
  }
});

// node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/semver/functions/neq.js"(exports, module2) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module2.exports = neq;
  }
});

// node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/semver/functions/gt.js"(exports, module2) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module2.exports = gt;
  }
});

// node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/semver/functions/lt.js"(exports, module2) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module2.exports = lt;
  }
});

// node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/semver/functions/lte.js"(exports, module2) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module2.exports = lte;
  }
});

// node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/semver/functions/cmp.js"(exports, module2) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module2.exports = cmp;
  }
});

// node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/semver/classes/comparator.js"(exports, module2) {
    "use strict";
    var ANY = Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug("Comparator.test", version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module2.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/semver/classes/range.js"(exports, module2) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module2.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/semver/functions/satisfies.js"(exports, module2) {
    "use strict";
    var Range = require_range();
    var satisfies = (version, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module2.exports = satisfies;
  }
});

// node_modules/sharp/package.json
var require_package = __commonJS({
  "node_modules/sharp/package.json"(exports, module2) {
    module2.exports = {
      name: "sharp",
      description: "High performance Node.js image processing, the fastest module to resize JPEG, PNG, WebP, GIF, AVIF and TIFF images",
      version: "0.34.5",
      author: "Lovell Fuller <npm@lovell.info>",
      homepage: "https://sharp.pixelplumbing.com",
      contributors: [
        "Pierre Inglebert <pierre.inglebert@gmail.com>",
        "Jonathan Ong <jonathanrichardong@gmail.com>",
        "Chanon Sajjamanochai <chanon.s@gmail.com>",
        "Juliano Julio <julianojulio@gmail.com>",
        "Daniel Gasienica <daniel@gasienica.ch>",
        "Julian Walker <julian@fiftythree.com>",
        "Amit Pitaru <pitaru.amit@gmail.com>",
        "Brandon Aaron <hello.brandon@aaron.sh>",
        "Andreas Lind <andreas@one.com>",
        "Maurus Cuelenaere <mcuelenaere@gmail.com>",
        "Linus Unneb\xE4ck <linus@folkdatorn.se>",
        "Victor Mateevitsi <mvictoras@gmail.com>",
        "Alaric Holloway <alaric.holloway@gmail.com>",
        "Bernhard K. Weisshuhn <bkw@codingforce.com>",
        "Chris Riley <criley@primedia.com>",
        "David Carley <dacarley@gmail.com>",
        "John Tobin <john@limelightmobileinc.com>",
        "Kenton Gray <kentongray@gmail.com>",
        "Felix B\xFCnemann <Felix.Buenemann@gmail.com>",
        "Samy Al Zahrani <samyalzahrany@gmail.com>",
        "Chintan Thakkar <lemnisk8@gmail.com>",
        "F. Orlando Galashan <frulo@gmx.de>",
        "Kleis Auke Wolthuizen <info@kleisauke.nl>",
        "Matt Hirsch <mhirsch@media.mit.edu>",
        "Matthias Thoemmes <thoemmes@gmail.com>",
        "Patrick Paskaris <patrick@paskaris.gr>",
        "J\xE9r\xE9my Lal <kapouer@melix.org>",
        "Rahul Nanwani <r.nanwani@gmail.com>",
        "Alice Monday <alice0meta@gmail.com>",
        "Kristo Jorgenson <kristo.jorgenson@gmail.com>",
        "YvesBos <yves_bos@outlook.com>",
        "Guy Maliar <guy@tailorbrands.com>",
        "Nicolas Coden <nicolas@ncoden.fr>",
        "Matt Parrish <matt.r.parrish@gmail.com>",
        "Marcel Bretschneider <marcel.bretschneider@gmail.com>",
        "Matthew McEachen <matthew+github@mceachen.org>",
        "Jarda Kot\u011B\u0161ovec <jarda.kotesovec@gmail.com>",
        "Kenric D'Souza <kenric.dsouza@gmail.com>",
        "Oleh Aleinyk <oleg.aleynik@gmail.com>",
        "Marcel Bretschneider <marcel.bretschneider@gmail.com>",
        "Andrea Bianco <andrea.bianco@unibas.ch>",
        "Rik Heywood <rik@rik.org>",
        "Thomas Parisot <hi@oncletom.io>",
        "Nathan Graves <nathanrgraves+github@gmail.com>",
        "Tom Lokhorst <tom@lokhorst.eu>",
        "Espen Hovlandsdal <espen@hovlandsdal.com>",
        "Sylvain Dumont <sylvain.dumont35@gmail.com>",
        "Alun Davies <alun.owain.davies@googlemail.com>",
        "Aidan Hoolachan <ajhoolachan21@gmail.com>",
        "Axel Eirola <axel.eirola@iki.fi>",
        "Freezy <freezy@xbmc.org>",
        "Daiz <taneli.vatanen@gmail.com>",
        "Julian Aubourg <j@ubourg.net>",
        "Keith Belovay <keith@picthrive.com>",
        "Michael B. Klein <mbklein@gmail.com>",
        "Jordan Prudhomme <jordan@raboland.fr>",
        "Ilya Ovdin <iovdin@gmail.com>",
        "Andargor <andargor@yahoo.com>",
        "Paul Neave <paul.neave@gmail.com>",
        "Brendan Kennedy <brenwken@gmail.com>",
        "Brychan Bennett-Odlum <git@brychan.io>",
        "Edward Silverton <e.silverton@gmail.com>",
        "Roman Malieiev <aromaleev@gmail.com>",
        "Tomas Szabo <tomas.szabo@deftomat.com>",
        "Robert O'Rourke <robert@o-rourke.org>",
        "Guillermo Alfonso Varela Chouci\xF1o <guillevch@gmail.com>",
        "Christian Flintrup <chr@gigahost.dk>",
        "Manan Jadhav <manan@motionden.com>",
        "Leon Radley <leon@radley.se>",
        "alza54 <alza54@thiocod.in>",
        "Jacob Smith <jacob@frende.me>",
        "Michael Nutt <michael@nutt.im>",
        "Brad Parham <baparham@gmail.com>",
        "Taneli Vatanen <taneli.vatanen@gmail.com>",
        "Joris Dugu\xE9 <zaruike10@gmail.com>",
        "Chris Banks <christopher.bradley.banks@gmail.com>",
        "Ompal Singh <ompal.hitm09@gmail.com>",
        "Brodan <christopher.hranj@gmail.com>",
        "Ankur Parihar <ankur.github@gmail.com>",
        "Brahim Ait elhaj <brahima@gmail.com>",
        "Mart Jansink <m.jansink@gmail.com>",
        "Lachlan Newman <lachnewman007@gmail.com>",
        "Dennis Beatty <dennis@dcbeatty.com>",
        "Ingvar Stepanyan <me@rreverser.com>",
        "Don Denton <don@happycollision.com>"
      ],
      scripts: {
        build: "node install/build.js",
        install: "node install/check.js || npm run build",
        clean: "rm -rf src/build/ .nyc_output/ coverage/ test/fixtures/output.*",
        test: "npm run lint && npm run test-unit",
        lint: "npm run lint-cpp && npm run lint-js && npm run lint-types",
        "lint-cpp": "cpplint --quiet src/*.h src/*.cc",
        "lint-js": "biome lint",
        "lint-types": "tsd --files ./test/types/sharp.test-d.ts",
        "test-leak": "./test/leak/leak.sh",
        "test-unit": "node --experimental-test-coverage test/unit.mjs",
        "package-from-local-build": "node npm/from-local-build.js",
        "package-release-notes": "node npm/release-notes.js",
        "docs-build": "node docs/build.mjs",
        "docs-serve": "cd docs && npm start",
        "docs-publish": "cd docs && npm run build && npx firebase-tools deploy --project pixelplumbing --only hosting:pixelplumbing-sharp"
      },
      type: "commonjs",
      main: "lib/index.js",
      types: "lib/index.d.ts",
      files: [
        "install",
        "lib",
        "src/*.{cc,h,gyp}"
      ],
      repository: {
        type: "git",
        url: "git://github.com/lovell/sharp.git"
      },
      keywords: [
        "jpeg",
        "png",
        "webp",
        "avif",
        "tiff",
        "gif",
        "svg",
        "jp2",
        "dzi",
        "image",
        "resize",
        "thumbnail",
        "crop",
        "embed",
        "libvips",
        "vips"
      ],
      dependencies: {
        "@img/colour": "^1.0.0",
        "detect-libc": "^2.1.2",
        semver: "^7.7.3"
      },
      optionalDependencies: {
        "@img/sharp-darwin-arm64": "0.34.5",
        "@img/sharp-darwin-x64": "0.34.5",
        "@img/sharp-libvips-darwin-arm64": "1.2.4",
        "@img/sharp-libvips-darwin-x64": "1.2.4",
        "@img/sharp-libvips-linux-arm": "1.2.4",
        "@img/sharp-libvips-linux-arm64": "1.2.4",
        "@img/sharp-libvips-linux-ppc64": "1.2.4",
        "@img/sharp-libvips-linux-riscv64": "1.2.4",
        "@img/sharp-libvips-linux-s390x": "1.2.4",
        "@img/sharp-libvips-linux-x64": "1.2.4",
        "@img/sharp-libvips-linuxmusl-arm64": "1.2.4",
        "@img/sharp-libvips-linuxmusl-x64": "1.2.4",
        "@img/sharp-linux-arm": "0.34.5",
        "@img/sharp-linux-arm64": "0.34.5",
        "@img/sharp-linux-ppc64": "0.34.5",
        "@img/sharp-linux-riscv64": "0.34.5",
        "@img/sharp-linux-s390x": "0.34.5",
        "@img/sharp-linux-x64": "0.34.5",
        "@img/sharp-linuxmusl-arm64": "0.34.5",
        "@img/sharp-linuxmusl-x64": "0.34.5",
        "@img/sharp-wasm32": "0.34.5",
        "@img/sharp-win32-arm64": "0.34.5",
        "@img/sharp-win32-ia32": "0.34.5",
        "@img/sharp-win32-x64": "0.34.5"
      },
      devDependencies: {
        "@biomejs/biome": "^2.3.4",
        "@cpplint/cli": "^0.1.0",
        "@emnapi/runtime": "^1.7.0",
        "@img/sharp-libvips-dev": "1.2.4",
        "@img/sharp-libvips-dev-wasm32": "1.2.4",
        "@img/sharp-libvips-win32-arm64": "1.2.4",
        "@img/sharp-libvips-win32-ia32": "1.2.4",
        "@img/sharp-libvips-win32-x64": "1.2.4",
        "@types/node": "*",
        emnapi: "^1.7.0",
        "exif-reader": "^2.0.2",
        "extract-zip": "^2.0.1",
        icc: "^3.0.0",
        "jsdoc-to-markdown": "^9.1.3",
        "node-addon-api": "^8.5.0",
        "node-gyp": "^11.5.0",
        "tar-fs": "^3.1.1",
        tsd: "^0.33.0"
      },
      license: "Apache-2.0",
      engines: {
        node: "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      config: {
        libvips: ">=8.17.3"
      },
      funding: {
        url: "https://opencollective.com/libvips"
      }
    };
  }
});

// node_modules/sharp/lib/libvips.js
var require_libvips = __commonJS({
  "node_modules/sharp/lib/libvips.js"(exports, module2) {
    var { spawnSync: spawnSync2 } = require("node:child_process");
    var { createHash } = require("node:crypto");
    var semverCoerce = require_coerce();
    var semverGreaterThanOrEqualTo = require_gte();
    var semverSatisfies = require_satisfies();
    var detectLibc = require_detect_libc();
    var { config, engines, optionalDependencies } = require_package();
    var minimumLibvipsVersionLabelled = process.env.npm_package_config_libvips || config.libvips;
    var minimumLibvipsVersion = semverCoerce(minimumLibvipsVersionLabelled).version;
    var prebuiltPlatforms = [
      "darwin-arm64",
      "darwin-x64",
      "linux-arm",
      "linux-arm64",
      "linux-ppc64",
      "linux-riscv64",
      "linux-s390x",
      "linux-x64",
      "linuxmusl-arm64",
      "linuxmusl-x64",
      "win32-arm64",
      "win32-ia32",
      "win32-x64"
    ];
    var spawnSyncOptions = {
      encoding: "utf8",
      shell: true
    };
    var log = (item) => {
      if (item instanceof Error) {
        console.error(`sharp: Installation error: ${item.message}`);
      } else {
        console.log(`sharp: ${item}`);
      }
    };
    var runtimeLibc = () => detectLibc.isNonGlibcLinuxSync() ? detectLibc.familySync() : "";
    var runtimePlatformArch = () => `${process.platform}${runtimeLibc()}-${process.arch}`;
    var buildPlatformArch = () => {
      if (isEmscripten()) {
        return "wasm32";
      }
      const { npm_config_arch, npm_config_platform, npm_config_libc } = process.env;
      const libc = typeof npm_config_libc === "string" ? npm_config_libc : runtimeLibc();
      return `${npm_config_platform || process.platform}${libc}-${npm_config_arch || process.arch}`;
    };
    var buildSharpLibvipsIncludeDir = () => {
      try {
        return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/include`);
      } catch {
        try {
          return require("@img/sharp-libvips-dev/include");
        } catch {
        }
      }
      return "";
    };
    var buildSharpLibvipsCPlusPlusDir = () => {
      try {
        return require("@img/sharp-libvips-dev/cplusplus");
      } catch {
      }
      return "";
    };
    var buildSharpLibvipsLibDir = () => {
      try {
        return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/lib`);
      } catch {
        try {
          return require(`@img/sharp-libvips-${buildPlatformArch()}/lib`);
        } catch {
        }
      }
      return "";
    };
    var isUnsupportedNodeRuntime = () => {
      if (process.release?.name === "node" && process.versions) {
        if (!semverSatisfies(process.versions.node, engines.node)) {
          return { found: process.versions.node, expected: engines.node };
        }
      }
    };
    var isEmscripten = () => {
      const { CC } = process.env;
      return Boolean(CC?.endsWith("/emcc"));
    };
    var isRosetta = () => {
      if (process.platform === "darwin" && process.arch === "x64") {
        const translated = spawnSync2("sysctl sysctl.proc_translated", spawnSyncOptions).stdout;
        return (translated || "").trim() === "sysctl.proc_translated: 1";
      }
      return false;
    };
    var sha512 = (s) => createHash("sha512").update(s).digest("hex");
    var yarnLocator = () => {
      try {
        const identHash = sha512(`imgsharp-libvips-${buildPlatformArch()}`);
        const npmVersion = semverCoerce(optionalDependencies[`@img/sharp-libvips-${buildPlatformArch()}`], {
          includePrerelease: true
        }).version;
        return sha512(`${identHash}npm:${npmVersion}`).slice(0, 10);
      } catch {
      }
      return "";
    };
    var spawnRebuild = () => spawnSync2(`node-gyp rebuild --directory=src ${isEmscripten() ? "--nodedir=emscripten" : ""}`, {
      ...spawnSyncOptions,
      stdio: "inherit"
    }).status;
    var globalLibvipsVersion = () => {
      if (process.platform !== "win32") {
        const globalLibvipsVersion2 = spawnSync2("pkg-config --modversion vips-cpp", {
          ...spawnSyncOptions,
          env: {
            ...process.env,
            PKG_CONFIG_PATH: pkgConfigPath()
          }
        }).stdout;
        return (globalLibvipsVersion2 || "").trim();
      } else {
        return "";
      }
    };
    var pkgConfigPath = () => {
      if (process.platform !== "win32") {
        const brewPkgConfigPath = spawnSync2(
          'which brew >/dev/null 2>&1 && brew environment --plain | grep PKG_CONFIG_LIBDIR | cut -d" " -f2',
          spawnSyncOptions
        ).stdout || "";
        return [
          brewPkgConfigPath.trim(),
          process.env.PKG_CONFIG_PATH,
          "/usr/local/lib/pkgconfig",
          "/usr/lib/pkgconfig",
          "/usr/local/libdata/pkgconfig",
          "/usr/libdata/pkgconfig"
        ].filter(Boolean).join(":");
      } else {
        return "";
      }
    };
    var skipSearch = (status, reason, logger) => {
      if (logger) {
        logger(`Detected ${reason}, skipping search for globally-installed libvips`);
      }
      return status;
    };
    var useGlobalLibvips = (logger) => {
      if (Boolean(process.env.SHARP_IGNORE_GLOBAL_LIBVIPS) === true) {
        return skipSearch(false, "SHARP_IGNORE_GLOBAL_LIBVIPS", logger);
      }
      if (Boolean(process.env.SHARP_FORCE_GLOBAL_LIBVIPS) === true) {
        return skipSearch(true, "SHARP_FORCE_GLOBAL_LIBVIPS", logger);
      }
      if (isRosetta()) {
        return skipSearch(false, "Rosetta", logger);
      }
      const globalVipsVersion = globalLibvipsVersion();
      return !!globalVipsVersion && semverGreaterThanOrEqualTo(globalVipsVersion, minimumLibvipsVersion);
    };
    module2.exports = {
      minimumLibvipsVersion,
      prebuiltPlatforms,
      buildPlatformArch,
      buildSharpLibvipsIncludeDir,
      buildSharpLibvipsCPlusPlusDir,
      buildSharpLibvipsLibDir,
      isUnsupportedNodeRuntime,
      runtimePlatformArch,
      log,
      yarnLocator,
      spawnRebuild,
      globalLibvipsVersion,
      pkgConfigPath,
      useGlobalLibvips
    };
  }
});

// node_modules/sharp/lib/sharp.js
var require_sharp = __commonJS({
  "node_modules/sharp/lib/sharp.js"(exports, module2) {
    var { familySync, versionSync } = require_detect_libc();
    var { runtimePlatformArch, isUnsupportedNodeRuntime, prebuiltPlatforms, minimumLibvipsVersion } = require_libvips();
    var runtimePlatform = runtimePlatformArch();
    var paths = [
      `../src/build/Release/sharp-${runtimePlatform}.node`,
      "../src/build/Release/sharp-wasm32.node",
      `@img/sharp-${runtimePlatform}/sharp.node`,
      "@img/sharp-wasm32/sharp.node"
    ];
    var path;
    var sharp5;
    var errors = [];
    for (path of paths) {
      try {
        sharp5 = require(path);
        break;
      } catch (err2) {
        errors.push(err2);
      }
    }
    if (sharp5 && path.startsWith("@img/sharp-linux-x64") && !sharp5._isUsingX64V2()) {
      const err2 = new Error("Prebuilt binaries for linux-x64 require v2 microarchitecture");
      err2.code = "Unsupported CPU";
      errors.push(err2);
      sharp5 = null;
    }
    if (sharp5) {
      module2.exports = sharp5;
    } else {
      const [isLinux, isMacOs, isWindows] = ["linux", "darwin", "win32"].map((os) => runtimePlatform.startsWith(os));
      const help = [`Could not load the "sharp" module using the ${runtimePlatform} runtime`];
      errors.forEach((err2) => {
        if (err2.code !== "MODULE_NOT_FOUND") {
          help.push(`${err2.code}: ${err2.message}`);
        }
      });
      const messages = errors.map((err2) => err2.message).join(" ");
      help.push("Possible solutions:");
      if (isUnsupportedNodeRuntime()) {
        const { found, expected } = isUnsupportedNodeRuntime();
        help.push(
          "- Please upgrade Node.js:",
          `    Found ${found}`,
          `    Requires ${expected}`
        );
      } else if (prebuiltPlatforms.includes(runtimePlatform)) {
        const [os, cpu] = runtimePlatform.split("-");
        const libc = os.endsWith("musl") ? " --libc=musl" : "";
        help.push(
          "- Ensure optional dependencies can be installed:",
          "    npm install --include=optional sharp",
          "- Ensure your package manager supports multi-platform installation:",
          "    See https://sharp.pixelplumbing.com/install#cross-platform",
          "- Add platform-specific dependencies:",
          `    npm install --os=${os.replace("musl", "")}${libc} --cpu=${cpu} sharp`
        );
      } else {
        help.push(
          `- Manually install libvips >= ${minimumLibvipsVersion}`,
          "- Add experimental WebAssembly-based dependencies:",
          "    npm install --cpu=wasm32 sharp",
          "    npm install @img/sharp-wasm32"
        );
      }
      if (isLinux && /(symbol not found|CXXABI_)/i.test(messages)) {
        try {
          const { config } = require(`@img/sharp-libvips-${runtimePlatform}/package`);
          const libcFound = `${familySync()} ${versionSync()}`;
          const libcRequires = `${config.musl ? "musl" : "glibc"} ${config.musl || config.glibc}`;
          help.push(
            "- Update your OS:",
            `    Found ${libcFound}`,
            `    Requires ${libcRequires}`
          );
        } catch (_errEngines) {
        }
      }
      if (isLinux && /\/snap\/core[0-9]{2}/.test(messages)) {
        help.push(
          "- Remove the Node.js Snap, which does not support native modules",
          "    snap remove node"
        );
      }
      if (isMacOs && /Incompatible library version/.test(messages)) {
        help.push(
          "- Update Homebrew:",
          "    brew update && brew upgrade vips"
        );
      }
      if (errors.some((err2) => err2.code === "ERR_DLOPEN_DISABLED")) {
        help.push("- Run Node.js without using the --no-addons flag");
      }
      if (isWindows && /The specified procedure could not be found/.test(messages)) {
        help.push(
          "- Using the canvas package on Windows?",
          "    See https://sharp.pixelplumbing.com/install#canvas-and-windows",
          "- Check for outdated versions of sharp in the dependency tree:",
          "    npm ls sharp"
        );
      }
      help.push(
        "- Consult the installation documentation:",
        "    See https://sharp.pixelplumbing.com/install"
      );
      throw new Error(help.join("\n"));
    }
  }
});

// node_modules/sharp/lib/constructor.js
var require_constructor = __commonJS({
  "node_modules/sharp/lib/constructor.js"(exports, module2) {
    var util = require("node:util");
    var stream = require("node:stream");
    var is = require_is();
    require_sharp();
    var debuglog = util.debuglog("sharp");
    var queueListener = (queueLength) => {
      Sharp.queue.emit("change", queueLength);
    };
    var Sharp = function(input, options) {
      if (arguments.length === 1 && !is.defined(input)) {
        throw new Error("Invalid input");
      }
      if (!(this instanceof Sharp)) {
        return new Sharp(input, options);
      }
      stream.Duplex.call(this);
      this.options = {
        // resize options
        topOffsetPre: -1,
        leftOffsetPre: -1,
        widthPre: -1,
        heightPre: -1,
        topOffsetPost: -1,
        leftOffsetPost: -1,
        widthPost: -1,
        heightPost: -1,
        width: -1,
        height: -1,
        canvas: "crop",
        position: 0,
        resizeBackground: [0, 0, 0, 255],
        angle: 0,
        rotationAngle: 0,
        rotationBackground: [0, 0, 0, 255],
        rotateBefore: false,
        orientBefore: false,
        flip: false,
        flop: false,
        extendTop: 0,
        extendBottom: 0,
        extendLeft: 0,
        extendRight: 0,
        extendBackground: [0, 0, 0, 255],
        extendWith: "background",
        withoutEnlargement: false,
        withoutReduction: false,
        affineMatrix: [],
        affineBackground: [0, 0, 0, 255],
        affineIdx: 0,
        affineIdy: 0,
        affineOdx: 0,
        affineOdy: 0,
        affineInterpolator: this.constructor.interpolators.bilinear,
        kernel: "lanczos3",
        fastShrinkOnLoad: true,
        // operations
        tint: [-1, 0, 0, 0],
        flatten: false,
        flattenBackground: [0, 0, 0],
        unflatten: false,
        negate: false,
        negateAlpha: true,
        medianSize: 0,
        blurSigma: 0,
        precision: "integer",
        minAmpl: 0.2,
        sharpenSigma: 0,
        sharpenM1: 1,
        sharpenM2: 2,
        sharpenX1: 2,
        sharpenY2: 10,
        sharpenY3: 20,
        threshold: 0,
        thresholdGrayscale: true,
        trimBackground: [],
        trimThreshold: -1,
        trimLineArt: false,
        dilateWidth: 0,
        erodeWidth: 0,
        gamma: 0,
        gammaOut: 0,
        greyscale: false,
        normalise: false,
        normaliseLower: 1,
        normaliseUpper: 99,
        claheWidth: 0,
        claheHeight: 0,
        claheMaxSlope: 3,
        brightness: 1,
        saturation: 1,
        hue: 0,
        lightness: 0,
        booleanBufferIn: null,
        booleanFileIn: "",
        joinChannelIn: [],
        extractChannel: -1,
        removeAlpha: false,
        ensureAlpha: -1,
        colourspace: "srgb",
        colourspacePipeline: "last",
        composite: [],
        // output
        fileOut: "",
        formatOut: "input",
        streamOut: false,
        keepMetadata: 0,
        withMetadataOrientation: -1,
        withMetadataDensity: 0,
        withIccProfile: "",
        withExif: {},
        withExifMerge: true,
        withXmp: "",
        resolveWithObject: false,
        loop: -1,
        delay: [],
        // output format
        jpegQuality: 80,
        jpegProgressive: false,
        jpegChromaSubsampling: "4:2:0",
        jpegTrellisQuantisation: false,
        jpegOvershootDeringing: false,
        jpegOptimiseScans: false,
        jpegOptimiseCoding: true,
        jpegQuantisationTable: 0,
        pngProgressive: false,
        pngCompressionLevel: 6,
        pngAdaptiveFiltering: false,
        pngPalette: false,
        pngQuality: 100,
        pngEffort: 7,
        pngBitdepth: 8,
        pngDither: 1,
        jp2Quality: 80,
        jp2TileHeight: 512,
        jp2TileWidth: 512,
        jp2Lossless: false,
        jp2ChromaSubsampling: "4:4:4",
        webpQuality: 80,
        webpAlphaQuality: 100,
        webpLossless: false,
        webpNearLossless: false,
        webpSmartSubsample: false,
        webpSmartDeblock: false,
        webpPreset: "default",
        webpEffort: 4,
        webpMinSize: false,
        webpMixed: false,
        gifBitdepth: 8,
        gifEffort: 7,
        gifDither: 1,
        gifInterFrameMaxError: 0,
        gifInterPaletteMaxError: 3,
        gifKeepDuplicateFrames: false,
        gifReuse: true,
        gifProgressive: false,
        tiffQuality: 80,
        tiffCompression: "jpeg",
        tiffBigtiff: false,
        tiffPredictor: "horizontal",
        tiffPyramid: false,
        tiffMiniswhite: false,
        tiffBitdepth: 8,
        tiffTile: false,
        tiffTileHeight: 256,
        tiffTileWidth: 256,
        tiffXres: 1,
        tiffYres: 1,
        tiffResolutionUnit: "inch",
        heifQuality: 50,
        heifLossless: false,
        heifCompression: "av1",
        heifEffort: 4,
        heifChromaSubsampling: "4:4:4",
        heifBitdepth: 8,
        jxlDistance: 1,
        jxlDecodingTier: 0,
        jxlEffort: 7,
        jxlLossless: false,
        rawDepth: "uchar",
        tileSize: 256,
        tileOverlap: 0,
        tileContainer: "fs",
        tileLayout: "dz",
        tileFormat: "last",
        tileDepth: "last",
        tileAngle: 0,
        tileSkipBlanks: -1,
        tileBackground: [255, 255, 255, 255],
        tileCentre: false,
        tileId: "https://example.com/iiif",
        tileBasename: "",
        timeoutSeconds: 0,
        linearA: [],
        linearB: [],
        pdfBackground: [255, 255, 255, 255],
        // Function to notify of libvips warnings
        debuglog: (warning) => {
          this.emit("warning", warning);
          debuglog(warning);
        },
        // Function to notify of queue length changes
        queueListener
      };
      this.options.input = this._createInputDescriptor(input, options, { allowStream: true });
      return this;
    };
    Object.setPrototypeOf(Sharp.prototype, stream.Duplex.prototype);
    Object.setPrototypeOf(Sharp, stream.Duplex);
    function clone() {
      const clone2 = this.constructor.call();
      const { debuglog: debuglog2, queueListener: queueListener2, ...options } = this.options;
      clone2.options = structuredClone(options);
      clone2.options.debuglog = debuglog2;
      clone2.options.queueListener = queueListener2;
      if (this._isStreamInput()) {
        this.on("finish", () => {
          this._flattenBufferIn();
          clone2.options.input.buffer = this.options.input.buffer;
          clone2.emit("finish");
        });
      }
      return clone2;
    }
    Object.assign(Sharp.prototype, { clone });
    module2.exports = Sharp;
  }
});

// node_modules/sharp/lib/input.js
var require_input = __commonJS({
  "node_modules/sharp/lib/input.js"(exports, module2) {
    var is = require_is();
    var sharp5 = require_sharp();
    var align = {
      left: "low",
      top: "low",
      low: "low",
      center: "centre",
      centre: "centre",
      right: "high",
      bottom: "high",
      high: "high"
    };
    var inputStreamParameters = [
      // Limits and error handling
      "failOn",
      "limitInputPixels",
      "unlimited",
      // Format-generic
      "animated",
      "autoOrient",
      "density",
      "ignoreIcc",
      "page",
      "pages",
      "sequentialRead",
      // Format-specific
      "jp2",
      "openSlide",
      "pdf",
      "raw",
      "svg",
      "tiff",
      // Deprecated
      "failOnError",
      "openSlideLevel",
      "pdfBackground",
      "tiffSubifd"
    ];
    function _inputOptionsFromObject(obj) {
      const params = inputStreamParameters.filter((p) => is.defined(obj[p])).map((p) => [p, obj[p]]);
      return params.length ? Object.fromEntries(params) : void 0;
    }
    function _createInputDescriptor(input, inputOptions, containerOptions) {
      const inputDescriptor = {
        autoOrient: false,
        failOn: "warning",
        limitInputPixels: 16383 ** 2,
        ignoreIcc: false,
        unlimited: false,
        sequentialRead: true
      };
      if (is.string(input)) {
        inputDescriptor.file = input;
      } else if (is.buffer(input)) {
        if (input.length === 0) {
          throw Error("Input Buffer is empty");
        }
        inputDescriptor.buffer = input;
      } else if (is.arrayBuffer(input)) {
        if (input.byteLength === 0) {
          throw Error("Input bit Array is empty");
        }
        inputDescriptor.buffer = Buffer.from(input, 0, input.byteLength);
      } else if (is.typedArray(input)) {
        if (input.length === 0) {
          throw Error("Input Bit Array is empty");
        }
        inputDescriptor.buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
      } else if (is.plainObject(input) && !is.defined(inputOptions)) {
        inputOptions = input;
        if (_inputOptionsFromObject(inputOptions)) {
          inputDescriptor.buffer = [];
        }
      } else if (!is.defined(input) && !is.defined(inputOptions) && is.object(containerOptions) && containerOptions.allowStream) {
        inputDescriptor.buffer = [];
      } else if (Array.isArray(input)) {
        if (input.length > 1) {
          if (!this.options.joining) {
            this.options.joining = true;
            this.options.join = input.map((i) => this._createInputDescriptor(i));
          } else {
            throw new Error("Recursive join is unsupported");
          }
        } else {
          throw new Error("Expected at least two images to join");
        }
      } else {
        throw new Error(`Unsupported input '${input}' of type ${typeof input}${is.defined(inputOptions) ? ` when also providing options of type ${typeof inputOptions}` : ""}`);
      }
      if (is.object(inputOptions)) {
        if (is.defined(inputOptions.failOnError)) {
          if (is.bool(inputOptions.failOnError)) {
            inputDescriptor.failOn = inputOptions.failOnError ? "warning" : "none";
          } else {
            throw is.invalidParameterError("failOnError", "boolean", inputOptions.failOnError);
          }
        }
        if (is.defined(inputOptions.failOn)) {
          if (is.string(inputOptions.failOn) && is.inArray(inputOptions.failOn, ["none", "truncated", "error", "warning"])) {
            inputDescriptor.failOn = inputOptions.failOn;
          } else {
            throw is.invalidParameterError("failOn", "one of: none, truncated, error, warning", inputOptions.failOn);
          }
        }
        if (is.defined(inputOptions.autoOrient)) {
          if (is.bool(inputOptions.autoOrient)) {
            inputDescriptor.autoOrient = inputOptions.autoOrient;
          } else {
            throw is.invalidParameterError("autoOrient", "boolean", inputOptions.autoOrient);
          }
        }
        if (is.defined(inputOptions.density)) {
          if (is.inRange(inputOptions.density, 1, 1e5)) {
            inputDescriptor.density = inputOptions.density;
          } else {
            throw is.invalidParameterError("density", "number between 1 and 100000", inputOptions.density);
          }
        }
        if (is.defined(inputOptions.ignoreIcc)) {
          if (is.bool(inputOptions.ignoreIcc)) {
            inputDescriptor.ignoreIcc = inputOptions.ignoreIcc;
          } else {
            throw is.invalidParameterError("ignoreIcc", "boolean", inputOptions.ignoreIcc);
          }
        }
        if (is.defined(inputOptions.limitInputPixels)) {
          if (is.bool(inputOptions.limitInputPixels)) {
            inputDescriptor.limitInputPixels = inputOptions.limitInputPixels ? 16383 ** 2 : 0;
          } else if (is.integer(inputOptions.limitInputPixels) && is.inRange(inputOptions.limitInputPixels, 0, Number.MAX_SAFE_INTEGER)) {
            inputDescriptor.limitInputPixels = inputOptions.limitInputPixels;
          } else {
            throw is.invalidParameterError("limitInputPixels", "positive integer", inputOptions.limitInputPixels);
          }
        }
        if (is.defined(inputOptions.unlimited)) {
          if (is.bool(inputOptions.unlimited)) {
            inputDescriptor.unlimited = inputOptions.unlimited;
          } else {
            throw is.invalidParameterError("unlimited", "boolean", inputOptions.unlimited);
          }
        }
        if (is.defined(inputOptions.sequentialRead)) {
          if (is.bool(inputOptions.sequentialRead)) {
            inputDescriptor.sequentialRead = inputOptions.sequentialRead;
          } else {
            throw is.invalidParameterError("sequentialRead", "boolean", inputOptions.sequentialRead);
          }
        }
        if (is.defined(inputOptions.raw)) {
          if (is.object(inputOptions.raw) && is.integer(inputOptions.raw.width) && inputOptions.raw.width > 0 && is.integer(inputOptions.raw.height) && inputOptions.raw.height > 0 && is.integer(inputOptions.raw.channels) && is.inRange(inputOptions.raw.channels, 1, 4)) {
            inputDescriptor.rawWidth = inputOptions.raw.width;
            inputDescriptor.rawHeight = inputOptions.raw.height;
            inputDescriptor.rawChannels = inputOptions.raw.channels;
            switch (input.constructor) {
              case Uint8Array:
              case Uint8ClampedArray:
                inputDescriptor.rawDepth = "uchar";
                break;
              case Int8Array:
                inputDescriptor.rawDepth = "char";
                break;
              case Uint16Array:
                inputDescriptor.rawDepth = "ushort";
                break;
              case Int16Array:
                inputDescriptor.rawDepth = "short";
                break;
              case Uint32Array:
                inputDescriptor.rawDepth = "uint";
                break;
              case Int32Array:
                inputDescriptor.rawDepth = "int";
                break;
              case Float32Array:
                inputDescriptor.rawDepth = "float";
                break;
              case Float64Array:
                inputDescriptor.rawDepth = "double";
                break;
              default:
                inputDescriptor.rawDepth = "uchar";
                break;
            }
          } else {
            throw new Error("Expected width, height and channels for raw pixel input");
          }
          inputDescriptor.rawPremultiplied = false;
          if (is.defined(inputOptions.raw.premultiplied)) {
            if (is.bool(inputOptions.raw.premultiplied)) {
              inputDescriptor.rawPremultiplied = inputOptions.raw.premultiplied;
            } else {
              throw is.invalidParameterError("raw.premultiplied", "boolean", inputOptions.raw.premultiplied);
            }
          }
          inputDescriptor.rawPageHeight = 0;
          if (is.defined(inputOptions.raw.pageHeight)) {
            if (is.integer(inputOptions.raw.pageHeight) && inputOptions.raw.pageHeight > 0 && inputOptions.raw.pageHeight <= inputOptions.raw.height) {
              if (inputOptions.raw.height % inputOptions.raw.pageHeight !== 0) {
                throw new Error(`Expected raw.height ${inputOptions.raw.height} to be a multiple of raw.pageHeight ${inputOptions.raw.pageHeight}`);
              }
              inputDescriptor.rawPageHeight = inputOptions.raw.pageHeight;
            } else {
              throw is.invalidParameterError("raw.pageHeight", "positive integer", inputOptions.raw.pageHeight);
            }
          }
        }
        if (is.defined(inputOptions.animated)) {
          if (is.bool(inputOptions.animated)) {
            inputDescriptor.pages = inputOptions.animated ? -1 : 1;
          } else {
            throw is.invalidParameterError("animated", "boolean", inputOptions.animated);
          }
        }
        if (is.defined(inputOptions.pages)) {
          if (is.integer(inputOptions.pages) && is.inRange(inputOptions.pages, -1, 1e5)) {
            inputDescriptor.pages = inputOptions.pages;
          } else {
            throw is.invalidParameterError("pages", "integer between -1 and 100000", inputOptions.pages);
          }
        }
        if (is.defined(inputOptions.page)) {
          if (is.integer(inputOptions.page) && is.inRange(inputOptions.page, 0, 1e5)) {
            inputDescriptor.page = inputOptions.page;
          } else {
            throw is.invalidParameterError("page", "integer between 0 and 100000", inputOptions.page);
          }
        }
        if (is.object(inputOptions.openSlide) && is.defined(inputOptions.openSlide.level)) {
          if (is.integer(inputOptions.openSlide.level) && is.inRange(inputOptions.openSlide.level, 0, 256)) {
            inputDescriptor.openSlideLevel = inputOptions.openSlide.level;
          } else {
            throw is.invalidParameterError("openSlide.level", "integer between 0 and 256", inputOptions.openSlide.level);
          }
        } else if (is.defined(inputOptions.level)) {
          if (is.integer(inputOptions.level) && is.inRange(inputOptions.level, 0, 256)) {
            inputDescriptor.openSlideLevel = inputOptions.level;
          } else {
            throw is.invalidParameterError("level", "integer between 0 and 256", inputOptions.level);
          }
        }
        if (is.object(inputOptions.tiff) && is.defined(inputOptions.tiff.subifd)) {
          if (is.integer(inputOptions.tiff.subifd) && is.inRange(inputOptions.tiff.subifd, -1, 1e5)) {
            inputDescriptor.tiffSubifd = inputOptions.tiff.subifd;
          } else {
            throw is.invalidParameterError("tiff.subifd", "integer between -1 and 100000", inputOptions.tiff.subifd);
          }
        } else if (is.defined(inputOptions.subifd)) {
          if (is.integer(inputOptions.subifd) && is.inRange(inputOptions.subifd, -1, 1e5)) {
            inputDescriptor.tiffSubifd = inputOptions.subifd;
          } else {
            throw is.invalidParameterError("subifd", "integer between -1 and 100000", inputOptions.subifd);
          }
        }
        if (is.object(inputOptions.svg)) {
          if (is.defined(inputOptions.svg.stylesheet)) {
            if (is.string(inputOptions.svg.stylesheet)) {
              inputDescriptor.svgStylesheet = inputOptions.svg.stylesheet;
            } else {
              throw is.invalidParameterError("svg.stylesheet", "string", inputOptions.svg.stylesheet);
            }
          }
          if (is.defined(inputOptions.svg.highBitdepth)) {
            if (is.bool(inputOptions.svg.highBitdepth)) {
              inputDescriptor.svgHighBitdepth = inputOptions.svg.highBitdepth;
            } else {
              throw is.invalidParameterError("svg.highBitdepth", "boolean", inputOptions.svg.highBitdepth);
            }
          }
        }
        if (is.object(inputOptions.pdf) && is.defined(inputOptions.pdf.background)) {
          inputDescriptor.pdfBackground = this._getBackgroundColourOption(inputOptions.pdf.background);
        } else if (is.defined(inputOptions.pdfBackground)) {
          inputDescriptor.pdfBackground = this._getBackgroundColourOption(inputOptions.pdfBackground);
        }
        if (is.object(inputOptions.jp2) && is.defined(inputOptions.jp2.oneshot)) {
          if (is.bool(inputOptions.jp2.oneshot)) {
            inputDescriptor.jp2Oneshot = inputOptions.jp2.oneshot;
          } else {
            throw is.invalidParameterError("jp2.oneshot", "boolean", inputOptions.jp2.oneshot);
          }
        }
        if (is.defined(inputOptions.create)) {
          if (is.object(inputOptions.create) && is.integer(inputOptions.create.width) && inputOptions.create.width > 0 && is.integer(inputOptions.create.height) && inputOptions.create.height > 0 && is.integer(inputOptions.create.channels)) {
            inputDescriptor.createWidth = inputOptions.create.width;
            inputDescriptor.createHeight = inputOptions.create.height;
            inputDescriptor.createChannels = inputOptions.create.channels;
            inputDescriptor.createPageHeight = 0;
            if (is.defined(inputOptions.create.pageHeight)) {
              if (is.integer(inputOptions.create.pageHeight) && inputOptions.create.pageHeight > 0 && inputOptions.create.pageHeight <= inputOptions.create.height) {
                if (inputOptions.create.height % inputOptions.create.pageHeight !== 0) {
                  throw new Error(`Expected create.height ${inputOptions.create.height} to be a multiple of create.pageHeight ${inputOptions.create.pageHeight}`);
                }
                inputDescriptor.createPageHeight = inputOptions.create.pageHeight;
              } else {
                throw is.invalidParameterError("create.pageHeight", "positive integer", inputOptions.create.pageHeight);
              }
            }
            if (is.defined(inputOptions.create.noise)) {
              if (!is.object(inputOptions.create.noise)) {
                throw new Error("Expected noise to be an object");
              }
              if (inputOptions.create.noise.type !== "gaussian") {
                throw new Error("Only gaussian noise is supported at the moment");
              }
              inputDescriptor.createNoiseType = inputOptions.create.noise.type;
              if (!is.inRange(inputOptions.create.channels, 1, 4)) {
                throw is.invalidParameterError("create.channels", "number between 1 and 4", inputOptions.create.channels);
              }
              inputDescriptor.createNoiseMean = 128;
              if (is.defined(inputOptions.create.noise.mean)) {
                if (is.number(inputOptions.create.noise.mean) && is.inRange(inputOptions.create.noise.mean, 0, 1e4)) {
                  inputDescriptor.createNoiseMean = inputOptions.create.noise.mean;
                } else {
                  throw is.invalidParameterError("create.noise.mean", "number between 0 and 10000", inputOptions.create.noise.mean);
                }
              }
              inputDescriptor.createNoiseSigma = 30;
              if (is.defined(inputOptions.create.noise.sigma)) {
                if (is.number(inputOptions.create.noise.sigma) && is.inRange(inputOptions.create.noise.sigma, 0, 1e4)) {
                  inputDescriptor.createNoiseSigma = inputOptions.create.noise.sigma;
                } else {
                  throw is.invalidParameterError("create.noise.sigma", "number between 0 and 10000", inputOptions.create.noise.sigma);
                }
              }
            } else if (is.defined(inputOptions.create.background)) {
              if (!is.inRange(inputOptions.create.channels, 3, 4)) {
                throw is.invalidParameterError("create.channels", "number between 3 and 4", inputOptions.create.channels);
              }
              inputDescriptor.createBackground = this._getBackgroundColourOption(inputOptions.create.background);
            } else {
              throw new Error("Expected valid noise or background to create a new input image");
            }
            delete inputDescriptor.buffer;
          } else {
            throw new Error("Expected valid width, height and channels to create a new input image");
          }
        }
        if (is.defined(inputOptions.text)) {
          if (is.object(inputOptions.text) && is.string(inputOptions.text.text)) {
            inputDescriptor.textValue = inputOptions.text.text;
            if (is.defined(inputOptions.text.height) && is.defined(inputOptions.text.dpi)) {
              throw new Error("Expected only one of dpi or height");
            }
            if (is.defined(inputOptions.text.font)) {
              if (is.string(inputOptions.text.font)) {
                inputDescriptor.textFont = inputOptions.text.font;
              } else {
                throw is.invalidParameterError("text.font", "string", inputOptions.text.font);
              }
            }
            if (is.defined(inputOptions.text.fontfile)) {
              if (is.string(inputOptions.text.fontfile)) {
                inputDescriptor.textFontfile = inputOptions.text.fontfile;
              } else {
                throw is.invalidParameterError("text.fontfile", "string", inputOptions.text.fontfile);
              }
            }
            if (is.defined(inputOptions.text.width)) {
              if (is.integer(inputOptions.text.width) && inputOptions.text.width > 0) {
                inputDescriptor.textWidth = inputOptions.text.width;
              } else {
                throw is.invalidParameterError("text.width", "positive integer", inputOptions.text.width);
              }
            }
            if (is.defined(inputOptions.text.height)) {
              if (is.integer(inputOptions.text.height) && inputOptions.text.height > 0) {
                inputDescriptor.textHeight = inputOptions.text.height;
              } else {
                throw is.invalidParameterError("text.height", "positive integer", inputOptions.text.height);
              }
            }
            if (is.defined(inputOptions.text.align)) {
              if (is.string(inputOptions.text.align) && is.string(this.constructor.align[inputOptions.text.align])) {
                inputDescriptor.textAlign = this.constructor.align[inputOptions.text.align];
              } else {
                throw is.invalidParameterError("text.align", "valid alignment", inputOptions.text.align);
              }
            }
            if (is.defined(inputOptions.text.justify)) {
              if (is.bool(inputOptions.text.justify)) {
                inputDescriptor.textJustify = inputOptions.text.justify;
              } else {
                throw is.invalidParameterError("text.justify", "boolean", inputOptions.text.justify);
              }
            }
            if (is.defined(inputOptions.text.dpi)) {
              if (is.integer(inputOptions.text.dpi) && is.inRange(inputOptions.text.dpi, 1, 1e6)) {
                inputDescriptor.textDpi = inputOptions.text.dpi;
              } else {
                throw is.invalidParameterError("text.dpi", "integer between 1 and 1000000", inputOptions.text.dpi);
              }
            }
            if (is.defined(inputOptions.text.rgba)) {
              if (is.bool(inputOptions.text.rgba)) {
                inputDescriptor.textRgba = inputOptions.text.rgba;
              } else {
                throw is.invalidParameterError("text.rgba", "bool", inputOptions.text.rgba);
              }
            }
            if (is.defined(inputOptions.text.spacing)) {
              if (is.integer(inputOptions.text.spacing) && is.inRange(inputOptions.text.spacing, -1e6, 1e6)) {
                inputDescriptor.textSpacing = inputOptions.text.spacing;
              } else {
                throw is.invalidParameterError("text.spacing", "integer between -1000000 and 1000000", inputOptions.text.spacing);
              }
            }
            if (is.defined(inputOptions.text.wrap)) {
              if (is.string(inputOptions.text.wrap) && is.inArray(inputOptions.text.wrap, ["word", "char", "word-char", "none"])) {
                inputDescriptor.textWrap = inputOptions.text.wrap;
              } else {
                throw is.invalidParameterError("text.wrap", "one of: word, char, word-char, none", inputOptions.text.wrap);
              }
            }
            delete inputDescriptor.buffer;
          } else {
            throw new Error("Expected a valid string to create an image with text.");
          }
        }
        if (is.defined(inputOptions.join)) {
          if (is.defined(this.options.join)) {
            if (is.defined(inputOptions.join.animated)) {
              if (is.bool(inputOptions.join.animated)) {
                inputDescriptor.joinAnimated = inputOptions.join.animated;
              } else {
                throw is.invalidParameterError("join.animated", "boolean", inputOptions.join.animated);
              }
            }
            if (is.defined(inputOptions.join.across)) {
              if (is.integer(inputOptions.join.across) && is.inRange(inputOptions.join.across, 1, 1e6)) {
                inputDescriptor.joinAcross = inputOptions.join.across;
              } else {
                throw is.invalidParameterError("join.across", "integer between 1 and 100000", inputOptions.join.across);
              }
            }
            if (is.defined(inputOptions.join.shim)) {
              if (is.integer(inputOptions.join.shim) && is.inRange(inputOptions.join.shim, 0, 1e6)) {
                inputDescriptor.joinShim = inputOptions.join.shim;
              } else {
                throw is.invalidParameterError("join.shim", "integer between 0 and 100000", inputOptions.join.shim);
              }
            }
            if (is.defined(inputOptions.join.background)) {
              inputDescriptor.joinBackground = this._getBackgroundColourOption(inputOptions.join.background);
            }
            if (is.defined(inputOptions.join.halign)) {
              if (is.string(inputOptions.join.halign) && is.string(this.constructor.align[inputOptions.join.halign])) {
                inputDescriptor.joinHalign = this.constructor.align[inputOptions.join.halign];
              } else {
                throw is.invalidParameterError("join.halign", "valid alignment", inputOptions.join.halign);
              }
            }
            if (is.defined(inputOptions.join.valign)) {
              if (is.string(inputOptions.join.valign) && is.string(this.constructor.align[inputOptions.join.valign])) {
                inputDescriptor.joinValign = this.constructor.align[inputOptions.join.valign];
              } else {
                throw is.invalidParameterError("join.valign", "valid alignment", inputOptions.join.valign);
              }
            }
          } else {
            throw new Error("Expected input to be an array of images to join");
          }
        }
      } else if (is.defined(inputOptions)) {
        throw new Error(`Invalid input options ${inputOptions}`);
      }
      return inputDescriptor;
    }
    function _write(chunk, _encoding, callback) {
      if (Array.isArray(this.options.input.buffer)) {
        if (is.buffer(chunk)) {
          if (this.options.input.buffer.length === 0) {
            this.on("finish", () => {
              this.streamInFinished = true;
            });
          }
          this.options.input.buffer.push(chunk);
          callback();
        } else {
          callback(new Error("Non-Buffer data on Writable Stream"));
        }
      } else {
        callback(new Error("Unexpected data on Writable Stream"));
      }
    }
    function _flattenBufferIn() {
      if (this._isStreamInput()) {
        this.options.input.buffer = Buffer.concat(this.options.input.buffer);
      }
    }
    function _isStreamInput() {
      return Array.isArray(this.options.input.buffer);
    }
    function metadata(callback) {
      const stack = Error();
      if (is.fn(callback)) {
        if (this._isStreamInput()) {
          this.on("finish", () => {
            this._flattenBufferIn();
            sharp5.metadata(this.options, (err2, metadata2) => {
              if (err2) {
                callback(is.nativeError(err2, stack));
              } else {
                callback(null, metadata2);
              }
            });
          });
        } else {
          sharp5.metadata(this.options, (err2, metadata2) => {
            if (err2) {
              callback(is.nativeError(err2, stack));
            } else {
              callback(null, metadata2);
            }
          });
        }
        return this;
      } else {
        if (this._isStreamInput()) {
          return new Promise((resolve3, reject) => {
            const finished = () => {
              this._flattenBufferIn();
              sharp5.metadata(this.options, (err2, metadata2) => {
                if (err2) {
                  reject(is.nativeError(err2, stack));
                } else {
                  resolve3(metadata2);
                }
              });
            };
            if (this.writableFinished) {
              finished();
            } else {
              this.once("finish", finished);
            }
          });
        } else {
          return new Promise((resolve3, reject) => {
            sharp5.metadata(this.options, (err2, metadata2) => {
              if (err2) {
                reject(is.nativeError(err2, stack));
              } else {
                resolve3(metadata2);
              }
            });
          });
        }
      }
    }
    function stats(callback) {
      const stack = Error();
      if (is.fn(callback)) {
        if (this._isStreamInput()) {
          this.on("finish", () => {
            this._flattenBufferIn();
            sharp5.stats(this.options, (err2, stats2) => {
              if (err2) {
                callback(is.nativeError(err2, stack));
              } else {
                callback(null, stats2);
              }
            });
          });
        } else {
          sharp5.stats(this.options, (err2, stats2) => {
            if (err2) {
              callback(is.nativeError(err2, stack));
            } else {
              callback(null, stats2);
            }
          });
        }
        return this;
      } else {
        if (this._isStreamInput()) {
          return new Promise((resolve3, reject) => {
            this.on("finish", function() {
              this._flattenBufferIn();
              sharp5.stats(this.options, (err2, stats2) => {
                if (err2) {
                  reject(is.nativeError(err2, stack));
                } else {
                  resolve3(stats2);
                }
              });
            });
          });
        } else {
          return new Promise((resolve3, reject) => {
            sharp5.stats(this.options, (err2, stats2) => {
              if (err2) {
                reject(is.nativeError(err2, stack));
              } else {
                resolve3(stats2);
              }
            });
          });
        }
      }
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        // Private
        _inputOptionsFromObject,
        _createInputDescriptor,
        _write,
        _flattenBufferIn,
        _isStreamInput,
        // Public
        metadata,
        stats
      });
      Sharp.align = align;
    };
  }
});

// node_modules/sharp/lib/resize.js
var require_resize = __commonJS({
  "node_modules/sharp/lib/resize.js"(exports, module2) {
    var is = require_is();
    var gravity = {
      center: 0,
      centre: 0,
      north: 1,
      east: 2,
      south: 3,
      west: 4,
      northeast: 5,
      southeast: 6,
      southwest: 7,
      northwest: 8
    };
    var position = {
      top: 1,
      right: 2,
      bottom: 3,
      left: 4,
      "right top": 5,
      "right bottom": 6,
      "left bottom": 7,
      "left top": 8
    };
    var extendWith = {
      background: "background",
      copy: "copy",
      repeat: "repeat",
      mirror: "mirror"
    };
    var strategy = {
      entropy: 16,
      attention: 17
    };
    var kernel = {
      nearest: "nearest",
      linear: "linear",
      cubic: "cubic",
      mitchell: "mitchell",
      lanczos2: "lanczos2",
      lanczos3: "lanczos3",
      mks2013: "mks2013",
      mks2021: "mks2021"
    };
    var fit = {
      contain: "contain",
      cover: "cover",
      fill: "fill",
      inside: "inside",
      outside: "outside"
    };
    var mapFitToCanvas = {
      contain: "embed",
      cover: "crop",
      fill: "ignore_aspect",
      inside: "max",
      outside: "min"
    };
    function isRotationExpected(options) {
      return options.angle % 360 !== 0 || options.rotationAngle !== 0;
    }
    function isResizeExpected(options) {
      return options.width !== -1 || options.height !== -1;
    }
    function resize(widthOrOptions, height, options) {
      if (isResizeExpected(this.options)) {
        this.options.debuglog("ignoring previous resize options");
      }
      if (this.options.widthPost !== -1) {
        this.options.debuglog("operation order will be: extract, resize, extract");
      }
      if (is.defined(widthOrOptions)) {
        if (is.object(widthOrOptions) && !is.defined(options)) {
          options = widthOrOptions;
        } else if (is.integer(widthOrOptions) && widthOrOptions > 0) {
          this.options.width = widthOrOptions;
        } else {
          throw is.invalidParameterError("width", "positive integer", widthOrOptions);
        }
      } else {
        this.options.width = -1;
      }
      if (is.defined(height)) {
        if (is.integer(height) && height > 0) {
          this.options.height = height;
        } else {
          throw is.invalidParameterError("height", "positive integer", height);
        }
      } else {
        this.options.height = -1;
      }
      if (is.object(options)) {
        if (is.defined(options.width)) {
          if (is.integer(options.width) && options.width > 0) {
            this.options.width = options.width;
          } else {
            throw is.invalidParameterError("width", "positive integer", options.width);
          }
        }
        if (is.defined(options.height)) {
          if (is.integer(options.height) && options.height > 0) {
            this.options.height = options.height;
          } else {
            throw is.invalidParameterError("height", "positive integer", options.height);
          }
        }
        if (is.defined(options.fit)) {
          const canvas = mapFitToCanvas[options.fit];
          if (is.string(canvas)) {
            this.options.canvas = canvas;
          } else {
            throw is.invalidParameterError("fit", "valid fit", options.fit);
          }
        }
        if (is.defined(options.position)) {
          const pos = is.integer(options.position) ? options.position : strategy[options.position] || position[options.position] || gravity[options.position];
          if (is.integer(pos) && (is.inRange(pos, 0, 8) || is.inRange(pos, 16, 17))) {
            this.options.position = pos;
          } else {
            throw is.invalidParameterError("position", "valid position/gravity/strategy", options.position);
          }
        }
        this._setBackgroundColourOption("resizeBackground", options.background);
        if (is.defined(options.kernel)) {
          if (is.string(kernel[options.kernel])) {
            this.options.kernel = kernel[options.kernel];
          } else {
            throw is.invalidParameterError("kernel", "valid kernel name", options.kernel);
          }
        }
        if (is.defined(options.withoutEnlargement)) {
          this._setBooleanOption("withoutEnlargement", options.withoutEnlargement);
        }
        if (is.defined(options.withoutReduction)) {
          this._setBooleanOption("withoutReduction", options.withoutReduction);
        }
        if (is.defined(options.fastShrinkOnLoad)) {
          this._setBooleanOption("fastShrinkOnLoad", options.fastShrinkOnLoad);
        }
      }
      if (isRotationExpected(this.options) && isResizeExpected(this.options)) {
        this.options.rotateBefore = true;
      }
      return this;
    }
    function extend(extend2) {
      if (is.integer(extend2) && extend2 > 0) {
        this.options.extendTop = extend2;
        this.options.extendBottom = extend2;
        this.options.extendLeft = extend2;
        this.options.extendRight = extend2;
      } else if (is.object(extend2)) {
        if (is.defined(extend2.top)) {
          if (is.integer(extend2.top) && extend2.top >= 0) {
            this.options.extendTop = extend2.top;
          } else {
            throw is.invalidParameterError("top", "positive integer", extend2.top);
          }
        }
        if (is.defined(extend2.bottom)) {
          if (is.integer(extend2.bottom) && extend2.bottom >= 0) {
            this.options.extendBottom = extend2.bottom;
          } else {
            throw is.invalidParameterError("bottom", "positive integer", extend2.bottom);
          }
        }
        if (is.defined(extend2.left)) {
          if (is.integer(extend2.left) && extend2.left >= 0) {
            this.options.extendLeft = extend2.left;
          } else {
            throw is.invalidParameterError("left", "positive integer", extend2.left);
          }
        }
        if (is.defined(extend2.right)) {
          if (is.integer(extend2.right) && extend2.right >= 0) {
            this.options.extendRight = extend2.right;
          } else {
            throw is.invalidParameterError("right", "positive integer", extend2.right);
          }
        }
        this._setBackgroundColourOption("extendBackground", extend2.background);
        if (is.defined(extend2.extendWith)) {
          if (is.string(extendWith[extend2.extendWith])) {
            this.options.extendWith = extendWith[extend2.extendWith];
          } else {
            throw is.invalidParameterError("extendWith", "one of: background, copy, repeat, mirror", extend2.extendWith);
          }
        }
      } else {
        throw is.invalidParameterError("extend", "integer or object", extend2);
      }
      return this;
    }
    function extract4(options) {
      const suffix = isResizeExpected(this.options) || this.options.widthPre !== -1 ? "Post" : "Pre";
      if (this.options[`width${suffix}`] !== -1) {
        this.options.debuglog("ignoring previous extract options");
      }
      ["left", "top", "width", "height"].forEach(function(name) {
        const value = options[name];
        if (is.integer(value) && value >= 0) {
          this.options[name + (name === "left" || name === "top" ? "Offset" : "") + suffix] = value;
        } else {
          throw is.invalidParameterError(name, "integer", value);
        }
      }, this);
      if (isRotationExpected(this.options) && !isResizeExpected(this.options)) {
        if (this.options.widthPre === -1 || this.options.widthPost === -1) {
          this.options.rotateBefore = true;
        }
      }
      if (this.options.input.autoOrient) {
        this.options.orientBefore = true;
      }
      return this;
    }
    function trim(options) {
      this.options.trimThreshold = 10;
      if (is.defined(options)) {
        if (is.object(options)) {
          if (is.defined(options.background)) {
            this._setBackgroundColourOption("trimBackground", options.background);
          }
          if (is.defined(options.threshold)) {
            if (is.number(options.threshold) && options.threshold >= 0) {
              this.options.trimThreshold = options.threshold;
            } else {
              throw is.invalidParameterError("threshold", "positive number", options.threshold);
            }
          }
          if (is.defined(options.lineArt)) {
            this._setBooleanOption("trimLineArt", options.lineArt);
          }
        } else {
          throw is.invalidParameterError("trim", "object", options);
        }
      }
      if (isRotationExpected(this.options)) {
        this.options.rotateBefore = true;
      }
      return this;
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        resize,
        extend,
        extract: extract4,
        trim
      });
      Sharp.gravity = gravity;
      Sharp.strategy = strategy;
      Sharp.kernel = kernel;
      Sharp.fit = fit;
      Sharp.position = position;
    };
  }
});

// node_modules/sharp/lib/composite.js
var require_composite = __commonJS({
  "node_modules/sharp/lib/composite.js"(exports, module2) {
    var is = require_is();
    var blend = {
      clear: "clear",
      source: "source",
      over: "over",
      in: "in",
      out: "out",
      atop: "atop",
      dest: "dest",
      "dest-over": "dest-over",
      "dest-in": "dest-in",
      "dest-out": "dest-out",
      "dest-atop": "dest-atop",
      xor: "xor",
      add: "add",
      saturate: "saturate",
      multiply: "multiply",
      screen: "screen",
      overlay: "overlay",
      darken: "darken",
      lighten: "lighten",
      "colour-dodge": "colour-dodge",
      "color-dodge": "colour-dodge",
      "colour-burn": "colour-burn",
      "color-burn": "colour-burn",
      "hard-light": "hard-light",
      "soft-light": "soft-light",
      difference: "difference",
      exclusion: "exclusion"
    };
    function composite(images) {
      if (!Array.isArray(images)) {
        throw is.invalidParameterError("images to composite", "array", images);
      }
      this.options.composite = images.map((image) => {
        if (!is.object(image)) {
          throw is.invalidParameterError("image to composite", "object", image);
        }
        const inputOptions = this._inputOptionsFromObject(image);
        const composite2 = {
          input: this._createInputDescriptor(image.input, inputOptions, { allowStream: false }),
          blend: "over",
          tile: false,
          left: 0,
          top: 0,
          hasOffset: false,
          gravity: 0,
          premultiplied: false
        };
        if (is.defined(image.blend)) {
          if (is.string(blend[image.blend])) {
            composite2.blend = blend[image.blend];
          } else {
            throw is.invalidParameterError("blend", "valid blend name", image.blend);
          }
        }
        if (is.defined(image.tile)) {
          if (is.bool(image.tile)) {
            composite2.tile = image.tile;
          } else {
            throw is.invalidParameterError("tile", "boolean", image.tile);
          }
        }
        if (is.defined(image.left)) {
          if (is.integer(image.left)) {
            composite2.left = image.left;
          } else {
            throw is.invalidParameterError("left", "integer", image.left);
          }
        }
        if (is.defined(image.top)) {
          if (is.integer(image.top)) {
            composite2.top = image.top;
          } else {
            throw is.invalidParameterError("top", "integer", image.top);
          }
        }
        if (is.defined(image.top) !== is.defined(image.left)) {
          throw new Error("Expected both left and top to be set");
        } else {
          composite2.hasOffset = is.integer(image.top) && is.integer(image.left);
        }
        if (is.defined(image.gravity)) {
          if (is.integer(image.gravity) && is.inRange(image.gravity, 0, 8)) {
            composite2.gravity = image.gravity;
          } else if (is.string(image.gravity) && is.integer(this.constructor.gravity[image.gravity])) {
            composite2.gravity = this.constructor.gravity[image.gravity];
          } else {
            throw is.invalidParameterError("gravity", "valid gravity", image.gravity);
          }
        }
        if (is.defined(image.premultiplied)) {
          if (is.bool(image.premultiplied)) {
            composite2.premultiplied = image.premultiplied;
          } else {
            throw is.invalidParameterError("premultiplied", "boolean", image.premultiplied);
          }
        }
        return composite2;
      });
      return this;
    }
    module2.exports = (Sharp) => {
      Sharp.prototype.composite = composite;
      Sharp.blend = blend;
    };
  }
});

// node_modules/sharp/lib/operation.js
var require_operation = __commonJS({
  "node_modules/sharp/lib/operation.js"(exports, module2) {
    var is = require_is();
    var vipsPrecision = {
      integer: "integer",
      float: "float",
      approximate: "approximate"
    };
    function rotate(angle, options) {
      if (!is.defined(angle)) {
        return this.autoOrient();
      }
      if (this.options.angle || this.options.rotationAngle) {
        this.options.debuglog("ignoring previous rotate options");
        this.options.angle = 0;
        this.options.rotationAngle = 0;
      }
      if (is.integer(angle) && !(angle % 90)) {
        this.options.angle = angle;
      } else if (is.number(angle)) {
        this.options.rotationAngle = angle;
        if (is.object(options) && options.background) {
          this._setBackgroundColourOption("rotationBackground", options.background);
        }
      } else {
        throw is.invalidParameterError("angle", "numeric", angle);
      }
      return this;
    }
    function autoOrient() {
      this.options.input.autoOrient = true;
      return this;
    }
    function flip(flip2) {
      this.options.flip = is.bool(flip2) ? flip2 : true;
      return this;
    }
    function flop(flop2) {
      this.options.flop = is.bool(flop2) ? flop2 : true;
      return this;
    }
    function affine(matrix, options) {
      const flatMatrix = [].concat(...matrix);
      if (flatMatrix.length === 4 && flatMatrix.every(is.number)) {
        this.options.affineMatrix = flatMatrix;
      } else {
        throw is.invalidParameterError("matrix", "1x4 or 2x2 array", matrix);
      }
      if (is.defined(options)) {
        if (is.object(options)) {
          this._setBackgroundColourOption("affineBackground", options.background);
          if (is.defined(options.idx)) {
            if (is.number(options.idx)) {
              this.options.affineIdx = options.idx;
            } else {
              throw is.invalidParameterError("options.idx", "number", options.idx);
            }
          }
          if (is.defined(options.idy)) {
            if (is.number(options.idy)) {
              this.options.affineIdy = options.idy;
            } else {
              throw is.invalidParameterError("options.idy", "number", options.idy);
            }
          }
          if (is.defined(options.odx)) {
            if (is.number(options.odx)) {
              this.options.affineOdx = options.odx;
            } else {
              throw is.invalidParameterError("options.odx", "number", options.odx);
            }
          }
          if (is.defined(options.ody)) {
            if (is.number(options.ody)) {
              this.options.affineOdy = options.ody;
            } else {
              throw is.invalidParameterError("options.ody", "number", options.ody);
            }
          }
          if (is.defined(options.interpolator)) {
            if (is.inArray(options.interpolator, Object.values(this.constructor.interpolators))) {
              this.options.affineInterpolator = options.interpolator;
            } else {
              throw is.invalidParameterError("options.interpolator", "valid interpolator name", options.interpolator);
            }
          }
        } else {
          throw is.invalidParameterError("options", "object", options);
        }
      }
      return this;
    }
    function sharpen(options, flat, jagged) {
      if (!is.defined(options)) {
        this.options.sharpenSigma = -1;
      } else if (is.bool(options)) {
        this.options.sharpenSigma = options ? -1 : 0;
      } else if (is.number(options) && is.inRange(options, 0.01, 1e4)) {
        this.options.sharpenSigma = options;
        if (is.defined(flat)) {
          if (is.number(flat) && is.inRange(flat, 0, 1e4)) {
            this.options.sharpenM1 = flat;
          } else {
            throw is.invalidParameterError("flat", "number between 0 and 10000", flat);
          }
        }
        if (is.defined(jagged)) {
          if (is.number(jagged) && is.inRange(jagged, 0, 1e4)) {
            this.options.sharpenM2 = jagged;
          } else {
            throw is.invalidParameterError("jagged", "number between 0 and 10000", jagged);
          }
        }
      } else if (is.plainObject(options)) {
        if (is.number(options.sigma) && is.inRange(options.sigma, 1e-6, 10)) {
          this.options.sharpenSigma = options.sigma;
        } else {
          throw is.invalidParameterError("options.sigma", "number between 0.000001 and 10", options.sigma);
        }
        if (is.defined(options.m1)) {
          if (is.number(options.m1) && is.inRange(options.m1, 0, 1e6)) {
            this.options.sharpenM1 = options.m1;
          } else {
            throw is.invalidParameterError("options.m1", "number between 0 and 1000000", options.m1);
          }
        }
        if (is.defined(options.m2)) {
          if (is.number(options.m2) && is.inRange(options.m2, 0, 1e6)) {
            this.options.sharpenM2 = options.m2;
          } else {
            throw is.invalidParameterError("options.m2", "number between 0 and 1000000", options.m2);
          }
        }
        if (is.defined(options.x1)) {
          if (is.number(options.x1) && is.inRange(options.x1, 0, 1e6)) {
            this.options.sharpenX1 = options.x1;
          } else {
            throw is.invalidParameterError("options.x1", "number between 0 and 1000000", options.x1);
          }
        }
        if (is.defined(options.y2)) {
          if (is.number(options.y2) && is.inRange(options.y2, 0, 1e6)) {
            this.options.sharpenY2 = options.y2;
          } else {
            throw is.invalidParameterError("options.y2", "number between 0 and 1000000", options.y2);
          }
        }
        if (is.defined(options.y3)) {
          if (is.number(options.y3) && is.inRange(options.y3, 0, 1e6)) {
            this.options.sharpenY3 = options.y3;
          } else {
            throw is.invalidParameterError("options.y3", "number between 0 and 1000000", options.y3);
          }
        }
      } else {
        throw is.invalidParameterError("sigma", "number between 0.01 and 10000", options);
      }
      return this;
    }
    function median(size) {
      if (!is.defined(size)) {
        this.options.medianSize = 3;
      } else if (is.integer(size) && is.inRange(size, 1, 1e3)) {
        this.options.medianSize = size;
      } else {
        throw is.invalidParameterError("size", "integer between 1 and 1000", size);
      }
      return this;
    }
    function blur(options) {
      let sigma;
      if (is.number(options)) {
        sigma = options;
      } else if (is.plainObject(options)) {
        if (!is.number(options.sigma)) {
          throw is.invalidParameterError("options.sigma", "number between 0.3 and 1000", sigma);
        }
        sigma = options.sigma;
        if ("precision" in options) {
          if (is.string(vipsPrecision[options.precision])) {
            this.options.precision = vipsPrecision[options.precision];
          } else {
            throw is.invalidParameterError("precision", "one of: integer, float, approximate", options.precision);
          }
        }
        if ("minAmplitude" in options) {
          if (is.number(options.minAmplitude) && is.inRange(options.minAmplitude, 1e-3, 1)) {
            this.options.minAmpl = options.minAmplitude;
          } else {
            throw is.invalidParameterError("minAmplitude", "number between 0.001 and 1", options.minAmplitude);
          }
        }
      }
      if (!is.defined(options)) {
        this.options.blurSigma = -1;
      } else if (is.bool(options)) {
        this.options.blurSigma = options ? -1 : 0;
      } else if (is.number(sigma) && is.inRange(sigma, 0.3, 1e3)) {
        this.options.blurSigma = sigma;
      } else {
        throw is.invalidParameterError("sigma", "number between 0.3 and 1000", sigma);
      }
      return this;
    }
    function dilate(width) {
      if (!is.defined(width)) {
        this.options.dilateWidth = 1;
      } else if (is.integer(width) && width > 0) {
        this.options.dilateWidth = width;
      } else {
        throw is.invalidParameterError("dilate", "positive integer", dilate);
      }
      return this;
    }
    function erode(width) {
      if (!is.defined(width)) {
        this.options.erodeWidth = 1;
      } else if (is.integer(width) && width > 0) {
        this.options.erodeWidth = width;
      } else {
        throw is.invalidParameterError("erode", "positive integer", erode);
      }
      return this;
    }
    function flatten(options) {
      this.options.flatten = is.bool(options) ? options : true;
      if (is.object(options)) {
        this._setBackgroundColourOption("flattenBackground", options.background);
      }
      return this;
    }
    function unflatten() {
      this.options.unflatten = true;
      return this;
    }
    function gamma(gamma2, gammaOut) {
      if (!is.defined(gamma2)) {
        this.options.gamma = 2.2;
      } else if (is.number(gamma2) && is.inRange(gamma2, 1, 3)) {
        this.options.gamma = gamma2;
      } else {
        throw is.invalidParameterError("gamma", "number between 1.0 and 3.0", gamma2);
      }
      if (!is.defined(gammaOut)) {
        this.options.gammaOut = this.options.gamma;
      } else if (is.number(gammaOut) && is.inRange(gammaOut, 1, 3)) {
        this.options.gammaOut = gammaOut;
      } else {
        throw is.invalidParameterError("gammaOut", "number between 1.0 and 3.0", gammaOut);
      }
      return this;
    }
    function negate(options) {
      this.options.negate = is.bool(options) ? options : true;
      if (is.plainObject(options) && "alpha" in options) {
        if (!is.bool(options.alpha)) {
          throw is.invalidParameterError("alpha", "should be boolean value", options.alpha);
        } else {
          this.options.negateAlpha = options.alpha;
        }
      }
      return this;
    }
    function normalise(options) {
      if (is.plainObject(options)) {
        if (is.defined(options.lower)) {
          if (is.number(options.lower) && is.inRange(options.lower, 0, 99)) {
            this.options.normaliseLower = options.lower;
          } else {
            throw is.invalidParameterError("lower", "number between 0 and 99", options.lower);
          }
        }
        if (is.defined(options.upper)) {
          if (is.number(options.upper) && is.inRange(options.upper, 1, 100)) {
            this.options.normaliseUpper = options.upper;
          } else {
            throw is.invalidParameterError("upper", "number between 1 and 100", options.upper);
          }
        }
      }
      if (this.options.normaliseLower >= this.options.normaliseUpper) {
        throw is.invalidParameterError(
          "range",
          "lower to be less than upper",
          `${this.options.normaliseLower} >= ${this.options.normaliseUpper}`
        );
      }
      this.options.normalise = true;
      return this;
    }
    function normalize(options) {
      return this.normalise(options);
    }
    function clahe(options) {
      if (is.plainObject(options)) {
        if (is.integer(options.width) && options.width > 0) {
          this.options.claheWidth = options.width;
        } else {
          throw is.invalidParameterError("width", "integer greater than zero", options.width);
        }
        if (is.integer(options.height) && options.height > 0) {
          this.options.claheHeight = options.height;
        } else {
          throw is.invalidParameterError("height", "integer greater than zero", options.height);
        }
        if (is.defined(options.maxSlope)) {
          if (is.integer(options.maxSlope) && is.inRange(options.maxSlope, 0, 100)) {
            this.options.claheMaxSlope = options.maxSlope;
          } else {
            throw is.invalidParameterError("maxSlope", "integer between 0 and 100", options.maxSlope);
          }
        }
      } else {
        throw is.invalidParameterError("options", "plain object", options);
      }
      return this;
    }
    function convolve(kernel) {
      if (!is.object(kernel) || !Array.isArray(kernel.kernel) || !is.integer(kernel.width) || !is.integer(kernel.height) || !is.inRange(kernel.width, 3, 1001) || !is.inRange(kernel.height, 3, 1001) || kernel.height * kernel.width !== kernel.kernel.length) {
        throw new Error("Invalid convolution kernel");
      }
      if (!is.integer(kernel.scale)) {
        kernel.scale = kernel.kernel.reduce((a, b) => a + b, 0);
      }
      if (kernel.scale < 1) {
        kernel.scale = 1;
      }
      if (!is.integer(kernel.offset)) {
        kernel.offset = 0;
      }
      this.options.convKernel = kernel;
      return this;
    }
    function threshold(threshold2, options) {
      if (!is.defined(threshold2)) {
        this.options.threshold = 128;
      } else if (is.bool(threshold2)) {
        this.options.threshold = threshold2 ? 128 : 0;
      } else if (is.integer(threshold2) && is.inRange(threshold2, 0, 255)) {
        this.options.threshold = threshold2;
      } else {
        throw is.invalidParameterError("threshold", "integer between 0 and 255", threshold2);
      }
      if (!is.object(options) || options.greyscale === true || options.grayscale === true) {
        this.options.thresholdGrayscale = true;
      } else {
        this.options.thresholdGrayscale = false;
      }
      return this;
    }
    function boolean(operand, operator, options) {
      this.options.boolean = this._createInputDescriptor(operand, options);
      if (is.string(operator) && is.inArray(operator, ["and", "or", "eor"])) {
        this.options.booleanOp = operator;
      } else {
        throw is.invalidParameterError("operator", "one of: and, or, eor", operator);
      }
      return this;
    }
    function linear(a, b) {
      if (!is.defined(a) && is.number(b)) {
        a = 1;
      } else if (is.number(a) && !is.defined(b)) {
        b = 0;
      }
      if (!is.defined(a)) {
        this.options.linearA = [];
      } else if (is.number(a)) {
        this.options.linearA = [a];
      } else if (Array.isArray(a) && a.length && a.every(is.number)) {
        this.options.linearA = a;
      } else {
        throw is.invalidParameterError("a", "number or array of numbers", a);
      }
      if (!is.defined(b)) {
        this.options.linearB = [];
      } else if (is.number(b)) {
        this.options.linearB = [b];
      } else if (Array.isArray(b) && b.length && b.every(is.number)) {
        this.options.linearB = b;
      } else {
        throw is.invalidParameterError("b", "number or array of numbers", b);
      }
      if (this.options.linearA.length !== this.options.linearB.length) {
        throw new Error("Expected a and b to be arrays of the same length");
      }
      return this;
    }
    function recomb(inputMatrix) {
      if (!Array.isArray(inputMatrix)) {
        throw is.invalidParameterError("inputMatrix", "array", inputMatrix);
      }
      if (inputMatrix.length !== 3 && inputMatrix.length !== 4) {
        throw is.invalidParameterError("inputMatrix", "3x3 or 4x4 array", inputMatrix.length);
      }
      const recombMatrix = inputMatrix.flat().map(Number);
      if (recombMatrix.length !== 9 && recombMatrix.length !== 16) {
        throw is.invalidParameterError("inputMatrix", "cardinality of 9 or 16", recombMatrix.length);
      }
      this.options.recombMatrix = recombMatrix;
      return this;
    }
    function modulate(options) {
      if (!is.plainObject(options)) {
        throw is.invalidParameterError("options", "plain object", options);
      }
      if ("brightness" in options) {
        if (is.number(options.brightness) && options.brightness >= 0) {
          this.options.brightness = options.brightness;
        } else {
          throw is.invalidParameterError("brightness", "number above zero", options.brightness);
        }
      }
      if ("saturation" in options) {
        if (is.number(options.saturation) && options.saturation >= 0) {
          this.options.saturation = options.saturation;
        } else {
          throw is.invalidParameterError("saturation", "number above zero", options.saturation);
        }
      }
      if ("hue" in options) {
        if (is.integer(options.hue)) {
          this.options.hue = options.hue % 360;
        } else {
          throw is.invalidParameterError("hue", "number", options.hue);
        }
      }
      if ("lightness" in options) {
        if (is.number(options.lightness)) {
          this.options.lightness = options.lightness;
        } else {
          throw is.invalidParameterError("lightness", "number", options.lightness);
        }
      }
      return this;
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        autoOrient,
        rotate,
        flip,
        flop,
        affine,
        sharpen,
        erode,
        dilate,
        median,
        blur,
        flatten,
        unflatten,
        gamma,
        negate,
        normalise,
        normalize,
        clahe,
        convolve,
        threshold,
        boolean,
        linear,
        recomb,
        modulate
      });
    };
  }
});

// node_modules/sharp/lib/colour.js
var require_colour = __commonJS({
  "node_modules/sharp/lib/colour.js"(exports, module2) {
    var color = require("@img/colour");
    var is = require_is();
    var colourspace = {
      multiband: "multiband",
      "b-w": "b-w",
      bw: "b-w",
      cmyk: "cmyk",
      srgb: "srgb"
    };
    function tint(tint2) {
      this._setBackgroundColourOption("tint", tint2);
      return this;
    }
    function greyscale(greyscale2) {
      this.options.greyscale = is.bool(greyscale2) ? greyscale2 : true;
      return this;
    }
    function grayscale(grayscale2) {
      return this.greyscale(grayscale2);
    }
    function pipelineColourspace(colourspace2) {
      if (!is.string(colourspace2)) {
        throw is.invalidParameterError("colourspace", "string", colourspace2);
      }
      this.options.colourspacePipeline = colourspace2;
      return this;
    }
    function pipelineColorspace(colorspace) {
      return this.pipelineColourspace(colorspace);
    }
    function toColourspace(colourspace2) {
      if (!is.string(colourspace2)) {
        throw is.invalidParameterError("colourspace", "string", colourspace2);
      }
      this.options.colourspace = colourspace2;
      return this;
    }
    function toColorspace(colorspace) {
      return this.toColourspace(colorspace);
    }
    function _getBackgroundColourOption(value) {
      if (is.object(value) || is.string(value) && value.length >= 3 && value.length <= 200) {
        const colour = color(value);
        return [
          colour.red(),
          colour.green(),
          colour.blue(),
          Math.round(colour.alpha() * 255)
        ];
      } else {
        throw is.invalidParameterError("background", "object or string", value);
      }
    }
    function _setBackgroundColourOption(key, value) {
      if (is.defined(value)) {
        this.options[key] = _getBackgroundColourOption(value);
      }
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        // Public
        tint,
        greyscale,
        grayscale,
        pipelineColourspace,
        pipelineColorspace,
        toColourspace,
        toColorspace,
        // Private
        _getBackgroundColourOption,
        _setBackgroundColourOption
      });
      Sharp.colourspace = colourspace;
      Sharp.colorspace = colourspace;
    };
  }
});

// node_modules/sharp/lib/channel.js
var require_channel = __commonJS({
  "node_modules/sharp/lib/channel.js"(exports, module2) {
    var is = require_is();
    var bool = {
      and: "and",
      or: "or",
      eor: "eor"
    };
    function removeAlpha() {
      this.options.removeAlpha = true;
      return this;
    }
    function ensureAlpha(alpha) {
      if (is.defined(alpha)) {
        if (is.number(alpha) && is.inRange(alpha, 0, 1)) {
          this.options.ensureAlpha = alpha;
        } else {
          throw is.invalidParameterError("alpha", "number between 0 and 1", alpha);
        }
      } else {
        this.options.ensureAlpha = 1;
      }
      return this;
    }
    function extractChannel(channel) {
      const channelMap = { red: 0, green: 1, blue: 2, alpha: 3 };
      if (Object.keys(channelMap).includes(channel)) {
        channel = channelMap[channel];
      }
      if (is.integer(channel) && is.inRange(channel, 0, 4)) {
        this.options.extractChannel = channel;
      } else {
        throw is.invalidParameterError("channel", "integer or one of: red, green, blue, alpha", channel);
      }
      return this;
    }
    function joinChannel(images, options) {
      if (Array.isArray(images)) {
        images.forEach(function(image) {
          this.options.joinChannelIn.push(this._createInputDescriptor(image, options));
        }, this);
      } else {
        this.options.joinChannelIn.push(this._createInputDescriptor(images, options));
      }
      return this;
    }
    function bandbool(boolOp) {
      if (is.string(boolOp) && is.inArray(boolOp, ["and", "or", "eor"])) {
        this.options.bandBoolOp = boolOp;
      } else {
        throw is.invalidParameterError("boolOp", "one of: and, or, eor", boolOp);
      }
      return this;
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        // Public instance functions
        removeAlpha,
        ensureAlpha,
        extractChannel,
        joinChannel,
        bandbool
      });
      Sharp.bool = bool;
    };
  }
});

// node_modules/sharp/lib/output.js
var require_output = __commonJS({
  "node_modules/sharp/lib/output.js"(exports, module2) {
    var path = require("node:path");
    var is = require_is();
    var sharp5 = require_sharp();
    var formats = /* @__PURE__ */ new Map([
      ["heic", "heif"],
      ["heif", "heif"],
      ["avif", "avif"],
      ["jpeg", "jpeg"],
      ["jpg", "jpeg"],
      ["jpe", "jpeg"],
      ["tile", "tile"],
      ["dz", "tile"],
      ["png", "png"],
      ["raw", "raw"],
      ["tiff", "tiff"],
      ["tif", "tiff"],
      ["webp", "webp"],
      ["gif", "gif"],
      ["jp2", "jp2"],
      ["jpx", "jp2"],
      ["j2k", "jp2"],
      ["j2c", "jp2"],
      ["jxl", "jxl"]
    ]);
    var jp2Regex = /\.(jp[2x]|j2[kc])$/i;
    var errJp2Save = () => new Error("JP2 output requires libvips with support for OpenJPEG");
    var bitdepthFromColourCount = (colours) => 1 << 31 - Math.clz32(Math.ceil(Math.log2(colours)));
    function toFile(fileOut, callback) {
      let err2;
      if (!is.string(fileOut)) {
        err2 = new Error("Missing output file path");
      } else if (is.string(this.options.input.file) && path.resolve(this.options.input.file) === path.resolve(fileOut)) {
        err2 = new Error("Cannot use same file for input and output");
      } else if (jp2Regex.test(path.extname(fileOut)) && !this.constructor.format.jp2k.output.file) {
        err2 = errJp2Save();
      }
      if (err2) {
        if (is.fn(callback)) {
          callback(err2);
        } else {
          return Promise.reject(err2);
        }
      } else {
        this.options.fileOut = fileOut;
        const stack = Error();
        return this._pipeline(callback, stack);
      }
      return this;
    }
    function toBuffer(options, callback) {
      if (is.object(options)) {
        this._setBooleanOption("resolveWithObject", options.resolveWithObject);
      } else if (this.options.resolveWithObject) {
        this.options.resolveWithObject = false;
      }
      this.options.fileOut = "";
      const stack = Error();
      return this._pipeline(is.fn(options) ? options : callback, stack);
    }
    function keepExif() {
      this.options.keepMetadata |= 1;
      return this;
    }
    function withExif(exif) {
      if (is.object(exif)) {
        for (const [ifd, entries] of Object.entries(exif)) {
          if (is.object(entries)) {
            for (const [k, v] of Object.entries(entries)) {
              if (is.string(v)) {
                this.options.withExif[`exif-${ifd.toLowerCase()}-${k}`] = v;
              } else {
                throw is.invalidParameterError(`${ifd}.${k}`, "string", v);
              }
            }
          } else {
            throw is.invalidParameterError(ifd, "object", entries);
          }
        }
      } else {
        throw is.invalidParameterError("exif", "object", exif);
      }
      this.options.withExifMerge = false;
      return this.keepExif();
    }
    function withExifMerge(exif) {
      this.withExif(exif);
      this.options.withExifMerge = true;
      return this;
    }
    function keepIccProfile() {
      this.options.keepMetadata |= 8;
      return this;
    }
    function withIccProfile(icc, options) {
      if (is.string(icc)) {
        this.options.withIccProfile = icc;
      } else {
        throw is.invalidParameterError("icc", "string", icc);
      }
      this.keepIccProfile();
      if (is.object(options)) {
        if (is.defined(options.attach)) {
          if (is.bool(options.attach)) {
            if (!options.attach) {
              this.options.keepMetadata &= ~8;
            }
          } else {
            throw is.invalidParameterError("attach", "boolean", options.attach);
          }
        }
      }
      return this;
    }
    function keepXmp() {
      this.options.keepMetadata |= 2;
      return this;
    }
    function withXmp(xmp) {
      if (is.string(xmp) && xmp.length > 0) {
        this.options.withXmp = xmp;
        this.options.keepMetadata |= 2;
      } else {
        throw is.invalidParameterError("xmp", "non-empty string", xmp);
      }
      return this;
    }
    function keepMetadata() {
      this.options.keepMetadata = 31;
      return this;
    }
    function withMetadata(options) {
      this.keepMetadata();
      this.withIccProfile("srgb");
      if (is.object(options)) {
        if (is.defined(options.orientation)) {
          if (is.integer(options.orientation) && is.inRange(options.orientation, 1, 8)) {
            this.options.withMetadataOrientation = options.orientation;
          } else {
            throw is.invalidParameterError("orientation", "integer between 1 and 8", options.orientation);
          }
        }
        if (is.defined(options.density)) {
          if (is.number(options.density) && options.density > 0) {
            this.options.withMetadataDensity = options.density;
          } else {
            throw is.invalidParameterError("density", "positive number", options.density);
          }
        }
        if (is.defined(options.icc)) {
          this.withIccProfile(options.icc);
        }
        if (is.defined(options.exif)) {
          this.withExifMerge(options.exif);
        }
      }
      return this;
    }
    function toFormat(format, options) {
      const actualFormat = formats.get((is.object(format) && is.string(format.id) ? format.id : format).toLowerCase());
      if (!actualFormat) {
        throw is.invalidParameterError("format", `one of: ${[...formats.keys()].join(", ")}`, format);
      }
      return this[actualFormat](options);
    }
    function jpeg(options) {
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.jpegQuality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.progressive)) {
          this._setBooleanOption("jpegProgressive", options.progressive);
        }
        if (is.defined(options.chromaSubsampling)) {
          if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
            this.options.jpegChromaSubsampling = options.chromaSubsampling;
          } else {
            throw is.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
          }
        }
        const optimiseCoding = is.bool(options.optimizeCoding) ? options.optimizeCoding : options.optimiseCoding;
        if (is.defined(optimiseCoding)) {
          this._setBooleanOption("jpegOptimiseCoding", optimiseCoding);
        }
        if (is.defined(options.mozjpeg)) {
          if (is.bool(options.mozjpeg)) {
            if (options.mozjpeg) {
              this.options.jpegTrellisQuantisation = true;
              this.options.jpegOvershootDeringing = true;
              this.options.jpegOptimiseScans = true;
              this.options.jpegProgressive = true;
              this.options.jpegQuantisationTable = 3;
            }
          } else {
            throw is.invalidParameterError("mozjpeg", "boolean", options.mozjpeg);
          }
        }
        const trellisQuantisation = is.bool(options.trellisQuantization) ? options.trellisQuantization : options.trellisQuantisation;
        if (is.defined(trellisQuantisation)) {
          this._setBooleanOption("jpegTrellisQuantisation", trellisQuantisation);
        }
        if (is.defined(options.overshootDeringing)) {
          this._setBooleanOption("jpegOvershootDeringing", options.overshootDeringing);
        }
        const optimiseScans = is.bool(options.optimizeScans) ? options.optimizeScans : options.optimiseScans;
        if (is.defined(optimiseScans)) {
          this._setBooleanOption("jpegOptimiseScans", optimiseScans);
          if (optimiseScans) {
            this.options.jpegProgressive = true;
          }
        }
        const quantisationTable = is.number(options.quantizationTable) ? options.quantizationTable : options.quantisationTable;
        if (is.defined(quantisationTable)) {
          if (is.integer(quantisationTable) && is.inRange(quantisationTable, 0, 8)) {
            this.options.jpegQuantisationTable = quantisationTable;
          } else {
            throw is.invalidParameterError("quantisationTable", "integer between 0 and 8", quantisationTable);
          }
        }
      }
      return this._updateFormatOut("jpeg", options);
    }
    function png(options) {
      if (is.object(options)) {
        if (is.defined(options.progressive)) {
          this._setBooleanOption("pngProgressive", options.progressive);
        }
        if (is.defined(options.compressionLevel)) {
          if (is.integer(options.compressionLevel) && is.inRange(options.compressionLevel, 0, 9)) {
            this.options.pngCompressionLevel = options.compressionLevel;
          } else {
            throw is.invalidParameterError("compressionLevel", "integer between 0 and 9", options.compressionLevel);
          }
        }
        if (is.defined(options.adaptiveFiltering)) {
          this._setBooleanOption("pngAdaptiveFiltering", options.adaptiveFiltering);
        }
        const colours = options.colours || options.colors;
        if (is.defined(colours)) {
          if (is.integer(colours) && is.inRange(colours, 2, 256)) {
            this.options.pngBitdepth = bitdepthFromColourCount(colours);
          } else {
            throw is.invalidParameterError("colours", "integer between 2 and 256", colours);
          }
        }
        if (is.defined(options.palette)) {
          this._setBooleanOption("pngPalette", options.palette);
        } else if ([options.quality, options.effort, options.colours, options.colors, options.dither].some(is.defined)) {
          this._setBooleanOption("pngPalette", true);
        }
        if (this.options.pngPalette) {
          if (is.defined(options.quality)) {
            if (is.integer(options.quality) && is.inRange(options.quality, 0, 100)) {
              this.options.pngQuality = options.quality;
            } else {
              throw is.invalidParameterError("quality", "integer between 0 and 100", options.quality);
            }
          }
          if (is.defined(options.effort)) {
            if (is.integer(options.effort) && is.inRange(options.effort, 1, 10)) {
              this.options.pngEffort = options.effort;
            } else {
              throw is.invalidParameterError("effort", "integer between 1 and 10", options.effort);
            }
          }
          if (is.defined(options.dither)) {
            if (is.number(options.dither) && is.inRange(options.dither, 0, 1)) {
              this.options.pngDither = options.dither;
            } else {
              throw is.invalidParameterError("dither", "number between 0.0 and 1.0", options.dither);
            }
          }
        }
      }
      return this._updateFormatOut("png", options);
    }
    function webp(options) {
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.webpQuality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.alphaQuality)) {
          if (is.integer(options.alphaQuality) && is.inRange(options.alphaQuality, 0, 100)) {
            this.options.webpAlphaQuality = options.alphaQuality;
          } else {
            throw is.invalidParameterError("alphaQuality", "integer between 0 and 100", options.alphaQuality);
          }
        }
        if (is.defined(options.lossless)) {
          this._setBooleanOption("webpLossless", options.lossless);
        }
        if (is.defined(options.nearLossless)) {
          this._setBooleanOption("webpNearLossless", options.nearLossless);
        }
        if (is.defined(options.smartSubsample)) {
          this._setBooleanOption("webpSmartSubsample", options.smartSubsample);
        }
        if (is.defined(options.smartDeblock)) {
          this._setBooleanOption("webpSmartDeblock", options.smartDeblock);
        }
        if (is.defined(options.preset)) {
          if (is.string(options.preset) && is.inArray(options.preset, ["default", "photo", "picture", "drawing", "icon", "text"])) {
            this.options.webpPreset = options.preset;
          } else {
            throw is.invalidParameterError("preset", "one of: default, photo, picture, drawing, icon, text", options.preset);
          }
        }
        if (is.defined(options.effort)) {
          if (is.integer(options.effort) && is.inRange(options.effort, 0, 6)) {
            this.options.webpEffort = options.effort;
          } else {
            throw is.invalidParameterError("effort", "integer between 0 and 6", options.effort);
          }
        }
        if (is.defined(options.minSize)) {
          this._setBooleanOption("webpMinSize", options.minSize);
        }
        if (is.defined(options.mixed)) {
          this._setBooleanOption("webpMixed", options.mixed);
        }
      }
      trySetAnimationOptions(options, this.options);
      return this._updateFormatOut("webp", options);
    }
    function gif(options) {
      if (is.object(options)) {
        if (is.defined(options.reuse)) {
          this._setBooleanOption("gifReuse", options.reuse);
        }
        if (is.defined(options.progressive)) {
          this._setBooleanOption("gifProgressive", options.progressive);
        }
        const colours = options.colours || options.colors;
        if (is.defined(colours)) {
          if (is.integer(colours) && is.inRange(colours, 2, 256)) {
            this.options.gifBitdepth = bitdepthFromColourCount(colours);
          } else {
            throw is.invalidParameterError("colours", "integer between 2 and 256", colours);
          }
        }
        if (is.defined(options.effort)) {
          if (is.number(options.effort) && is.inRange(options.effort, 1, 10)) {
            this.options.gifEffort = options.effort;
          } else {
            throw is.invalidParameterError("effort", "integer between 1 and 10", options.effort);
          }
        }
        if (is.defined(options.dither)) {
          if (is.number(options.dither) && is.inRange(options.dither, 0, 1)) {
            this.options.gifDither = options.dither;
          } else {
            throw is.invalidParameterError("dither", "number between 0.0 and 1.0", options.dither);
          }
        }
        if (is.defined(options.interFrameMaxError)) {
          if (is.number(options.interFrameMaxError) && is.inRange(options.interFrameMaxError, 0, 32)) {
            this.options.gifInterFrameMaxError = options.interFrameMaxError;
          } else {
            throw is.invalidParameterError("interFrameMaxError", "number between 0.0 and 32.0", options.interFrameMaxError);
          }
        }
        if (is.defined(options.interPaletteMaxError)) {
          if (is.number(options.interPaletteMaxError) && is.inRange(options.interPaletteMaxError, 0, 256)) {
            this.options.gifInterPaletteMaxError = options.interPaletteMaxError;
          } else {
            throw is.invalidParameterError("interPaletteMaxError", "number between 0.0 and 256.0", options.interPaletteMaxError);
          }
        }
        if (is.defined(options.keepDuplicateFrames)) {
          if (is.bool(options.keepDuplicateFrames)) {
            this._setBooleanOption("gifKeepDuplicateFrames", options.keepDuplicateFrames);
          } else {
            throw is.invalidParameterError("keepDuplicateFrames", "boolean", options.keepDuplicateFrames);
          }
        }
      }
      trySetAnimationOptions(options, this.options);
      return this._updateFormatOut("gif", options);
    }
    function jp2(options) {
      if (!this.constructor.format.jp2k.output.buffer) {
        throw errJp2Save();
      }
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.jp2Quality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.lossless)) {
          if (is.bool(options.lossless)) {
            this.options.jp2Lossless = options.lossless;
          } else {
            throw is.invalidParameterError("lossless", "boolean", options.lossless);
          }
        }
        if (is.defined(options.tileWidth)) {
          if (is.integer(options.tileWidth) && is.inRange(options.tileWidth, 1, 32768)) {
            this.options.jp2TileWidth = options.tileWidth;
          } else {
            throw is.invalidParameterError("tileWidth", "integer between 1 and 32768", options.tileWidth);
          }
        }
        if (is.defined(options.tileHeight)) {
          if (is.integer(options.tileHeight) && is.inRange(options.tileHeight, 1, 32768)) {
            this.options.jp2TileHeight = options.tileHeight;
          } else {
            throw is.invalidParameterError("tileHeight", "integer between 1 and 32768", options.tileHeight);
          }
        }
        if (is.defined(options.chromaSubsampling)) {
          if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
            this.options.jp2ChromaSubsampling = options.chromaSubsampling;
          } else {
            throw is.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
          }
        }
      }
      return this._updateFormatOut("jp2", options);
    }
    function trySetAnimationOptions(source, target) {
      if (is.object(source) && is.defined(source.loop)) {
        if (is.integer(source.loop) && is.inRange(source.loop, 0, 65535)) {
          target.loop = source.loop;
        } else {
          throw is.invalidParameterError("loop", "integer between 0 and 65535", source.loop);
        }
      }
      if (is.object(source) && is.defined(source.delay)) {
        if (is.integer(source.delay) && is.inRange(source.delay, 0, 65535)) {
          target.delay = [source.delay];
        } else if (Array.isArray(source.delay) && source.delay.every(is.integer) && source.delay.every((v) => is.inRange(v, 0, 65535))) {
          target.delay = source.delay;
        } else {
          throw is.invalidParameterError("delay", "integer or an array of integers between 0 and 65535", source.delay);
        }
      }
    }
    function tiff(options) {
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.tiffQuality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.bitdepth)) {
          if (is.integer(options.bitdepth) && is.inArray(options.bitdepth, [1, 2, 4, 8])) {
            this.options.tiffBitdepth = options.bitdepth;
          } else {
            throw is.invalidParameterError("bitdepth", "1, 2, 4 or 8", options.bitdepth);
          }
        }
        if (is.defined(options.tile)) {
          this._setBooleanOption("tiffTile", options.tile);
        }
        if (is.defined(options.tileWidth)) {
          if (is.integer(options.tileWidth) && options.tileWidth > 0) {
            this.options.tiffTileWidth = options.tileWidth;
          } else {
            throw is.invalidParameterError("tileWidth", "integer greater than zero", options.tileWidth);
          }
        }
        if (is.defined(options.tileHeight)) {
          if (is.integer(options.tileHeight) && options.tileHeight > 0) {
            this.options.tiffTileHeight = options.tileHeight;
          } else {
            throw is.invalidParameterError("tileHeight", "integer greater than zero", options.tileHeight);
          }
        }
        if (is.defined(options.miniswhite)) {
          this._setBooleanOption("tiffMiniswhite", options.miniswhite);
        }
        if (is.defined(options.pyramid)) {
          this._setBooleanOption("tiffPyramid", options.pyramid);
        }
        if (is.defined(options.xres)) {
          if (is.number(options.xres) && options.xres > 0) {
            this.options.tiffXres = options.xres;
          } else {
            throw is.invalidParameterError("xres", "number greater than zero", options.xres);
          }
        }
        if (is.defined(options.yres)) {
          if (is.number(options.yres) && options.yres > 0) {
            this.options.tiffYres = options.yres;
          } else {
            throw is.invalidParameterError("yres", "number greater than zero", options.yres);
          }
        }
        if (is.defined(options.compression)) {
          if (is.string(options.compression) && is.inArray(options.compression, ["none", "jpeg", "deflate", "packbits", "ccittfax4", "lzw", "webp", "zstd", "jp2k"])) {
            this.options.tiffCompression = options.compression;
          } else {
            throw is.invalidParameterError("compression", "one of: none, jpeg, deflate, packbits, ccittfax4, lzw, webp, zstd, jp2k", options.compression);
          }
        }
        if (is.defined(options.bigtiff)) {
          this._setBooleanOption("tiffBigtiff", options.bigtiff);
        }
        if (is.defined(options.predictor)) {
          if (is.string(options.predictor) && is.inArray(options.predictor, ["none", "horizontal", "float"])) {
            this.options.tiffPredictor = options.predictor;
          } else {
            throw is.invalidParameterError("predictor", "one of: none, horizontal, float", options.predictor);
          }
        }
        if (is.defined(options.resolutionUnit)) {
          if (is.string(options.resolutionUnit) && is.inArray(options.resolutionUnit, ["inch", "cm"])) {
            this.options.tiffResolutionUnit = options.resolutionUnit;
          } else {
            throw is.invalidParameterError("resolutionUnit", "one of: inch, cm", options.resolutionUnit);
          }
        }
      }
      return this._updateFormatOut("tiff", options);
    }
    function avif(options) {
      return this.heif({ ...options, compression: "av1" });
    }
    function heif(options) {
      if (is.object(options)) {
        if (is.string(options.compression) && is.inArray(options.compression, ["av1", "hevc"])) {
          this.options.heifCompression = options.compression;
        } else {
          throw is.invalidParameterError("compression", "one of: av1, hevc", options.compression);
        }
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.heifQuality = options.quality;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        }
        if (is.defined(options.lossless)) {
          if (is.bool(options.lossless)) {
            this.options.heifLossless = options.lossless;
          } else {
            throw is.invalidParameterError("lossless", "boolean", options.lossless);
          }
        }
        if (is.defined(options.effort)) {
          if (is.integer(options.effort) && is.inRange(options.effort, 0, 9)) {
            this.options.heifEffort = options.effort;
          } else {
            throw is.invalidParameterError("effort", "integer between 0 and 9", options.effort);
          }
        }
        if (is.defined(options.chromaSubsampling)) {
          if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ["4:2:0", "4:4:4"])) {
            this.options.heifChromaSubsampling = options.chromaSubsampling;
          } else {
            throw is.invalidParameterError("chromaSubsampling", "one of: 4:2:0, 4:4:4", options.chromaSubsampling);
          }
        }
        if (is.defined(options.bitdepth)) {
          if (is.integer(options.bitdepth) && is.inArray(options.bitdepth, [8, 10, 12])) {
            if (options.bitdepth !== 8 && this.constructor.versions.heif) {
              throw is.invalidParameterError("bitdepth when using prebuilt binaries", 8, options.bitdepth);
            }
            this.options.heifBitdepth = options.bitdepth;
          } else {
            throw is.invalidParameterError("bitdepth", "8, 10 or 12", options.bitdepth);
          }
        }
      } else {
        throw is.invalidParameterError("options", "Object", options);
      }
      return this._updateFormatOut("heif", options);
    }
    function jxl(options) {
      if (is.object(options)) {
        if (is.defined(options.quality)) {
          if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
            this.options.jxlDistance = options.quality >= 30 ? 0.1 + (100 - options.quality) * 0.09 : 53 / 3e3 * options.quality * options.quality - 23 / 20 * options.quality + 25;
          } else {
            throw is.invalidParameterError("quality", "integer between 1 and 100", options.quality);
          }
        } else if (is.defined(options.distance)) {
          if (is.number(options.distance) && is.inRange(options.distance, 0, 15)) {
            this.options.jxlDistance = options.distance;
          } else {
            throw is.invalidParameterError("distance", "number between 0.0 and 15.0", options.distance);
          }
        }
        if (is.defined(options.decodingTier)) {
          if (is.integer(options.decodingTier) && is.inRange(options.decodingTier, 0, 4)) {
            this.options.jxlDecodingTier = options.decodingTier;
          } else {
            throw is.invalidParameterError("decodingTier", "integer between 0 and 4", options.decodingTier);
          }
        }
        if (is.defined(options.lossless)) {
          if (is.bool(options.lossless)) {
            this.options.jxlLossless = options.lossless;
          } else {
            throw is.invalidParameterError("lossless", "boolean", options.lossless);
          }
        }
        if (is.defined(options.effort)) {
          if (is.integer(options.effort) && is.inRange(options.effort, 1, 9)) {
            this.options.jxlEffort = options.effort;
          } else {
            throw is.invalidParameterError("effort", "integer between 1 and 9", options.effort);
          }
        }
      }
      trySetAnimationOptions(options, this.options);
      return this._updateFormatOut("jxl", options);
    }
    function raw(options) {
      if (is.object(options)) {
        if (is.defined(options.depth)) {
          if (is.string(options.depth) && is.inArray(
            options.depth,
            ["char", "uchar", "short", "ushort", "int", "uint", "float", "complex", "double", "dpcomplex"]
          )) {
            this.options.rawDepth = options.depth;
          } else {
            throw is.invalidParameterError("depth", "one of: char, uchar, short, ushort, int, uint, float, complex, double, dpcomplex", options.depth);
          }
        }
      }
      return this._updateFormatOut("raw");
    }
    function tile(options) {
      if (is.object(options)) {
        if (is.defined(options.size)) {
          if (is.integer(options.size) && is.inRange(options.size, 1, 8192)) {
            this.options.tileSize = options.size;
          } else {
            throw is.invalidParameterError("size", "integer between 1 and 8192", options.size);
          }
        }
        if (is.defined(options.overlap)) {
          if (is.integer(options.overlap) && is.inRange(options.overlap, 0, 8192)) {
            if (options.overlap > this.options.tileSize) {
              throw is.invalidParameterError("overlap", `<= size (${this.options.tileSize})`, options.overlap);
            }
            this.options.tileOverlap = options.overlap;
          } else {
            throw is.invalidParameterError("overlap", "integer between 0 and 8192", options.overlap);
          }
        }
        if (is.defined(options.container)) {
          if (is.string(options.container) && is.inArray(options.container, ["fs", "zip"])) {
            this.options.tileContainer = options.container;
          } else {
            throw is.invalidParameterError("container", "one of: fs, zip", options.container);
          }
        }
        if (is.defined(options.layout)) {
          if (is.string(options.layout) && is.inArray(options.layout, ["dz", "google", "iiif", "iiif3", "zoomify"])) {
            this.options.tileLayout = options.layout;
          } else {
            throw is.invalidParameterError("layout", "one of: dz, google, iiif, iiif3, zoomify", options.layout);
          }
        }
        if (is.defined(options.angle)) {
          if (is.integer(options.angle) && !(options.angle % 90)) {
            this.options.tileAngle = options.angle;
          } else {
            throw is.invalidParameterError("angle", "positive/negative multiple of 90", options.angle);
          }
        }
        this._setBackgroundColourOption("tileBackground", options.background);
        if (is.defined(options.depth)) {
          if (is.string(options.depth) && is.inArray(options.depth, ["onepixel", "onetile", "one"])) {
            this.options.tileDepth = options.depth;
          } else {
            throw is.invalidParameterError("depth", "one of: onepixel, onetile, one", options.depth);
          }
        }
        if (is.defined(options.skipBlanks)) {
          if (is.integer(options.skipBlanks) && is.inRange(options.skipBlanks, -1, 65535)) {
            this.options.tileSkipBlanks = options.skipBlanks;
          } else {
            throw is.invalidParameterError("skipBlanks", "integer between -1 and 255/65535", options.skipBlanks);
          }
        } else if (is.defined(options.layout) && options.layout === "google") {
          this.options.tileSkipBlanks = 5;
        }
        const centre = is.bool(options.center) ? options.center : options.centre;
        if (is.defined(centre)) {
          this._setBooleanOption("tileCentre", centre);
        }
        if (is.defined(options.id)) {
          if (is.string(options.id)) {
            this.options.tileId = options.id;
          } else {
            throw is.invalidParameterError("id", "string", options.id);
          }
        }
        if (is.defined(options.basename)) {
          if (is.string(options.basename)) {
            this.options.tileBasename = options.basename;
          } else {
            throw is.invalidParameterError("basename", "string", options.basename);
          }
        }
      }
      if (is.inArray(this.options.formatOut, ["jpeg", "png", "webp"])) {
        this.options.tileFormat = this.options.formatOut;
      } else if (this.options.formatOut !== "input") {
        throw is.invalidParameterError("format", "one of: jpeg, png, webp", this.options.formatOut);
      }
      return this._updateFormatOut("dz");
    }
    function timeout(options) {
      if (!is.plainObject(options)) {
        throw is.invalidParameterError("options", "object", options);
      }
      if (is.integer(options.seconds) && is.inRange(options.seconds, 0, 3600)) {
        this.options.timeoutSeconds = options.seconds;
      } else {
        throw is.invalidParameterError("seconds", "integer between 0 and 3600", options.seconds);
      }
      return this;
    }
    function _updateFormatOut(formatOut, options) {
      if (!(is.object(options) && options.force === false)) {
        this.options.formatOut = formatOut;
      }
      return this;
    }
    function _setBooleanOption(key, val) {
      if (is.bool(val)) {
        this.options[key] = val;
      } else {
        throw is.invalidParameterError(key, "boolean", val);
      }
    }
    function _read() {
      if (!this.options.streamOut) {
        this.options.streamOut = true;
        const stack = Error();
        this._pipeline(void 0, stack);
      }
    }
    function _pipeline(callback, stack) {
      if (typeof callback === "function") {
        if (this._isStreamInput()) {
          this.on("finish", () => {
            this._flattenBufferIn();
            sharp5.pipeline(this.options, (err2, data, info) => {
              if (err2) {
                callback(is.nativeError(err2, stack));
              } else {
                callback(null, data, info);
              }
            });
          });
        } else {
          sharp5.pipeline(this.options, (err2, data, info) => {
            if (err2) {
              callback(is.nativeError(err2, stack));
            } else {
              callback(null, data, info);
            }
          });
        }
        return this;
      } else if (this.options.streamOut) {
        if (this._isStreamInput()) {
          this.once("finish", () => {
            this._flattenBufferIn();
            sharp5.pipeline(this.options, (err2, data, info) => {
              if (err2) {
                this.emit("error", is.nativeError(err2, stack));
              } else {
                this.emit("info", info);
                this.push(data);
              }
              this.push(null);
              this.on("end", () => this.emit("close"));
            });
          });
          if (this.streamInFinished) {
            this.emit("finish");
          }
        } else {
          sharp5.pipeline(this.options, (err2, data, info) => {
            if (err2) {
              this.emit("error", is.nativeError(err2, stack));
            } else {
              this.emit("info", info);
              this.push(data);
            }
            this.push(null);
            this.on("end", () => this.emit("close"));
          });
        }
        return this;
      } else {
        if (this._isStreamInput()) {
          return new Promise((resolve3, reject) => {
            this.once("finish", () => {
              this._flattenBufferIn();
              sharp5.pipeline(this.options, (err2, data, info) => {
                if (err2) {
                  reject(is.nativeError(err2, stack));
                } else {
                  if (this.options.resolveWithObject) {
                    resolve3({ data, info });
                  } else {
                    resolve3(data);
                  }
                }
              });
            });
          });
        } else {
          return new Promise((resolve3, reject) => {
            sharp5.pipeline(this.options, (err2, data, info) => {
              if (err2) {
                reject(is.nativeError(err2, stack));
              } else {
                if (this.options.resolveWithObject) {
                  resolve3({ data, info });
                } else {
                  resolve3(data);
                }
              }
            });
          });
        }
      }
    }
    module2.exports = (Sharp) => {
      Object.assign(Sharp.prototype, {
        // Public
        toFile,
        toBuffer,
        keepExif,
        withExif,
        withExifMerge,
        keepIccProfile,
        withIccProfile,
        keepXmp,
        withXmp,
        keepMetadata,
        withMetadata,
        toFormat,
        jpeg,
        jp2,
        png,
        webp,
        tiff,
        avif,
        heif,
        jxl,
        gif,
        raw,
        tile,
        timeout,
        // Private
        _updateFormatOut,
        _setBooleanOption,
        _read,
        _pipeline
      });
    };
  }
});

// node_modules/sharp/lib/utility.js
var require_utility = __commonJS({
  "node_modules/sharp/lib/utility.js"(exports, module2) {
    var events = require("node:events");
    var detectLibc = require_detect_libc();
    var is = require_is();
    var { runtimePlatformArch } = require_libvips();
    var sharp5 = require_sharp();
    var runtimePlatform = runtimePlatformArch();
    var libvipsVersion = sharp5.libvipsVersion();
    var format = sharp5.format();
    format.heif.output.alias = ["avif", "heic"];
    format.jpeg.output.alias = ["jpe", "jpg"];
    format.tiff.output.alias = ["tif"];
    format.jp2k.output.alias = ["j2c", "j2k", "jp2", "jpx"];
    var interpolators = {
      /** [Nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation). Suitable for image enlargement only. */
      nearest: "nearest",
      /** [Bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation). Faster than bicubic but with less smooth results. */
      bilinear: "bilinear",
      /** [Bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) (the default). */
      bicubic: "bicubic",
      /** [LBB interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/lbb.cpp#L100). Prevents some "[acutance](http://en.wikipedia.org/wiki/Acutance)" but typically reduces performance by a factor of 2. */
      locallyBoundedBicubic: "lbb",
      /** [Nohalo interpolation](http://eprints.soton.ac.uk/268086/). Prevents acutance but typically reduces performance by a factor of 3. */
      nohalo: "nohalo",
      /** [VSQBS interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/vsqbs.cpp#L48). Prevents "staircasing" when enlarging. */
      vertexSplitQuadraticBasisSpline: "vsqbs"
    };
    var versions = {
      vips: libvipsVersion.semver
    };
    if (!libvipsVersion.isGlobal) {
      if (!libvipsVersion.isWasm) {
        try {
          versions = require(`@img/sharp-${runtimePlatform}/versions`);
        } catch (_) {
          try {
            versions = require(`@img/sharp-libvips-${runtimePlatform}/versions`);
          } catch (_2) {
          }
        }
      } else {
        try {
          versions = require("@img/sharp-wasm32/versions");
        } catch (_) {
        }
      }
    }
    versions.sharp = require_package().version;
    if (versions.heif && format.heif) {
      format.heif.input.fileSuffix = [".avif"];
      format.heif.output.alias = ["avif"];
    }
    function cache(options) {
      if (is.bool(options)) {
        if (options) {
          return sharp5.cache(50, 20, 100);
        } else {
          return sharp5.cache(0, 0, 0);
        }
      } else if (is.object(options)) {
        return sharp5.cache(options.memory, options.files, options.items);
      } else {
        return sharp5.cache();
      }
    }
    cache(true);
    function concurrency(concurrency2) {
      return sharp5.concurrency(is.integer(concurrency2) ? concurrency2 : null);
    }
    if (detectLibc.familySync() === detectLibc.GLIBC && !sharp5._isUsingJemalloc()) {
      sharp5.concurrency(1);
    } else if (detectLibc.familySync() === detectLibc.MUSL && sharp5.concurrency() === 1024) {
      sharp5.concurrency(require("node:os").availableParallelism());
    }
    var queue = new events.EventEmitter();
    function counters() {
      return sharp5.counters();
    }
    function simd(simd2) {
      return sharp5.simd(is.bool(simd2) ? simd2 : null);
    }
    function block(options) {
      if (is.object(options)) {
        if (Array.isArray(options.operation) && options.operation.every(is.string)) {
          sharp5.block(options.operation, true);
        } else {
          throw is.invalidParameterError("operation", "Array<string>", options.operation);
        }
      } else {
        throw is.invalidParameterError("options", "object", options);
      }
    }
    function unblock(options) {
      if (is.object(options)) {
        if (Array.isArray(options.operation) && options.operation.every(is.string)) {
          sharp5.block(options.operation, false);
        } else {
          throw is.invalidParameterError("operation", "Array<string>", options.operation);
        }
      } else {
        throw is.invalidParameterError("options", "object", options);
      }
    }
    module2.exports = (Sharp) => {
      Sharp.cache = cache;
      Sharp.concurrency = concurrency;
      Sharp.counters = counters;
      Sharp.simd = simd;
      Sharp.format = format;
      Sharp.interpolators = interpolators;
      Sharp.versions = versions;
      Sharp.queue = queue;
      Sharp.block = block;
      Sharp.unblock = unblock;
    };
  }
});

// node_modules/sharp/lib/index.js
var require_lib = __commonJS({
  "node_modules/sharp/lib/index.js"(exports, module2) {
    var Sharp = require_constructor();
    require_input()(Sharp);
    require_resize()(Sharp);
    require_composite()(Sharp);
    require_operation()(Sharp);
    require_colour()(Sharp);
    require_channel()(Sharp);
    require_output()(Sharp);
    require_utility()(Sharp);
    module2.exports = Sharp;
  }
});

// node_modules/@mongodb-js/zstd/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/@mongodb-js/zstd/lib/index.js"(exports) {
    "use strict";
    var { promisify } = require("util");
    var { isUint8Array } = require("util/types");
    function load() {
      try {
        return require("../build/Release/zstd.node");
      } catch {
        try {
          return require("../build/Debug/zstd.node");
        } catch (error) {
          throw error;
        }
      }
    }
    var zstd = load();
    var _compress = promisify(zstd.compress);
    var _decompress = promisify(zstd.decompress);
    exports.compress = async function compress(data, compressionLevel) {
      if (!isUint8Array(data)) {
        throw new TypeError(`parameter 'data' must be a Uint8Array.`);
      }
      if (compressionLevel != null && typeof compressionLevel !== "number") {
        throw new TypeError(`parameter 'compressionLevel' must be a number.`);
      }
      try {
        return await _compress(data, compressionLevel ?? 3);
      } catch (e) {
        throw new Error(`zstd: ${e.message}`);
      }
    };
    exports.decompress = async function decompress2(data) {
      if (!isUint8Array(data)) {
        throw new TypeError(`parameter 'data' must be a Uint8Array.`);
      }
      try {
        return await _decompress(data);
      } catch (e) {
        throw new Error(`zstd: ${e.message}`);
      }
    };
  }
});

// node_modules/amdefine/amdefine.js
var require_amdefine = __commonJS({
  "node_modules/amdefine/amdefine.js"(exports, module2) {
    "use strict";
    function amdefine(module3, requireFn) {
      "use strict";
      var defineCache = {}, loaderCache = {}, alreadyCalled = false, path = require("path"), makeRequire, stringRequire;
      function trimDots(ary) {
        var i, part;
        for (i = 0; ary[i]; i += 1) {
          part = ary[i];
          if (part === ".") {
            ary.splice(i, 1);
            i -= 1;
          } else if (part === "..") {
            if (i === 1 && (ary[2] === ".." || ary[0] === "..")) {
              break;
            } else if (i > 0) {
              ary.splice(i - 1, 2);
              i -= 2;
            }
          }
        }
      }
      function normalize(name, baseName) {
        var baseParts;
        if (name && name.charAt(0) === ".") {
          if (baseName) {
            baseParts = baseName.split("/");
            baseParts = baseParts.slice(0, baseParts.length - 1);
            baseParts = baseParts.concat(name.split("/"));
            trimDots(baseParts);
            name = baseParts.join("/");
          }
        }
        return name;
      }
      function makeNormalize(relName) {
        return function(name) {
          return normalize(name, relName);
        };
      }
      function makeLoad(id) {
        function load(value) {
          loaderCache[id] = value;
        }
        load.fromText = function(id2, text) {
          throw new Error("amdefine does not implement load.fromText");
        };
        return load;
      }
      makeRequire = function(systemRequire, exports2, module4, relId) {
        function amdRequire(deps, callback) {
          if (typeof deps === "string") {
            return stringRequire(systemRequire, exports2, module4, deps, relId);
          } else {
            deps = deps.map(function(depName) {
              return stringRequire(systemRequire, exports2, module4, depName, relId);
            });
            if (callback) {
              process.nextTick(function() {
                callback.apply(null, deps);
              });
            }
          }
        }
        amdRequire.toUrl = function(filePath) {
          if (filePath.indexOf(".") === 0) {
            return normalize(filePath, path.dirname(module4.filename));
          } else {
            return filePath;
          }
        };
        return amdRequire;
      };
      requireFn = requireFn || function req() {
        return module3.require.apply(module3, arguments);
      };
      function runFactory(id, deps, factory) {
        var r, e, m, result;
        if (id) {
          e = loaderCache[id] = {};
          m = {
            id,
            uri: __filename,
            exports: e
          };
          r = makeRequire(requireFn, e, m, id);
        } else {
          if (alreadyCalled) {
            throw new Error("amdefine with no module ID cannot be called more than once per file.");
          }
          alreadyCalled = true;
          e = module3.exports;
          m = module3;
          r = makeRequire(requireFn, e, m, module3.id);
        }
        if (deps) {
          deps = deps.map(function(depName) {
            return r(depName);
          });
        }
        if (typeof factory === "function") {
          result = factory.apply(m.exports, deps);
        } else {
          result = factory;
        }
        if (result !== void 0) {
          m.exports = result;
          if (id) {
            loaderCache[id] = m.exports;
          }
        }
      }
      stringRequire = function(systemRequire, exports2, module4, id, relId) {
        var index = id.indexOf("!"), originalId = id, prefix, plugin;
        if (index === -1) {
          id = normalize(id, relId);
          if (id === "require") {
            return makeRequire(systemRequire, exports2, module4, relId);
          } else if (id === "exports") {
            return exports2;
          } else if (id === "module") {
            return module4;
          } else if (loaderCache.hasOwnProperty(id)) {
            return loaderCache[id];
          } else if (defineCache[id]) {
            runFactory.apply(null, defineCache[id]);
            return loaderCache[id];
          } else {
            if (systemRequire) {
              return systemRequire(originalId);
            } else {
              throw new Error("No module with ID: " + id);
            }
          }
        } else {
          prefix = id.substring(0, index);
          id = id.substring(index + 1, id.length);
          plugin = stringRequire(systemRequire, exports2, module4, prefix, relId);
          if (plugin.normalize) {
            id = plugin.normalize(id, makeNormalize(relId));
          } else {
            id = normalize(id, relId);
          }
          if (loaderCache[id]) {
            return loaderCache[id];
          } else {
            plugin.load(id, makeRequire(systemRequire, exports2, module4, relId), makeLoad(id), {});
            return loaderCache[id];
          }
        }
      };
      function define2(id, deps, factory) {
        if (Array.isArray(id)) {
          factory = deps;
          deps = id;
          id = void 0;
        } else if (typeof id !== "string") {
          factory = id;
          id = deps = void 0;
        }
        if (deps && !Array.isArray(deps)) {
          factory = deps;
          deps = void 0;
        }
        if (!deps) {
          deps = ["require", "exports", "module"];
        }
        if (id) {
          defineCache[id] = [id, deps, factory];
        } else {
          runFactory(id, deps, factory);
        }
      }
      define2.require = function(id) {
        if (loaderCache[id]) {
          return loaderCache[id];
        }
        if (defineCache[id]) {
          runFactory.apply(null, defineCache[id]);
          return loaderCache[id];
        }
      };
      define2.amd = {};
      return define2;
    }
    module2.exports = amdefine;
  }
});

// node_modules/lzma-purejs/main.js
var require_main = __commonJS({
  "node_modules/lzma-purejs/main.js"(exports, module2) {
    if (typeof define2 !== "function") {
      define2 = require_amdefine()(module2);
    }
    var define2;
    define2(["./lib/freeze", "./lib/LZ", "./lib/LZMA", "./lib/RangeCoder", "./lib/Stream", "./lib/Util"], function(freeze, LZ, LZMA, RangeCoder, Stream, Util) {
      "use strict";
      return freeze({
        version: "0.9.0",
        LZ,
        LZMA,
        RangeCoder,
        Stream,
        Util,
        // utility methods
        compress: Util.compress,
        compressFile: Util.compressFile,
        decompress: Util.decompress,
        decompressFile: Util.decompressFile
      });
    });
  }
});

// node_modules/sliced/index.js
var require_sliced = __commonJS({
  "node_modules/sliced/index.js"(exports, module2) {
    module2.exports = function(args, slice, sliceEnd) {
      var ret = [];
      var len = args.length;
      if (0 === len)
        return ret;
      var start = slice < 0 ? Math.max(0, slice + len) : slice || 0;
      if (sliceEnd !== void 0) {
        len = sliceEnd < 0 ? sliceEnd + len : sliceEnd;
      }
      while (len-- > start) {
        ret[len - start] = args[len];
      }
      return ret;
    };
  }
});

// node_modules/png-chunks-encode/index.js
var require_png_chunks_encode = __commonJS({
  "node_modules/png-chunks-encode/index.js"(exports, module2) {
    var sliced = require_sliced();
    var crc322 = require_crc32();
    module2.exports = encodeChunks;
    var uint8 = new Uint8Array(4);
    var int32 = new Int32Array(uint8.buffer);
    var uint32 = new Uint32Array(uint8.buffer);
    function encodeChunks(chunks) {
      var totalSize = 8;
      var idx = totalSize;
      var i;
      for (i = 0; i < chunks.length; i++) {
        totalSize += chunks[i].data.length;
        totalSize += 12;
      }
      var output = new Uint8Array(totalSize);
      output[0] = 137;
      output[1] = 80;
      output[2] = 78;
      output[3] = 71;
      output[4] = 13;
      output[5] = 10;
      output[6] = 26;
      output[7] = 10;
      for (i = 0; i < chunks.length; i++) {
        var chunk = chunks[i];
        var name = chunk.name;
        var data = chunk.data;
        var size = data.length;
        var nameChars = [
          name.charCodeAt(0),
          name.charCodeAt(1),
          name.charCodeAt(2),
          name.charCodeAt(3)
        ];
        uint32[0] = size;
        output[idx++] = uint8[3];
        output[idx++] = uint8[2];
        output[idx++] = uint8[1];
        output[idx++] = uint8[0];
        output[idx++] = nameChars[0];
        output[idx++] = nameChars[1];
        output[idx++] = nameChars[2];
        output[idx++] = nameChars[3];
        for (var j = 0; j < size; ) {
          output[idx++] = data[j++];
        }
        var crcCheck = nameChars.concat(sliced(data));
        var crc2 = crc322.buf(crcCheck);
        int32[0] = crc2;
        output[idx++] = uint8[3];
        output[idx++] = uint8[2];
        output[idx++] = uint8[1];
        output[idx++] = uint8[0];
      }
      return output;
    }
  }
});

// node_modules/fflate/esm/index.mjs
var esm_exports = {};
__export(esm_exports, {
  AsyncCompress: () => AsyncGzip,
  AsyncDecompress: () => AsyncDecompress,
  AsyncDeflate: () => AsyncDeflate,
  AsyncGunzip: () => AsyncGunzip,
  AsyncGzip: () => AsyncGzip,
  AsyncInflate: () => AsyncInflate,
  AsyncUnzipInflate: () => AsyncUnzipInflate,
  AsyncUnzlib: () => AsyncUnzlib,
  AsyncZipDeflate: () => AsyncZipDeflate,
  AsyncZlib: () => AsyncZlib,
  Compress: () => Gzip,
  DecodeUTF8: () => DecodeUTF8,
  Decompress: () => Decompress,
  Deflate: () => Deflate,
  EncodeUTF8: () => EncodeUTF8,
  FlateErrorCode: () => FlateErrorCode,
  Gunzip: () => Gunzip,
  Gzip: () => Gzip,
  Inflate: () => Inflate,
  Unzip: () => Unzip,
  UnzipInflate: () => UnzipInflate,
  UnzipPassThrough: () => UnzipPassThrough,
  Unzlib: () => Unzlib,
  Zip: () => Zip,
  ZipDeflate: () => ZipDeflate,
  ZipPassThrough: () => ZipPassThrough,
  Zlib: () => Zlib,
  compress: () => gzip,
  compressSync: () => gzipSync,
  decompress: () => decompress,
  decompressSync: () => decompressSync,
  deflate: () => deflate,
  deflateSync: () => deflateSync,
  gunzip: () => gunzip,
  gunzipSync: () => gunzipSync,
  gzip: () => gzip,
  gzipSync: () => gzipSync,
  inflate: () => inflate,
  inflateSync: () => inflateSync,
  strFromU8: () => strFromU8,
  strToU8: () => strToU8,
  unzip: () => unzip,
  unzipSync: () => unzipSync,
  unzlib: () => unzlib,
  unzlibSync: () => unzlibSync,
  zip: () => zip,
  zipSync: () => zipSync,
  zlib: () => zlib,
  zlibSync: () => zlibSync
});
function AsyncCmpStrm(opts, cb) {
  if (!cb && typeof opts == "function")
    cb = opts, opts = {};
  this.ondata = cb;
  return opts;
}
function deflate(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return cbify(data, opts, [
    bDflt
  ], function(ev) {
    return pbf(deflateSync(ev.data[0], ev.data[1]));
  }, 0, cb);
}
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
function inflate(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return cbify(data, opts, [
    bInflt
  ], function(ev) {
    return pbf(inflateSync(ev.data[0], gu8(ev.data[1])));
  }, 1, cb);
}
function inflateSync(data, out) {
  return inflt(data, out);
}
function gzip(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return cbify(data, opts, [
    bDflt,
    gze,
    function() {
      return [gzipSync];
    }
  ], function(ev) {
    return pbf(gzipSync(ev.data[0], ev.data[1]));
  }, 2, cb);
}
function gzipSync(data, opts) {
  if (!opts)
    opts = {};
  var c = crc(), l = data.length;
  c.p(data);
  var d = dopt(data, opts, gzhl(opts), 8), s = d.length;
  return gzh(d, opts), wbytes(d, s - 8, c.d()), wbytes(d, s - 4, l), d;
}
function gunzip(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return cbify(data, opts, [
    bInflt,
    guze,
    function() {
      return [gunzipSync];
    }
  ], function(ev) {
    return pbf(gunzipSync(ev.data[0]));
  }, 3, cb);
}
function gunzipSync(data, out) {
  return inflt(data.subarray(gzs(data), -8), out || new u8(gzl(data)));
}
function zlib(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return cbify(data, opts, [
    bDflt,
    zle,
    function() {
      return [zlibSync];
    }
  ], function(ev) {
    return pbf(zlibSync(ev.data[0], ev.data[1]));
  }, 4, cb);
}
function zlibSync(data, opts) {
  if (!opts)
    opts = {};
  var a = adler();
  a.p(data);
  var d = dopt(data, opts, 2, 4);
  return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
}
function unzlib(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return cbify(data, opts, [
    bInflt,
    zule,
    function() {
      return [unzlibSync];
    }
  ], function(ev) {
    return pbf(unzlibSync(ev.data[0], gu8(ev.data[1])));
  }, 5, cb);
}
function unzlibSync(data, out) {
  return inflt((zlv(data), data.subarray(2, -4)), out);
}
function decompress(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzip(data, opts, cb) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflate(data, opts, cb) : unzlib(data, opts, cb);
}
function decompressSync(data, out) {
  return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzipSync(data, out) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflateSync(data, out) : unzlibSync(data, out);
}
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td)
    return td.decode(dat);
  else {
    var _a2 = dutf8(dat), out = _a2[0], ext = _a2[1];
    if (ext.length)
      err(8);
    return out;
  }
}
function zip(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  var r = {};
  fltn(data, "", r, opts);
  var k = Object.keys(r);
  var lft = k.length, o = 0, tot = 0;
  var slft = lft, files = new Array(lft);
  var term = [];
  var tAll = function() {
    for (var i2 = 0; i2 < term.length; ++i2)
      term[i2]();
  };
  var cbd = function(a, b) {
    mt(function() {
      cb(a, b);
    });
  };
  mt(function() {
    cbd = cb;
  });
  var cbf = function() {
    var out = new u8(tot + 22), oe = o, cdl = tot - o;
    tot = 0;
    for (var i2 = 0; i2 < slft; ++i2) {
      var f = files[i2];
      try {
        var l = f.c.length;
        wzh(out, tot, f, f.f, f.u, l);
        var badd = 30 + f.f.length + exfl(f.extra);
        var loc = tot + badd;
        out.set(f.c, loc);
        wzh(out, o, f, f.f, f.u, l, tot, f.m), o += 16 + badd + (f.m ? f.m.length : 0), tot = loc + l;
      } catch (e) {
        return cbd(e, null);
      }
    }
    wzf(out, o, files.length, cdl, oe);
    cbd(null, out);
  };
  if (!lft)
    cbf();
  var _loop_1 = function(i2) {
    var fn = k[i2];
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var c = crc(), size = file.length;
    c.p(file);
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    var compression = p.level == 0 ? 0 : 8;
    var cbl = function(e, d) {
      if (e) {
        tAll();
        cbd(e, null);
      } else {
        var l = d.length;
        files[i2] = mrg(p, {
          size,
          crc: c.d(),
          c: d,
          f,
          m,
          u: s != fn.length || m && com.length != ms,
          compression
        });
        o += 30 + s + exl + l;
        tot += 76 + 2 * (s + exl) + (ms || 0) + l;
        if (!--lft)
          cbf();
      }
    };
    if (s > 65535)
      cbl(err(11, 0, 1), null);
    if (!compression)
      cbl(null, file);
    else if (size < 16e4) {
      try {
        cbl(null, deflateSync(file, p));
      } catch (e) {
        cbl(e, null);
      }
    } else
      term.push(deflate(file, p, cbl));
  };
  for (var i = 0; i < slft; ++i) {
    _loop_1(i);
  }
  return tAll;
}
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}
function unzip(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  var term = [];
  var tAll = function() {
    for (var i2 = 0; i2 < term.length; ++i2)
      term[i2]();
  };
  var files = {};
  var cbd = function(a, b) {
    mt(function() {
      cb(a, b);
    });
  };
  mt(function() {
    cbd = cb;
  });
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558) {
      cbd(err(13, 0, 1), null);
      return tAll;
    }
  }
  ;
  var lft = b2(data, e + 8);
  if (lft) {
    var c = lft;
    var o = b4(data, e + 16);
    var z = o == 4294967295 || c == 65535;
    if (z) {
      var ze = b4(data, e - 12);
      z = b4(data, ze) == 101075792;
      if (z) {
        c = lft = b4(data, ze + 32);
        o = b4(data, ze + 48);
      }
    }
    var fltr = opts && opts.filter;
    var _loop_3 = function(i2) {
      var _a2 = zh(data, o, z), c_1 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
      o = no;
      var cbl = function(e2, d) {
        if (e2) {
          tAll();
          cbd(e2, null);
        } else {
          if (d)
            files[fn] = d;
          if (!--lft)
            cbd(null, files);
        }
      };
      if (!fltr || fltr({
        name: fn,
        size: sc,
        originalSize: su,
        compression: c_1
      })) {
        if (!c_1)
          cbl(null, slc(data, b, b + sc));
        else if (c_1 == 8) {
          var infl = data.subarray(b, b + sc);
          if (sc < 32e4) {
            try {
              cbl(null, inflateSync(infl, new u8(su)));
            } catch (e2) {
              cbl(e2, null);
            }
          } else
            term.push(inflate(infl, { size: su }, cbl));
        } else
          cbl(err(14, "unknown compression type " + c_1, 1), null);
      } else
        cbl(null, null);
    };
    for (var i = 0; i < c; ++i) {
      _loop_3(i);
    }
  } else
    cbd(null, {});
  return tAll;
}
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = o == 4294967295 || c == 65535;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), new u8(su));
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}
var import_module, require2, Worker, workerAdd, wk, u8, u16, u32, fleb, fdeb, clim, freb, _a, fl, revfl, _b, fd, revfd, rev, x, i, hMap, flt, i, i, i, i, fdt, i, flm, flrm, fdm, fdrm, max, bits, bits16, shft, slc, FlateErrorCode, ec, err, inflt, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, deo, et, dflt, crct, crc, adler, dopt, mrg, wcln, ch, cbfs, wrkr, bInflt, bDflt, gze, guze, zle, zule, pbf, gu8, cbify, astrm, astrmify, b2, b4, b8, wbytes, gzh, gzs, gzl, gzhl, zlh, zlv, Deflate, AsyncDeflate, Inflate, AsyncInflate, Gzip, AsyncGzip, Gunzip, AsyncGunzip, Zlib, AsyncZlib, Unzlib, AsyncUnzlib, Decompress, AsyncDecompress, fltn, te, td, tds, dutf8, DecodeUTF8, EncodeUTF8, dbf, slzh, zh, z64e, exfl, wzh, wzf, ZipPassThrough, ZipDeflate, AsyncZipDeflate, Zip, UnzipPassThrough, UnzipInflate, AsyncUnzipInflate, Unzip, mt;
var init_esm = __esm({
  "node_modules/fflate/esm/index.mjs"() {
    import_module = require("module");
    require2 = (0, import_module.createRequire)("/");
    workerAdd = ";var __w=require('worker_threads');__w.parentPort.on('message',function(m){onmessage({data:m})}),postMessage=function(m,t){__w.parentPort.postMessage(m,t)},close=process.exit;self=global";
    try {
      Worker = require2("worker_threads").Worker;
    } catch (e) {
    }
    wk = Worker ? function(c, _, msg, transfer, cb) {
      var done = false;
      var w = new Worker(c + workerAdd, { eval: true }).on("error", function(e) {
        return cb(e, null);
      }).on("message", function(m) {
        return cb(null, m);
      }).on("exit", function(c2) {
        if (c2 && !done)
          cb(new Error("exited with code " + c2), null);
      });
      w.postMessage(msg, transfer);
      w.terminate = function() {
        done = true;
        return Worker.prototype.terminate.call(w);
      };
      return w;
    } : function(_, __, ___, ____, cb) {
      setImmediate(function() {
        return cb(new Error("async operations unsupported - update to Node 12+ (or Node 10-11 with the --experimental-worker CLI flag)"), null);
      });
      var NOP = function() {
      };
      return {
        terminate: NOP,
        postMessage: NOP
      };
    };
    u8 = Uint8Array;
    u16 = Uint16Array;
    u32 = Uint32Array;
    fleb = new u8([
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      2,
      2,
      2,
      2,
      3,
      3,
      3,
      3,
      4,
      4,
      4,
      4,
      5,
      5,
      5,
      5,
      0,
      /* unused */
      0,
      0,
      /* impossible */
      0
    ]);
    fdeb = new u8([
      0,
      0,
      0,
      0,
      1,
      1,
      2,
      2,
      3,
      3,
      4,
      4,
      5,
      5,
      6,
      6,
      7,
      7,
      8,
      8,
      9,
      9,
      10,
      10,
      11,
      11,
      12,
      12,
      13,
      13,
      /* unused */
      0,
      0
    ]);
    clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    freb = function(eb, start) {
      var b = new u16(31);
      for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
      }
      var r = new u32(b[30]);
      for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
          r[j] = j - b[i] << 5 | i;
        }
      }
      return [b, r];
    };
    _a = freb(fleb, 2);
    fl = _a[0];
    revfl = _a[1];
    fl[28] = 258, revfl[258] = 28;
    _b = freb(fdeb, 0);
    fd = _b[0];
    revfd = _b[1];
    rev = new u16(32768);
    for (i = 0; i < 32768; ++i) {
      x = (i & 43690) >>> 1 | (i & 21845) << 1;
      x = (x & 52428) >>> 2 | (x & 13107) << 2;
      x = (x & 61680) >>> 4 | (x & 3855) << 4;
      rev[i] = ((x & 65280) >>> 8 | (x & 255) << 8) >>> 1;
    }
    hMap = function(cd, mb, r) {
      var s = cd.length;
      var i = 0;
      var l = new u16(mb);
      for (; i < s; ++i) {
        if (cd[i])
          ++l[cd[i] - 1];
      }
      var le = new u16(mb);
      for (i = 0; i < mb; ++i) {
        le[i] = le[i - 1] + l[i - 1] << 1;
      }
      var co;
      if (r) {
        co = new u16(1 << mb);
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
          if (cd[i]) {
            var sv = i << 4 | cd[i];
            var r_1 = mb - cd[i];
            var v = le[cd[i] - 1]++ << r_1;
            for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
              co[rev[v] >>> rvb] = sv;
            }
          }
        }
      } else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
          if (cd[i]) {
            co[i] = rev[le[cd[i] - 1]++] >>> 15 - cd[i];
          }
        }
      }
      return co;
    };
    flt = new u8(288);
    for (i = 0; i < 144; ++i)
      flt[i] = 8;
    for (i = 144; i < 256; ++i)
      flt[i] = 9;
    for (i = 256; i < 280; ++i)
      flt[i] = 7;
    for (i = 280; i < 288; ++i)
      flt[i] = 8;
    fdt = new u8(32);
    for (i = 0; i < 32; ++i)
      fdt[i] = 5;
    flm = /* @__PURE__ */ hMap(flt, 9, 0);
    flrm = /* @__PURE__ */ hMap(flt, 9, 1);
    fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
    fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
    max = function(a) {
      var m = a[0];
      for (var i = 1; i < a.length; ++i) {
        if (a[i] > m)
          m = a[i];
      }
      return m;
    };
    bits = function(d, p, m) {
      var o = p / 8 | 0;
      return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
    };
    bits16 = function(d, p) {
      var o = p / 8 | 0;
      return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
    };
    shft = function(p) {
      return (p + 7) / 8 | 0;
    };
    slc = function(v, s, e) {
      if (s == null || s < 0)
        s = 0;
      if (e == null || e > v.length)
        e = v.length;
      var n = new (v.BYTES_PER_ELEMENT == 2 ? u16 : v.BYTES_PER_ELEMENT == 4 ? u32 : u8)(e - s);
      n.set(v.subarray(s, e));
      return n;
    };
    FlateErrorCode = {
      UnexpectedEOF: 0,
      InvalidBlockType: 1,
      InvalidLengthLiteral: 2,
      InvalidDistance: 3,
      StreamFinished: 4,
      NoStreamHandler: 5,
      InvalidHeader: 6,
      NoCallback: 7,
      InvalidUTF8: 8,
      ExtraFieldTooLong: 9,
      InvalidDate: 10,
      FilenameTooLong: 11,
      StreamFinishing: 12,
      InvalidZipData: 13,
      UnknownCompressionMethod: 14
    };
    ec = [
      "unexpected EOF",
      "invalid block type",
      "invalid length/literal",
      "invalid distance",
      "stream finished",
      "no stream handler",
      ,
      "no callback",
      "invalid UTF-8 data",
      "extra field too long",
      "date not in range 1980-2099",
      "filename too long",
      "stream finishing",
      "invalid zip data"
      // determined by unknown compression method
    ];
    err = function(ind, msg, nt) {
      var e = new Error(msg || ec[ind]);
      e.code = ind;
      if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
      if (!nt)
        throw e;
      return e;
    };
    inflt = function(dat, buf, st) {
      var sl = dat.length;
      if (!sl || st && st.f && !st.l)
        return buf || new u8(0);
      var noBuf = !buf || st;
      var noSt = !st || st.i;
      if (!st)
        st = {};
      if (!buf)
        buf = new u8(sl * 3);
      var cbuf = function(l2) {
        var bl = buf.length;
        if (l2 > bl) {
          var nbuf = new u8(Math.max(bl * 2, l2));
          nbuf.set(buf);
          buf = nbuf;
        }
      };
      var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
      var tbts = sl * 8;
      do {
        if (!lm) {
          final = bits(dat, pos, 1);
          var type = bits(dat, pos + 1, 3);
          pos += 3;
          if (!type) {
            var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
            if (t > sl) {
              if (noSt)
                err(0);
              break;
            }
            if (noBuf)
              cbuf(bt + l);
            buf.set(dat.subarray(s, t), bt);
            st.b = bt += l, st.p = pos = t * 8, st.f = final;
            continue;
          } else if (type == 1)
            lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
          else if (type == 2) {
            var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
            var tl = hLit + bits(dat, pos + 5, 31) + 1;
            pos += 14;
            var ldt = new u8(tl);
            var clt = new u8(19);
            for (var i = 0; i < hcLen; ++i) {
              clt[clim[i]] = bits(dat, pos + i * 3, 7);
            }
            pos += hcLen * 3;
            var clb = max(clt), clbmsk = (1 << clb) - 1;
            var clm = hMap(clt, clb, 1);
            for (var i = 0; i < tl; ) {
              var r = clm[bits(dat, pos, clbmsk)];
              pos += r & 15;
              var s = r >>> 4;
              if (s < 16) {
                ldt[i++] = s;
              } else {
                var c = 0, n = 0;
                if (s == 16)
                  n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                else if (s == 17)
                  n = 3 + bits(dat, pos, 7), pos += 3;
                else if (s == 18)
                  n = 11 + bits(dat, pos, 127), pos += 7;
                while (n--)
                  ldt[i++] = c;
              }
            }
            var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
            lbt = max(lt);
            dbt = max(dt);
            lm = hMap(lt, lbt, 1);
            dm = hMap(dt, dbt, 1);
          } else
            err(1);
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
        }
        if (noBuf)
          cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (; ; lpos = pos) {
          var c = lm[bits16(dat, pos) & lms], sym = c >>> 4;
          pos += c & 15;
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
          if (!c)
            err(2);
          if (sym < 256)
            buf[bt++] = sym;
          else if (sym == 256) {
            lpos = pos, lm = null;
            break;
          } else {
            var add = sym - 254;
            if (sym > 264) {
              var i = sym - 257, b = fleb[i];
              add = bits(dat, pos, (1 << b) - 1) + fl[i];
              pos += b;
            }
            var d = dm[bits16(dat, pos) & dms], dsym = d >>> 4;
            if (!d)
              err(3);
            pos += d & 15;
            var dt = fd[dsym];
            if (dsym > 3) {
              var b = fdeb[dsym];
              dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
            }
            if (pos > tbts) {
              if (noSt)
                err(0);
              break;
            }
            if (noBuf)
              cbuf(bt + 131072);
            var end = bt + add;
            for (; bt < end; bt += 4) {
              buf[bt] = buf[bt - dt];
              buf[bt + 1] = buf[bt + 1 - dt];
              buf[bt + 2] = buf[bt + 2 - dt];
              buf[bt + 3] = buf[bt + 3 - dt];
            }
            bt = end;
          }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = final;
        if (lm)
          final = 1, st.m = lbt, st.d = dm, st.n = dbt;
      } while (!final);
      return bt == buf.length ? buf : slc(buf, 0, bt);
    };
    wbits = function(d, p, v) {
      v <<= p & 7;
      var o = p / 8 | 0;
      d[o] |= v;
      d[o + 1] |= v >>> 8;
    };
    wbits16 = function(d, p, v) {
      v <<= p & 7;
      var o = p / 8 | 0;
      d[o] |= v;
      d[o + 1] |= v >>> 8;
      d[o + 2] |= v >>> 16;
    };
    hTree = function(d, mb) {
      var t = [];
      for (var i = 0; i < d.length; ++i) {
        if (d[i])
          t.push({ s: i, f: d[i] });
      }
      var s = t.length;
      var t2 = t.slice();
      if (!s)
        return [et, 0];
      if (s == 1) {
        var v = new u8(t[0].s + 1);
        v[t[0].s] = 1;
        return [v, 1];
      }
      t.sort(function(a, b) {
        return a.f - b.f;
      });
      t.push({ s: -1, f: 25001 });
      var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
      t[0] = { s: -1, f: l.f + r.f, l, r };
      while (i1 != s - 1) {
        l = t[t[i0].f < t[i2].f ? i0++ : i2++];
        r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
        t[i1++] = { s: -1, f: l.f + r.f, l, r };
      }
      var maxSym = t2[0].s;
      for (var i = 1; i < s; ++i) {
        if (t2[i].s > maxSym)
          maxSym = t2[i].s;
      }
      var tr = new u16(maxSym + 1);
      var mbt = ln(t[i1 - 1], tr, 0);
      if (mbt > mb) {
        var i = 0, dt = 0;
        var lft = mbt - mb, cst = 1 << lft;
        t2.sort(function(a, b) {
          return tr[b.s] - tr[a.s] || a.f - b.f;
        });
        for (; i < s; ++i) {
          var i2_1 = t2[i].s;
          if (tr[i2_1] > mb) {
            dt += cst - (1 << mbt - tr[i2_1]);
            tr[i2_1] = mb;
          } else
            break;
        }
        dt >>>= lft;
        while (dt > 0) {
          var i2_2 = t2[i].s;
          if (tr[i2_2] < mb)
            dt -= 1 << mb - tr[i2_2]++ - 1;
          else
            ++i;
        }
        for (; i >= 0 && dt; --i) {
          var i2_3 = t2[i].s;
          if (tr[i2_3] == mb) {
            --tr[i2_3];
            ++dt;
          }
        }
        mbt = mb;
      }
      return [new u8(tr), mbt];
    };
    ln = function(n, l, d) {
      return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
    };
    lc = function(c) {
      var s = c.length;
      while (s && !c[--s])
        ;
      var cl = new u16(++s);
      var cli = 0, cln = c[0], cls = 1;
      var w = function(v) {
        cl[cli++] = v;
      };
      for (var i = 1; i <= s; ++i) {
        if (c[i] == cln && i != s)
          ++cls;
        else {
          if (!cln && cls > 2) {
            for (; cls > 138; cls -= 138)
              w(32754);
            if (cls > 2) {
              w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
              cls = 0;
            }
          } else if (cls > 3) {
            w(cln), --cls;
            for (; cls > 6; cls -= 6)
              w(8304);
            if (cls > 2)
              w(cls - 3 << 5 | 8208), cls = 0;
          }
          while (cls--)
            w(cln);
          cls = 1;
          cln = c[i];
        }
      }
      return [cl.subarray(0, cli), s];
    };
    clen = function(cf, cl) {
      var l = 0;
      for (var i = 0; i < cl.length; ++i)
        l += cf[i] * cl[i];
      return l;
    };
    wfblk = function(out, pos, dat) {
      var s = dat.length;
      var o = shft(pos + 2);
      out[o] = s & 255;
      out[o + 1] = s >>> 8;
      out[o + 2] = out[o] ^ 255;
      out[o + 3] = out[o + 1] ^ 255;
      for (var i = 0; i < s; ++i)
        out[o + i + 4] = dat[i];
      return (o + 4 + s) * 8;
    };
    wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
      wbits(out, p++, final);
      ++lf[256];
      var _a2 = hTree(lf, 15), dlt = _a2[0], mlb = _a2[1];
      var _b2 = hTree(df, 15), ddt = _b2[0], mdb = _b2[1];
      var _c = lc(dlt), lclt = _c[0], nlc = _c[1];
      var _d = lc(ddt), lcdt = _d[0], ndc = _d[1];
      var lcfreq = new u16(19);
      for (var i = 0; i < lclt.length; ++i)
        lcfreq[lclt[i] & 31]++;
      for (var i = 0; i < lcdt.length; ++i)
        lcfreq[lcdt[i] & 31]++;
      var _e = hTree(lcfreq, 7), lct = _e[0], mlcb = _e[1];
      var nlcc = 19;
      for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
        ;
      var flen = bl + 5 << 3;
      var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
      var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + (2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18]);
      if (flen <= ftlen && flen <= dtlen)
        return wfblk(out, p, dat.subarray(bs, bs + bl));
      var lm, ll, dm, dl;
      wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
      if (dtlen < ftlen) {
        lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
        var llm = hMap(lct, mlcb, 0);
        wbits(out, p, nlc - 257);
        wbits(out, p + 5, ndc - 1);
        wbits(out, p + 10, nlcc - 4);
        p += 14;
        for (var i = 0; i < nlcc; ++i)
          wbits(out, p + 3 * i, lct[clim[i]]);
        p += 3 * nlcc;
        var lcts = [lclt, lcdt];
        for (var it = 0; it < 2; ++it) {
          var clct = lcts[it];
          for (var i = 0; i < clct.length; ++i) {
            var len = clct[i] & 31;
            wbits(out, p, llm[len]), p += lct[len];
            if (len > 15)
              wbits(out, p, clct[i] >>> 5 & 127), p += clct[i] >>> 12;
          }
        }
      } else {
        lm = flm, ll = flt, dm = fdm, dl = fdt;
      }
      for (var i = 0; i < li; ++i) {
        if (syms[i] > 255) {
          var len = syms[i] >>> 18 & 31;
          wbits16(out, p, lm[len + 257]), p += ll[len + 257];
          if (len > 7)
            wbits(out, p, syms[i] >>> 23 & 31), p += fleb[len];
          var dst = syms[i] & 31;
          wbits16(out, p, dm[dst]), p += dl[dst];
          if (dst > 3)
            wbits16(out, p, syms[i] >>> 5 & 8191), p += fdeb[dst];
        } else {
          wbits16(out, p, lm[syms[i]]), p += ll[syms[i]];
        }
      }
      wbits16(out, p, lm[256]);
      return p + ll[256];
    };
    deo = /* @__PURE__ */ new u32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
    et = /* @__PURE__ */ new u8(0);
    dflt = function(dat, lvl, plvl, pre, post, lst) {
      var s = dat.length;
      var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
      var w = o.subarray(pre, o.length - post);
      var pos = 0;
      if (!lvl || s < 8) {
        for (var i = 0; i <= s; i += 65535) {
          var e = i + 65535;
          if (e >= s) {
            w[pos >> 3] = lst;
          }
          pos = wfblk(w, pos + 1, dat.subarray(i, e));
        }
      } else {
        var opt = deo[lvl - 1];
        var n = opt >>> 13, c = opt & 8191;
        var msk_1 = (1 << plvl) - 1;
        var prev = new u16(32768), head = new u16(msk_1 + 1);
        var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
        var hsh = function(i2) {
          return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
        };
        var syms = new u32(25e3);
        var lf = new u16(288), df = new u16(32);
        var lc_1 = 0, eb = 0, i = 0, li = 0, wi = 0, bs = 0;
        for (; i < s; ++i) {
          var hv = hsh(i);
          var imod = i & 32767, pimod = head[hv];
          prev[imod] = pimod;
          head[hv] = imod;
          if (wi <= i) {
            var rem = s - i;
            if ((lc_1 > 7e3 || li > 24576) && rem > 423) {
              pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
              li = lc_1 = eb = 0, bs = i;
              for (var j = 0; j < 286; ++j)
                lf[j] = 0;
              for (var j = 0; j < 30; ++j)
                df[j] = 0;
            }
            var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
            if (rem > 2 && hv == hsh(i - dif)) {
              var maxn = Math.min(n, rem) - 1;
              var maxd = Math.min(32767, i);
              var ml = Math.min(258, rem);
              while (dif <= maxd && --ch_1 && imod != pimod) {
                if (dat[i + l] == dat[i + l - dif]) {
                  var nl = 0;
                  for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                    ;
                  if (nl > l) {
                    l = nl, d = dif;
                    if (nl > maxn)
                      break;
                    var mmd = Math.min(dif, nl - 2);
                    var md = 0;
                    for (var j = 0; j < mmd; ++j) {
                      var ti = i - dif + j + 32768 & 32767;
                      var pti = prev[ti];
                      var cd = ti - pti + 32768 & 32767;
                      if (cd > md)
                        md = cd, pimod = ti;
                    }
                  }
                }
                imod = pimod, pimod = prev[imod];
                dif += imod - pimod + 32768 & 32767;
              }
            }
            if (d) {
              syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
              var lin = revfl[l] & 31, din = revfd[d] & 31;
              eb += fleb[lin] + fdeb[din];
              ++lf[257 + lin];
              ++df[din];
              wi = i + l;
              ++lc_1;
            } else {
              syms[li++] = dat[i];
              ++lf[dat[i]];
            }
          }
        }
        pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
        if (!lst && pos & 7)
          pos = wfblk(w, pos + 1, et);
      }
      return slc(o, 0, pre + shft(pos) + post);
    };
    crct = /* @__PURE__ */ function() {
      var t = new Int32Array(256);
      for (var i = 0; i < 256; ++i) {
        var c = i, k = 9;
        while (--k)
          c = (c & 1 && -306674912) ^ c >>> 1;
        t[i] = c;
      }
      return t;
    }();
    crc = function() {
      var c = -1;
      return {
        p: function(d) {
          var cr = c;
          for (var i = 0; i < d.length; ++i)
            cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
          c = cr;
        },
        d: function() {
          return ~c;
        }
      };
    };
    adler = function() {
      var a = 1, b = 0;
      return {
        p: function(d) {
          var n = a, m = b;
          var l = d.length | 0;
          for (var i = 0; i != l; ) {
            var e = Math.min(i + 2655, l);
            for (; i < e; ++i)
              m += n += d[i];
            n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
          }
          a = n, b = m;
        },
        d: function() {
          a %= 65521, b %= 65521;
          return (a & 255) << 24 | a >>> 8 << 16 | (b & 255) << 8 | b >>> 8;
        }
      };
    };
    dopt = function(dat, opt, pre, post, st) {
      return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 12 + opt.mem, pre, post, !st);
    };
    mrg = function(a, b) {
      var o = {};
      for (var k in a)
        o[k] = a[k];
      for (var k in b)
        o[k] = b[k];
      return o;
    };
    wcln = function(fn, fnStr, td2) {
      var dt = fn();
      var st = fn.toString();
      var ks = st.slice(st.indexOf("[") + 1, st.lastIndexOf("]")).replace(/\s+/g, "").split(",");
      for (var i = 0; i < dt.length; ++i) {
        var v = dt[i], k = ks[i];
        if (typeof v == "function") {
          fnStr += ";" + k + "=";
          var st_1 = v.toString();
          if (v.prototype) {
            if (st_1.indexOf("[native code]") != -1) {
              var spInd = st_1.indexOf(" ", 8) + 1;
              fnStr += st_1.slice(spInd, st_1.indexOf("(", spInd));
            } else {
              fnStr += st_1;
              for (var t in v.prototype)
                fnStr += ";" + k + ".prototype." + t + "=" + v.prototype[t].toString();
            }
          } else
            fnStr += st_1;
        } else
          td2[k] = v;
      }
      return [fnStr, td2];
    };
    ch = [];
    cbfs = function(v) {
      var tl = [];
      for (var k in v) {
        if (v[k].buffer) {
          tl.push((v[k] = new v[k].constructor(v[k])).buffer);
        }
      }
      return tl;
    };
    wrkr = function(fns, init, id, cb) {
      var _a2;
      if (!ch[id]) {
        var fnStr = "", td_1 = {}, m = fns.length - 1;
        for (var i = 0; i < m; ++i)
          _a2 = wcln(fns[i], fnStr, td_1), fnStr = _a2[0], td_1 = _a2[1];
        ch[id] = wcln(fns[m], fnStr, td_1);
      }
      var td2 = mrg({}, ch[id][1]);
      return wk(ch[id][0] + ";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=" + init.toString() + "}", id, td2, cbfs(td2), cb);
    };
    bInflt = function() {
      return [u8, u16, u32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, ec, hMap, max, bits, bits16, shft, slc, err, inflt, inflateSync, pbf, gu8];
    };
    bDflt = function() {
      return [u8, u16, u32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf];
    };
    gze = function() {
      return [gzh, gzhl, wbytes, crc, crct];
    };
    guze = function() {
      return [gzs, gzl];
    };
    zle = function() {
      return [zlh, wbytes, adler];
    };
    zule = function() {
      return [zlv];
    };
    pbf = function(msg) {
      return postMessage(msg, [msg.buffer]);
    };
    gu8 = function(o) {
      return o && o.size && new u8(o.size);
    };
    cbify = function(dat, opts, fns, init, id, cb) {
      var w = wrkr(fns, init, id, function(err2, dat2) {
        w.terminate();
        cb(err2, dat2);
      });
      w.postMessage([dat, opts], opts.consume ? [dat.buffer] : []);
      return function() {
        w.terminate();
      };
    };
    astrm = function(strm) {
      strm.ondata = function(dat, final) {
        return postMessage([dat, final], [dat.buffer]);
      };
      return function(ev) {
        return strm.push(ev.data[0], ev.data[1]);
      };
    };
    astrmify = function(fns, strm, opts, init, id) {
      var t;
      var w = wrkr(fns, init, id, function(err2, dat) {
        if (err2)
          w.terminate(), strm.ondata.call(strm, err2);
        else {
          if (dat[1])
            w.terminate();
          strm.ondata.call(strm, err2, dat[0], dat[1]);
        }
      });
      w.postMessage(opts);
      strm.push = function(d, f) {
        if (!strm.ondata)
          err(5);
        if (t)
          strm.ondata(err(4, 0, 1), null, !!f);
        w.postMessage([d, t = f], [d.buffer]);
      };
      strm.terminate = function() {
        w.terminate();
      };
    };
    b2 = function(d, b) {
      return d[b] | d[b + 1] << 8;
    };
    b4 = function(d, b) {
      return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
    };
    b8 = function(d, b) {
      return b4(d, b) + b4(d, b + 4) * 4294967296;
    };
    wbytes = function(d, b, v) {
      for (; v; ++b)
        d[b] = v, v >>>= 8;
    };
    gzh = function(c, o) {
      var fn = o.filename;
      c[0] = 31, c[1] = 139, c[2] = 8, c[8] = o.level < 2 ? 4 : o.level == 9 ? 2 : 0, c[9] = 3;
      if (o.mtime != 0)
        wbytes(c, 4, Math.floor(new Date(o.mtime || Date.now()) / 1e3));
      if (fn) {
        c[3] = 8;
        for (var i = 0; i <= fn.length; ++i)
          c[i + 10] = fn.charCodeAt(i);
      }
    };
    gzs = function(d) {
      if (d[0] != 31 || d[1] != 139 || d[2] != 8)
        err(6, "invalid gzip data");
      var flg = d[3];
      var st = 10;
      if (flg & 4)
        st += d[10] | (d[11] << 8) + 2;
      for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++])
        ;
      return st + (flg & 2);
    };
    gzl = function(d) {
      var l = d.length;
      return (d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16 | d[l - 1] << 24) >>> 0;
    };
    gzhl = function(o) {
      return 10 + (o.filename && o.filename.length + 1 || 0);
    };
    zlh = function(c, o) {
      var lv = o.level, fl2 = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
      c[0] = 120, c[1] = fl2 << 6 | (fl2 ? 32 - 2 * fl2 : 1);
    };
    zlv = function(d) {
      if ((d[0] & 15) != 8 || d[0] >>> 4 > 7 || (d[0] << 8 | d[1]) % 31)
        err(6, "invalid zlib data");
      if (d[1] & 32)
        err(6, "invalid zlib data: preset dictionaries not supported");
    };
    Deflate = /* @__PURE__ */ function() {
      function Deflate2(opts, cb) {
        if (!cb && typeof opts == "function")
          cb = opts, opts = {};
        this.ondata = cb;
        this.o = opts || {};
      }
      Deflate2.prototype.p = function(c, f) {
        this.ondata(dopt(c, this.o, 0, 0, !f), f);
      };
      Deflate2.prototype.push = function(chunk, final) {
        if (!this.ondata)
          err(5);
        if (this.d)
          err(4);
        this.d = final;
        this.p(chunk, final || false);
      };
      return Deflate2;
    }();
    AsyncDeflate = /* @__PURE__ */ function() {
      function AsyncDeflate2(opts, cb) {
        astrmify([
          bDflt,
          function() {
            return [astrm, Deflate];
          }
        ], this, AsyncCmpStrm.call(this, opts, cb), function(ev) {
          var strm = new Deflate(ev.data);
          onmessage = astrm(strm);
        }, 6);
      }
      return AsyncDeflate2;
    }();
    Inflate = /* @__PURE__ */ function() {
      function Inflate2(cb) {
        this.s = {};
        this.p = new u8(0);
        this.ondata = cb;
      }
      Inflate2.prototype.e = function(c) {
        if (!this.ondata)
          err(5);
        if (this.d)
          err(4);
        var l = this.p.length;
        var n = new u8(l + c.length);
        n.set(this.p), n.set(c, l), this.p = n;
      };
      Inflate2.prototype.c = function(final) {
        this.d = this.s.i = final || false;
        var bts = this.s.b;
        var dt = inflt(this.p, this.o, this.s);
        this.ondata(slc(dt, bts, this.s.b), this.d);
        this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
        this.p = slc(this.p, this.s.p / 8 | 0), this.s.p &= 7;
      };
      Inflate2.prototype.push = function(chunk, final) {
        this.e(chunk), this.c(final);
      };
      return Inflate2;
    }();
    AsyncInflate = /* @__PURE__ */ function() {
      function AsyncInflate2(cb) {
        this.ondata = cb;
        astrmify([
          bInflt,
          function() {
            return [astrm, Inflate];
          }
        ], this, 0, function() {
          var strm = new Inflate();
          onmessage = astrm(strm);
        }, 7);
      }
      return AsyncInflate2;
    }();
    Gzip = /* @__PURE__ */ function() {
      function Gzip2(opts, cb) {
        this.c = crc();
        this.l = 0;
        this.v = 1;
        Deflate.call(this, opts, cb);
      }
      Gzip2.prototype.push = function(chunk, final) {
        Deflate.prototype.push.call(this, chunk, final);
      };
      Gzip2.prototype.p = function(c, f) {
        this.c.p(c);
        this.l += c.length;
        var raw = dopt(c, this.o, this.v && gzhl(this.o), f && 8, !f);
        if (this.v)
          gzh(raw, this.o), this.v = 0;
        if (f)
          wbytes(raw, raw.length - 8, this.c.d()), wbytes(raw, raw.length - 4, this.l);
        this.ondata(raw, f);
      };
      return Gzip2;
    }();
    AsyncGzip = /* @__PURE__ */ function() {
      function AsyncGzip2(opts, cb) {
        astrmify([
          bDflt,
          gze,
          function() {
            return [astrm, Deflate, Gzip];
          }
        ], this, AsyncCmpStrm.call(this, opts, cb), function(ev) {
          var strm = new Gzip(ev.data);
          onmessage = astrm(strm);
        }, 8);
      }
      return AsyncGzip2;
    }();
    Gunzip = /* @__PURE__ */ function() {
      function Gunzip2(cb) {
        this.v = 1;
        Inflate.call(this, cb);
      }
      Gunzip2.prototype.push = function(chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        if (this.v) {
          var s = this.p.length > 3 ? gzs(this.p) : 4;
          if (s >= this.p.length && !final)
            return;
          this.p = this.p.subarray(s), this.v = 0;
        }
        if (final) {
          if (this.p.length < 8)
            err(6, "invalid gzip data");
          this.p = this.p.subarray(0, -8);
        }
        Inflate.prototype.c.call(this, final);
      };
      return Gunzip2;
    }();
    AsyncGunzip = /* @__PURE__ */ function() {
      function AsyncGunzip2(cb) {
        this.ondata = cb;
        astrmify([
          bInflt,
          guze,
          function() {
            return [astrm, Inflate, Gunzip];
          }
        ], this, 0, function() {
          var strm = new Gunzip();
          onmessage = astrm(strm);
        }, 9);
      }
      return AsyncGunzip2;
    }();
    Zlib = /* @__PURE__ */ function() {
      function Zlib2(opts, cb) {
        this.c = adler();
        this.v = 1;
        Deflate.call(this, opts, cb);
      }
      Zlib2.prototype.push = function(chunk, final) {
        Deflate.prototype.push.call(this, chunk, final);
      };
      Zlib2.prototype.p = function(c, f) {
        this.c.p(c);
        var raw = dopt(c, this.o, this.v && 2, f && 4, !f);
        if (this.v)
          zlh(raw, this.o), this.v = 0;
        if (f)
          wbytes(raw, raw.length - 4, this.c.d());
        this.ondata(raw, f);
      };
      return Zlib2;
    }();
    AsyncZlib = /* @__PURE__ */ function() {
      function AsyncZlib2(opts, cb) {
        astrmify([
          bDflt,
          zle,
          function() {
            return [astrm, Deflate, Zlib];
          }
        ], this, AsyncCmpStrm.call(this, opts, cb), function(ev) {
          var strm = new Zlib(ev.data);
          onmessage = astrm(strm);
        }, 10);
      }
      return AsyncZlib2;
    }();
    Unzlib = /* @__PURE__ */ function() {
      function Unzlib2(cb) {
        this.v = 1;
        Inflate.call(this, cb);
      }
      Unzlib2.prototype.push = function(chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        if (this.v) {
          if (this.p.length < 2 && !final)
            return;
          this.p = this.p.subarray(2), this.v = 0;
        }
        if (final) {
          if (this.p.length < 4)
            err(6, "invalid zlib data");
          this.p = this.p.subarray(0, -4);
        }
        Inflate.prototype.c.call(this, final);
      };
      return Unzlib2;
    }();
    AsyncUnzlib = /* @__PURE__ */ function() {
      function AsyncUnzlib2(cb) {
        this.ondata = cb;
        astrmify([
          bInflt,
          zule,
          function() {
            return [astrm, Inflate, Unzlib];
          }
        ], this, 0, function() {
          var strm = new Unzlib();
          onmessage = astrm(strm);
        }, 11);
      }
      return AsyncUnzlib2;
    }();
    Decompress = /* @__PURE__ */ function() {
      function Decompress2(cb) {
        this.G = Gunzip;
        this.I = Inflate;
        this.Z = Unzlib;
        this.ondata = cb;
      }
      Decompress2.prototype.push = function(chunk, final) {
        if (!this.ondata)
          err(5);
        if (!this.s) {
          if (this.p && this.p.length) {
            var n = new u8(this.p.length + chunk.length);
            n.set(this.p), n.set(chunk, this.p.length);
          } else
            this.p = chunk;
          if (this.p.length > 2) {
            var _this_1 = this;
            var cb = function() {
              _this_1.ondata.apply(_this_1, arguments);
            };
            this.s = this.p[0] == 31 && this.p[1] == 139 && this.p[2] == 8 ? new this.G(cb) : (this.p[0] & 15) != 8 || this.p[0] >> 4 > 7 || (this.p[0] << 8 | this.p[1]) % 31 ? new this.I(cb) : new this.Z(cb);
            this.s.push(this.p, final);
            this.p = null;
          }
        } else
          this.s.push(chunk, final);
      };
      return Decompress2;
    }();
    AsyncDecompress = /* @__PURE__ */ function() {
      function AsyncDecompress2(cb) {
        this.G = AsyncGunzip;
        this.I = AsyncInflate;
        this.Z = AsyncUnzlib;
        this.ondata = cb;
      }
      AsyncDecompress2.prototype.push = function(chunk, final) {
        Decompress.prototype.push.call(this, chunk, final);
      };
      return AsyncDecompress2;
    }();
    fltn = function(d, p, t, o) {
      for (var k in d) {
        var val = d[k], n = p + k, op = o;
        if (Array.isArray(val))
          op = mrg(o, val[1]), val = val[0];
        if (val instanceof u8)
          t[n] = [val, op];
        else {
          t[n += "/"] = [new u8(0), op];
          fltn(val, n, t, o);
        }
      }
    };
    te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
    td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
    tds = 0;
    try {
      td.decode(et, { stream: true });
      tds = 1;
    } catch (e) {
    }
    dutf8 = function(d) {
      for (var r = "", i = 0; ; ) {
        var c = d[i++];
        var eb = (c > 127) + (c > 223) + (c > 239);
        if (i + eb > d.length)
          return [r, slc(d, i - 1)];
        if (!eb)
          r += String.fromCharCode(c);
        else if (eb == 3) {
          c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
        } else if (eb & 1)
          r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
        else
          r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
      }
    };
    DecodeUTF8 = /* @__PURE__ */ function() {
      function DecodeUTF82(cb) {
        this.ondata = cb;
        if (tds)
          this.t = new TextDecoder();
        else
          this.p = et;
      }
      DecodeUTF82.prototype.push = function(chunk, final) {
        if (!this.ondata)
          err(5);
        final = !!final;
        if (this.t) {
          this.ondata(this.t.decode(chunk, { stream: true }), final);
          if (final) {
            if (this.t.decode().length)
              err(8);
            this.t = null;
          }
          return;
        }
        if (!this.p)
          err(4);
        var dat = new u8(this.p.length + chunk.length);
        dat.set(this.p);
        dat.set(chunk, this.p.length);
        var _a2 = dutf8(dat), ch2 = _a2[0], np = _a2[1];
        if (final) {
          if (np.length)
            err(8);
          this.p = null;
        } else
          this.p = np;
        this.ondata(ch2, final);
      };
      return DecodeUTF82;
    }();
    EncodeUTF8 = /* @__PURE__ */ function() {
      function EncodeUTF82(cb) {
        this.ondata = cb;
      }
      EncodeUTF82.prototype.push = function(chunk, final) {
        if (!this.ondata)
          err(5);
        if (this.d)
          err(4);
        this.ondata(strToU8(chunk), this.d = final || false);
      };
      return EncodeUTF82;
    }();
    dbf = function(l) {
      return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0;
    };
    slzh = function(d, b) {
      return b + 30 + b2(d, b + 26) + b2(d, b + 28);
    };
    zh = function(d, b, z) {
      var fnl = b2(d, b + 28), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl, bs = b4(d, b + 20);
      var _a2 = z && bs == 4294967295 ? z64e(d, es) : [bs, b4(d, b + 24), b4(d, b + 42)], sc = _a2[0], su = _a2[1], off = _a2[2];
      return [b2(d, b + 10), sc, su, fn, es + b2(d, b + 30) + b2(d, b + 32), off];
    };
    z64e = function(d, b) {
      for (; b2(d, b) != 1; b += 4 + b2(d, b + 2))
        ;
      return [b8(d, b + 12), b8(d, b + 4), b8(d, b + 20)];
    };
    exfl = function(ex) {
      var le = 0;
      if (ex) {
        for (var k in ex) {
          var l = ex[k].length;
          if (l > 65535)
            err(9);
          le += l + 4;
        }
      }
      return le;
    };
    wzh = function(d, b, f, fn, u, c, ce, co) {
      var fl2 = fn.length, ex = f.extra, col = co && co.length;
      var exl = exfl(ex);
      wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
      if (ce != null)
        d[b++] = 20, d[b++] = f.os;
      d[b] = 20, b += 2;
      d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
      d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
      var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
      if (y < 0 || y > 119)
        err(10);
      wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >>> 1), b += 4;
      if (c != -1) {
        wbytes(d, b, f.crc);
        wbytes(d, b + 4, c < 0 ? -c - 2 : c);
        wbytes(d, b + 8, f.size);
      }
      wbytes(d, b + 12, fl2);
      wbytes(d, b + 14, exl), b += 16;
      if (ce != null) {
        wbytes(d, b, col);
        wbytes(d, b + 6, f.attrs);
        wbytes(d, b + 10, ce), b += 14;
      }
      d.set(fn, b);
      b += fl2;
      if (exl) {
        for (var k in ex) {
          var exf = ex[k], l = exf.length;
          wbytes(d, b, +k);
          wbytes(d, b + 2, l);
          d.set(exf, b + 4), b += 4 + l;
        }
      }
      if (col)
        d.set(co, b), b += col;
      return b;
    };
    wzf = function(o, b, c, d, e) {
      wbytes(o, b, 101010256);
      wbytes(o, b + 8, c);
      wbytes(o, b + 10, c);
      wbytes(o, b + 12, d);
      wbytes(o, b + 16, e);
    };
    ZipPassThrough = /* @__PURE__ */ function() {
      function ZipPassThrough2(filename) {
        this.filename = filename;
        this.c = crc();
        this.size = 0;
        this.compression = 0;
      }
      ZipPassThrough2.prototype.process = function(chunk, final) {
        this.ondata(null, chunk, final);
      };
      ZipPassThrough2.prototype.push = function(chunk, final) {
        if (!this.ondata)
          err(5);
        this.c.p(chunk);
        this.size += chunk.length;
        if (final)
          this.crc = this.c.d();
        this.process(chunk, final || false);
      };
      return ZipPassThrough2;
    }();
    ZipDeflate = /* @__PURE__ */ function() {
      function ZipDeflate2(filename, opts) {
        var _this_1 = this;
        if (!opts)
          opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new Deflate(opts, function(dat, final) {
          _this_1.ondata(null, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
      }
      ZipDeflate2.prototype.process = function(chunk, final) {
        try {
          this.d.push(chunk, final);
        } catch (e) {
          this.ondata(e, null, final);
        }
      };
      ZipDeflate2.prototype.push = function(chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
      };
      return ZipDeflate2;
    }();
    AsyncZipDeflate = /* @__PURE__ */ function() {
      function AsyncZipDeflate2(filename, opts) {
        var _this_1 = this;
        if (!opts)
          opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new AsyncDeflate(opts, function(err2, dat, final) {
          _this_1.ondata(err2, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
        this.terminate = this.d.terminate;
      }
      AsyncZipDeflate2.prototype.process = function(chunk, final) {
        this.d.push(chunk, final);
      };
      AsyncZipDeflate2.prototype.push = function(chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
      };
      return AsyncZipDeflate2;
    }();
    Zip = /* @__PURE__ */ function() {
      function Zip2(cb) {
        this.ondata = cb;
        this.u = [];
        this.d = 1;
      }
      Zip2.prototype.add = function(file) {
        var _this_1 = this;
        if (!this.ondata)
          err(5);
        if (this.d & 2)
          this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false);
        else {
          var f = strToU8(file.filename), fl_1 = f.length;
          var com = file.comment, o = com && strToU8(com);
          var u = fl_1 != file.filename.length || o && com.length != o.length;
          var hl_1 = fl_1 + exfl(file.extra) + 30;
          if (fl_1 > 65535)
            this.ondata(err(11, 0, 1), null, false);
          var header = new u8(hl_1);
          wzh(header, 0, file, f, u, -1);
          var chks_1 = [header];
          var pAll_1 = function() {
            for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
              var chk = chks_2[_i];
              _this_1.ondata(null, chk, false);
            }
            chks_1 = [];
          };
          var tr_1 = this.d;
          this.d = 0;
          var ind_1 = this.u.length;
          var uf_1 = mrg(file, {
            f,
            u,
            o,
            t: function() {
              if (file.terminate)
                file.terminate();
            },
            r: function() {
              pAll_1();
              if (tr_1) {
                var nxt = _this_1.u[ind_1 + 1];
                if (nxt)
                  nxt.r();
                else
                  _this_1.d = 1;
              }
              tr_1 = 1;
            }
          });
          var cl_1 = 0;
          file.ondata = function(err2, dat, final) {
            if (err2) {
              _this_1.ondata(err2, dat, final);
              _this_1.terminate();
            } else {
              cl_1 += dat.length;
              chks_1.push(dat);
              if (final) {
                var dd = new u8(16);
                wbytes(dd, 0, 134695760);
                wbytes(dd, 4, file.crc);
                wbytes(dd, 8, cl_1);
                wbytes(dd, 12, file.size);
                chks_1.push(dd);
                uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
                if (tr_1)
                  uf_1.r();
                tr_1 = 1;
              } else if (tr_1)
                pAll_1();
            }
          };
          this.u.push(uf_1);
        }
      };
      Zip2.prototype.end = function() {
        var _this_1 = this;
        if (this.d & 2) {
          this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
          return;
        }
        if (this.d)
          this.e();
        else
          this.u.push({
            r: function() {
              if (!(_this_1.d & 1))
                return;
              _this_1.u.splice(-1, 1);
              _this_1.e();
            },
            t: function() {
            }
          });
        this.d = 3;
      };
      Zip2.prototype.e = function() {
        var bt = 0, l = 0, tl = 0;
        for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
          var f = _a2[_i];
          tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
        }
        var out = new u8(tl + 22);
        for (var _b2 = 0, _c = this.u; _b2 < _c.length; _b2++) {
          var f = _c[_b2];
          wzh(out, bt, f, f.f, f.u, -f.c - 2, l, f.o);
          bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
        }
        wzf(out, bt, this.u.length, tl, l);
        this.ondata(null, out, true);
        this.d = 2;
      };
      Zip2.prototype.terminate = function() {
        for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
          var f = _a2[_i];
          f.t();
        }
        this.d = 2;
      };
      return Zip2;
    }();
    UnzipPassThrough = /* @__PURE__ */ function() {
      function UnzipPassThrough2() {
      }
      UnzipPassThrough2.prototype.push = function(data, final) {
        this.ondata(null, data, final);
      };
      UnzipPassThrough2.compression = 0;
      return UnzipPassThrough2;
    }();
    UnzipInflate = /* @__PURE__ */ function() {
      function UnzipInflate2() {
        var _this_1 = this;
        this.i = new Inflate(function(dat, final) {
          _this_1.ondata(null, dat, final);
        });
      }
      UnzipInflate2.prototype.push = function(data, final) {
        try {
          this.i.push(data, final);
        } catch (e) {
          this.ondata(e, null, final);
        }
      };
      UnzipInflate2.compression = 8;
      return UnzipInflate2;
    }();
    AsyncUnzipInflate = /* @__PURE__ */ function() {
      function AsyncUnzipInflate2(_, sz) {
        var _this_1 = this;
        if (sz < 32e4) {
          this.i = new Inflate(function(dat, final) {
            _this_1.ondata(null, dat, final);
          });
        } else {
          this.i = new AsyncInflate(function(err2, dat, final) {
            _this_1.ondata(err2, dat, final);
          });
          this.terminate = this.i.terminate;
        }
      }
      AsyncUnzipInflate2.prototype.push = function(data, final) {
        if (this.i.terminate)
          data = slc(data, 0);
        this.i.push(data, final);
      };
      AsyncUnzipInflate2.compression = 8;
      return AsyncUnzipInflate2;
    }();
    Unzip = /* @__PURE__ */ function() {
      function Unzip2(cb) {
        this.onfile = cb;
        this.k = [];
        this.o = {
          0: UnzipPassThrough
        };
        this.p = et;
      }
      Unzip2.prototype.push = function(chunk, final) {
        var _this_1 = this;
        if (!this.onfile)
          err(5);
        if (!this.p)
          err(4);
        if (this.c > 0) {
          var len = Math.min(this.c, chunk.length);
          var toAdd = chunk.subarray(0, len);
          this.c -= len;
          if (this.d)
            this.d.push(toAdd, !this.c);
          else
            this.k[0].push(toAdd);
          chunk = chunk.subarray(len);
          if (chunk.length)
            return this.push(chunk, final);
        } else {
          var f = 0, i = 0, is = void 0, buf = void 0;
          if (!this.p.length)
            buf = chunk;
          else if (!chunk.length)
            buf = this.p;
          else {
            buf = new u8(this.p.length + chunk.length);
            buf.set(this.p), buf.set(chunk, this.p.length);
          }
          var l = buf.length, oc = this.c, add = oc && this.d;
          var _loop_2 = function() {
            var _a2;
            var sig = b4(buf, i);
            if (sig == 67324752) {
              f = 1, is = i;
              this_1.d = null;
              this_1.c = 0;
              var bf = b2(buf, i + 6), cmp_1 = b2(buf, i + 8), u = bf & 2048, dd = bf & 8, fnl = b2(buf, i + 26), es = b2(buf, i + 28);
              if (l > i + 30 + fnl + es) {
                var chks_3 = [];
                this_1.k.unshift(chks_3);
                f = 2;
                var sc_1 = b4(buf, i + 18), su_1 = b4(buf, i + 22);
                var fn_1 = strFromU8(buf.subarray(i + 30, i += 30 + fnl), !u);
                if (sc_1 == 4294967295) {
                  _a2 = dd ? [-2] : z64e(buf, i), sc_1 = _a2[0], su_1 = _a2[1];
                } else if (dd)
                  sc_1 = -1;
                i += es;
                this_1.c = sc_1;
                var d_1;
                var file_1 = {
                  name: fn_1,
                  compression: cmp_1,
                  start: function() {
                    if (!file_1.ondata)
                      err(5);
                    if (!sc_1)
                      file_1.ondata(null, et, true);
                    else {
                      var ctr = _this_1.o[cmp_1];
                      if (!ctr)
                        file_1.ondata(err(14, "unknown compression type " + cmp_1, 1), null, false);
                      d_1 = sc_1 < 0 ? new ctr(fn_1) : new ctr(fn_1, sc_1, su_1);
                      d_1.ondata = function(err2, dat3, final2) {
                        file_1.ondata(err2, dat3, final2);
                      };
                      for (var _i = 0, chks_4 = chks_3; _i < chks_4.length; _i++) {
                        var dat2 = chks_4[_i];
                        d_1.push(dat2, false);
                      }
                      if (_this_1.k[0] == chks_3 && _this_1.c)
                        _this_1.d = d_1;
                      else
                        d_1.push(et, true);
                    }
                  },
                  terminate: function() {
                    if (d_1 && d_1.terminate)
                      d_1.terminate();
                  }
                };
                if (sc_1 >= 0)
                  file_1.size = sc_1, file_1.originalSize = su_1;
                this_1.onfile(file_1);
              }
              return "break";
            } else if (oc) {
              if (sig == 134695760) {
                is = i += 12 + (oc == -2 && 8), f = 3, this_1.c = 0;
                return "break";
              } else if (sig == 33639248) {
                is = i -= 4, f = 3, this_1.c = 0;
                return "break";
              }
            }
          };
          var this_1 = this;
          for (; i < l - 4; ++i) {
            var state_1 = _loop_2();
            if (state_1 === "break")
              break;
          }
          this.p = et;
          if (oc < 0) {
            var dat = f ? buf.subarray(0, is - 12 - (oc == -2 && 8) - (b4(buf, is - 16) == 134695760 && 4)) : buf.subarray(0, i);
            if (add)
              add.push(dat, !!f);
            else
              this.k[+(f == 2)].push(dat);
          }
          if (f & 2)
            return this.push(buf.subarray(i), final);
          this.p = buf.subarray(i);
        }
        if (final) {
          if (this.c)
            err(13);
          this.p = null;
        }
      };
      Unzip2.prototype.register = function(decoder) {
        this.o[decoder.compression] = decoder;
      };
      return Unzip2;
    }();
    mt = typeof queueMicrotask == "function" ? queueMicrotask : typeof setTimeout == "function" ? setTimeout : function(fn) {
      fn();
    };
  }
});

// node_modules/roxify/dist/cli.js
var import_cli_progress3 = __toESM(require_cli_progress(), 1);
var import_fs4 = require("fs");
var import_path4 = require("path");

// node_modules/roxify/dist/utils/constants.js
var CHUNK_TYPE = "rXDT";
var MAGIC = Buffer.from("ROX1");
var PIXEL_MAGIC = Buffer.from("PXL1");
var ENC_NONE = 0;
var ENC_AES = 1;
var ENC_XOR = 2;
var FILTER_ZERO = Buffer.from([0]);
var PNG_HEADER = Buffer.from([
  137,
  80,
  78,
  71,
  13,
  10,
  26,
  10
]);
var PNG_HEADER_HEX = PNG_HEADER.toString("hex");
var MARKER_COLORS = [
  { r: 255, g: 0, b: 0 },
  { r: 0, g: 255, b: 0 },
  { r: 0, g: 0, b: 255 }
];
var MARKER_START = MARKER_COLORS;
var MARKER_END = [...MARKER_COLORS].reverse();
var COMPRESSION_MARKERS = {
  zstd: [{ r: 0, g: 255, b: 0 }],
  lzma: [{ r: 255, g: 255, b: 0 }]
};

// node_modules/roxify/dist/utils/crc.js
var CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 3988292384 ^ c >>> 1;
    } else {
      c = c >>> 1;
    }
  }
  CRC_TABLE[n] = c;
}
function crc32(buf, previous = 0) {
  let crc2 = previous ^ 4294967295;
  for (let i = 0; i < buf.length; i++) {
    crc2 = CRC_TABLE[(crc2 ^ buf[i]) & 255] ^ crc2 >>> 8;
  }
  return (crc2 ^ 4294967295) >>> 0;
}

// node_modules/roxify/dist/utils/decoder.js
var import_cli_progress = __toESM(require_cli_progress(), 1);
var import_fs2 = require("fs");
var import_png_chunks_extract = __toESM(require_png_chunks_extract(), 1);
var import_sharp2 = __toESM(require_lib(), 1);

// node_modules/roxify/dist/pack.js
var import_fs = require("fs");
var import_path = require("path");
function* collectFilesGenerator(paths) {
  for (const p of paths) {
    const abs = (0, import_path.resolve)(p);
    const st = (0, import_fs.statSync)(abs);
    if (st.isFile()) {
      yield abs;
    } else if (st.isDirectory()) {
      const names = (0, import_fs.readdirSync)(abs);
      const childPaths = names.map((n) => (0, import_path.join)(abs, n));
      yield* collectFilesGenerator(childPaths);
    }
  }
}
function unpackBuffer(buf, fileList) {
  if (buf.length < 8)
    return null;
  const magic = buf.readUInt32BE(0);
  if (magic === 1380931657) {
    const indexLen = buf.readUInt32BE(4);
    const indexBuf = buf.slice(8, 8 + indexLen);
    const index = JSON.parse(indexBuf.toString("utf8"));
    const dataStart = 8 + indexLen;
    const files2 = [];
    const entriesToProcess = fileList ? index.filter((e) => fileList.includes(e.path)) : index;
    for (const entry of entriesToProcess) {
      const entryStart = dataStart + entry.offset;
      let ptr = entryStart;
      if (ptr + 2 > buf.length)
        continue;
      const nameLen = buf.readUInt16BE(ptr);
      ptr += 2;
      ptr += nameLen;
      ptr += 8;
      if (ptr + entry.size > buf.length)
        continue;
      const content = buf.slice(ptr, ptr + entry.size);
      files2.push({ path: entry.path, buf: content });
    }
    return { files: files2 };
  }
  if (magic !== 1380931664)
    return null;
  const header = buf.slice(0, 8);
  const fileCount = header.readUInt32BE(4);
  let offset = 8;
  const files = [];
  for (let i = 0; i < fileCount; i++) {
    if (offset + 2 > buf.length)
      return null;
    const nameLen = buf.readUInt16BE(offset);
    offset += 2;
    if (offset + nameLen > buf.length)
      return null;
    const name = buf.slice(offset, offset + nameLen).toString("utf8");
    offset += nameLen;
    if (offset + 8 > buf.length)
      return null;
    const size = buf.readBigUInt64BE(offset);
    offset += 8;
    if (offset + Number(size) > buf.length)
      return null;
    const content = buf.slice(offset, offset + Number(size));
    offset += Number(size);
    files.push({ path: name, buf: content });
  }
  if (fileList) {
    const filtered = files.filter((f) => fileList.includes(f.path));
    return { files: filtered };
  }
  return { files };
}
async function packPathsGenerator(paths, baseDir, onProgress) {
  const files = [];
  for (const f of collectFilesGenerator(paths)) {
    files.push(f);
  }
  files.sort((a, b) => {
    const extA = (0, import_path.extname)(a);
    const extB = (0, import_path.extname)(b);
    if (extA !== extB)
      return extA.localeCompare(extB);
    return a.localeCompare(b);
  });
  const base = baseDir ? (0, import_path.resolve)(baseDir) : process.cwd();
  const BLOCK_SIZE = 8 * 1024 * 1024;
  const index = [];
  let currentBlockId = 0;
  let currentBlockSize = 0;
  let globalDataOffset = 0;
  let totalSize = 0;
  for (const f of files) {
    const st = (0, import_fs.statSync)(f);
    const rel = (0, import_path.relative)(base, f).split(import_path.sep).join("/");
    const nameBuf = Buffer.from(rel, "utf8");
    const entrySize = 2 + nameBuf.length + 8 + st.size;
    if (currentBlockSize + entrySize > BLOCK_SIZE && currentBlockSize > 0) {
      currentBlockId++;
      currentBlockSize = 0;
    }
    index.push({
      path: rel,
      blockId: currentBlockId,
      offset: globalDataOffset,
      size: st.size
    });
    currentBlockSize += entrySize;
    globalDataOffset += entrySize;
    totalSize += st.size;
  }
  async function* streamGenerator() {
    const indexBuf = Buffer.from(JSON.stringify(index), "utf8");
    const indexHeader = Buffer.alloc(8);
    indexHeader.writeUInt32BE(1380931657, 0);
    indexHeader.writeUInt32BE(indexBuf.length, 4);
    yield Buffer.concat([indexHeader, indexBuf]);
    let currentBuffer = Buffer.alloc(0);
    let readSoFar = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const rel = (0, import_path.relative)(base, f).split(import_path.sep).join("/");
      const content = (0, import_fs.readFileSync)(f);
      const nameBuf = Buffer.from(rel, "utf8");
      const nameLen = Buffer.alloc(2);
      nameLen.writeUInt16BE(nameBuf.length, 0);
      const sizeBuf = Buffer.alloc(8);
      sizeBuf.writeBigUInt64BE(BigInt(content.length), 0);
      const entry = Buffer.concat([nameLen, nameBuf, sizeBuf, content]);
      if (currentBuffer.length + entry.length > BLOCK_SIZE && currentBuffer.length > 0) {
        yield currentBuffer;
        currentBuffer = Buffer.alloc(0);
      }
      currentBuffer = Buffer.concat([currentBuffer, entry]);
      readSoFar += content.length;
      if (onProgress)
        onProgress(readSoFar, totalSize, rel);
    }
    if (currentBuffer.length > 0) {
      yield currentBuffer;
    }
  }
  return { index, stream: streamGenerator(), totalSize };
}

// node_modules/roxify/dist/utils/errors.js
var PassphraseRequiredError = class extends Error {
  constructor(message = "Passphrase required") {
    super(message);
    this.name = "PassphraseRequiredError";
  }
};
var IncorrectPassphraseError = class extends Error {
  constructor(message = "Incorrect passphrase") {
    super(message);
    this.name = "IncorrectPassphraseError";
  }
};
var DataFormatError = class extends Error {
  constructor(message = "Data format error") {
    super(message);
    this.name = "DataFormatError";
  }
};

// node_modules/roxify/dist/utils/helpers.js
var import_crypto = require("crypto");
function colorsToBytes(colors) {
  const buf = Buffer.alloc(colors.length * 3);
  for (let i = 0; i < colors.length; i++) {
    buf[i * 3] = colors[i].r;
    buf[i * 3 + 1] = colors[i].g;
    buf[i * 3 + 2] = colors[i].b;
  }
  return buf;
}
function deltaDecode(data) {
  if (data.length === 0)
    return data;
  const out = Buffer.alloc(data.length);
  out[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    out[i] = out[i - 1] + data[i] & 255;
  }
  return out;
}
function applyXor(buf, passphrase) {
  const key = Buffer.from(passphrase, "utf8");
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ key[i % key.length];
  }
  return out;
}
function tryDecryptIfNeeded(buf, passphrase) {
  if (!buf || buf.length === 0)
    return buf;
  const flag = buf[0];
  if (flag === ENC_AES) {
    const MIN_AES_LEN = 1 + 16 + 12 + 16 + 1;
    if (buf.length < MIN_AES_LEN)
      throw new IncorrectPassphraseError();
    if (!passphrase)
      throw new PassphraseRequiredError();
    const salt = buf.slice(1, 17);
    const iv = buf.slice(17, 29);
    const tag = buf.slice(29, 45);
    const enc = buf.slice(45);
    const PBKDF2_ITERS = 1e6;
    const key = (0, import_crypto.pbkdf2Sync)(passphrase, salt, PBKDF2_ITERS, 32, "sha256");
    const dec = (0, import_crypto.createDecipheriv)("aes-256-gcm", key, iv);
    dec.setAuthTag(tag);
    try {
      const decrypted = Buffer.concat([dec.update(enc), dec.final()]);
      return decrypted;
    } catch (e) {
      throw new IncorrectPassphraseError();
    }
  }
  if (flag === ENC_XOR) {
    if (!passphrase)
      throw new PassphraseRequiredError();
    return applyXor(buf.slice(1), passphrase);
  }
  if (flag === ENC_NONE) {
    return buf.slice(1);
  }
  return buf;
}

// node_modules/roxify/dist/utils/reconstitution.js
var import_path2 = require("path");
var import_sharp = __toESM(require_lib(), 1);
async function cropAndReconstitute(input, debugDir) {
  async function loadRaw(imgInput) {
    const { data, info: info2 } = await (0, import_sharp.default)(imgInput).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data, info: info2 };
  }
  function idxFor(x, y, width) {
    return (y * width + x) * 4;
  }
  function eqRGB(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  const { info } = await loadRaw(input);
  const doubledBuffer = await (0, import_sharp.default)(input).resize({
    width: info.width * 2,
    height: info.height * 2,
    kernel: "nearest"
  }).png().toBuffer();
  if (debugDir) {
    await (0, import_sharp.default)(doubledBuffer).toFile((0, import_path2.join)(debugDir, "doubled.png"));
  }
  const { data: doubledData, info: doubledInfo } = await loadRaw(doubledBuffer);
  const w = doubledInfo.width, h = doubledInfo.height;
  const at = (x, y) => {
    const i = idxFor(x, y, w);
    return [
      doubledData[i],
      doubledData[i + 1],
      doubledData[i + 2],
      doubledData[i + 3]
    ];
  };
  const findPattern = (startX, startY, dirX, dirY, pattern) => {
    for (let y = startY; y >= 0 && y < h; y += dirY) {
      for (let x = startX; x >= 0 && x < w; x += dirX) {
        const p = at(x, y);
        if (p[0] !== 255 || p[1] !== 0 || p[2] !== 0)
          continue;
        let nx = x + dirX;
        while (nx >= 0 && nx < w && eqRGB(at(nx, y), p))
          nx += dirX;
        if (nx < 0 || nx >= w)
          continue;
        const a = at(nx, y);
        let nx2 = nx + dirX;
        while (nx2 >= 0 && nx2 < w && eqRGB(at(nx2, y), a))
          nx2 += dirX;
        if (nx2 < 0 || nx2 >= w)
          continue;
        const b = at(nx2, y);
        if (a[0] === pattern[0][0] && a[1] === pattern[0][1] && a[2] === pattern[0][2] && b[0] === pattern[1][0] && b[1] === pattern[1][1] && b[2] === pattern[1][2]) {
          return { x, y };
        }
      }
    }
    return null;
  };
  const startPoint = findPattern(0, 0, 1, 1, [
    [0, 255, 0],
    [0, 0, 255]
  ]);
  const endPoint = findPattern(w - 1, h - 1, -1, -1, [
    [0, 255, 0],
    [0, 0, 255]
  ]);
  if (!startPoint || !endPoint)
    throw new Error("Patterns not found");
  const sx1 = Math.min(startPoint.x, endPoint.x), sy1 = Math.min(startPoint.y, endPoint.y);
  const sx2 = Math.max(startPoint.x, endPoint.x), sy2 = Math.max(startPoint.y, endPoint.y);
  const cropW = sx2 - sx1 + 1, cropH = sy2 - sy1 + 1;
  if (cropW <= 0 || cropH <= 0)
    throw new Error("Invalid crop dimensions");
  const cropped = await (0, import_sharp.default)(doubledBuffer).extract({ left: sx1, top: sy1, width: cropW, height: cropH }).png().toBuffer();
  const { data: cdata, info: cinfo } = await loadRaw(cropped);
  const cw = cinfo.width, ch2 = cinfo.height;
  const newWidth = cw, newHeight = ch2 + 1;
  const out = Buffer.alloc(newWidth * newHeight * 4, 0);
  for (let i = 0; i < out.length; i += 4)
    out[i + 3] = 255;
  for (let y = 0; y < ch2; y++) {
    for (let x = 0; x < cw; x++) {
      const srcI = (y * cw + x) * 4;
      const dstI = (y * newWidth + x) * 4;
      out[dstI] = cdata[srcI];
      out[dstI + 1] = cdata[srcI + 1];
      out[dstI + 2] = cdata[srcI + 2];
      out[dstI + 3] = cdata[srcI + 3];
    }
  }
  for (let x = 0; x < newWidth; x++) {
    const i = ((ch2 - 1) * newWidth + x) * 4;
    out[i] = out[i + 1] = out[i + 2] = 0;
    out[i + 3] = 255;
    const j = (ch2 * newWidth + x) * 4;
    out[j] = out[j + 1] = out[j + 2] = 0;
    out[j + 3] = 255;
  }
  if (newWidth >= 3) {
    const bgrStart = newWidth - 3;
    const bgr = [
      [0, 0, 255],
      [0, 255, 0],
      [255, 0, 0]
    ];
    for (let k = 0; k < 3; k++) {
      const i = (ch2 * newWidth + bgrStart + k) * 4;
      out[i] = bgr[k][0];
      out[i + 1] = bgr[k][1];
      out[i + 2] = bgr[k][2];
      out[i + 3] = 255;
    }
  }
  const getPixel = (x, y) => {
    const i = (y * newWidth + x) * 4;
    return [out[i], out[i + 1], out[i + 2], out[i + 3]];
  };
  const compressedLines = [];
  for (let y = 0; y < newHeight; y++) {
    const line = [];
    for (let x = 0; x < newWidth; x++)
      line.push(getPixel(x, y));
    const isAllBlack = line.every((p) => p[0] === 0 && p[1] === 0 && p[2] === 0 && p[3] === 255);
    if (!isAllBlack && (compressedLines.length === 0 || !line.every((p, i) => p.every((v, j) => v === compressedLines[compressedLines.length - 1][i][j])))) {
      compressedLines.push(line);
    }
  }
  if (compressedLines.length === 0) {
    return (0, import_sharp.default)({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    }).png().toBuffer();
  }
  let finalWidth = newWidth, finalHeight = compressedLines.length;
  let finalOut = Buffer.alloc(finalWidth * finalHeight * 4, 0);
  for (let i = 0; i < finalOut.length; i += 4)
    finalOut[i + 3] = 255;
  for (let y = 0; y < finalHeight; y++) {
    for (let x = 0; x < finalWidth; x++) {
      const i = (y * finalWidth + x) * 4;
      finalOut[i] = compressedLines[y][x][0];
      finalOut[i + 1] = compressedLines[y][x][1];
      finalOut[i + 2] = compressedLines[y][x][2];
      finalOut[i + 3] = compressedLines[y][x][3] || 255;
    }
  }
  if (finalHeight >= 1 && finalWidth >= 3) {
    const lastY = finalHeight - 1;
    for (let k = 0; k < 3; k++) {
      const i = (lastY * finalWidth + finalWidth - 3 + k) * 4;
      finalOut[i] = finalOut[i + 1] = finalOut[i + 2] = 0;
      finalOut[i + 3] = 255;
    }
  }
  if (finalWidth >= 2) {
    const kept = [];
    for (let x = 0; x < finalWidth; x++) {
      if (kept.length === 0) {
        kept.push(x);
        continue;
      }
      const prevX = kept[kept.length - 1];
      let same = true;
      for (let y = 0; y < finalHeight; y++) {
        const ia = (y * finalWidth + prevX) * 4, ib = (y * finalWidth + x) * 4;
        if (finalOut[ia] !== finalOut[ib] || finalOut[ia + 1] !== finalOut[ib + 1] || finalOut[ia + 2] !== finalOut[ib + 2] || finalOut[ia + 3] !== finalOut[ib + 3]) {
          same = false;
          break;
        }
      }
      if (!same)
        kept.push(x);
    }
    if (kept.length !== finalWidth) {
      const newFinalWidth = kept.length;
      const newOut = Buffer.alloc(newFinalWidth * finalHeight * 4, 0);
      for (let i = 0; i < newOut.length; i += 4)
        newOut[i + 3] = 255;
      for (let nx = 0; nx < kept.length; nx++) {
        const sx = kept[nx];
        for (let y = 0; y < finalHeight; y++) {
          const srcI = (y * finalWidth + sx) * 4, dstI = (y * newFinalWidth + nx) * 4;
          newOut[dstI] = finalOut[srcI];
          newOut[dstI + 1] = finalOut[srcI + 1];
          newOut[dstI + 2] = finalOut[srcI + 2];
          newOut[dstI + 3] = finalOut[srcI + 3];
        }
      }
      finalOut = newOut;
      finalWidth = newFinalWidth;
    }
  }
  if (finalHeight >= 2 && finalWidth >= 3) {
    const secondLastY = finalHeight - 2;
    const bgrSeq = [
      [0, 0, 255],
      [0, 255, 0],
      [255, 0, 0]
    ];
    let hasBGR = true;
    for (let k = 0; k < 3; k++) {
      const i = (secondLastY * finalWidth + finalWidth - 3 + k) * 4;
      if (finalOut[i] !== bgrSeq[k][0] || finalOut[i + 1] !== bgrSeq[k][1] || finalOut[i + 2] !== bgrSeq[k][2]) {
        hasBGR = false;
        break;
      }
    }
    if (hasBGR) {
      for (let k = 0; k < 3; k++) {
        const i = (secondLastY * finalWidth + finalWidth - 3 + k) * 4;
        finalOut[i] = finalOut[i + 1] = finalOut[i + 2] = 0;
        finalOut[i + 3] = 255;
      }
    }
  }
  if (finalHeight >= 1 && finalWidth >= 1) {
    const lastYFinal = finalHeight - 1;
    const bgrSeq = [
      [0, 0, 255],
      [0, 255, 0],
      [255, 0, 0]
    ];
    for (let k = 0; k < 3; k++) {
      const sx = finalWidth - 3 + k;
      if (sx >= 0) {
        const i = (lastYFinal * finalWidth + sx) * 4;
        finalOut[i] = bgrSeq[k][0];
        finalOut[i + 1] = bgrSeq[k][1];
        finalOut[i + 2] = bgrSeq[k][2];
        finalOut[i + 3] = 255;
      }
    }
  }
  return (0, import_sharp.default)(finalOut, {
    raw: { width: finalWidth, height: finalHeight, channels: 4 }
  }).png().toBuffer();
}

// node_modules/roxify/dist/utils/zstd.js
var import_zstd = __toESM(require_lib2(), 1);
var import_os = require("os");
async function parallelZstdCompress(payload, level = 19, onProgress) {
  const chunkSize = 8 * 1024 * 1024;
  const chunks = [];
  if (Array.isArray(payload)) {
    for (const p of payload) {
      if (p.length <= chunkSize) {
        chunks.push(p);
      } else {
        for (let i = 0; i < p.length; i += chunkSize) {
          chunks.push(p.subarray(i, Math.min(i + chunkSize, p.length)));
        }
      }
    }
  } else {
    if (payload.length <= chunkSize) {
      if (onProgress)
        onProgress(0, 1);
      const result = await (0, import_zstd.compress)(payload, level);
      if (onProgress)
        onProgress(1, 1);
      return [Buffer.from(result)];
    }
    for (let i = 0; i < payload.length; i += chunkSize) {
      chunks.push(payload.subarray(i, Math.min(i + chunkSize, payload.length)));
    }
  }
  const totalChunks = chunks.length;
  let completedChunks = 0;
  const concurrency = Math.max(1, Math.min(4, (0, import_os.cpus)().length));
  const compressedChunks = new Array(totalChunks);
  let idx = 0;
  const worker = async () => {
    while (true) {
      const cur = idx++;
      if (cur >= totalChunks)
        return;
      const chunk = chunks[cur];
      const compressed = await (0, import_zstd.compress)(chunk, level);
      compressedChunks[cur] = Buffer.from(compressed);
      completedChunks++;
      if (onProgress)
        onProgress(completedChunks, totalChunks);
    }
  };
  await Promise.all(new Array(concurrency).fill(0).map(() => worker()));
  const chunkSizes = Buffer.alloc(compressedChunks.length * 4);
  for (let i = 0; i < compressedChunks.length; i++) {
    chunkSizes.writeUInt32BE(compressedChunks[i].length, i * 4);
  }
  const header = Buffer.alloc(8);
  header.writeUInt32BE(1515410500, 0);
  header.writeUInt32BE(compressedChunks.length, 4);
  return [header, chunkSizes, ...compressedChunks];
}
async function parallelZstdDecompress(payload, onProgress) {
  if (payload.length < 8) {
    onProgress?.({ phase: "decompress_start", total: 1 });
    const d = Buffer.from(await (0, import_zstd.decompress)(payload));
    onProgress?.({ phase: "decompress_progress", loaded: 1, total: 1 });
    onProgress?.({ phase: "decompress_done", loaded: 1, total: 1 });
    return d;
  }
  const magic = payload.readUInt32BE(0);
  if (magic !== 1515410500) {
    if (process.env.ROX_DEBUG)
      console.log("tryZstdDecompress: invalid magic");
    onProgress?.({ phase: "decompress_start", total: 1 });
    const d = Buffer.from(await (0, import_zstd.decompress)(payload));
    onProgress?.({ phase: "decompress_progress", loaded: 1, total: 1 });
    onProgress?.({ phase: "decompress_done", loaded: 1, total: 1 });
    return d;
  }
  const numChunks = payload.readUInt32BE(4);
  const chunkSizes = [];
  let offset = 8;
  for (let i = 0; i < numChunks; i++) {
    chunkSizes.push(payload.readUInt32BE(offset));
    offset += 4;
  }
  onProgress?.({ phase: "decompress_start", total: numChunks });
  const decompressedChunks = [];
  for (let i = 0; i < numChunks; i++) {
    const size = chunkSizes[i];
    const chunk = payload.slice(offset, offset + size);
    offset += size;
    const dec = Buffer.from(await (0, import_zstd.decompress)(chunk));
    decompressedChunks.push(dec);
    onProgress?.({
      phase: "decompress_progress",
      loaded: i + 1,
      total: numChunks
    });
  }
  onProgress?.({
    phase: "decompress_done",
    loaded: numChunks,
    total: numChunks
  });
  return Buffer.concat(decompressedChunks);
}
async function tryZstdDecompress(payload, onProgress) {
  return await parallelZstdDecompress(payload, onProgress);
}

// node_modules/roxify/dist/utils/decoder.js
async function tryDecompress(payload, onProgress) {
  try {
    return await parallelZstdDecompress(payload, onProgress);
  } catch (e) {
    try {
      const mod = await Promise.resolve().then(() => __toESM(require_main(), 1));
      const decompressFn = mod && (mod.decompress || mod.LZMA && mod.LZMA.decompress);
      if (!decompressFn)
        throw new Error("No lzma decompress");
      const dec = await new Promise((resolve3, reject) => {
        try {
          decompressFn(Buffer.from(payload), (out) => resolve3(out));
        } catch (err2) {
          reject(err2);
        }
      });
      const dBuf = Buffer.isBuffer(dec) ? dec : Buffer.from(dec);
      return dBuf;
    } catch (e3) {
      throw e;
    }
  }
}
async function decodePngToBinary(input, opts = {}) {
  let pngBuf;
  if (Buffer.isBuffer(input)) {
    pngBuf = input;
  } else {
    try {
      const metadata = await (0, import_sharp2.default)(input).metadata();
      const rawBytesEstimate = (metadata.width || 0) * (metadata.height || 0) * 4;
      const MAX_RAW_BYTES = 200 * 1024 * 1024;
      if (rawBytesEstimate > MAX_RAW_BYTES) {
        pngBuf = (0, import_fs2.readFileSync)(input);
      } else {
        pngBuf = (0, import_fs2.readFileSync)(input);
      }
    } catch (e) {
      try {
        pngBuf = (0, import_fs2.readFileSync)(input);
      } catch (e2) {
        throw e;
      }
    }
  }
  let progressBar = null;
  if (opts.showProgress) {
    progressBar = new import_cli_progress.default.SingleBar({
      format: " {bar} {percentage}% | {step} | {elapsed}s"
    }, import_cli_progress.default.Presets.shades_classic);
    progressBar.start(100, 0, { step: "Starting", elapsed: "0" });
    const startTime = Date.now();
    if (!opts.onProgress) {
      opts.onProgress = (info) => {
        let pct = 0;
        if (info.phase === "start") {
          pct = 10;
        } else if (info.phase === "decompress") {
          pct = 50;
        } else if (info.phase === "done") {
          pct = 100;
        }
        progressBar.update(Math.floor(pct), {
          step: info.phase.replace("_", " "),
          elapsed: String(Math.floor((Date.now() - startTime) / 1e3))
        });
      };
    }
  }
  if (opts.onProgress)
    opts.onProgress({ phase: "start" });
  let processedBuf = pngBuf;
  try {
    const info = await (0, import_sharp2.default)(pngBuf).metadata();
    if (info.width && info.height) {
      const MAX_RAW_BYTES = 1200 * 1024 * 1024;
      const rawBytesEstimate = info.width * info.height * 4;
      if (rawBytesEstimate > MAX_RAW_BYTES) {
        throw new DataFormatError(`Image too large to decode in-process (${Math.round(rawBytesEstimate / 1024 / 1024)} MB). Increase Node heap or use a smaller image/compact mode.`);
      }
      if (false) {
        const doubledBuffer = await (0, import_sharp2.default)(pngBuf).resize({
          width: info.width * 2,
          height: info.height * 2,
          kernel: "nearest"
        }).png().toBuffer();
        processedBuf = await cropAndReconstitute(doubledBuffer, opts.debugDir);
      } else {
        processedBuf = pngBuf;
      }
    }
  } catch (e) {
    if (e instanceof DataFormatError)
      throw e;
  }
  if (opts.onProgress)
    opts.onProgress({ phase: "processed" });
  if (processedBuf.subarray(0, MAGIC.length).equals(MAGIC)) {
    const d = processedBuf.subarray(MAGIC.length);
    const nameLen = d[0];
    let idx = 1;
    let name;
    if (nameLen > 0) {
      name = d.subarray(idx, idx + nameLen).toString("utf8");
      idx += nameLen;
    }
    const rawPayload = d.subarray(idx);
    let payload = tryDecryptIfNeeded(rawPayload, opts.passphrase);
    if (opts.onProgress)
      opts.onProgress({ phase: "decompress_start" });
    try {
      payload = await tryDecompress(payload, (info) => {
        if (opts.onProgress)
          opts.onProgress(info);
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (opts.passphrase)
        throw new IncorrectPassphraseError("Incorrect passphrase (compact mode, zstd failed: " + errMsg + ")");
      throw new DataFormatError("Compact mode zstd decompression failed: " + errMsg);
    }
    if (!payload.subarray(0, MAGIC.length).equals(MAGIC)) {
      throw new Error("Invalid ROX format (ROX direct: missing ROX1 magic after decompression)");
    }
    payload = payload.subarray(MAGIC.length);
    if (opts.onProgress)
      opts.onProgress({ phase: "done" });
    progressBar?.stop();
    return { buf: payload, meta: { name } };
  }
  let chunks = [];
  try {
    const chunksRaw = (0, import_png_chunks_extract.default)(processedBuf);
    chunks = chunksRaw.map((c) => ({
      name: c.name,
      data: Buffer.isBuffer(c.data) ? c.data : Buffer.from(c.data)
    }));
  } catch (e) {
    try {
      const withHeader = Buffer.concat([PNG_HEADER, pngBuf]);
      const chunksRaw = (0, import_png_chunks_extract.default)(withHeader);
      chunks = chunksRaw.map((c) => ({
        name: c.name,
        data: Buffer.isBuffer(c.data) ? c.data : Buffer.from(c.data)
      }));
    } catch (e2) {
      chunks = [];
    }
  }
  const target = chunks.find((c) => c.name === CHUNK_TYPE);
  if (target) {
    const d = target.data;
    const nameLen = d[0];
    let idx = 1;
    let name;
    if (nameLen > 0) {
      name = d.slice(idx, idx + nameLen).toString("utf8");
      idx += nameLen;
    }
    const rawPayload = d.slice(idx);
    if (rawPayload.length === 0)
      throw new DataFormatError("Compact mode payload empty");
    let payload = tryDecryptIfNeeded(rawPayload, opts.passphrase);
    if (opts.onProgress)
      opts.onProgress({ phase: "decompress_start" });
    try {
      payload = await tryZstdDecompress(payload, (info) => {
        if (opts.onProgress)
          opts.onProgress(info);
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (opts.passphrase)
        throw new IncorrectPassphraseError("Incorrect passphrase (compact mode, zstd failed: " + errMsg + ")");
      throw new DataFormatError("Compact mode zstd decompression failed: " + errMsg);
    }
    if (!payload.slice(0, MAGIC.length).equals(MAGIC)) {
      throw new DataFormatError("Invalid ROX format (compact mode: missing ROX1 magic after decompression)");
    }
    payload = payload.slice(MAGIC.length);
    if (opts.files) {
      const unpacked = unpackBuffer(payload, opts.files);
      if (unpacked) {
        if (opts.onProgress)
          opts.onProgress({ phase: "done" });
        progressBar?.stop();
        return { files: unpacked.files, meta: { name } };
      }
    }
    if (opts.onProgress)
      opts.onProgress({ phase: "done" });
    progressBar?.stop();
    return { buf: payload, meta: { name } };
  }
  try {
    const metadata = await (0, import_sharp2.default)(processedBuf).metadata();
    const currentWidth = metadata.width;
    const currentHeight = metadata.height;
    const rawRGB = Buffer.allocUnsafe(currentWidth * currentHeight * 3);
    let writeOffset = 0;
    const rowsPerChunk = 2e3;
    for (let startRow = 0; startRow < currentHeight; startRow += rowsPerChunk) {
      const endRow = Math.min(startRow + rowsPerChunk, currentHeight);
      const chunkHeight = endRow - startRow;
      const { data: chunkData, info: chunkInfo } = await (0, import_sharp2.default)(processedBuf).extract({
        left: 0,
        top: startRow,
        width: currentWidth,
        height: chunkHeight
      }).raw().toBuffer({ resolveWithObject: true });
      const channels = chunkInfo.channels;
      const pixelsInChunk = currentWidth * chunkHeight;
      if (channels === 3) {
        chunkData.copy(rawRGB, writeOffset);
        writeOffset += pixelsInChunk * 3;
      } else if (channels === 4) {
        for (let i = 0; i < pixelsInChunk; i++) {
          rawRGB[writeOffset++] = chunkData[i * 4];
          rawRGB[writeOffset++] = chunkData[i * 4 + 1];
          rawRGB[writeOffset++] = chunkData[i * 4 + 2];
        }
      }
      if (opts.onProgress) {
        opts.onProgress({
          phase: "extract_pixels",
          loaded: endRow,
          total: currentHeight
        });
      }
    }
    const firstPixels = [];
    for (let i = 0; i < Math.min(MARKER_START.length, rawRGB.length / 3); i++) {
      firstPixels.push({
        r: rawRGB[i * 3],
        g: rawRGB[i * 3 + 1],
        b: rawRGB[i * 3 + 2]
      });
    }
    let hasMarkerStart = false;
    if (firstPixels.length === MARKER_START.length) {
      hasMarkerStart = true;
      for (let i = 0; i < MARKER_START.length; i++) {
        if (firstPixels[i].r !== MARKER_START[i].r || firstPixels[i].g !== MARKER_START[i].g || firstPixels[i].b !== MARKER_START[i].b) {
          hasMarkerStart = false;
          break;
        }
      }
    }
    let hasPixelMagic = false;
    if (rawRGB.length >= 8 + PIXEL_MAGIC.length) {
      const widthFromDim = rawRGB.readUInt32BE(0);
      const heightFromDim = rawRGB.readUInt32BE(4);
      if (widthFromDim === currentWidth && heightFromDim === currentHeight && rawRGB.slice(8, 8 + PIXEL_MAGIC.length).equals(PIXEL_MAGIC)) {
        hasPixelMagic = true;
      }
    }
    let logicalWidth;
    let logicalHeight;
    let logicalData;
    if (hasMarkerStart || hasPixelMagic) {
      logicalWidth = currentWidth;
      logicalHeight = currentHeight;
      logicalData = rawRGB;
    } else {
      const reconstructed = await cropAndReconstitute(processedBuf, opts.debugDir);
      const { data: rdata, info: rinfo } = await (0, import_sharp2.default)(reconstructed).raw().toBuffer({ resolveWithObject: true });
      logicalWidth = rinfo.width;
      logicalHeight = rinfo.height;
      logicalData = Buffer.alloc(rinfo.width * rinfo.height * 3);
      if (rinfo.channels === 3) {
        rdata.copy(logicalData);
      } else if (rinfo.channels === 4) {
        for (let i = 0; i < logicalWidth * logicalHeight; i++) {
          logicalData[i * 3] = rdata[i * 4];
          logicalData[i * 3 + 1] = rdata[i * 4 + 1];
          logicalData[i * 3 + 2] = rdata[i * 4 + 2];
        }
      }
    }
    if (process.env.ROX_DEBUG) {
      console.log("DEBUG: Logical grid reconstructed:", logicalWidth, "x", logicalHeight, "=", logicalWidth * logicalHeight, "pixels");
    }
    if (hasPixelMagic) {
      if (logicalData.length < 8 + PIXEL_MAGIC.length) {
        throw new DataFormatError("Pixel mode data too short");
      }
      let idx = 8 + PIXEL_MAGIC.length;
      const version = logicalData[idx++];
      const nameLen = logicalData[idx++];
      let name;
      if (nameLen > 0 && nameLen < 256) {
        name = logicalData.slice(idx, idx + nameLen).toString("utf8");
        idx += nameLen;
      }
      const payloadLen = logicalData.readUInt32BE(idx);
      idx += 4;
      const available = logicalData.length - idx;
      if (available < payloadLen) {
        throw new DataFormatError(`Pixel payload truncated: expected ${payloadLen} bytes but only ${available} available`);
      }
      const rawPayload = logicalData.slice(idx, idx + payloadLen);
      let payload = tryDecryptIfNeeded(rawPayload, opts.passphrase);
      try {
        payload = await tryZstdDecompress(payload, (info) => {
          if (opts.onProgress)
            opts.onProgress(info);
        });
        if (version === 3) {
          payload = deltaDecode(payload);
        }
      } catch (e) {
      }
      if (!payload.slice(0, MAGIC.length).equals(MAGIC)) {
        throw new DataFormatError("Invalid ROX format (pixel mode: missing ROX1 magic after decompression)");
      }
      payload = payload.slice(MAGIC.length);
      return { buf: payload, meta: { name } };
    }
    const totalPixels = logicalData.length / 3 | 0;
    let startIdx = -1;
    for (let i = 0; i <= totalPixels - MARKER_START.length; i++) {
      let match = true;
      for (let mi = 0; mi < MARKER_START.length && match; mi++) {
        const offset = (i + mi) * 3;
        if (logicalData[offset] !== MARKER_START[mi].r || logicalData[offset + 1] !== MARKER_START[mi].g || logicalData[offset + 2] !== MARKER_START[mi].b) {
          match = false;
        }
      }
      if (match) {
        startIdx = i;
        break;
      }
    }
    if (startIdx === -1) {
      if (process.env.ROX_DEBUG) {
        console.log("DEBUG: MARKER_START not found in grid of", totalPixels, "pixels");
        console.log("DEBUG: Trying 2D scan for START marker...");
      }
      let found2D = false;
      for (let y = 0; y < logicalHeight && !found2D; y++) {
        for (let x = 0; x <= logicalWidth - MARKER_START.length && !found2D; x++) {
          let match = true;
          for (let mi = 0; mi < MARKER_START.length && match; mi++) {
            const idx = (y * logicalWidth + (x + mi)) * 3;
            if (idx + 2 >= logicalData.length || logicalData[idx] !== MARKER_START[mi].r || logicalData[idx + 1] !== MARKER_START[mi].g || logicalData[idx + 2] !== MARKER_START[mi].b) {
              match = false;
            }
          }
          if (match) {
            if (process.env.ROX_DEBUG) {
              console.log(`DEBUG: Found START marker in 2D at (${x}, ${y})`);
            }
            let endX = x + MARKER_START.length - 1;
            let endY = y;
            for (let scanY = y; scanY < logicalHeight; scanY++) {
              let rowHasData = false;
              for (let scanX = x; scanX < logicalWidth; scanX++) {
                const scanIdx = (scanY * logicalWidth + scanX) * 3;
                if (scanIdx + 2 < logicalData.length) {
                  const r = logicalData[scanIdx];
                  const g = logicalData[scanIdx + 1];
                  const b = logicalData[scanIdx + 2];
                  const isBackground = r === 100 && g === 120 && b === 110 || r === 0 && g === 0 && b === 0 || r >= 50 && r <= 220 && g >= 50 && g <= 220 && b >= 50 && b <= 220 && Math.abs(r - g) < 70 && Math.abs(r - b) < 70 && Math.abs(g - b) < 70;
                  if (!isBackground) {
                    rowHasData = true;
                    if (scanX > endX) {
                      endX = scanX;
                    }
                  }
                }
              }
              if (rowHasData) {
                endY = scanY;
              } else if (scanY > y) {
                break;
              }
            }
            const rectWidth = endX - x + 1;
            const rectHeight = endY - y + 1;
            if (process.env.ROX_DEBUG) {
              console.log(`DEBUG: Extracted rectangle: ${rectWidth}x${rectHeight} from (${x},${y})`);
            }
            const newDataLen = rectWidth * rectHeight * 3;
            const newData = Buffer.allocUnsafe(newDataLen);
            let writeIdx = 0;
            for (let ry = y; ry <= endY; ry++) {
              for (let rx = x; rx <= endX; rx++) {
                const idx = (ry * logicalWidth + rx) * 3;
                newData[writeIdx++] = logicalData[idx];
                newData[writeIdx++] = logicalData[idx + 1];
                newData[writeIdx++] = logicalData[idx + 2];
              }
            }
            logicalData = newData;
            logicalWidth = rectWidth;
            logicalHeight = rectHeight;
            startIdx = 0;
            found2D = true;
          }
        }
      }
      if (!found2D) {
        if (process.env.ROX_DEBUG) {
          const first20 = [];
          for (let i = 0; i < Math.min(20, totalPixels); i++) {
            const offset = i * 3;
            first20.push(`(${logicalData[offset]},${logicalData[offset + 1]},${logicalData[offset + 2]})`);
          }
          console.log("DEBUG: First 20 pixels:", first20.join(" "));
        }
        throw new Error("Marker START not found - image format not supported");
      }
    }
    if (process.env.ROX_DEBUG && startIdx === 0) {
      console.log(`DEBUG: MARKER_START at index ${startIdx}, grid size: ${totalPixels}`);
    }
    const dataStartPixel = startIdx + MARKER_START.length + 1;
    const curTotalPixels = logicalData.length / 3 | 0;
    if (curTotalPixels < dataStartPixel + MARKER_END.length) {
      if (process.env.ROX_DEBUG) {
        console.log("DEBUG: grid too small:", curTotalPixels, "pixels");
      }
      throw new Error("Marker START or END not found - image format not supported");
    }
    for (let i = 0; i < MARKER_START.length; i++) {
      const offset = (startIdx + i) * 3;
      if (logicalData[offset] !== MARKER_START[i].r || logicalData[offset + 1] !== MARKER_START[i].g || logicalData[offset + 2] !== MARKER_START[i].b) {
        throw new Error("Marker START not found - image format not supported");
      }
    }
    let compression = "zstd";
    if (curTotalPixels > startIdx + MARKER_START.length) {
      const compOffset = (startIdx + MARKER_START.length) * 3;
      const compPixel = {
        r: logicalData[compOffset],
        g: logicalData[compOffset + 1],
        b: logicalData[compOffset + 2]
      };
      if (compPixel.r === 0 && compPixel.g === 255 && compPixel.b === 0) {
        compression = "zstd";
      } else {
        compression = "zstd";
      }
    }
    if (process.env.ROX_DEBUG) {
      console.log(`DEBUG: Detected compression: ${compression}`);
    }
    let endStartPixel = -1;
    const lastLineStart = (logicalHeight - 1) * logicalWidth;
    const endMarkerStartCol = logicalWidth - MARKER_END.length;
    if (lastLineStart + endMarkerStartCol < curTotalPixels) {
      let matchEnd = true;
      for (let mi = 0; mi < MARKER_END.length && matchEnd; mi++) {
        const pixelIdx = lastLineStart + endMarkerStartCol + mi;
        if (pixelIdx >= curTotalPixels) {
          matchEnd = false;
          break;
        }
        const offset = pixelIdx * 3;
        if (logicalData[offset] !== MARKER_END[mi].r || logicalData[offset + 1] !== MARKER_END[mi].g || logicalData[offset + 2] !== MARKER_END[mi].b) {
          matchEnd = false;
        }
      }
      if (matchEnd) {
        endStartPixel = lastLineStart + endMarkerStartCol - startIdx;
        if (process.env.ROX_DEBUG) {
          console.log(`DEBUG: Found END marker at last line, col ${endMarkerStartCol}`);
        }
      }
    }
    if (endStartPixel === -1) {
      if (process.env.ROX_DEBUG) {
        console.log("DEBUG: END marker not found at expected position");
        const lastLinePixels = [];
        for (let i = Math.max(0, lastLineStart); i < curTotalPixels && i < lastLineStart + 20; i++) {
          const offset = i * 3;
          lastLinePixels.push(`(${logicalData[offset]},${logicalData[offset + 1]},${logicalData[offset + 2]})`);
        }
        console.log("DEBUG: Last line pixels:", lastLinePixels.join(" "));
      }
      endStartPixel = curTotalPixels - startIdx;
    }
    const dataPixelCount = endStartPixel - (MARKER_START.length + 1);
    const pixelBytes = Buffer.allocUnsafe(dataPixelCount * 3);
    for (let i = 0; i < dataPixelCount; i++) {
      const srcOffset = (dataStartPixel + i) * 3;
      const dstOffset = i * 3;
      pixelBytes[dstOffset] = logicalData[srcOffset];
      pixelBytes[dstOffset + 1] = logicalData[srcOffset + 1];
      pixelBytes[dstOffset + 2] = logicalData[srcOffset + 2];
    }
    if (process.env.ROX_DEBUG) {
      console.log("DEBUG: extracted len", pixelBytes.length);
      console.log("DEBUG: extracted head", pixelBytes.slice(0, 32).toString("hex"));
      const found = pixelBytes.indexOf(PIXEL_MAGIC);
      console.log("DEBUG: PIXEL_MAGIC index:", found);
      if (found !== -1) {
        console.log("DEBUG: PIXEL_MAGIC head:", pixelBytes.slice(found, found + 64).toString("hex"));
        const markerEndBytes = colorsToBytes(MARKER_END);
        console.log("DEBUG: MARKER_END index:", pixelBytes.indexOf(markerEndBytes));
      }
    }
    try {
      let idx = 0;
      if (pixelBytes.length >= PIXEL_MAGIC.length) {
        const at0 = pixelBytes.slice(0, PIXEL_MAGIC.length).equals(PIXEL_MAGIC);
        if (at0) {
          idx = PIXEL_MAGIC.length;
        } else {
          const found = pixelBytes.indexOf(PIXEL_MAGIC);
          if (found !== -1) {
            idx = found + PIXEL_MAGIC.length;
          }
        }
      }
      if (idx > 0) {
        const version = pixelBytes[idx++];
        const nameLen = pixelBytes[idx++];
        let name;
        if (nameLen > 0 && nameLen < 256) {
          name = pixelBytes.slice(idx, idx + nameLen).toString("utf8");
          idx += nameLen;
        }
        const payloadLen = pixelBytes.readUInt32BE(idx);
        idx += 4;
        if (idx + 4 <= pixelBytes.length) {
          const marker = pixelBytes.slice(idx, idx + 4).toString("utf8");
          if (marker === "rXFL") {
            idx += 4;
            if (idx + 4 <= pixelBytes.length) {
              const jsonLen = pixelBytes.readUInt32BE(idx);
              idx += 4;
              idx += jsonLen;
            }
          }
        }
        const available = pixelBytes.length - idx;
        if (available < payloadLen) {
          throw new DataFormatError(`Pixel payload truncated: expected ${payloadLen} bytes but only ${available} available`);
        }
        const rawPayload = pixelBytes.slice(idx, idx + payloadLen);
        let payload = tryDecryptIfNeeded(rawPayload, opts.passphrase);
        try {
          payload = await tryDecompress(payload, (info) => {
            if (opts.onProgress)
              opts.onProgress(info);
          });
          if (version === 3) {
            payload = deltaDecode(payload);
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          if (opts.passphrase)
            throw new IncorrectPassphraseError(`Incorrect passphrase (screenshot mode, zstd failed: ` + errMsg + ")");
          throw new DataFormatError(`Screenshot mode zstd decompression failed: ` + errMsg);
        }
        if (!payload.slice(0, MAGIC.length).equals(MAGIC)) {
          throw new DataFormatError("Invalid ROX format (pixel mode: missing ROX1 magic after decompression)");
        }
        payload = payload.slice(MAGIC.length);
        if (opts.files) {
          const unpacked = unpackBuffer(payload, opts.files);
          if (unpacked) {
            if (opts.onProgress)
              opts.onProgress({ phase: "done" });
            progressBar?.stop();
            return { files: unpacked.files, meta: { name } };
          }
        }
        if (opts.onProgress)
          opts.onProgress({ phase: "done" });
        progressBar?.stop();
        return { buf: payload, meta: { name } };
      }
    } catch (e) {
      if (e instanceof PassphraseRequiredError || e instanceof IncorrectPassphraseError || e instanceof DataFormatError) {
        throw e;
      }
      const errMsg = e instanceof Error ? e.message : String(e);
      throw new Error("Failed to extract data from screenshot: " + errMsg);
    }
  } catch (e) {
    if (e instanceof PassphraseRequiredError || e instanceof IncorrectPassphraseError || e instanceof DataFormatError) {
      throw e;
    }
    const errMsg = e instanceof Error ? e.message : String(e);
    throw new Error("Failed to decode PNG: " + errMsg);
  }
  throw new DataFormatError("No valid data found in image");
}

// node_modules/roxify/dist/utils/encoder.js
var import_cli_progress2 = __toESM(require_cli_progress(), 1);
var import_crypto2 = require("crypto");
var import_sharp3 = __toESM(require_lib(), 1);
var zlib3 = __toESM(require("zlib"), 1);

// node_modules/roxify/dist/utils/optimization.js
var import_child_process = require("child_process");
var import_fs3 = require("fs");
var import_os2 = require("os");
var import_path3 = require("path");
var import_png_chunks_encode = __toESM(require_png_chunks_encode(), 1);
var import_png_chunks_extract2 = __toESM(require_png_chunks_extract(), 1);
var zlib2 = __toESM(require("zlib"), 1);
async function optimizePngBuffer(pngBuf, fast = false) {
  const MAX_OPTIMIZE_SIZE = 50 * 1024 * 1024;
  if (pngBuf.length > MAX_OPTIMIZE_SIZE) {
    return pngBuf;
  }
  const runCommandAsync = (cmd, args, timeout = 12e4) => {
    return new Promise((resolve3) => {
      try {
        const child = (0, import_child_process.spawn)(cmd, args, { windowsHide: true, stdio: "ignore" });
        let killed = false;
        const to = setTimeout(() => {
          killed = true;
          try {
            child.kill("SIGTERM");
          } catch (e) {
          }
        }, timeout);
        child.on("close", (code) => {
          clearTimeout(to);
          if (killed)
            resolve3({ error: new Error("timeout") });
          else
            resolve3({ code: code ?? 0 });
        });
        child.on("error", (err2) => {
          clearTimeout(to);
          resolve3({ error: err2 });
        });
      } catch (err2) {
        resolve3({ error: err2 });
      }
    });
  };
  try {
    const inPath = (0, import_path3.join)((0, import_os2.tmpdir)(), `rox_zop_in_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
    const outPath = inPath + ".out.png";
    (0, import_fs3.writeFileSync)(inPath, pngBuf);
    const iterations = fast ? 15 : 40;
    const args = [
      "-y",
      `--iterations=${iterations}`,
      "--filters=01234mepb",
      inPath,
      outPath
    ];
    const res = await runCommandAsync("zopflipng", args, 12e4);
    if (!res.error && (0, import_fs3.existsSync)(outPath)) {
      const outBuf = (0, import_fs3.readFileSync)(outPath);
      try {
        (0, import_fs3.unlinkSync)(inPath);
        (0, import_fs3.unlinkSync)(outPath);
      } catch (e) {
      }
      return outBuf.length < pngBuf.length ? outBuf : pngBuf;
    }
    if (fast)
      return pngBuf;
  } catch (e) {
  }
  try {
    let paethPredict = function(a, b, c) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      if (pa <= pb && pa <= pc)
        return a;
      if (pb <= pc)
        return b;
      return c;
    }, ensurePng = function(buf) {
      return buf.slice(0, 8).toString("hex") === PNG_HEADER_HEX ? buf : Buffer.concat([PNG_HEADER, buf]);
    };
    const chunksRaw = (0, import_png_chunks_extract2.default)(pngBuf);
    const ihdr = chunksRaw.find((c) => c.name === "IHDR");
    if (!ihdr)
      return pngBuf;
    const ihdrData = Buffer.isBuffer(ihdr.data) ? ihdr.data : Buffer.from(ihdr.data);
    const width = ihdrData.readUInt32BE(0);
    const height = ihdrData.readUInt32BE(4);
    const bitDepth = ihdrData[8];
    const colorType = ihdrData[9];
    if (bitDepth !== 8 || colorType !== 2)
      return pngBuf;
    const idatChunks = chunksRaw.filter((c) => c.name === "IDAT");
    const idatData = Buffer.concat(idatChunks.map((c) => Buffer.isBuffer(c.data) ? c.data : Buffer.from(c.data)));
    let raw;
    try {
      raw = zlib2.inflateSync(idatData);
    } catch (e) {
      return pngBuf;
    }
    const bytesPerPixel = 3;
    const rowBytes = width * bytesPerPixel;
    const inRowLen = rowBytes + 1;
    if (raw.length !== inRowLen * height)
      return pngBuf;
    const outRows = [];
    let prevRow = null;
    for (let y = 0; y < height; y++) {
      const rowStart = y * inRowLen + 1;
      const row = raw.slice(rowStart, rowStart + rowBytes);
      let bestSum = Infinity;
      let bestFiltered = null;
      for (let f = 0; f <= 4; f++) {
        const filtered = Buffer.alloc(rowBytes);
        let sum = 0;
        for (let i = 0; i < rowBytes; i++) {
          const val = row[i];
          let outv = 0;
          const left = i - bytesPerPixel >= 0 ? row[i - bytesPerPixel] : 0;
          const up = prevRow ? prevRow[i] : 0;
          const upLeft = prevRow && i - bytesPerPixel >= 0 ? prevRow[i - bytesPerPixel] : 0;
          if (f === 0) {
            outv = val;
          } else if (f === 1) {
            outv = val - left + 256 & 255;
          } else if (f === 2) {
            outv = val - up + 256 & 255;
          } else if (f === 3) {
            const avg = Math.floor((left + up) / 2);
            outv = val - avg + 256 & 255;
          } else {
            const p = paethPredict(left, up, upLeft);
            outv = val - p + 256 & 255;
          }
          filtered[i] = outv;
          const signed = outv > 127 ? outv - 256 : outv;
          sum += Math.abs(signed);
        }
        if (sum < bestSum) {
          bestSum = sum;
          bestFiltered = filtered;
        }
      }
      const rowBuf = Buffer.alloc(1 + rowBytes);
      let chosenFilter = 0;
      for (let f = 0; f <= 4; f++) {
        const filtered = Buffer.alloc(rowBytes);
        for (let i = 0; i < rowBytes; i++) {
          const val = row[i];
          const left = i - bytesPerPixel >= 0 ? row[i - bytesPerPixel] : 0;
          const up = prevRow ? prevRow[i] : 0;
          const upLeft = prevRow && i - bytesPerPixel >= 0 ? prevRow[i - bytesPerPixel] : 0;
          if (f === 0)
            filtered[i] = val;
          else if (f === 1)
            filtered[i] = val - left + 256 & 255;
          else if (f === 2)
            filtered[i] = val - up + 256 & 255;
          else if (f === 3)
            filtered[i] = val - Math.floor((left + up) / 2) + 256 & 255;
          else
            filtered[i] = val - paethPredict(left, up, upLeft) + 256 & 255;
        }
        if (filtered.equals(bestFiltered)) {
          chosenFilter = f;
          break;
        }
      }
      rowBuf[0] = chosenFilter;
      bestFiltered.copy(rowBuf, 1);
      outRows.push(rowBuf);
      prevRow = row;
    }
    const filteredAll = Buffer.concat(outRows);
    const compressed = zlib2.deflateSync(filteredAll, {
      level: 9,
      memLevel: 9,
      strategy: zlib2.constants.Z_DEFAULT_STRATEGY
    });
    const newChunks = [];
    for (const c of chunksRaw) {
      if (c.name === "IDAT")
        continue;
      newChunks.push({
        name: c.name,
        data: Buffer.isBuffer(c.data) ? c.data : Buffer.from(c.data)
      });
    }
    const iendIndex = newChunks.findIndex((c) => c.name === "IEND");
    const insertIndex = iendIndex >= 0 ? iendIndex : newChunks.length;
    newChunks.splice(insertIndex, 0, { name: "IDAT", data: compressed });
    const out = ensurePng(Buffer.from((0, import_png_chunks_encode.default)(newChunks)));
    let bestBuf = out.length < pngBuf.length ? out : pngBuf;
    const strategies = [
      zlib2.constants.Z_DEFAULT_STRATEGY,
      zlib2.constants.Z_FILTERED,
      zlib2.constants.Z_RLE,
      ...zlib2.constants.Z_HUFFMAN_ONLY ? [zlib2.constants.Z_HUFFMAN_ONLY] : [],
      ...zlib2.constants.Z_FIXED ? [zlib2.constants.Z_FIXED] : []
    ];
    for (const strat of strategies) {
      try {
        const comp = zlib2.deflateSync(raw, {
          level: 9,
          memLevel: 9,
          strategy: strat
        });
        const altChunks = newChunks.map((c) => ({
          name: c.name,
          data: c.data
        }));
        const idx = altChunks.findIndex((c) => c.name === "IDAT");
        if (idx !== -1)
          altChunks[idx] = { name: "IDAT", data: comp };
        const candidate = ensurePng(Buffer.from((0, import_png_chunks_encode.default)(altChunks)));
        if (candidate.length < bestBuf.length)
          bestBuf = candidate;
      } catch (e) {
      }
    }
    try {
      const fflate = await Promise.resolve().then(() => (init_esm(), esm_exports));
      const fflateDeflateSync = fflate.deflateSync;
      try {
        const comp = fflateDeflateSync(filteredAll);
        const altChunks = newChunks.map((c) => ({
          name: c.name,
          data: c.data
        }));
        const idx = altChunks.findIndex((c) => c.name === "IDAT");
        if (idx !== -1)
          altChunks[idx] = { name: "IDAT", data: Buffer.from(comp) };
        const candidate = ensurePng(Buffer.from((0, import_png_chunks_encode.default)(altChunks)));
        if (candidate.length < bestBuf.length)
          bestBuf = candidate;
      } catch (e) {
      }
    } catch (e) {
    }
    const windowBitsOpts = [15, 12, 9];
    const memLevelOpts = [9, 8];
    for (let f = 0; f <= 4; f++) {
      try {
        const filteredAllGlobalRows = [];
        let prevRowG = null;
        for (let y = 0; y < height; y++) {
          const row = raw.slice(y * inRowLen + 1, y * inRowLen + 1 + rowBytes);
          const filtered = Buffer.alloc(rowBytes);
          for (let i = 0; i < rowBytes; i++) {
            const val = row[i];
            const left = i - bytesPerPixel >= 0 ? row[i - bytesPerPixel] : 0;
            const up = prevRowG ? prevRowG[i] : 0;
            const upLeft = prevRowG && i - bytesPerPixel >= 0 ? prevRowG[i - bytesPerPixel] : 0;
            if (f === 0)
              filtered[i] = val;
            else if (f === 1)
              filtered[i] = val - left + 256 & 255;
            else if (f === 2)
              filtered[i] = val - up + 256 & 255;
            else if (f === 3)
              filtered[i] = val - Math.floor((left + up) / 2) + 256 & 255;
            else
              filtered[i] = val - paethPredict(left, up, upLeft) + 256 & 255;
          }
          const rowBuf = Buffer.alloc(1 + rowBytes);
          rowBuf[0] = f;
          filtered.copy(rowBuf, 1);
          filteredAllGlobalRows.push(rowBuf);
          prevRowG = row;
        }
        const filteredAllGlobal = Buffer.concat(filteredAllGlobalRows);
        for (const strat2 of strategies) {
          for (const wb of windowBitsOpts) {
            for (const ml of memLevelOpts) {
              try {
                const comp = zlib2.deflateSync(filteredAllGlobal, {
                  level: 9,
                  memLevel: ml,
                  strategy: strat2,
                  windowBits: wb
                });
                const altChunks = newChunks.map((c) => ({
                  name: c.name,
                  data: c.data
                }));
                const idx = altChunks.findIndex((c) => c.name === "IDAT");
                if (idx !== -1)
                  altChunks[idx] = { name: "IDAT", data: comp };
                const candidate = ensurePng(Buffer.from((0, import_png_chunks_encode.default)(altChunks)));
                if (candidate.length < bestBuf.length)
                  bestBuf = candidate;
              } catch (e) {
              }
            }
          }
        }
      } catch (e) {
      }
    }
    try {
      const zopIterations = [1e3, 2e3];
      zopIterations.push(5e3, 1e4, 2e4);
      for (const iters of zopIterations) {
        try {
          const zIn = (0, import_path3.join)((0, import_os2.tmpdir)(), `rox_zop_in_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
          const zOut = zIn + ".out.png";
          (0, import_fs3.writeFileSync)(zIn, bestBuf);
          const args2 = [
            "-y",
            `--iterations=${iters}`,
            "--filters=01234mepb",
            zIn,
            zOut
          ];
          try {
            const r2 = await runCommandAsync("zopflipng", args2, 24e4);
            if (!r2.error && (0, import_fs3.existsSync)(zOut)) {
              const zbuf = (0, import_fs3.readFileSync)(zOut);
              try {
                (0, import_fs3.unlinkSync)(zIn);
                (0, import_fs3.unlinkSync)(zOut);
              } catch (e) {
              }
              if (zbuf.length < bestBuf.length)
                bestBuf = zbuf;
            }
          } catch (e) {
          }
        } catch (e) {
        }
      }
    } catch (e) {
    }
    try {
      const advIn = (0, import_path3.join)((0, import_os2.tmpdir)(), `rox_adv_in_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
      (0, import_fs3.writeFileSync)(advIn, bestBuf);
      const rAdv = (0, import_child_process.spawnSync)("advdef", ["-z4", "-i10", advIn], {
        windowsHide: true,
        stdio: "ignore",
        timeout: 12e4
      });
      if (!rAdv.error && (0, import_fs3.existsSync)(advIn)) {
        const advBuf = (0, import_fs3.readFileSync)(advIn);
        try {
          (0, import_fs3.unlinkSync)(advIn);
        } catch (e) {
        }
        if (advBuf.length < bestBuf.length)
          bestBuf = advBuf;
      }
    } catch (e) {
    }
    for (const strat of strategies) {
      try {
        const comp = zlib2.deflateSync(filteredAll, {
          level: 9,
          memLevel: 9,
          strategy: strat
        });
        const altChunks = newChunks.map((c) => ({
          name: c.name,
          data: c.data
        }));
        const idx = altChunks.findIndex((c) => c.name === "IDAT");
        if (idx !== -1)
          altChunks[idx] = { name: "IDAT", data: comp };
        const candidate = ensurePng(Buffer.from((0, import_png_chunks_encode.default)(altChunks)));
        if (candidate.length < bestBuf.length)
          bestBuf = candidate;
      } catch (e) {
      }
    }
    try {
      const pixels = Buffer.alloc(width * height * 3);
      let prev = null;
      for (let y = 0; y < height; y++) {
        const f = raw[y * inRowLen];
        const row = raw.slice(y * inRowLen + 1, y * inRowLen + 1 + rowBytes);
        const recon = Buffer.alloc(rowBytes);
        for (let i = 0; i < rowBytes; i++) {
          const left = i - 3 >= 0 ? recon[i - 3] : 0;
          const up = prev ? prev[i] : 0;
          const upLeft = prev && i - 3 >= 0 ? prev[i - 3] : 0;
          let v = row[i];
          if (f === 0) {
          } else if (f === 1)
            v = v + left & 255;
          else if (f === 2)
            v = v + up & 255;
          else if (f === 3)
            v = v + Math.floor((left + up) / 2) & 255;
          else
            v = v + paethPredict(left, up, upLeft) & 255;
          recon[i] = v;
        }
        recon.copy(pixels, y * rowBytes);
        prev = recon;
      }
      const paletteMap = /* @__PURE__ */ new Map();
      const palette = [];
      for (let i = 0; i < pixels.length; i += 3) {
        const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
        if (!paletteMap.has(key)) {
          paletteMap.set(key, paletteMap.size);
          palette.push(pixels[i], pixels[i + 1], pixels[i + 2]);
          if (paletteMap.size > 256)
            break;
        }
      }
      if (paletteMap.size <= 256) {
        const idxRowLen = 1 + width * 1;
        const idxRows = [];
        for (let y = 0; y < height; y++) {
          const rowIdx = Buffer.alloc(width);
          for (let x = 0; x < width; x++) {
            const pos = (y * width + x) * 3;
            const key = `${pixels[pos]},${pixels[pos + 1]},${pixels[pos + 2]}`;
            rowIdx[x] = paletteMap.get(key);
          }
          let bestRowFilter = 0;
          let bestRowSum = Infinity;
          let bestRowFiltered = null;
          for (let f = 0; f <= 4; f++) {
            const filteredRow = Buffer.alloc(width);
            let sum = 0;
            for (let i = 0; i < width; i++) {
              const val = rowIdx[i];
              let outv = 0;
              const left = i - 1 >= 0 ? rowIdx[i - 1] : 0;
              const up = y > 0 ? idxRows[y - 1][i] : 0;
              const upLeft = y > 0 && i - 1 >= 0 ? idxRows[y - 1][i - 1] : 0;
              if (f === 0)
                outv = val;
              else if (f === 1)
                outv = val - left + 256 & 255;
              else if (f === 2)
                outv = val - up + 256 & 255;
              else if (f === 3)
                outv = val - Math.floor((left + up) / 2) + 256 & 255;
              else
                outv = val - paethPredict(left, up, upLeft) + 256 & 255;
              filteredRow[i] = outv;
              const signed = outv > 127 ? outv - 256 : outv;
              sum += Math.abs(signed);
            }
            if (sum < bestRowSum) {
              bestRowSum = sum;
              bestRowFilter = f;
              bestRowFiltered = filteredRow;
            }
          }
          const rowBuf = Buffer.alloc(idxRowLen);
          rowBuf[0] = bestRowFilter;
          bestRowFiltered.copy(rowBuf, 1);
          idxRows.push(rowBuf);
        }
        const freqMap = /* @__PURE__ */ new Map();
        for (let i = 0; i < pixels.length; i += 3) {
          const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
          freqMap.set(key, (freqMap.get(key) || 0) + 1);
        }
        const paletteVariants = [];
        paletteVariants.push({
          paletteArr: palette.slice(),
          map: new Map(paletteMap)
        });
        const freqSorted = Array.from(freqMap.entries()).sort((a, b) => b[1] - a[1]);
        if (freqSorted.length > 0) {
          const pal2 = [];
          const map2 = /* @__PURE__ */ new Map();
          let pi = 0;
          for (const [k] of freqSorted) {
            const parts = k.split(",").map((s) => Number(s));
            pal2.push(parts[0], parts[1], parts[2]);
            map2.set(k, pi++);
            if (pi >= 256)
              break;
          }
          if (map2.size <= 256)
            paletteVariants.push({ paletteArr: pal2, map: map2 });
        }
        for (const variant of paletteVariants) {
          let packRowIndices = function(rowIdx, bitDepth3) {
            if (bitDepth3 === 8)
              return rowIdx;
            const bitsPerRow = width * bitDepth3;
            const outLen = Math.ceil(bitsPerRow / 8);
            const out2 = Buffer.alloc(outLen);
            let bitPos = 0;
            for (let i = 0; i < width; i++) {
              const val = rowIdx[i] & (1 << bitDepth3) - 1;
              for (let b = 0; b < bitDepth3; b++) {
                const bit = val >> bitDepth3 - 1 - b & 1;
                const byteIdx = Math.floor(bitPos / 8);
                const shift = 7 - bitPos % 8;
                out2[byteIdx] |= bit << shift;
                bitPos++;
              }
            }
            return out2;
          };
          const pSize = variant.map.size;
          const bitDepth2 = pSize <= 2 ? 1 : pSize <= 4 ? 2 : pSize <= 16 ? 4 : 8;
          const idxRowsVar = [];
          for (let y = 0; y < height; y++) {
            const rowIdx = Buffer.alloc(width);
            for (let x = 0; x < width; x++) {
              const pos = (y * width + x) * 3;
              const key = `${pixels[pos]},${pixels[pos + 1]},${pixels[pos + 2]}`;
              rowIdx[x] = variant.map.get(key);
            }
            idxRowsVar.push(rowIdx);
          }
          const packedRows = [];
          for (let y = 0; y < height; y++) {
            const packed = packRowIndices(idxRowsVar[y], bitDepth2);
            let bestRowFilter = 0;
            let bestRowSum = Infinity;
            let bestRowFiltered = null;
            for (let f = 0; f <= 4; f++) {
              const filteredRow = Buffer.alloc(packed.length);
              let sum = 0;
              for (let i = 0; i < packed.length; i++) {
                const val = packed[i];
                const left = i - 1 >= 0 ? packed[i - 1] : 0;
                const up = y > 0 ? packedRows[y - 1][i] : 0;
                const upLeft = y > 0 && i - 1 >= 0 ? packedRows[y - 1][i - 1] : 0;
                let outv = 0;
                if (f === 0)
                  outv = val;
                else if (f === 1)
                  outv = val - left + 256 & 255;
                else if (f === 2)
                  outv = val - up + 256 & 255;
                else if (f === 3)
                  outv = val - Math.floor((left + up) / 2) + 256 & 255;
                else
                  outv = val - paethPredict(left, up, upLeft) + 256 & 255;
                filteredRow[i] = outv;
                const signed = outv > 127 ? outv - 256 : outv;
                sum += Math.abs(signed);
              }
              if (sum < bestRowSum) {
                bestRowSum = sum;
                bestRowFilter = f;
                bestRowFiltered = filteredRow;
              }
            }
            const rowBuf = Buffer.alloc(1 + packed.length);
            rowBuf[0] = bestRowFilter;
            bestRowFiltered.copy(rowBuf, 1);
            packedRows.push(rowBuf);
          }
          const idxFilteredAllVar = Buffer.concat(packedRows);
          const palettesBufVar = Buffer.from(variant.paletteArr);
          const palChunksVar = [];
          const ihdr2 = Buffer.alloc(13);
          ihdr2.writeUInt32BE(width, 0);
          ihdr2.writeUInt32BE(height, 4);
          ihdr2[8] = bitDepth2;
          ihdr2[9] = 3;
          ihdr2[10] = 0;
          ihdr2[11] = 0;
          ihdr2[12] = 0;
          palChunksVar.push({ name: "IHDR", data: ihdr2 });
          palChunksVar.push({ name: "PLTE", data: palettesBufVar });
          palChunksVar.push({
            name: "IDAT",
            data: zlib2.deflateSync(idxFilteredAllVar, { level: 9 })
          });
          palChunksVar.push({ name: "IEND", data: Buffer.alloc(0) });
          const palOutVar = ensurePng(Buffer.from((0, import_png_chunks_encode.default)(palChunksVar)));
          if (palOutVar.length < bestBuf.length)
            bestBuf = palOutVar;
        }
      }
    } catch (e) {
    }
    const externalAttempts = [
      { cmd: "oxipng", args: ["-o", "6", "--strip", "all"] },
      { cmd: "optipng", args: ["-o7"] },
      { cmd: "pngcrush", args: ["-brute", "-reduce"] },
      { cmd: "pngout", args: [] }
    ];
    for (const tool of externalAttempts) {
      try {
        const tIn = (0, import_path3.join)((0, import_os2.tmpdir)(), `rox_ext_in_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
        const tOut = tIn + ".out.png";
        (0, import_fs3.writeFileSync)(tIn, bestBuf);
        const args = tool.args.concat([tIn, tOut]);
        const r = (0, import_child_process.spawnSync)(tool.cmd, args, {
          windowsHide: true,
          stdio: "ignore",
          timeout: 24e4
        });
        if (!r.error && (0, import_fs3.existsSync)(tOut)) {
          const outb = (0, import_fs3.readFileSync)(tOut);
          try {
            (0, import_fs3.unlinkSync)(tIn);
            (0, import_fs3.unlinkSync)(tOut);
          } catch (e) {
          }
          if (outb.length < bestBuf.length)
            bestBuf = outb;
        } else {
          try {
            (0, import_fs3.unlinkSync)(tIn);
          } catch (e) {
          }
        }
      } catch (e) {
      }
    }
    return bestBuf;
  } catch (e) {
    return pngBuf;
  }
}

// node_modules/roxify/dist/utils/encoder.js
async function encodeBinaryToPng(input, opts = {}) {
  let progressBar = null;
  if (opts.showProgress) {
    progressBar = new import_cli_progress2.default.SingleBar({
      format: " {bar} {percentage}% | {step} | {elapsed}s"
    }, import_cli_progress2.default.Presets.shades_classic);
    progressBar.start(100, 0, { step: "Starting", elapsed: "0" });
    const startTime = Date.now();
    if (!opts.onProgress) {
      opts.onProgress = (info) => {
        let pct = 0;
        if (info.phase === "compress_progress" && info.loaded && info.total) {
          pct = info.loaded / info.total * 50;
        } else if (info.phase === "compress_done") {
          pct = 50;
        } else if (info.phase === "encrypt_done") {
          pct = 80;
        } else if (info.phase === "png_gen") {
          pct = 90;
        } else if (info.phase === "done") {
          pct = 100;
        }
        progressBar.update(Math.floor(pct), {
          step: info.phase.replace("_", " "),
          elapsed: String(Math.floor((Date.now() - startTime) / 1e3))
        });
      };
    }
  }
  let payloadInput;
  let totalLen = 0;
  if (Array.isArray(input)) {
    payloadInput = [MAGIC, ...input];
    totalLen = MAGIC.length + input.reduce((a, b) => a + b.length, 0);
  } else {
    payloadInput = [MAGIC, input];
    totalLen = MAGIC.length + input.length;
  }
  if (opts.onProgress)
    opts.onProgress({ phase: "compress_start", total: totalLen });
  let payload = await parallelZstdCompress(payloadInput, 15, (loaded, total) => {
    if (opts.onProgress) {
      opts.onProgress({
        phase: "compress_progress",
        loaded,
        total
      });
    }
  });
  if (opts.onProgress)
    opts.onProgress({ phase: "compress_done", loaded: payload.length });
  if (Array.isArray(input)) {
    input.length = 0;
  }
  if (opts.passphrase && !opts.encrypt) {
    opts.encrypt = "aes";
  }
  if (opts.encrypt === "auto" && !opts._skipAuto) {
    const candidates = ["none", "xor", "aes"];
    const candidateBufs = [];
    for (const c of candidates) {
      const testBuf = await encodeBinaryToPng(input, {
        ...opts,
        encrypt: c,
        _skipAuto: true
      });
      candidateBufs.push({ enc: c, buf: testBuf });
    }
    candidateBufs.sort((a, b) => a.buf.length - b.buf.length);
    return candidateBufs[0].buf;
  }
  if (opts.passphrase && opts.encrypt && opts.encrypt !== "auto") {
    const encChoice = opts.encrypt;
    if (opts.onProgress)
      opts.onProgress({ phase: "encrypt_start" });
    if (encChoice === "aes") {
      const salt = (0, import_crypto2.randomBytes)(16);
      const iv = (0, import_crypto2.randomBytes)(12);
      const PBKDF2_ITERS = 1e6;
      const key = (0, import_crypto2.pbkdf2Sync)(opts.passphrase, salt, PBKDF2_ITERS, 32, "sha256");
      const cipher = (0, import_crypto2.createCipheriv)("aes-256-gcm", key, iv);
      const encParts = [];
      for (const chunk of payload) {
        encParts.push(cipher.update(chunk));
      }
      encParts.push(cipher.final());
      const tag = cipher.getAuthTag();
      payload = [Buffer.from([ENC_AES]), salt, iv, tag, ...encParts];
      if (opts.onProgress)
        opts.onProgress({ phase: "encrypt_done" });
    } else if (encChoice === "xor") {
      const xoredParts = [];
      let offset = 0;
      const keyBuf = Buffer.from(opts.passphrase, "utf8");
      for (const chunk of payload) {
        const out = Buffer.alloc(chunk.length);
        for (let i = 0; i < chunk.length; i++) {
          out[i] = chunk[i] ^ keyBuf[(offset + i) % keyBuf.length];
        }
        offset += chunk.length;
        xoredParts.push(out);
      }
      payload = [Buffer.from([ENC_XOR]), ...xoredParts];
      if (opts.onProgress)
        opts.onProgress({ phase: "encrypt_done" });
    } else if (encChoice === "none") {
      payload = [Buffer.from([ENC_NONE]), ...payload];
      if (opts.onProgress)
        opts.onProgress({ phase: "encrypt_done" });
    }
  } else {
    payload = [Buffer.from([ENC_NONE]), ...payload];
  }
  const payloadTotalLen = payload.reduce((a, b) => a + b.length, 0);
  if (opts.onProgress)
    opts.onProgress({ phase: "meta_prep_done", loaded: payloadTotalLen });
  const metaParts = [];
  const includeName = opts.includeName === void 0 ? true : !!opts.includeName;
  if (includeName && opts.name) {
    const nameBuf = Buffer.from(opts.name, "utf8");
    metaParts.push(Buffer.from([nameBuf.length]));
    metaParts.push(nameBuf);
  } else {
    metaParts.push(Buffer.from([0]));
  }
  let meta = [...metaParts, ...payload];
  if (opts.includeFileList && opts.fileList) {
    let sizeMap = null;
    if (!Array.isArray(input)) {
      try {
        const unpack = unpackBuffer(input);
        if (unpack) {
          sizeMap = {};
          for (const ef of unpack.files)
            sizeMap[ef.path] = ef.buf.length;
        }
      } catch (e) {
      }
    }
    const normalized = opts.fileList.map((f) => {
      if (typeof f === "string")
        return { name: f, size: sizeMap && sizeMap[f] ? sizeMap[f] : 0 };
      if (f && typeof f === "object") {
        if (f.name)
          return { name: f.name, size: f.size ?? 0 };
        if (f.path)
          return { name: f.path, size: f.size ?? 0 };
      }
      return { name: String(f), size: 0 };
    });
    const jsonBuf = Buffer.from(JSON.stringify(normalized), "utf8");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(jsonBuf.length, 0);
    meta = [...meta, Buffer.from("rXFL", "utf8"), lenBuf, jsonBuf];
  }
  if (opts.output === "rox") {
    return Buffer.concat([MAGIC, ...meta]);
  }
  {
    const nameBuf = opts.name ? Buffer.from(opts.name, "utf8") : Buffer.alloc(0);
    const nameLen = nameBuf.length;
    const payloadLenBuf = Buffer.alloc(4);
    payloadLenBuf.writeUInt32BE(payloadTotalLen, 0);
    const version = 1;
    let metaPixel = [
      Buffer.from([version]),
      Buffer.from([nameLen]),
      nameBuf,
      payloadLenBuf,
      ...payload
    ];
    if (opts.includeFileList && opts.fileList) {
      let sizeMap2 = null;
      if (!Array.isArray(input)) {
        try {
          const unpack = unpackBuffer(input);
          if (unpack) {
            sizeMap2 = {};
            for (const ef of unpack.files)
              sizeMap2[ef.path] = ef.buf.length;
          }
        } catch (e) {
        }
      }
      const normalized = opts.fileList.map((f) => {
        if (typeof f === "string")
          return { name: f, size: sizeMap2 && sizeMap2[f] ? sizeMap2[f] : 0 };
        if (f && typeof f === "object") {
          if (f.name)
            return { name: f.name, size: f.size ?? 0 };
          if (f.path)
            return { name: f.path, size: f.size ?? 0 };
        }
        return { name: String(f), size: 0 };
      });
      const jsonBuf = Buffer.from(JSON.stringify(normalized), "utf8");
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32BE(jsonBuf.length, 0);
      metaPixel = [...metaPixel, Buffer.from("rXFL", "utf8"), lenBuf, jsonBuf];
    }
    const dataWithoutMarkers = [PIXEL_MAGIC, ...metaPixel];
    const dataWithoutMarkersLen = dataWithoutMarkers.reduce((a, b) => a + b.length, 0);
    const padding = (3 - dataWithoutMarkersLen % 3) % 3;
    const paddedData = padding > 0 ? [...dataWithoutMarkers, Buffer.alloc(padding)] : dataWithoutMarkers;
    const markerStartBytes = colorsToBytes(MARKER_START);
    const compressionMarkerBytes = colorsToBytes(COMPRESSION_MARKERS.zstd);
    const dataWithMarkers = [
      markerStartBytes,
      compressionMarkerBytes,
      ...paddedData
    ];
    const bytesPerPixel = 3;
    const dataWithMarkersLen = dataWithMarkers.reduce((a, b) => a + b.length, 0);
    const dataPixels = Math.ceil(dataWithMarkersLen / 3);
    const totalPixels = dataPixels + MARKER_END.length;
    const maxWidth = 16384;
    let side = Math.ceil(Math.sqrt(totalPixels));
    if (side < MARKER_END.length)
      side = MARKER_END.length;
    let logicalWidth;
    let logicalHeight;
    if (side <= maxWidth) {
      logicalWidth = side;
      logicalHeight = side;
    } else {
      logicalWidth = Math.min(maxWidth, totalPixels);
      logicalHeight = Math.ceil(totalPixels / logicalWidth);
    }
    const scale = 1;
    const width = logicalWidth * scale;
    const height = logicalHeight * scale;
    const LARGE_IMAGE_PIXELS = 5e7;
    const useManualPng = width * height > LARGE_IMAGE_PIXELS || !!process.env.ROX_FAST_PNG;
    let raw;
    let stride = 0;
    if (useManualPng) {
      stride = width * 3 + 1;
      raw = Buffer.alloc(height * stride);
    } else {
      raw = Buffer.alloc(width * height * bytesPerPixel);
    }
    let currentBufIdx = 0;
    let currentBufOffset = 0;
    const getNextByte = () => {
      while (currentBufIdx < dataWithMarkers.length) {
        const buf = dataWithMarkers[currentBufIdx];
        if (currentBufOffset < buf.length) {
          return buf[currentBufOffset++];
        }
        currentBufIdx++;
        currentBufOffset = 0;
      }
      return 0;
    };
    for (let ly = 0; ly < logicalHeight; ly++) {
      if (useManualPng) {
        for (let sy = 0; sy < scale; sy++) {
          const py = ly * scale + sy;
          raw[py * stride] = 0;
        }
      }
      for (let lx = 0; lx < logicalWidth; lx++) {
        const linearIdx = ly * logicalWidth + lx;
        let r = 0, g = 0, b = 0;
        if (ly === logicalHeight - 1 && lx >= logicalWidth - MARKER_END.length) {
          const markerIdx = lx - (logicalWidth - MARKER_END.length);
          r = MARKER_END[markerIdx].r;
          g = MARKER_END[markerIdx].g;
          b = MARKER_END[markerIdx].b;
        } else if (linearIdx < dataPixels) {
          r = getNextByte();
          g = getNextByte();
          b = getNextByte();
        }
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = lx * scale + sx;
            const py = ly * scale + sy;
            if (useManualPng) {
              const dstIdx = py * stride + 1 + px * 3;
              raw[dstIdx] = r;
              raw[dstIdx + 1] = g;
              raw[dstIdx + 2] = b;
            } else {
              const dstIdx = (py * width + px) * 3;
              raw[dstIdx] = r;
              raw[dstIdx + 1] = g;
              raw[dstIdx + 2] = b;
            }
          }
        }
      }
    }
    payload.length = 0;
    dataWithMarkers.length = 0;
    metaPixel.length = 0;
    meta.length = 0;
    paddedData.length = 0;
    dataWithoutMarkers.length = 0;
    if (opts.onProgress)
      opts.onProgress({ phase: "png_gen", loaded: 0, total: height });
    let bufScr;
    if (useManualPng) {
      const bytesPerRow = width * 3;
      const scanlinesData = Buffer.alloc(height * (1 + bytesPerRow));
      const progressStep = Math.max(1, Math.floor(height / 20));
      for (let row = 0; row < height; row++) {
        scanlinesData[row * (1 + bytesPerRow)] = 0;
        const srcStart = row * stride + 1;
        const dstStart = row * (1 + bytesPerRow) + 1;
        raw.copy(scanlinesData, dstStart, srcStart, srcStart + bytesPerRow);
        if (opts.onProgress && row % progressStep === 0) {
          opts.onProgress({ phase: "png_gen", loaded: row, total: height });
        }
      }
      if (opts.onProgress)
        opts.onProgress({ phase: "png_compress", loaded: 0, total: 100 });
      const idatData = zlib3.deflateSync(scanlinesData, {
        level: 3,
        memLevel: 8,
        strategy: zlib3.constants.Z_DEFAULT_STRATEGY
      });
      raw = Buffer.alloc(0);
      const ihdrData = Buffer.alloc(13);
      ihdrData.writeUInt32BE(width, 0);
      ihdrData.writeUInt32BE(height, 4);
      ihdrData[8] = 8;
      ihdrData[9] = 2;
      ihdrData[10] = 0;
      ihdrData[11] = 0;
      ihdrData[12] = 0;
      const ihdrType = Buffer.from("IHDR", "utf8");
      const ihdrCrc = crc32(ihdrData, crc32(ihdrType));
      const ihdrCrcBuf = Buffer.alloc(4);
      ihdrCrcBuf.writeUInt32BE(ihdrCrc, 0);
      const ihdrLen = Buffer.alloc(4);
      ihdrLen.writeUInt32BE(ihdrData.length, 0);
      const idatType = Buffer.from("IDAT", "utf8");
      const idatCrc = crc32(idatData, crc32(idatType));
      const idatCrcBuf = Buffer.alloc(4);
      idatCrcBuf.writeUInt32BE(idatCrc, 0);
      const idatLen = Buffer.alloc(4);
      idatLen.writeUInt32BE(idatData.length, 0);
      const iendType = Buffer.from("IEND", "utf8");
      const iendCrc = crc32(Buffer.alloc(0), crc32(iendType));
      const iendCrcBuf = Buffer.alloc(4);
      iendCrcBuf.writeUInt32BE(iendCrc, 0);
      const iendLen = Buffer.alloc(4);
      iendLen.writeUInt32BE(0, 0);
      bufScr = Buffer.concat([
        PNG_HEADER,
        ihdrLen,
        ihdrType,
        ihdrData,
        ihdrCrcBuf,
        idatLen,
        idatType,
        idatData,
        idatCrcBuf,
        iendLen,
        iendType,
        iendCrcBuf
      ]);
    } else {
      bufScr = await (0, import_sharp3.default)(raw, {
        raw: { width, height, channels: 3 }
      }).png({
        compressionLevel: 3,
        palette: false,
        effort: 1,
        adaptiveFiltering: false
      }).toBuffer();
    }
    raw = Buffer.alloc(0);
    if (opts.onProgress)
      opts.onProgress({ phase: "png_compress", loaded: 100, total: 100 });
    if (opts.onProgress)
      opts.onProgress({ phase: "optimizing", loaded: 0, total: 100 });
    try {
      const optimized = await optimizePngBuffer(bufScr, true);
      if (opts.onProgress)
        opts.onProgress({ phase: "optimizing", loaded: 100, total: 100 });
      progressBar?.stop();
      return optimized;
    } catch (e) {
      progressBar?.stop();
      return bufScr;
    }
  }
}

// node_modules/roxify/dist/utils/inspection.js
var import_png_chunks_extract3 = __toESM(require_png_chunks_extract(), 1);
var import_sharp4 = __toESM(require_lib(), 1);
var zlib4 = __toESM(require("zlib"), 1);
async function listFilesInPng(pngBuf, opts = {}) {
  try {
    const chunks = (0, import_png_chunks_extract3.default)(pngBuf);
    const ihdr = chunks.find((c) => c.name === "IHDR");
    const idatChunks = chunks.filter((c) => c.name === "IDAT");
    if (ihdr && idatChunks.length > 0) {
      const ihdrData = Buffer.from(ihdr.data);
      const width = ihdrData.readUInt32BE(0);
      const bpp = 3;
      const rowLen = 1 + width * bpp;
      const files = await new Promise((resolve3) => {
        const inflate2 = zlib4.createInflate();
        let buffer = Buffer.alloc(0);
        let resolved = false;
        inflate2.on("data", (chunk) => {
          if (resolved)
            return;
          buffer = Buffer.concat([buffer, chunk]);
          const cleanBuffer = Buffer.alloc(buffer.length);
          let cleanPtr = 0;
          let ptr = 0;
          while (ptr < buffer.length) {
            const rowPos = ptr % rowLen;
            if (rowPos === 0) {
              ptr++;
            } else {
              const remainingInRow = rowLen - rowPos;
              const available = buffer.length - ptr;
              const toCopy = Math.min(remainingInRow, available);
              buffer.copy(cleanBuffer, cleanPtr, ptr, ptr + toCopy);
              cleanPtr += toCopy;
              ptr += toCopy;
            }
          }
          const validClean = cleanBuffer.slice(0, cleanPtr);
          if (validClean.length < 12)
            return;
          const magic = validClean.slice(8, 12);
          if (!magic.equals(PIXEL_MAGIC)) {
            resolved = true;
            inflate2.destroy();
            resolve3(null);
            return;
          }
          let idx = 12;
          if (validClean.length < idx + 2)
            return;
          idx++;
          const nameLen = validClean[idx++];
          if (validClean.length < idx + nameLen + 4)
            return;
          idx += nameLen;
          idx += 4;
          if (validClean.length < idx + 4)
            return;
          const marker = validClean.slice(idx, idx + 4).toString("utf8");
          if (marker === "rXFL") {
            idx += 4;
            if (validClean.length < idx + 4)
              return;
            const jsonLen = validClean.readUInt32BE(idx);
            idx += 4;
            if (validClean.length < idx + jsonLen)
              return;
            const jsonBuf = validClean.slice(idx, idx + jsonLen);
            try {
              const parsedFiles = JSON.parse(jsonBuf.toString("utf8"));
              resolved = true;
              inflate2.destroy();
              if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
                const objs = parsedFiles.map((p) => ({
                  name: p.name ?? p.path,
                  size: typeof p.size === "number" ? p.size : 0
                }));
                resolve3(objs.sort((a, b) => a.name.localeCompare(b.name)));
                return;
              }
              const names = parsedFiles;
              if (opts.includeSizes) {
                getFileSizesFromPng(pngBuf).then((sizes) => {
                  if (sizes) {
                    resolve3(names.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name)));
                  } else {
                    resolve3(names.sort());
                  }
                }).catch(() => resolve3(names.sort()));
              } else {
                resolve3(names.sort());
              }
            } catch (e) {
              resolved = true;
              inflate2.destroy();
              resolve3(null);
            }
          } else {
            resolved = true;
            inflate2.destroy();
            resolve3(null);
          }
        });
        inflate2.on("error", () => {
          if (!resolved)
            resolve3(null);
        });
        inflate2.on("end", () => {
          if (!resolved)
            resolve3(null);
        });
        for (const chunk of idatChunks) {
          if (resolved)
            break;
          inflate2.write(Buffer.from(chunk.data));
        }
        inflate2.end();
      });
      if (files)
        return files;
    }
  } catch (e) {
    console.log(" error:", e);
  }
  try {
    try {
      const { data, info } = await (0, import_sharp4.default)(pngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const currentWidth = info.width;
      const currentHeight = info.height;
      const rawRGB = Buffer.alloc(currentWidth * currentHeight * 3);
      for (let i = 0; i < currentWidth * currentHeight; i++) {
        rawRGB[i * 3] = data[i * 4];
        rawRGB[i * 3 + 1] = data[i * 4 + 1];
        rawRGB[i * 3 + 2] = data[i * 4 + 2];
      }
      const found = rawRGB.indexOf(PIXEL_MAGIC);
      if (found !== -1) {
        let idx = found + PIXEL_MAGIC.length;
        if (idx + 2 <= rawRGB.length) {
          const version = rawRGB[idx++];
          const nameLen = rawRGB[idx++];
          if (process.env.ROX_DEBUG)
            console.log("listFilesInPng: pixel version", version, "nameLen", nameLen);
          if (nameLen > 0 && idx + nameLen <= rawRGB.length) {
            idx += nameLen;
          }
          if (idx + 4 <= rawRGB.length) {
            const payloadLen = rawRGB.readUInt32BE(idx);
            idx += 4;
            const afterPayload = idx + payloadLen;
            if (afterPayload <= rawRGB.length) {
              if (afterPayload + 8 <= rawRGB.length) {
                const marker = rawRGB.slice(afterPayload, afterPayload + 4).toString("utf8");
                if (marker === "rXFL") {
                  const jsonLen = rawRGB.readUInt32BE(afterPayload + 4);
                  const jsonStart = afterPayload + 8;
                  const jsonEnd = jsonStart + jsonLen;
                  if (jsonEnd <= rawRGB.length) {
                    const jsonBuf = rawRGB.slice(jsonStart, jsonEnd);
                    const parsedFiles = JSON.parse(jsonBuf.toString("utf8"));
                    if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
                      const objs = parsedFiles.map((p) => ({
                        name: p.name ?? p.path,
                        size: typeof p.size === "number" ? p.size : 0
                      }));
                      return objs.sort((a, b) => a.name.localeCompare(b.name));
                    }
                    const files = parsedFiles;
                    if (opts.includeSizes) {
                      const sizes = await getFileSizesFromPng(pngBuf);
                      if (sizes) {
                        return files.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
                      }
                    }
                    return files.sort();
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
    }
  } catch (e) {
  }
  try {
    const reconstructed = await cropAndReconstitute(pngBuf);
    try {
      const { data, info } = await (0, import_sharp4.default)(reconstructed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const currentWidth = info.width;
      const currentHeight = info.height;
      const rawRGB = Buffer.alloc(currentWidth * currentHeight * 3);
      for (let i = 0; i < currentWidth * currentHeight; i++) {
        rawRGB[i * 3] = data[i * 4];
        rawRGB[i * 3 + 1] = data[i * 4 + 1];
        rawRGB[i * 3 + 2] = data[i * 4 + 2];
      }
      const found = rawRGB.indexOf(PIXEL_MAGIC);
      if (found !== -1) {
        let idx = found + PIXEL_MAGIC.length;
        if (idx + 2 <= rawRGB.length) {
          const version = rawRGB[idx++];
          const nameLen = rawRGB[idx++];
          if (process.env.ROX_DEBUG)
            console.log("listFilesInPng (reconstructed): pixel version", version, "nameLen", nameLen);
          if (nameLen > 0 && idx + nameLen <= rawRGB.length) {
            idx += nameLen;
          }
          if (idx + 4 <= rawRGB.length) {
            const payloadLen = rawRGB.readUInt32BE(idx);
            idx += 4;
            const afterPayload = idx + payloadLen;
            if (afterPayload <= rawRGB.length) {
              if (afterPayload + 8 <= rawRGB.length) {
                const marker = rawRGB.slice(afterPayload, afterPayload + 4).toString("utf8");
                if (marker === "rXFL") {
                  const jsonLen = rawRGB.readUInt32BE(afterPayload + 4);
                  const jsonStart = afterPayload + 8;
                  const jsonEnd = jsonStart + jsonLen;
                  if (jsonEnd <= rawRGB.length) {
                    const jsonBuf = rawRGB.slice(jsonStart, jsonEnd);
                    const parsedFiles = JSON.parse(jsonBuf.toString("utf8"));
                    if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
                      const objs = parsedFiles.map((p) => ({
                        name: p.name ?? p.path,
                        size: typeof p.size === "number" ? p.size : 0
                      }));
                      return objs.sort((a, b) => a.name.localeCompare(b.name));
                    }
                    const files = parsedFiles;
                    if (opts.includeSizes) {
                      const sizes = await getFileSizesFromPng(reconstructed);
                      if (sizes) {
                        return files.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
                      }
                    }
                    return files.sort();
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
    }
    try {
      const chunks = (0, import_png_chunks_extract3.default)(reconstructed);
      const fileListChunk = chunks.find((c) => c.name === "rXFL");
      if (fileListChunk) {
        const data = Buffer.isBuffer(fileListChunk.data) ? fileListChunk.data : Buffer.from(fileListChunk.data);
        const parsedFiles = JSON.parse(data.toString("utf8"));
        if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
          const objs = parsedFiles.map((p) => ({
            name: p.name ?? p.path,
            size: typeof p.size === "number" ? p.size : 0
          }));
          return objs.sort((a, b) => a.name.localeCompare(b.name));
        }
        const files = parsedFiles;
        if (opts.includeSizes) {
          const sizes = await getFileSizesFromPng(pngBuf);
          if (sizes) {
            return files.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
          }
        }
        return files.sort();
      }
      const metaChunk = chunks.find((c) => c.name === CHUNK_TYPE);
      if (metaChunk) {
        const dataBuf = Buffer.isBuffer(metaChunk.data) ? metaChunk.data : Buffer.from(metaChunk.data);
        const markerIdx = dataBuf.indexOf(Buffer.from("rXFL"));
        if (markerIdx !== -1 && markerIdx + 8 <= dataBuf.length) {
          const jsonLen = dataBuf.readUInt32BE(markerIdx + 4);
          const jsonStart = markerIdx + 8;
          const jsonEnd = jsonStart + jsonLen;
          if (jsonEnd <= dataBuf.length) {
            const parsedFiles = JSON.parse(dataBuf.slice(jsonStart, jsonEnd).toString("utf8"));
            if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
              const objs = parsedFiles.map((p) => ({
                name: p.name ?? p.path,
                size: typeof p.size === "number" ? p.size : 0
              }));
              return objs.sort((a, b) => a.name.localeCompare(b.name));
            }
            const files = parsedFiles;
            return files.sort();
          }
        }
      }
    } catch (e) {
    }
  } catch (e) {
  }
  try {
    const chunks = (0, import_png_chunks_extract3.default)(pngBuf);
    const fileListChunk = chunks.find((c) => c.name === "rXFL");
    if (fileListChunk) {
      const data = Buffer.isBuffer(fileListChunk.data) ? fileListChunk.data : Buffer.from(fileListChunk.data);
      const parsedFiles = JSON.parse(data.toString("utf8"));
      if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
        const objs = parsedFiles.map((p) => ({
          name: p.name ?? p.path,
          size: typeof p.size === "number" ? p.size : 0
        }));
        return objs.sort((a, b) => a.name.localeCompare(b.name));
      }
      const files = parsedFiles;
      if (opts.includeSizes) {
        const sizes = await getFileSizesFromPng(pngBuf);
        if (sizes) {
          return files.map((f) => ({ name: f, size: sizes[f] ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
        }
      }
      return files.sort();
    }
    const metaChunk = chunks.find((c) => c.name === CHUNK_TYPE);
    if (metaChunk) {
      const dataBuf = Buffer.isBuffer(metaChunk.data) ? metaChunk.data : Buffer.from(metaChunk.data);
      const markerIdx = dataBuf.indexOf(Buffer.from("rXFL"));
      if (markerIdx !== -1 && markerIdx + 8 <= dataBuf.length) {
        const jsonLen = dataBuf.readUInt32BE(markerIdx + 4);
        const jsonStart = markerIdx + 8;
        const jsonEnd = jsonStart + jsonLen;
        if (jsonEnd <= dataBuf.length) {
          const parsedFiles = JSON.parse(dataBuf.slice(jsonStart, jsonEnd).toString("utf8"));
          if (parsedFiles.length > 0 && typeof parsedFiles[0] === "object" && (parsedFiles[0].name || parsedFiles[0].path)) {
            const objs = parsedFiles.map((p) => ({
              name: p.name ?? p.path,
              size: typeof p.size === "number" ? p.size : 0
            }));
            return objs.sort((a, b) => a.name.localeCompare(b.name));
          }
          const files = parsedFiles;
          return files.sort();
        }
      }
    }
  } catch (e) {
  }
  return null;
}
async function getFileSizesFromPng(pngBuf) {
  try {
    const res = await decodePngToBinary(pngBuf, { showProgress: false });
    if (res && res.files) {
      const map = {};
      for (const f of res.files)
        map[f.path] = f.buf.length;
      return map;
    }
    if (res && res.buf) {
      const unpack = unpackBuffer(res.buf);
      if (unpack) {
        const map = {};
        for (const f of unpack.files)
          map[f.path] = f.buf.length;
        return map;
      }
    }
  } catch (e) {
  }
  return null;
}
async function hasPassphraseInPng(pngBuf) {
  try {
    if (pngBuf.slice(0, MAGIC.length).equals(MAGIC)) {
      let offset = MAGIC.length;
      if (offset >= pngBuf.length)
        return false;
      const nameLen = pngBuf.readUInt8(offset);
      offset += 1 + nameLen;
      if (offset >= pngBuf.length)
        return false;
      const flag = pngBuf[offset];
      return flag === ENC_AES || flag === ENC_XOR;
    }
    try {
      const chunksRaw = (0, import_png_chunks_extract3.default)(pngBuf);
      const target = chunksRaw.find((c) => c.name === CHUNK_TYPE);
      if (target) {
        const data = Buffer.isBuffer(target.data) ? target.data : Buffer.from(target.data);
        if (data.length >= 1) {
          const nameLen = data.readUInt8(0);
          const payloadStart = 1 + nameLen;
          if (payloadStart < data.length) {
            const flag = data[payloadStart];
            return flag === ENC_AES || flag === ENC_XOR;
          }
        }
      }
    } catch (e) {
    }
    try {
      const sharpLib = await Promise.resolve().then(() => __toESM(require_lib(), 1));
      const { data } = await sharpLib.default(pngBuf).raw().toBuffer({ resolveWithObject: true });
      const rawRGB = Buffer.from(data);
      const markerLen = MARKER_COLORS.length * 3;
      for (let i = 0; i <= rawRGB.length - markerLen; i += 3) {
        let ok = true;
        for (let m = 0; m < MARKER_COLORS.length; m++) {
          const j = i + m * 3;
          if (rawRGB[j] !== MARKER_COLORS[m].r || rawRGB[j + 1] !== MARKER_COLORS[m].g || rawRGB[j + 2] !== MARKER_COLORS[m].b) {
            ok = false;
            break;
          }
        }
        if (!ok)
          continue;
        const headerStart = i + markerLen;
        if (headerStart + PIXEL_MAGIC.length >= rawRGB.length)
          continue;
        if (!rawRGB.slice(headerStart, headerStart + PIXEL_MAGIC.length).equals(PIXEL_MAGIC))
          continue;
        const metaStart = headerStart + PIXEL_MAGIC.length;
        if (metaStart + 2 >= rawRGB.length)
          continue;
        const nameLen = rawRGB[metaStart + 1];
        const payloadLenOff = metaStart + 2 + nameLen;
        const payloadStart = payloadLenOff + 4;
        if (payloadStart >= rawRGB.length)
          continue;
        const flag = rawRGB[payloadStart];
        return flag === ENC_AES || flag === ENC_XOR;
      }
    } catch (e) {
    }
    try {
      await decodePngToBinary(pngBuf, { showProgress: false });
      return false;
    } catch (e) {
      if (e instanceof PassphraseRequiredError)
        return true;
      if (e.message && e.message.toLowerCase().includes("passphrase"))
        return true;
      return false;
    }
  } catch (e) {
    return false;
  }
}

// node_modules/roxify/dist/minpng.js
var import_zstd4 = __toESM(require_lib2(), 1);
var import_png_chunks_encode2 = __toESM(require_png_chunks_encode(), 1);
var PIXEL_MAGIC2 = Buffer.from("MNPG");
var MARKER_START2 = [
  { r: 255, g: 0, b: 0 },
  { r: 0, g: 255, b: 0 },
  { r: 0, b: 0, g: 255 }
];
var MARKER_END2 = [...MARKER_START2].reverse();

// node_modules/roxify/dist/cli.js
var VERSION = "1.2.6";
function showHelp() {
  console.log(`
ROX CLI \u2014 Encode/decode binary in PNG

Usage:
  npx rox <command> [options]

Commands:
  encode <input>... [output]   Encode one or more files/directories into a PNG
  decode <input> [output]   Decode PNG to original file
  list <input>               List files in a Rox PNG archive
  havepassphrase <input>     Check whether the PNG requires a passphrase

Options:
  -p, --passphrase <pass>   Use passphrase (AES-256-GCM)
  -m, --mode <mode>         Mode: screenshot (default)
  -e, --encrypt <type>      auto|aes|xor|none
  --no-compress             Disable compression
  -o, --output <path>       Output file path
  -s, --sizes               Show file sizes in 'list' output (default)
  --no-sizes                Disable file size reporting in 'list'
  --files <list>            Extract only specified files (comma-separated)
  --view-reconst            Export the reconstituted PNG for debugging
  --debug                   Export debug images (doubled.png, reconstructed.png)
  -v, --verbose             Show detailed errors

Run "npx rox help" for this message.
`);
}
function parseArgs(args) {
  const parsed = { _: [] };
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (key === "no-compress") {
        parsed.noCompress = true;
        i++;
      } else if (key === "verbose") {
        parsed.verbose = true;
        i++;
      } else if (key === "view-reconst") {
        parsed.viewReconst = true;
        i++;
      } else if (key === "sizes") {
        parsed.sizes = true;
        i++;
      } else if (key === "no-sizes") {
        parsed.sizes = false;
        i++;
      } else if (key === "debug") {
        parsed.debug = true;
        i++;
      } else if (key === "debug-dir") {
        parsed.debugDir = args[i + 1];
        i += 2;
      } else if (key === "files") {
        parsed.files = args[i + 1].split(",");
        i += 2;
      } else {
        const value = args[i + 1];
        parsed[key] = value;
        i += 2;
      }
    } else if (arg.startsWith("-")) {
      const flag = arg.slice(1);
      const value = args[i + 1];
      switch (flag) {
        case "p":
          parsed.passphrase = value;
          i += 2;
          break;
        case "m":
          i += 2;
          break;
        case "e":
          parsed.encrypt = value;
          i += 2;
          break;
        case "o":
          parsed.output = value;
          i += 2;
          break;
        case "v":
          parsed.verbose = true;
          i += 1;
          break;
        case "s":
          parsed.sizes = true;
          i += 1;
          break;
          break;
        case "d":
          parsed.debugDir = value;
          i += 2;
          break;
        default:
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
      }
    } else {
      parsed._.push(arg);
      i++;
    }
  }
  return parsed;
}
async function encodeCommand(args) {
  const parsed = parseArgs(args);
  const inputPaths = parsed.output ? parsed._ : parsed._.length > 1 ? parsed._.slice(0, -1) : parsed._;
  const outputPath = parsed.output ? void 0 : parsed._.length > 1 ? parsed._[parsed._.length - 1] : void 0;
  const firstInput = inputPaths[0];
  if (!firstInput) {
    console.log(" ");
    console.error("Error: Input file required");
    console.log("Usage: npx rox encode <input> [output] [options]");
    process.exit(1);
  }
  const resolvedInputs = inputPaths.map((p) => (0, import_path4.resolve)(p));
  let outputName = inputPaths.length === 1 ? (0, import_path4.basename)(firstInput) : "archive";
  if (inputPaths.length === 1 && !(0, import_fs4.statSync)(resolvedInputs[0]).isDirectory()) {
    outputName = outputName.replace(/(\.[^.]+)?$/, ".png");
  } else {
    outputName += ".png";
  }
  const resolvedOutput = parsed.output || outputPath || outputName;
  let options = {};
  try {
    const encodeBar = new import_cli_progress3.default.SingleBar({
      format: " {bar} {percentage}% | {step} | {elapsed}s"
    }, import_cli_progress3.default.Presets.shades_classic);
    let barStarted = false;
    const startEncode = Date.now();
    let currentEncodeStep = "Starting";
    let displayedPct = 0;
    let targetPct = 0;
    const TICK_MS = 100;
    const PCT_STEP = 1;
    const encodeHeartbeat = setInterval(() => {
      const elapsed = Date.now() - startEncode;
      if (!barStarted) {
        encodeBar.start(100, Math.floor(displayedPct), {
          step: currentEncodeStep,
          elapsed: "0"
        });
        barStarted = true;
      }
      if (displayedPct < targetPct) {
        displayedPct = Math.min(displayedPct + PCT_STEP, targetPct);
      } else if (displayedPct < 99) {
        displayedPct = Math.min(displayedPct + PCT_STEP, 99);
      }
      encodeBar.update(Math.floor(displayedPct), {
        step: currentEncodeStep,
        elapsed: String(Math.floor(elapsed / 1e3))
      });
    }, TICK_MS);
    const mode = "screenshot";
    Object.assign(options, {
      mode,
      name: parsed.outputName || "archive"
    });
    if (parsed.verbose)
      options.verbose = true;
    if (parsed.noCompress)
      options.compression = "none";
    if (parsed.passphrase) {
      options.passphrase = parsed.passphrase;
      options.encrypt = parsed.encrypt || "aes";
    }
    console.log(`Encoding to ${resolvedOutput} (Mode: ${mode})
`);
    let inputData;
    let inputSizeVal = 0;
    let displayName;
    let totalBytes = 0;
    const onProgress = (readBytes, total, currentFile) => {
      if (totalBytes === 0)
        totalBytes = total;
      const packPct = Math.floor(readBytes / totalBytes * 25);
      targetPct = Math.max(targetPct, packPct);
      currentEncodeStep = currentFile ? `Reading files: ${currentFile}` : "Reading files";
    };
    if (inputPaths.length > 1) {
      currentEncodeStep = "Reading files";
      const { index, stream, totalSize } = await packPathsGenerator(inputPaths, void 0, onProgress);
      inputData = stream;
      inputSizeVal = totalSize;
      displayName = parsed.outputName || "archive";
      options.includeFileList = true;
      options.fileList = index.map((e) => ({
        name: e.path,
        size: e.size
      }));
    } else {
      const resolvedInput = resolvedInputs[0];
      const st = (0, import_fs4.statSync)(resolvedInput);
      if (st.isDirectory()) {
        currentEncodeStep = "Reading files";
        const { index, stream, totalSize } = await packPathsGenerator([resolvedInput], (0, import_path4.dirname)(resolvedInput), onProgress);
        inputData = stream;
        inputSizeVal = totalSize;
        displayName = parsed.outputName || (0, import_path4.basename)(resolvedInput);
        options.includeFileList = true;
        options.fileList = index.map((e) => ({
          name: e.path,
          size: e.size
        }));
      } else {
        inputData = (0, import_fs4.readFileSync)(resolvedInput);
        inputSizeVal = inputData.length;
        displayName = (0, import_path4.basename)(resolvedInput);
        options.includeFileList = true;
        options.fileList = [{ name: (0, import_path4.basename)(resolvedInput), size: st.size }];
      }
    }
    options.name = displayName;
    options.onProgress = (info) => {
      let stepLabel = "Processing";
      let pct = 0;
      if (info.phase === "compress_start") {
        pct = 25;
        stepLabel = "Compressing";
      } else if (info.phase === "compress_progress") {
        pct = 25 + Math.floor(info.loaded / info.total * 50);
        stepLabel = "Compressing";
      } else if (info.phase === "compress_done") {
        pct = 75;
        stepLabel = "Compressed";
      } else if (info.phase === "encrypt_start") {
        pct = 76;
        stepLabel = "Encrypting";
      } else if (info.phase === "encrypt_done") {
        pct = 80;
        stepLabel = "Encrypted";
      } else if (info.phase === "meta_prep_done") {
        pct = 82;
        stepLabel = "Preparing";
      } else if (info.phase === "png_gen") {
        if (info.loaded !== void 0 && info.total !== void 0) {
          pct = 82 + Math.floor(info.loaded / info.total * 16);
        } else {
          pct = 98;
        }
        stepLabel = "Generating PNG";
      } else if (info.phase === "optimizing") {
        if (info.loaded !== void 0 && info.total !== void 0) {
          pct = 82 + Math.floor(info.loaded / info.total * 18);
        } else {
          pct = 98;
        }
        stepLabel = "Optimizing PNG";
      } else if (info.phase === "done") {
        pct = 100;
        stepLabel = "Done";
      }
      targetPct = Math.max(targetPct, pct);
      currentEncodeStep = stepLabel;
    };
    let inputBuffer;
    if (typeof inputData[Symbol.asyncIterator] === "function") {
      const chunks = [];
      for await (const chunk of inputData) {
        chunks.push(chunk);
      }
      inputBuffer = chunks;
    } else {
      inputBuffer = inputData;
    }
    const output = await encodeBinaryToPng(inputBuffer, options);
    const encodeTime = Date.now() - startEncode;
    clearInterval(encodeHeartbeat);
    if (barStarted) {
      encodeBar.update(100, {
        step: "done",
        elapsed: String(Math.floor(encodeTime / 1e3))
      });
      encodeBar.stop();
    }
    (0, import_fs4.writeFileSync)(resolvedOutput, output);
    const outputSize = (output.length / 1024 / 1024).toFixed(2);
    const inputSize = (inputSizeVal / 1024 / 1024).toFixed(2);
    const ratio = (output.length / inputSizeVal * 100).toFixed(1);
    console.log(`
Success!`);
    console.log(`  Input:  ${inputSize} MB`);
    console.log(`  Output: ${outputSize} MB (${ratio}% of original)`);
    console.log(`  Time:   ${encodeTime}ms`);
    console.log(`  Saved:  ${resolvedOutput}`);
    console.log(" ");
  } catch (err2) {
    console.log(" ");
    console.error("Error: Failed to encode file. Use --verbose for details.");
    if (parsed.verbose)
      console.error("Details:", err2.stack || err2.message);
    process.exit(1);
  }
}
async function decodeCommand(args) {
  const parsed = parseArgs(args);
  const [inputPath, outputPath] = parsed._;
  if (!inputPath) {
    console.log(" ");
    console.error("Error: Input PNG file required");
    console.log("Usage: npx rox decode <input> [output] [options]");
    process.exit(1);
  }
  const resolvedInput = (0, import_path4.resolve)(inputPath);
  const resolvedOutput = parsed.output || outputPath || "decoded.bin";
  try {
    const options = {};
    if (parsed.passphrase) {
      options.passphrase = parsed.passphrase;
    }
    if (parsed.debug) {
      options.debugDir = (0, import_path4.dirname)(resolvedInput);
    }
    if (parsed.files) {
      options.files = parsed.files;
    }
    console.log(" ");
    console.log(`Decoding...`);
    console.log(" ");
    const decodeBar = new import_cli_progress3.default.SingleBar({
      format: " {bar} {percentage}% | {step} | {elapsed}s"
    }, import_cli_progress3.default.Presets.shades_classic);
    let barStarted = false;
    const startDecode = Date.now();
    let currentPct = 0;
    let targetPct = 0;
    let currentStep = "Decoding";
    const heartbeat = setInterval(() => {
      if (currentPct < targetPct) {
        currentPct = Math.min(currentPct + 2, targetPct);
      }
      if (!barStarted && targetPct > 0) {
        decodeBar.start(100, Math.floor(currentPct), {
          step: currentStep,
          elapsed: String(Math.floor((Date.now() - startDecode) / 1e3))
        });
        barStarted = true;
      } else if (barStarted) {
        decodeBar.update(Math.floor(currentPct), {
          step: currentStep,
          elapsed: String(Math.floor((Date.now() - startDecode) / 1e3))
        });
      }
    }, 100);
    options.onProgress = (info) => {
      if (info.phase === "decompress_start") {
        targetPct = 50;
        currentStep = "Decompressing";
      } else if (info.phase === "decompress_progress" && info.loaded && info.total) {
        targetPct = 50 + Math.floor(info.loaded / info.total * 40);
        currentStep = `Decompressing (${info.loaded}/${info.total})`;
      } else if (info.phase === "decompress_done") {
        targetPct = 90;
        currentStep = "Decompressed";
      } else if (info.phase === "done") {
        targetPct = 100;
        currentStep = "Done";
      }
    };
    const inputBuffer = (0, import_fs4.readFileSync)(resolvedInput);
    const result = await decodePngToBinary(inputBuffer, options);
    const decodeTime = Date.now() - startDecode;
    clearInterval(heartbeat);
    if (barStarted) {
      currentPct = 100;
      decodeBar.update(100, {
        step: "done",
        elapsed: String(Math.floor(decodeTime / 1e3))
      });
      decodeBar.stop();
    }
    if (result.files) {
      const baseDir = parsed.output || outputPath || ".";
      const totalBytes = result.files.reduce((s, f) => s + f.buf.length, 0);
      const extractBar = new import_cli_progress3.default.SingleBar({ format: " {bar} {percentage}% | {step} | {elapsed}s" }, import_cli_progress3.default.Presets.shades_classic);
      const extractStart = Date.now();
      extractBar.start(totalBytes, 0, { step: "Writing files", elapsed: "0" });
      let written = 0;
      for (const file of result.files) {
        const fullPath = (0, import_path4.join)(baseDir, file.path);
        const dir = (0, import_path4.dirname)(fullPath);
        (0, import_fs4.mkdirSync)(dir, { recursive: true });
        (0, import_fs4.writeFileSync)(fullPath, file.buf);
        written += file.buf.length;
        extractBar.update(written, {
          step: `Writing ${file.path}`,
          elapsed: String(Math.floor((Date.now() - extractStart) / 1e3))
        });
      }
      extractBar.update(totalBytes, {
        step: "Done",
        elapsed: String(Math.floor((Date.now() - extractStart) / 1e3))
      });
      extractBar.stop();
      console.log(`
Success!`);
      console.log(`Unpacked ${result.files.length} files to directory : ${(0, import_path4.resolve)(baseDir)}`);
      console.log(`Time: ${decodeTime}ms`);
    } else if (result.buf) {
      const unpacked = unpackBuffer(result.buf);
      if (unpacked) {
        const baseDir = parsed.output || outputPath || ".";
        for (const file of unpacked.files) {
          const fullPath = (0, import_path4.join)(baseDir, file.path);
          const dir = (0, import_path4.dirname)(fullPath);
          (0, import_fs4.mkdirSync)(dir, { recursive: true });
          (0, import_fs4.writeFileSync)(fullPath, file.buf);
        }
        console.log(`
Success!`);
        console.log(`Time: ${decodeTime}ms`);
        console.log(`Unpacked ${unpacked.files.length} files to current directory`);
      } else {
        let finalOutput = resolvedOutput;
        if (!parsed.output && !outputPath && result.meta?.name) {
          finalOutput = result.meta.name;
        }
        (0, import_fs4.writeFileSync)(finalOutput, result.buf);
        console.log(`
Success!`);
        if (result.meta?.name) {
          console.log(`  Original name: ${result.meta.name}`);
        }
        const outputSize = (result.buf.length / 1024 / 1024).toFixed(2);
        console.log(`  Output size:   ${outputSize} MB`);
        console.log(`  Time:          ${decodeTime}ms`);
        console.log(`  Saved:         ${finalOutput}`);
      }
    } else {
      console.log(`
Success!`);
      console.log(`Time: ${decodeTime}ms`);
    }
    console.log(" ");
  } catch (err2) {
    if (err2 instanceof PassphraseRequiredError || err2.message && err2.message.includes("passphrase") && !parsed.passphrase) {
      console.log(" ");
      console.error("File appears to be encrypted. Provide a passphrase with -p");
    } else if (err2 instanceof IncorrectPassphraseError || err2.message && err2.message.includes("Incorrect passphrase")) {
      console.log(" ");
      console.error("Incorrect passphrase");
    } else if (err2 instanceof DataFormatError || err2.message && (err2.message.includes("decompression failed") || err2.message.includes("missing ROX1") || err2.message.includes("Pixel payload truncated") || err2.message.includes("Marker START not found"))) {
      console.log(" ");
      console.error("Data corrupted or unsupported format. Use --verbose for details.");
    } else {
      console.log(" ");
      console.error("Failed to decode file. Use --verbose for details.");
    }
    if (parsed.verbose) {
      console.error("Details:", err2.stack || err2.message);
    }
    process.exit(1);
  }
}
async function listCommand(args) {
  const parsed = parseArgs(args);
  const [inputPath] = parsed._;
  if (!inputPath) {
    console.log(" ");
    console.error("Error: Input PNG file required");
    console.log("Usage: npx rox list <input>");
    process.exit(1);
  }
  const resolvedInput = (0, import_path4.resolve)(inputPath);
  try {
    const inputBuffer = (0, import_fs4.readFileSync)(resolvedInput);
    const fileList = await listFilesInPng(inputBuffer, {
      includeSizes: parsed.sizes !== false
    });
    if (fileList) {
      console.log(`Files in ${resolvedInput}:`);
      for (const file of fileList) {
        if (typeof file === "string") {
          console.log(`  ${file}`);
        } else {
          console.log(`  ${file.name} (${file.size} bytes)`);
        }
      }
    } else {
      console.log("No file list found in the archive.");
    }
  } catch (err2) {
    console.log(" ");
    console.error("Failed to list files. Use --verbose for details.");
    if (parsed.verbose) {
      console.error("Details:", err2.stack || err2.message);
    }
    process.exit(1);
  }
}
async function havePassphraseCommand(args) {
  const parsed = parseArgs(args);
  const [inputPath] = parsed._;
  if (!inputPath) {
    console.log(" ");
    console.error("Error: Input PNG file required");
    console.log("Usage: npx rox havepassphrase <input>");
    process.exit(1);
  }
  const resolvedInput = (0, import_path4.resolve)(inputPath);
  try {
    const inputBuffer = (0, import_fs4.readFileSync)(resolvedInput);
    const has = await hasPassphraseInPng(inputBuffer);
    console.log(has ? "Passphrase detected." : "No passphrase detected.");
  } catch (err2) {
    console.log(" ");
    console.error("Failed to check passphrase. Use --verbose for details.");
    if (parsed.verbose)
      console.error("Details:", err2.stack || err2.message);
    process.exit(1);
  }
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
    showHelp();
    return;
  }
  if (args[0] === "version" || args[0] === "--version") {
    console.log(VERSION);
    return;
  }
  const command = args[0];
  const commandArgs = args.slice(1);
  switch (command) {
    case "encode":
      await encodeCommand(commandArgs);
      break;
    case "decode":
      await decodeCommand(commandArgs);
      break;
    case "list":
      await listCommand(commandArgs);
      break;
    case "havepassphrase":
      await havePassphraseCommand(commandArgs);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "npx rox help" for usage information');
      process.exit(1);
  }
}
main().catch((err2) => {
  console.log(" ");
  console.error("Fatal error:", err2);
  process.exit(1);
});
/*! Bundled license information:

sharp/lib/is.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/libvips.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/sharp.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/constructor.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/input.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/resize.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/composite.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/operation.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/colour.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/channel.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/output.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/utility.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

sharp/lib/index.js:
  (*!
    Copyright 2013 Lovell Fuller and others.
    SPDX-License-Identifier: Apache-2.0
  *)

amdefine/amdefine.js:
  (** vim: et:ts=4:sw=4:sts=4
   * @license amdefine 0.1.0 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
   * Available via the MIT or new BSD license.
   * see: http://github.com/jrburke/amdefine for details
   *)
*/
