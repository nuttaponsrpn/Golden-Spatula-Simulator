// Simple markdown parser for chat messages
export function formatMarkdown(text: string): string {
  if (!text) return "";

  let html = text
    // Escape HTML to prevent XSS
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Lists
  html = html.replace(/^- (.*)$/gm, "<li>$1</li>");

  // If there are lists, wrap them in <ul>
  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*<\/li>(?:\n<li>.*<\/li>)*)/g, (match) => {
      // Remove newlines between li tags so whitespace-pre-wrap doesn't add extra gaps
      const listContent = match.replace(/\n(<li>)/g, "$1");
      return `<ul class="list-disc pl-5 my-2 space-y-1">${listContent}</ul>`;
    });
  }

  return html;
}
