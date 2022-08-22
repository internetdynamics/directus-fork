import Markdown from "react-markdown";
import Link from "next/link";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection15({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="text-center mb-20">
            <h1 className="sm:text-3xl text-2xl font-medium title-font text-gray-900 mb-4">
              {section.sectionTitle}
            </h1>
            <div className="prose text-base leading-relaxed xl:w-2/4 lg:w-3/4 mx-auto text-gray-500s">
              <Markdown>{section.sectionText}</Markdown>
            </div>
            <div className="flex mt-6 justify-center">
              <div className="w-16 h-1 rounded-full bg-indigo-300 inline-flex"></div>
            </div>
          </div>
          <div className="flex flex-wrap sm:-m-4 -mx-4 -mb-10 -mt-4 md:space-y-0 space-y-6">
            {section.items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 md:w-1/3 flex flex-col  items-center"
              >
                <div>
                  <img
                    className="h-56 rounded w-full object-cover object-center mb-6"
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      item.itemImage.filename_disk
                    }
                    alt="content"
                  />
                </div>
                <div className="flex-grow">
                  <h2 className="text-gray-900 text-lg title-font font-medium mb-3">
                    {item.itemTitle}
                  </h2>
                  <div className="prose leading-relaxed text-base">
                    <Markdown>{item.itemText}</Markdown>
                  </div>
                </div>
                {item.itemLinkUrl && (
                  <div className="mt-3 text-indigo-500 inline-flex items-center">
                    <CustomLink
                      link={{
                        url: item.itemLinkUrl,
                        newTab: item.itemLinkNewTab,
                        text: item.itemLinkText
                      }}
                    >
                      {item.itemLinkText}
                    </CustomLink>
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="w-4 h-4 ml-2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          {section.sectionLinkUrl && (
            <div className="flex justify-center max-w-min whitespace-nowrap mx-auto mt-16 text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg">
              {section.sectionLinkNewTab && (
                <a
                  href={section.sectionLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {section.sectionLinkText}
                </a>
              )}
              {!section.sectionLinkNewTab && (
                <Link href={section.sectionLinkUrl}>
                  <a>{section.sectionLinkText}</a>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
