import WebsiteMarkdown from './WebsiteMarkdown';

export default function WebsiteSectionMain({ website, section }) {
  // console.log("WebsiteSectionMain()");
  // console.log("XXX WebsiteSectionMain props", props);
  return (
    <div className="ml-5 mr-5">
      <section className="bg-white dark:bg-gray-900">
        <div className="container px-6 py-10 mx-auto">
          <div className="lg:flex lg:items-center">
            <div className="w-full space-y-12 lg:w-1/2 ">
              <div>
                <h2 className="text-3xl font-semibold text-gray-800 lg:text-4xl dark:text-white">{ section.sectionTitle }</h2>
                <h3 className="text-1xl mt-3 font-semibold text-gray-800 lg:text-2xl dark:text-white">{ section.sectionSubtitle }</h3>
                <div className="mt-2">
                  <span className="inline-block w-40 h-1 rounded-full bg-secondary-100"></span>
                  <span className="inline-block w-3 h-1 ml-1 rounded-full bg-secondary-100"></span>
                  <span className="inline-block w-1 h-1 ml-1 rounded-full bg-secondary-100"></span>
                </div>
              </div>
              {section.items.map((item, index) => {
                return (
                  <div className="md:flex md:items-start md:-mx-4">
                    <span className="inline-block p-3 md:mx-4 dark:text-white">
                      <img className="flex-shrink-0 object-cover w-20 h-20 rounded-xl" src={ website.baseApiUrl + "/assets/" + item.itemImage.filename_disk } alt={ item.itemImage.title } />
                    </span>
                    <div className="mt-4 md:mx-4 md:mt-0">
                      <h1 className="text-2xl font-semibold text-gray-700 capitalize dark:text-white">{ item.itemTitle }</h1>
                      <div className="prose mt-3 text-gray-500 dark:text-gray-300">
                        <WebsiteMarkdown text={ item.itemText } />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="hidden lg:flex lg:items-center lg:w-1/2 lg:justify-center">
              <img className="w-[28rem] h-[28rem] object-cover xl:w-[34rem] xl:h-[34rem] rounded-full" src={ website.baseApiUrl + "/assets/" + section.sectionImage.filename_disk } alt={ section.sectionImage.title } />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
