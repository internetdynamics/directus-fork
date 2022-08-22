import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection08({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-col">
            <div className="h-1 bg-gray-200 rounded overflow-hidden">
              <div className="w-24 h-full bg-indigo-300"></div>
            </div>
            <div className="flex flex-wrap sm:flex-row flex-col py-6 mb-12">
              <h1 className="sm:w-2/5 text-gray-900 font-medium title-font text-2xl mb-2 sm:mb-0">
                {section.sectionTitle}
              </h1>
              <div className="prose sm:w-3/5 leading-relaxed text-base sm:pl-10 pl-0">
                <Markdown>{section.sectionText}</Markdown>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap sm:-m-4 -mx-4 -mb-10 -mt-4">
            {section.items.map((item, index) => (
              <div key={item.id} className="p-4 md:w-1/3 sm:mb-0 mb-6">
                <div className="rounded-lg h-64 overflow-hidden">
                  <img
                    alt="content"
                    className="object-cover object-center h-full w-full"
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      item.itemImage.filename_disk
                    }
                  />
                </div>
                <h2 className="text-xl font-medium title-font text-gray-900 mt-5">
                  {item.itemTitle}
                </h2>
                <div className="prose text-base leading-relaxed mt-2">
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
        </div>
      </section>
    </div>
  );
}
