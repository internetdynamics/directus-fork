import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection21({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font overflow-hidden">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-wrap -m-12">
            {section.items.map((item, index) => (
              <div
                key={item.id}
                className="p-12 md:w-1/2 flex flex-col items-start"
              >
                <span className="inline-block py-1 px-2 rounded bg-indigo-50 text-indigo-500 text-xs font-medium tracking-widest">
                  {item.itemSubtitle}
                </span>
                <h2 className="sm:text-3xl text-2xl title-font font-medium text-gray-900 mt-4 mb-4">
                  {item.itemTitle}
                </h2>
                <div className="leading-relaxed mb-8">
                  <Markdown>{item.itemText}</Markdown>
                </div>
                <div className="flex items-center flex-wrap pb-4 mb-4 border-b-2 border-gray-100 mt-auto w-full">
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
                <a className="inline-flex items-center">
                  <img
                    alt=""
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      item.itemImage.filename_disk
                    }
                    className="w-12 h-12 rounded-full flex-shrink-0 object-cover object-center"
                  />
                  <span className="flex-grow flex flex-col pl-4">
                    <span className="title-font font-medium text-gray-900">
                      {item.itemTitle2}
                    </span>
                    <span className="text-gray-400 text-xs tracking-widest mt-0.5">
                      {item.itemSubtitle2}
                    </span>
                  </span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
