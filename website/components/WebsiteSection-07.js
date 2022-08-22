import Markdown from "react-markdown";
import Link from "next/link";

export default function WebsiteSection07({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-wrap -mx-4 -mb-10 text-center">
            {section.items.map((item, index) => (
              <div key={item.id} className="sm:w-1/2 mb-10 px-4">
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
                <h2 className="title-font text-2xl font-medium text-gray-900 mt-6 mb-3">
                  {item.itemTitle}
                </h2>
                <div className="leading-relaxed text-base">
                  <Markdown>{item.itemText}</Markdown>
                </div>
                {item.itemLinkUrl && (
                  <div className="flex justify-center max-w-min whitespace-nowrap mx-auto mt-6 text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg">
                    {item.itemLinkNewTab && (
                      <a
                        href={item.itemLinkUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.itemLinkText}
                      </a>
                    )}
                    {!item.itemLinkNewTab && (
                      <Link href={item.itemLinkUrl}>
                        <a>{item.itemLinkText}</a>
                      </Link>
                    )}
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
