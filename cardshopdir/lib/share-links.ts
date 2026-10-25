export function buildShareLinks(url: string, text: string) {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(text)
  return [
    {
      key: "x",
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    {
      key: "reddit",
      label: "Reddit",
      href: `https://www.reddit.com/submit?url=${u}&title=${t}`,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${u}&text=${t}`,
    },
    {
      key: "email",
      label: "Email",
      href: `mailto:?subject=${t}&body=${encodeURIComponent(`${text}\n${url}`)}`,
    },
  ]
}
