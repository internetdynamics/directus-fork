import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection20({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-wrap -m-4">
            {section.items.map((item, index) => (
              <div key={item.id} className="p-4 lg:w-1/3">
                <div className="h-full bg-gray-100 bg-opacity-75 px-8 pt-16 pb-16 rounded-lg overflow-hidden text-center relative">
                  <h2 className="tracking-widest text-xs title-font font-medium text-gray-400 mb-1">
                    {item.itemSubtitle}
                  </h2>
                  <h1 className="title-font sm:text-2xl text-xl font-medium text-gray-900 mb-3">
                    {item.itemTitle}
                  </h1>
                  <div className="prose leading-relaxed mb-3">
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
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
