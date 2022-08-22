import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection22({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font overflow-hidden">
        <div className="container px-5 py-12 mx-auto">
          <div className="-my-8 divide-y-2 divide-gray-100">
            {section.items.map((item, index) => (
              <div key={item.id} className="py-8 flex flex-wrap md:flex-nowrap">
                <div className="md:w-64 md:mb-0 mb-6 flex-shrink-0 flex flex-col">
                  <span className="font-semibold title-font text-gray-700">
                    {item.itemTitle2}
                  </span>
                  <span className="mt-1 text-gray-500 text-sm">
                    {item.itemSubtitle}
                  </span>
                </div>
                <div className="md:flex-grow">
                  <h2 className="text-2xl font-medium text-gray-900 title-font mb-2">
                    {item.itemTitle}
                  </h2>
                  <div className="leading-relaxed">
                    <Markdown>{item.itemText}</Markdown>
                  </div>
                  {item.itemLinkUrl && (
                    <div className="text-indigo-500 inline-flex items-center mt-4">
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
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
