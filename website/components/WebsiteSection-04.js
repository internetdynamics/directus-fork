import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection04({ section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container flex flex-wrap px-5 py-12 mx-auto items-center">
          <div className="md:w-1/2 md:pr-12 md:py-8 md:border-r md:border-b-0 mb-10 md:mb-0 pb-10 border-b border-gray-200">
            <h1 className="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900">
              {section.sectionTitle}
            </h1>
            <div className="prose leading-relaxed text-base">
              <Markdown>{section.sectionText}</Markdown>
            </div>
            <div className="text-indigo-500 inline-flex items-center mt-4">
              <CustomLink
                link={{
                  url: section.sectionLinkUrl,
                  newTab: section.sectionLinkNewTab,
                  text: section.sectionLinkText
                }}
              >
                {section.sectionLinkText}
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
          </div>
          <div className="flex flex-col md:w-1/2 md:pl-12">
            <h2 className="title-font font-semibold text-gray-800 tracking-wider text-sm mb-3">
              {section.sectionSubtitle}
            </h2>
            <nav className="flex flex-wrap list-none -mb-1">
              {section.items.map((item, index) => (
                <li key={item.id} className="lg:w-1/3 mb-1 w-1/2">
                  <div className="text-gray-600 hover:text-gray-900">
                    <CustomLink
                      link={{
                        url: item.itemLinkUrl,
                        newTab: item.itemLinkNewTab,
                        text: item.itemLinkText
                      }}
                    >
                      {item.itemLinkText}
                    </CustomLink>
                  </div>
                </li>
              ))}
            </nav>
          </div>
        </div>
      </section>
    </div>
  );
}
