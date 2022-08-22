export default function WebsiteSection24({ website, section }) {
  return (
    <div className="ml-5 mr-5 pt-12">
      <section className="text-gray-600 body-font">
        <div className="m-auto lg:w-1/2 lg:h-1/2">
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              // src="https://www.youtube.com/embed/r9jwGansp1E"
              src={section.sectionLinkUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
        <div className="container mx-auto flex px-5 py-6 items-center justify-center flex-col">
          <div className="text-center lg:w-2/3 w-full">
            <h2 className="text-base text-indigo-500 tracking-widest font-medium title-font mb-1">
              {section.sectionSubtitle}
            </h2>
            <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">
              {section.sectionTitle}
            </h1>
            <p className="text-base leading-relaxed">{section.sectionText}</p>
          </div>
        </div>
        <div className="flex items-center lg:w-3/5 mx-auto border-b border-gray-200 sm:flex-row flex-col"></div>
      </section>
    </div>
  );
}
