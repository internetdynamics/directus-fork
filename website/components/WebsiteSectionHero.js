export default function WebsiteSectionHero({ website, section }) {
  return (
    <main className="flex items-center justify-center w-full h-full bg-gray-900 relative">
      <div
        className="w-full bg-left bg-cover h-[34rem]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom,rgba(0, 0, 0, 0) 41%,rgba(0, 0, 0, 1) 100%),url(" +
            website.baseApiUrl +
            "/assets/" +
            section.sectionImage.filename_disk
        }}
      >
        <div className="w-full h-full bg-gray-900 bg-opacity-10">
          <div className="absolute ml-8 z-100 bottom-10 max-w-2xl min-h-100">
            <h1 className="text-2xl font-semibold uppercase text-indigo-300 lg:text-5xl">
              {section.sectionTitle}
            </h1>
            <p className="text-lg w-full px-1 mt-4 text-white text-md transition-colors duration-200 transform">
              {section.sectionSubtitle}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
