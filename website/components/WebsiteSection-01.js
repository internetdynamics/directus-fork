import Markdown from "react-markdown";
import Link from "next/link";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection01({ section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-col text-center w-full mb-20">
            <h2 className="text-xs text-indigo-500 tracking-widest font-medium title-font mb-1">
              {section.sectionSubtitle}
            </h2>
            <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">
              {section.sectionTitle}
            </h1>
            <div className="prose lg:w-2/3 mx-auto leading-relaxed text-base">
              <Markdown>{section.sectionText}</Markdown>
            </div>
          </div>
          <div className="flex flex-wrap">
            {section.items.map((item, index) => (
              <div
                key={item.id}
                className="xl:w-1/4 lg:w-1/2 md:w-full px-8 py-6 border-l-2 border-gray-200 border-opacity-60"
              >
                <h2 className="text-lg sm:text-xl text-gray-900 font-medium title-font mb-2">
                  {item.itemTitle}
                </h2>
                <div className="prose leading-relaxed text-base mb-4">
                  <Markdown>{item.itemText}</Markdown>
                </div>

                {item.itemLinkUrl && (
                  <div className="text-indigo-500 inline-flex items-center">
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
