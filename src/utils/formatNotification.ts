
export function formatReportMessage(title: string, body: string = ''): string {
  let message = `<b>${title}</b>\n\n`;

  message += body;

  return message;
}