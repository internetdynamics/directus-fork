import Markdown from "react-markdown";

export default function WebsiteSection09({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-col text-center w-full mb-20">
            <h1 className="text-2xl font-medium title-font mb-4 text-gray-900">
              {section.sectionTitle}
            </h1>
            <div className="prose lg:w-2/3 mx-auto leading-relaxed text-base">
              <Markdown>{section.sectionText}</Markdown>
            </div>
          </div>
          <div className="flex flex-wrap -m-4">
            {section.items.map((item, index) => (
              <div key={item.id} className="p-4 lg:w-1/4 md:w-1/2">
                <div className="h-full flex flex-col items-center text-center">
                  <img
                    alt=""
                    className="flex-shrink-0 rounded-lg w-full h-56 object-cover object-center mb-4"
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      item.itemImage.filename_disk
                    }
                  />
                  <div className="w-full">
                    <h2 className="title-font font-medium text-lg text-gray-900">
                      {item.itemTitle}
                    </h2>
                    <h3 className="text-gray-500 mb-3">{item.itemSubtitle}</h3>
                    <div className="prose mb-4">
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
