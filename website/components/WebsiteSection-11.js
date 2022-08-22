import Markdown from "react-markdown";

export default function WebsiteSection11({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-wrap -m-4 justify-center">
            {section.items.map((item, index) => (
              <div key={item.id} className="lg:w-1/3 lg:mb-0 mb-6 p-4">
                <div className="h-full text-center">
                  <img
                    alt=""
                    className="w-28 h-28 mb-8 object-cover object-center rounded-full inline-block border-2 border-gray-200 bg-gray-100"
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      item.itemImage.filename_disk
                    }
                  />
                  <div className="prose leading-relaxed">
                    <Markdown>{item.itemText}</Markdown>
                  </div>
                  <span className="inline-block h-1 w-10 rounded bg-indigo-300 mt-6 mb-4"></span>
                  <h2 className="text-gray-900 font-medium title-font tracking-wider text-sm">
                    {item.itemTitle}
                  </h2>
                  <div className="text-gray-500">{item.itemSubtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
