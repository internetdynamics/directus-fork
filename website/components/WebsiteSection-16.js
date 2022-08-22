import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection16({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto flex flex-wrap">
          <div className="lg:w-1/2 w-full mb-10 lg:mb-0 rounded-lg overflow-hidden">
            <img
              alt="feature"
              className="object-cover object-center h-full w-full"
              src={
                website.baseApiUrl +
                "/assets/" +
                section.sectionImage.filename_disk
              }
            />
          </div>
          <div className="flex flex-col flex-wrap lg:py-6 -mb-10 lg:w-1/2 lg:pl-12 lg:text-left text-center">
            {section.items.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col mb-10 lg:items-start items-center"
              >
                <div>
                  <img
                    className="h-20 rounded w-full object-cover object-center mb-6"
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
