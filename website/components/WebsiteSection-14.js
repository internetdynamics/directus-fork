import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection14({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="sm:text-3xl text-2xl font-medium title-font text-center text-gray-900 mb-20">
            {section.sectionTitle}
            <div className="hidden text-xl sm:block">
              {section.sectionSubtitle}
            </div>
          </div>

          <div className="flex flex-wrap sm:-m-4 -mx-4 -mb-10 -mt-4 md:space-y-0 space-y-6">
            {section.items.map((item, index) => (
              <div key={item.id} className="p-4 md:w-1/3 flex">
                <div className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 mb-4 flex-shrink-0">
                  <img
                    className="w-6 h-6"
                    style={{
                      filter:
                        "invert(58%) sepia(30%) saturate(6211%) hue-rotate(211deg) brightness(107%) contrast(94%)"
                    }}
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      item.itemImage.filename_disk
                    }
                    alt="content"
                  />
                </div>
                <div className="flex-grow pl-6">
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
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
