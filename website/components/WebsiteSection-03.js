import Markdown from "react-markdown";
import Link from "next/link";

export default function WebsiteSection03({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-wrap w-full mb-20 flex-col items-center text-center">
            <h1 className="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900">
              {section.sectionTitle}
            </h1>
            <div className="prose lg:w-1/2 w-full leading-relaxed text-gray-500">
              <Markdown>{section.sectionText}</Markdown>
            </div>
          </div>
          <div className="flex flex-wrap -m-4">
            {section.items.map((item, index) => (
              <div key={item.id} className="xl:w-1/3 md:w-1/2 p-4">
                <div className="border border-gray-200 p-6 rounded-lg">
                  <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 mb-4">
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
                  <h2 className="text-lg text-gray-900 font-medium title-font mb-2">
                    {item.itemTitle}
                  </h2>
                  <div className="prose leading-relaxed text-base">
                    <Markdown>{item.itemText}</Markdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {section.sectionLinkUrl && (
            <div className="flex justify-center max-w-min whitespace-nowrap mx-auto mt-16 text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg">
              {section.sectionLinkNewTab && (
                <a
                  href={section.sectionLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {section.sectionLinkText}
                </a>
              )}
              {!section.sectionLinkNewTab && (
                <Link href={section.sectionLinkUrl}>
                  <a>{section.sectionLinkText}</a>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
