import Markdown from "react-markdown";

export default function WebsiteSection02({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-wrap w-full mb-20">
            <div className="lg:w-1/2 w-full mb-6 lg:mb-0">
              <h1 className="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900">
                {section.sectionTitle}
              </h1>
              <div className="mt-2">
                <span className="inline-block w-40 h-1 rounded-full bg-indigo-300"></span>
                <span className="inline-block w-3 h-1 ml-1 rounded-full bg-indigo-300"></span>
                <span className="inline-block w-1 h-1 ml-1 rounded-full bg-indigo-300"></span>
              </div>
            </div>
            <div className="prose lg:w-1/2 w-full leading-relaxed text-gray-500">
              <Markdown>{section.sectionText}</Markdown>
            </div>
          </div>
          <div className="flex flex-wrap -m-4">
            {section.items.map((item, index) => (
              <div key={item.id} className="xl:w-1/4 md:w-1/2 p-4">
                <div className="bg-gray-100 p-6 rounded-lg">
                  <img
                    className="h-40 rounded w-full object-cover object-center mb-6"
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      item.itemImage.filename_disk
                    }
                    alt="content"
                  />
                  <h3 className="tracking-widest text-indigo-500 text-xs font-medium title-font">
                    {item.itemSubtitle}
                  </h3>
                  <h2 className="text-lg text-gray-900 font-medium title-font mb-4">
                    {item.itemTitle}
                  </h2>
                  <div className="prose leading-relaxed text-base">
                    <Markdown>{item.itemText}</Markdown>
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
