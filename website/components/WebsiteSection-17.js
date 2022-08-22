import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection17({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-col text-center w-full mb-20">
            <h2 className="text-xs text-indigo-500 tracking-widest font-medium title-font mb-1">
              {section.sectionSubtitle}
            </h2>
            <h1 className="sm:text-3xl text-2xl font-medium title-font text-gray-900">
              {section.sectionTitle}
            </h1>
          </div>
          <div className="flex flex-wrap -m-4">
            {section.items.map((item, index) => (
              <div key={item.id} className="p-4 md:w-1/3">
                <div className="flex rounded-lg h-full bg-gray-100 p-8 flex-col">
                  <div className="flex items-center mb-3">
                    <div className="mr-3 inline-flex items-center justify-center rounded-full flex-shrink-0">
                      <img
                        alt=""
                        className="w-16 h-16 rounded-full flex-shrink-0 object-cover object-center"
                        src={
                          website.baseApiUrl +
                          "/assets/" +
                          item.itemImage.filename_disk
                        }
                      />
                    </div>
                    <h2 className="text-gray-900 text-lg title-font font-medium">
                      {item.itemTitle}
                    </h2>
                  </div>
                  <div className="flex-grow">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
