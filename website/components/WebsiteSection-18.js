import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection18({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 pt-12 mx-auto">
          {section.items.map((item, index) => (
            <div key={item.id}>
              {index % 2 ? (
                <div className="flex items-center lg:w-3/5 mx-auto border-b pb-10 mb-10 border-gray-200 sm:flex-row flex-col">
                  <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
                    <h2 className="text-gray-900 text-lg title-font font-medium mb-2">
                      {item.itemTitle}
                    </h2>
                    <div className="prose leading-relaxed text-base">
                      <Markdown>{item.itemText}</Markdown>
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
                  <div className="sm:w-32 sm:order-none order-first sm:h-32 h-20 w-20 sm:ml-10 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 flex-shrink-0">
                    <img
                      alt=""
                      className="sm:w-32 sm:h-32 h-20 w-20 rounded-full flex-shrink-0 object-cover object-center"
                      src={
                        website.baseApiUrl +
                        "/assets/" +
                        item.itemImage.filename_disk
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center lg:w-3/5 mx-auto border-b pb-10 mb-10 border-gray-200 sm:flex-row flex-col">
                  <div className="sm:w-32 sm:h-32 h-20 w-20 sm:mr-10 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 flex-shrink-0">
                    <img
                      alt=""
                      className="sm:w-32 sm:h-32 h-20 w-20 rounded-full flex-shrink-0 object-cover object-center"
                      src={
                        website.baseApiUrl +
                        "/assets/" +
                        item.itemImage.filename_disk
                      }
                    />
                  </div>
                  <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
                    <h2 className="text-gray-900 text-lg title-font font-medium mb-2">
                      {item.itemTitle}
                    </h2>
                    <div className="leading-relaxed text-base">
                      <Markdown>{item.itemText}</Markdown>
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
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
