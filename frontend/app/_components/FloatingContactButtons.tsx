const contactButtons = [
  {
    label: 'WhatsApp',
    href: 'https://wa.me/558896102643',
    className: 'bg-[#25D366] text-white hover:bg-[#1ebe5d]',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M20.5 3.5A11.8 11.8 0 0 0 12.08 0C5.55 0 .24 5.3.24 11.83c0 2.08.54 4.1 1.56 5.88L.14 24l6.43-1.63a11.84 11.84 0 0 0 5.5 1.36h.01c6.53 0 11.84-5.31 11.84-11.84 0-3.16-1.23-6.13-3.42-8.39Zm-8.42 18.2h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.81.97 1.02-3.71-.23-.38a9.83 9.83 0 0 1-1.5-5.17C2.17 6.4 6.6 1.98 12.08 1.98a9.8 9.8 0 0 1 6.98 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.48-4.42 9.9-9.87 9.9Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.44-1.5a9.15 9.15 0 0 1-1.69-2.1c-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.09 4.5.71.3 1.27.49 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.08-.12-.27-.2-.57-.35Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/matriz3ds',
    className: 'bg-[#E1306C] text-white hover:bg-[#c9285f]',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" />
      </svg>
    ),
  },
];

export default function FloatingContactButtons() {
  return (
    <aside className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 md:bottom-6 md:right-6" aria-label="Canais de contato">
      {contactButtons.map((button) => (
        <a
          key={button.label}
          href={button.href}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:scale-105 ${button.className}`}
          aria-label={`Entrar em contato pelo ${button.label}`}
        >
          {button.icon}
          <span>{button.label}</span>
        </a>
      ))}
    </aside>
  );
}