import Markdown from "react-markdown";

export default function WebsiteSection13({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-col text-center w-full mb-20">
            <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">
              {section.sectionTitle}
            </h1>
            <div className="prose lg:w-2/3 mx-auto leading-relaxed text-base">
              <Markdown>{section.sectionText}</Markdown>
            </div>
          </div>
          <div className="flex flex-wrap -m-4">
            {section.items.map((item, index) => (
              <div key={item.id} className="lg:w-1/3 sm:w-1/2 p-4">
                <div className="flex relative">
                  <img
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      item.itemImage.filename_disk
                    }
                  />
                  <div className="px-8 py-10 relative z-10 w-full border-4 border-gray-200 bg-white opacity-0 hover:opacity-100">
                    <h2 className="tracking-widest text-sm title-font font-medium text-indigo-500 mb-1">
                      {item.itemSubtitle}
                    </h2>
                    <h1 className="title-font text-lg font-medium text-gray-900 mb-3">
                      {item.itemTitle}
                    </h1>
                    <div className="prose leading-relaxed">
                      <Markdown>{item.itemText}</Markdown>
                    </div>
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
