import Markdown from "react-markdown";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection06({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto flex flex-col">
          <div className="lg:w-4/6 mx-auto">
            <div className="rounded-lg h-64 overflow-hidden">
              <img
                alt="content"
                className="object-cover object-center h-full w-full"
                src={
                  website.baseApiUrl +
                  "/assets/" +
                  section.sectionImage.filename_disk
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row mt-10">
              <div className="sm:w-1/3 text-center sm:pr-8 sm:py-8">
                <div className="w-24 h-24 rounded-full inline-flex items-center justify-center bg-gray-200 text-gray-400">
                  <img
                    alt="content"
                    className="object-cover object-center h-full w-full rounded-full"
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      section.sectionImage2.filename_disk
                    }
                  />
                </div>
                <div className="flex flex-col items-center text-center justify-center">
                  <h2 className="font-medium title-font mt-4 text-gray-900 text-lg">
                    {section.sectionTitle}
                  </h2>
                  <div className="w-12 h-1 bg-indigo-300 rounded mt-2 mb-4"></div>
                  <div className="prose text-base">
                    <Markdown>{section.sectionText2}</Markdown>
                  </div>
                  <div className="mt-4 pt-4 sm:mt-0 text-center sm:text-left">
                    {section.sectionLinkUrl && (
                      <div className="text-indigo-500 inline-flex items-center">
                        <CustomLink
                          link={{
                            url: section.sectionLinkUrl,
                            newTab: section.sectionLinkNewTab,
                            text: section.sectionLinkText
                          }}
                        >
                          {section.sectionLinkText}
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
              <div className="sm:w-2/3 sm:pl-8 sm:py-8 sm:border-l border-gray-200 sm:border-t-0 border-t mt-4 pt-4 sm:mt-0 text-center sm:text-left">
                <div className="prose leading-relaxed text-lg mb-4">
                  <Markdown>{section.sectionText}</Markdown>
                </div>
                {/* {section.sectionLinkUrl && (
                  <div className="text-indigo-500 inline-flex items-center">
                    <CustomLink
                      link={{
                        url: section.sectionLinkUrl,
                        newTab: section.sectionLinkNewTab,
                        text: section.sectionLinkText
                      }}
                    >
                      {section.sectionLinkText}
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
                )} */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
