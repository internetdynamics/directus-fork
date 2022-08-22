import Markdown from "react-markdown";
import Link from "next/link";
import CustomLink from "../components/elements/custom-link";

export default function WebsiteSection05({ section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto flex flex-wrap">
          <h2 className="sm:text-3xl text-2xl text-gray-900 font-medium title-font mb-2 md:w-2/5">
            {section.sectionTitle}
          </h2>
          <div className="md:w-3/5 md:pl-6">
            <div className="prose leading-relaxed text-base">
              <Markdown>{section.sectionText}</Markdown>
            </div>
            <div className="flex  max-w-min whitespace-nowrap md:mt-4 mt-6">
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
      </section>
    </div>
  );
}
