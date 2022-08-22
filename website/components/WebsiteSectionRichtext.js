import Markdown from "react-markdown";

export default function WebsiteSectionRichtext({ section }) {
  return (
    <div className="prose prose-lg container py-12 mx-auto px-3">
      <Markdown>{section.sectionText}</Markdown>
    </div>
  );
}
