type LogLevel = 'info' | 'warn' | 'error';

const prefixes: Record<LogLevel, string> = {
  info: '[INFO]',
  warn: '[WARN]',
  error: '[ERROR]',
};

export function log(level: LogLevel, message: string, meta?: unknown) {
  const prefix = prefixes[level];
  if (meta) {
    // eslint-disable-next-line no-console
    console.log(prefix, message, meta);
  } else {
    // eslint-disable-next-line no-console
    console.log(prefix, message);
  }
}
