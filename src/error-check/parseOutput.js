const CHECKS = new Set(['compile', 'type', 'lint', 'test']);

/** Strip CSI/SGR sequences so stylish eslint and similar parsers see plain text. */
export function stripAnsi(text) {
  return String(text ?? '').replace(/\u001B\[[0-9;]*[A-Za-z]/g, '');
}

function joinOutput(stdout, stderr) {
  return stripAnsi(`${stdout || ''}\n${stderr || ''}`).replace(/\r\n/g, '\n');
}

function cleanPath(file) {
  if (!file) return null;
  return String(file).trim().replace(/\\/g, '/');
}

function toLine(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pushFinding(findings, item) {
  if (!item?.message) return;
  findings.push({
    file: cleanPath(item.file),
    line: toLine(item.line),
    message: String(item.message).trim(),
    severity: item.severity === 'warning' ? 'warning' : 'error',
  });
}

function extractJsonArray(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  if (!/"filePath"\s*:/.test(slice) && !/"messages"\s*:/.test(slice)) return null;
  try {
    const parsed = JSON.parse(slice);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseEslintOutput(text) {
  const findings = [];
  const json = extractJsonArray(text);
  if (json) {
    for (const file of json) {
      for (const message of file.messages || []) {
        pushFinding(findings, {
          file: file.filePath,
          line: message.line,
          message: message.ruleId ? `${message.message} (${message.ruleId})` : message.message,
          severity: message.severity === 1 ? 'warning' : 'error',
        });
      }
    }
    return findings;
  }

  const lines = text.split('\n');
  let currentFile = null;
  const stylish = /^\s+(\d+):(\d+)\s+(error|warning)\s+(.+?)(?:\s{2,}(\S+))?\s*$/;
  for (const line of lines) {
    if (/^\s*$/.test(line) || line.startsWith('>') || /^\s*✖/.test(line)) continue;
    const issue = line.match(stylish);
    if (issue) {
      const message = issue[5] ? `${issue[4].trim()} (${issue[5]})` : issue[4].trim();
      pushFinding(findings, {
        file: currentFile,
        line: issue[1],
        message,
        severity: issue[3],
      });
      continue;
    }
    if (!/^\s/.test(line) && /[\\/]|\.m?js$|\.ts$/.test(line) && !/^error |^Oops/.test(line)) {
      currentFile = line.trim();
    }
  }
  return findings;
}

export function parseTscOutput(text) {
  const findings = [];
  const pattern = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/gm;
  let match;
  while ((match = pattern.exec(text))) {
    pushFinding(findings, {
      file: match[1],
      line: match[2],
      message: `${match[5]}: ${match[6]}`,
      severity: match[4],
    });
  }
  return findings;
}

export function parseViteOutput(text) {
  const findings = [];
  const seen = new Set();
  const add = (item) => {
    const key = `${item.file}:${item.line}:${item.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    pushFinding(findings, item);
  };

  const esbuild = /((?:[A-Za-z]:)?[^\s:]+\.[A-Za-z0-9]+):(\d+):(\d+):\s*ERROR:\s*(.+)/g;
  let match;
  while ((match = esbuild.exec(text))) {
    add({ file: match[1], line: match[2], message: match[4], severity: 'error' });
  }

  const rollup = /((?:[A-Za-z]:)?[^\s()]+\.[A-Za-z0-9]+)\s+\((\d+):(\d+)\):\s*(.+)/g;
  while ((match = rollup.exec(text))) {
    add({ file: match[1], line: match[2], message: match[4], severity: 'error' });
  }

  const failedResolve = /Could not resolve ['"]([^'"]+)['"] from ['"]?([^'"\n]+)['"]?/g;
  while ((match = failedResolve.exec(text))) {
    add({
      file: match[2],
      line: null,
      message: `Could not resolve '${match[1]}' from '${match[2]}'`,
      severity: 'error',
    });
  }

  if (findings.length === 0 && /error during build|Build failed|ERROR:/i.test(text)) {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const interesting = lines.filter((line) =>
      /error|failed|could not|unexpected/i.test(line) && !/^> /.test(line)
    );
    const message = interesting[interesting.length - 1] || lines[lines.length - 1];
    if (message) add({ file: null, line: null, message, severity: 'error' });
  }

  return findings;
}

export function parseVitestOutput(text) {
  const findings = [];
  const failBlocks = text.split(/(?=FAIL\s+)/);
  for (const block of failBlocks) {
    if (!/^FAIL\s+/.test(block) && !block.includes('FAIL ')) continue;
    const failLine = block.match(/FAIL\s+(\S+\.(?:js|ts|mjs|cjs|jsx|tsx))\s*(?:(?:>|·).+)?/);
    const loc = block.match(/❯\s+(\S+):(\d+):(\d+)/);
    const err = block.match(/^(?:AssertionError|Error|TypeError|ReferenceError):\s*(.+)$/m);
    const file = loc?.[1] || failLine?.[1] || null;
    const message = err?.[1] || (failLine ? block.split('\n')[0].replace(/^FAIL\s+/, '').trim() : null);
    if (message) {
      pushFinding(findings, {
        file,
        line: loc?.[2],
        message,
        severity: 'error',
      });
    }
  }

  if (findings.length === 0) {
    const summary = text.match(/Test Files\s+(\d+)\s+failed/);
    if (summary) {
      pushFinding(findings, {
        file: null,
        line: null,
        message: `${summary[1]} test file(s) failed`,
        severity: 'error',
      });
    }
  }

  return findings;
}

export function parseOutput(check, stdout = '', stderr = '') {
  if (!CHECKS.has(check)) return [];
  const text = joinOutput(stdout, stderr);
  switch (check) {
    case 'compile':
      return parseViteOutput(text);
    case 'lint':
      return parseEslintOutput(text);
    case 'type':
      return parseTscOutput(text);
    case 'test':
      return parseVitestOutput(text);
    default:
      return [];
  }
}
