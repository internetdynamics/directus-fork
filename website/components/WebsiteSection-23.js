import Markdown from "react-markdown";

export default function WebsiteSection23({ website, section }) {
  return (
    <div className="ml-5 mr-5">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">
          <div className="flex flex-wrap -m-4">
            {section.items.map((item, index) => (
              <div key={item.id} className="lg:w-1/4 md:w-1/2 p-4 w-full">
                <a className="block relative h-48 rounded overflow-hidden">
                  <img
                    alt=""
                    className="object-cover object-center w-full h-full block"
                    src={
                      website.baseApiUrl +
                      "/assets/" +
                      item.itemImage.filename_disk
                    }
                  />
                </a>
                <div className="mt-4">
                  <h3 className="text-gray-500 text-xs tracking-widest title-font mb-1">
                    {item.itemSubtitle}
                  </h3>
                  <h2 className="text-gray-900 title-font text-lg font-medium">
                    {item.itemTitle}
                  </h2>
                  <div className="prose mt-1">
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
