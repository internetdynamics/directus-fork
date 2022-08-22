import Link from "next/link";

export default function WebsiteFooter({ website }) {
  return (
    <footer className="pt-12 bg-indigo-300 relative w-full">
      <div className="pl-8 pr-8 flex flex-col lg:flex-row lg:justify-between sm:flex-row sm:justify-between">
        <div>
          {website?.footerLandscapeLogo?.filename_disk && (
            <img
              width="140"
              height="38"
              src={
                website.baseApiUrl +
                "/assets/" +
                website.footerLandscapeLogo.filename_disk
              }
            />
          )}
        </div>
        <nav className="flex flex-wrap flex-row gap-10 items-start lg:justify-end sm:justify-end mb-10">
          {website?.footer.columns.map((column, index) => {
            return (
              <div
                key={index}
                className="mt-10 lg:mt-0 w-4/12 lg:w-auto sm:w-auto"
              >
                <p className="uppercase tracking-wide font-semibold">
                  {column.heading}
                </p>
                <ul className="mt-2">
                  {column.links.map((link, index) => {
                    return (
                      <div key={index}>
                        <li
                          key={link.id}
                          className="text-gray-700 py-1 px-1 -mx-1 hover:text-gray-900"
                        >
                          {link.newTab ? (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link.text}
                            </a>
                          ) : (
                            <Link
                              href={link.url}
                              rel="noopener noreferrer"
                              passHref
                            >
                              <a>{link.text}</a>
                            </Link>
                          )}
                        </li>
                      </div>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>
      <div className="text-sm pl-8 pr-8 bg-gray-100 py-6 text-gray-700">
        <div className="container">
          © Copyright 2022, {website?.copyrightName}
        </div>
      </div>
    </footer>
  );
}
