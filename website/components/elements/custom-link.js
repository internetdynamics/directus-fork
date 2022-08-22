import Link from "next/link";

const CustomLink = ({ link, children }) => {
  const url = link?.url;
  if (!url || url === "x") {
    return "";
  }
  const isInternalLink = link.url.startsWith("/");

  // For internal links, use the Next.js Link component
  if (isInternalLink) {
    return (
      <Link href={link.url}>
        <a>{children}</a>
      </Link>
    );
  }

  // Plain <a> tags for external links
  if (link.newTab) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <a href={link.url} target="_self">
      {children}
    </a>
  );
};

export default CustomLink;
